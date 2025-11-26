import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString({ message: 'A senha deve ser uma string' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
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


