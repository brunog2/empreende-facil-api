import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';
import {
  STRONG_PASSWORD_MESSAGE,
  STRONG_PASSWORD_PATTERN,
} from '../password.policy';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString({ message: 'A senha deve ser uma string' })
  @Matches(STRONG_PASSWORD_PATTERN, { message: STRONG_PASSWORD_MESSAGE })
  password: string;

  @IsString({ message: 'O nome completo é obrigatório' })
  fullName: string;

  @IsOptional()
  @IsString({ message: 'O nome do negócio deve ser uma string' })
  businessName?: string;

  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string' })
  phone?: string;
}


