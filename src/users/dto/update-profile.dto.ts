import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'O nome completo deve ser uma string' })
  @MinLength(1, { message: 'O nome completo é obrigatório' })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'O nome do negócio deve ser uma string' })
  businessName?: string | null;

  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string' })
  phone?: string | null;
}


