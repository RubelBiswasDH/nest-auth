import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsEmail, IsString, IsOptional } from 'class-validator';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsEmail()
  @Index({ unique: true })
  email: string;

  @Exclude()
  @IsNotEmpty()
  @Column()
  passwordHash: string;

  @IsOptional()
  @IsString()
  @Column({ nullable: true, length: 50, unique: true })
  username: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
