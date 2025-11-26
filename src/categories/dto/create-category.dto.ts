import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'O nome da categoria é obrigatório' })
  @MinLength(1, { message: 'O nome da categoria é obrigatório' })
  @MaxLength(100, { message: 'O nome da categoria não pode ter mais de 100 caracteres' })
  name: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  description?: string | null;
}


