import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(data: {
    email: string;
    password: string;
    fullName: string;
    businessName?: string;
    phone?: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = this.usersRepository.create({
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      businessName: data.businessName || null,
      phone: data.phone || null,
    });

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async update(id: string, data: {
    fullName?: string;
    businessName?: string;
    phone?: string;
  }): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    Object.assign(user, data);
    return this.usersRepository.save(user);
  }

  async delete(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Usuário não encontrado');
    }
  }

  async deleteAccount(id: string): Promise<void> {
    // O TypeORM com CASCADE já deleta todos os dados associados automaticamente
    // devido às relações definidas nas entidades
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Usuário não encontrado');
    }
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}

