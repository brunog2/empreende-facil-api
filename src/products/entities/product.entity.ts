import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SaleItem } from '../../sales/entities/sale-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ nullable: true })
  category: string | null;

  @Column({
    name: 'cost_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value || '0'),
    },
  })
  costPrice: number;

  @Column({
    name: 'sale_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value || '0'),
    },
  })
  salePrice: number;

  @Column({
    name: 'stock_quantity',
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value || '0'),
    },
  })
  stockQuantity: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.product)
  saleItems: SaleItem[];
}


