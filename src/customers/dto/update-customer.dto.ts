import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString({ message: 'O nome do cliente deve ser uma string' })
  @MinLength(1, { message: 'O nome do cliente é obrigatório' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string | null;

  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string' })
  phone?: string | null;

  @IsOptional()
  @IsString({ message: 'O endereço deve ser uma string' })
  address?: string | null;

  @IsOptional()
  @IsString({ message: 'As observações devem ser uma string' })
  notes?: string | null;
}


