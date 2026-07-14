import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Brackets, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import {
  DEFAULT_USER_PERMISSIONS,
  UserPermission,
  UserRole,
} from '../users/user-access.constants';
import { FilterAdminUsersDto } from './dto/filter-admin-users.dto';
import { UpdateManagedUserDto } from './dto/update-managed-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async ensureDevelopmentAdmin(): Promise<void> {
    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');

    if (!email || !password) {
      return;
    }

    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      if (existing.role !== UserRole.Admin) {
        existing.password = await bcrypt.hash(password, 10);
        existing.role = UserRole.Admin;
        existing.isActive = true;
        existing.permissions = DEFAULT_USER_PERMISSIONS;
        await this.usersRepository.save(existing);
      } else if (!existing.isActive) {
        existing.isActive = true;
        await this.usersRepository.save(existing);
      }
      return;
    }

    const admin = this.usersRepository.create({
      email,
      password: await bcrypt.hash(password, 10),
      fullName:
        this.configService.get<string>('ADMIN_NAME') ||
        'Administrador da Plataforma',
      businessName: 'Gestão Pro',
      phone: null,
      role: UserRole.Admin,
      isActive: true,
      permissions: DEFAULT_USER_PERMISSIONS,
      lastLoginAt: null,
    });

    await this.usersRepository.save(admin);
    console.log(`✅ Administrador local criado: ${email}`);
  }

  async getOverview() {
    const raw = await this.usersRepository
      .createQueryBuilder('user')
      .select(
        `COUNT(*) FILTER (WHERE user.role = :customerRole)`,
        'totalUsers',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE user.role = :customerRole AND user.is_active = true)`,
        'activeUsers',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE user.role = :customerRole AND user.is_active = false)`,
        'inactiveUsers',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE user.role = :customerRole
          AND user.created_at >= DATE_TRUNC('month', CURRENT_DATE)
        )`,
        'newUsersThisMonth',
      )
      .setParameter('customerRole', UserRole.Customer)
      .getRawOne();

    const recentUsers = await this.usersRepository.find({
      where: { role: UserRole.Customer },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      totalUsers: Number(raw.totalUsers),
      activeUsers: Number(raw.activeUsers),
      inactiveUsers: Number(raw.inactiveUsers),
      newUsersThisMonth: Number(raw.newUsersThisMonth),
      recentUsers: recentUsers.map((user) => this.toManagedUser(user)),
    };
  }

  async getUsers(filters: FilterAdminUsersDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const query = this.usersRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.Customer });

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      query.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(user.full_name) LIKE :search', { search })
            .orWhere('LOWER(user.email) LIKE :search', { search })
            .orWhere('LOWER(COALESCE(user.business_name, \'\')) LIKE :search', {
              search,
            });
        }),
      );
    }

    if (filters.status === 'active') {
      query.andWhere('user.is_active = true');
    } else if (filters.status === 'inactive') {
      query.andWhere('user.is_active = false');
    }

    query
      .addSelect(
        '(SELECT COUNT(*) FROM products product WHERE product.user_id = user.id)',
        'productCount',
      )
      .addSelect(
        '(SELECT COUNT(*) FROM sales sale WHERE sale.user_id = user.id)',
        'saleCount',
      )
      .addSelect(
        '(SELECT COUNT(*) FROM customers customer WHERE customer.user_id = user.id)',
        'customerCount',
      )
      .orderBy('user.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [entities, total] = await query.getManyAndCount();
    const { raw } = await query.getRawAndEntities();

    return {
      data: entities.map((user, index) => ({
        ...this.toManagedUser(user),
        usage: {
          products: Number(raw[index]?.productCount || 0),
          sales: Number(raw[index]?.saleCount || 0),
          customers: Number(raw[index]?.customerCount || 0),
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getUser(id: string) {
    const user = await this.findManagedUser(id);
    return this.toManagedUser(user);
  }

  async updateUser(id: string, data: UpdateManagedUserDto) {
    const user = await this.findManagedUser(id);

    if (data.email && data.email !== user.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: data.email },
      });
      if (existing) {
        throw new ConflictException('Email já está em uso');
      }
    }

    const permissions = data.permissions
      ? this.normalizePermissions(data.permissions)
      : undefined;

    Object.assign(user, {
      ...(data.email !== undefined && { email: data.email }),
      ...(data.fullName !== undefined && { fullName: data.fullName }),
      ...(data.businessName !== undefined && {
        businessName: data.businessName || null,
      }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(permissions !== undefined && { permissions }),
    });

    return this.toManagedUser(await this.usersRepository.save(user));
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const user = await this.findManagedUser(id);

    if (user.role === UserRole.Admin) {
      throw new BadRequestException(
        'Contas administrativas não podem ser excluídas por esta rota',
      );
    }

    await this.usersRepository.remove(user);
    return { message: 'Conta e dados relacionados excluídos com sucesso' };
  }

  private async findManagedUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user || user.role !== UserRole.Customer) {
      throw new NotFoundException('Conta não encontrada');
    }
    return user;
  }

  private normalizePermissions(
    permissions: UserPermission[],
  ): UserPermission[] {
    const normalized = new Set(permissions);

    if (normalized.has(UserPermission.Dashboard)) {
      normalized.add(UserPermission.Sales);
      normalized.add(UserPermission.Products);
      normalized.add(UserPermission.Categories);
      normalized.add(UserPermission.Expenses);
    }

    return Array.from(normalized);
  }

  private toManagedUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      businessName: user.businessName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      permissions: user.permissions || [],
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
