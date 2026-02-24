import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('passkeys')
export class Passkey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  credentialID: string;

  @Column({ type: 'bytea' })
  credentialPublicKey: Buffer;

  @Column({ type: 'bigint', default: 0 })
  counter: number;

  @Column({ type: 'simple-array', nullable: true })
  transports: string[] | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
