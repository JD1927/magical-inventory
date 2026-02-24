import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async findOrCreate(email: string): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();
    let user = await this.userRepository.findOneBy({ email: normalizedEmail });

    if (!user) {
      const adminEmail = this.configService.get<string>('admin_email');
      const isAdmin = normalizedEmail === adminEmail?.toLowerCase().trim();

      user = this.userRepository.create({
        email: normalizedEmail,
        role: isAdmin ? UserRole.ADMIN : UserRole.USER,
        isActive: isAdmin,
      });
      await this.userRepository.save(user);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async toggleActive(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found!');
    }
    user.isActive = !user.isActive;
    return this.userRepository.save(user);
  }

  async updateChallenge(
    userId: string,
    challenge: string | null,
  ): Promise<void> {
    await this.userRepository.update(userId, { currentChallenge: challenge });
  }
}
