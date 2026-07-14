import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Expense } from '../../expenses/entities/expense.entity';
import { Category } from '../../categories/entities/category.entity';
import {
  DEFAULT_USER_PERMISSIONS,
  UserPermission,
  UserRole,
} from '../user-access.constants';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'business_name', nullable: true })
  businessName: string | null;

  @Column({ nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', default: UserRole.Customer })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    type: 'jsonb',
    default: () =>
      `'${JSON.stringify(DEFAULT_USER_PERMISSIONS)}'::jsonb`,
  })
  permissions: UserPermission[];

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Product, (product) => product.user)
  products: Product[];

  @OneToMany(() => Sale, (sale) => sale.user)
  sales: Sale[];

  @OneToMany(() => Customer, (customer) => customer.user)
  customers: Customer[];

  @OneToMany(() => Expense, (expense) => expense.user)
  expenses: Expense[];

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @OneToOne(() => Subscription, (subscription) => subscription.user)
  subscription: Subscription | null;
}
