import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value || '0'),
    },
  })
  amount: number;

  @Column()
  category: string;

  @Column({ name: 'expense_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  expenseDate: Date;

  @Column({ name: 'is_recurring', type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ name: 'recurrence_period', nullable: true })
  recurrencePeriod: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


