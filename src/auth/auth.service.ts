import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { Repository } from 'typeorm';
import { Passkey } from './entities/passkey.entity';
import { User } from './entities/user.entity';
import { ITokenPayload, ITokenResponse } from './models/user.model';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Passkey)
    private readonly passkeyRepository: Repository<Passkey>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Registration ─────────────────────────────────────────────

  async generateRegistrationOpts(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersService.findOrCreate(normalizedEmail);

    // Gather existing passkeys for this user (for excludeCredentials)
    const existingPasskeys: Passkey[] = await this.passkeyRepository.find({
      where: { user: { id: user.id } },
    });

    const options = await generateRegistrationOptions({
      rpName: this.configService.get<string>('rp_name')!,
      rpID: this.configService.get<string>('rp_id')!,
      userName: user.email,
      attestationType: 'none',
      excludeCredentials: existingPasskeys.map((passkey) => ({
        id: passkey.credentialID,
        type: 'public-key',
        transports: (passkey.transports ??
          []) as AuthenticatorTransportFuture[],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Persist the challenge for later verification
    await this.usersService.updateChallenge(user.id, options.challenge);

    return options;
  }

  async verifyRegistration(
    email: string,
    credential: RegistrationResponseJSON,
  ) {
    const normalizedEmail: string = email.toLowerCase().trim();
    const user: User | null =
      await this.usersService.findByEmail(normalizedEmail);

    if (!user || !user.currentChallenge) {
      throw new UnauthorizedException('Registration challenge not found');
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: this.configService.get<string>('rp_origin')!,
      expectedRPID: this.configService.get<string>('rp_id')!,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new UnauthorizedException('Registration verification failed');
    }

    const { credential: regCredential } = verification.registrationInfo;

    // Save the new passkey
    const passkey = this.passkeyRepository.create({
      credentialID: regCredential.id,
      credentialPublicKey: Buffer.from(regCredential.publicKey),
      counter: regCredential.counter,
      transports: credential.response.transports ?? null,
      user,
    });
    await this.passkeyRepository.save(passkey);

    // Clear the challenge
    await this.usersService.updateChallenge(user.id, null);

    return { verified: true };
  }

  // ─── Authentication ───────────────────────────────────────────

  async generateAuthenticationOpts(email: string) {
    const normalizedEmail: string = email.toLowerCase().trim();
    const user: User | null =
      await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const existingPasskeys: Passkey[] = await this.passkeyRepository.find({
      where: { user: { id: user.id } },
    });

    if (existingPasskeys.length === 0) {
      throw new UnauthorizedException(
        'No passkeys registered for this account',
      );
    }

    const options = await generateAuthenticationOptions({
      rpID: this.configService.get<string>('rp_id')!,
      allowCredentials: existingPasskeys.map((pk) => ({
        id: pk.credentialID,
        type: 'public-key',
        transports: (pk.transports ?? []) as AuthenticatorTransportFuture[],
      })),
      userVerification: 'preferred',
    });

    await this.usersService.updateChallenge(user.id, options.challenge);

    return options;
  }

  async verifyAuthentication(
    email: string,
    credential: AuthenticationResponseJSON,
  ): Promise<ITokenResponse> {
    const normalizedEmail: string = email.toLowerCase().trim();
    const user: User | null =
      await this.usersService.findByEmail(normalizedEmail);

    if (!user || !user.currentChallenge) {
      throw new UnauthorizedException('Authentication challenge not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User not authorized');
    }

    // Find the matching passkey
    const passkey: Passkey | null = await this.passkeyRepository.findOne({
      where: { credentialID: credential.id },
    });

    if (!passkey) {
      throw new UnauthorizedException('Passkey not found');
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: this.configService.get<string>('rp_origin')!,
      expectedRPID: this.configService.get<string>('rp_id')!,
      credential: {
        id: passkey.credentialID,
        publicKey: new Uint8Array(passkey.credentialPublicKey),
        counter: passkey.counter,
        transports: (passkey.transports ??
          []) as AuthenticatorTransportFuture[],
      },
    });

    if (!verification.verified) {
      throw new UnauthorizedException('Authentication verification failed');
    }

    // Update the counter to protect against replay attacks
    passkey.counter = verification.authenticationInfo.newCounter;
    await this.passkeyRepository.save(passkey);

    // Clear challenge
    await this.usersService.updateChallenge(user.id, null);

    // Issue JWT
    const payload: ITokenPayload = {
      uid: user.id,
      role: user.role,
    };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
