import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'suppliers' })
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true, default: '' })
  description: string;

  @Column({ type: 'text', nullable: true, default: '' })
  nit: string;

  @Column({ type: 'text', nullable: true, default: '' })
  address: string;

  @Column({ type: 'text', nullable: true, default: '' })
  contactNumber: string;

  @Column({ type: 'text', nullable: true, default: '' })
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
