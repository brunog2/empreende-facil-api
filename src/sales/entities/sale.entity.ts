import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { SaleItem } from './sale-item.entity';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'customer_id', nullable: true })
  customerId: string | null;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value || '0'),
    },
  })
  totalAmount: number;

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string | null;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @Column({ name: 'sale_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  saleDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.sale, { cascade: true })
  saleItems: SaleItem[];
}


