import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsOptional()
  @IsString({ message: 'O nome do produto deve ser uma string' })
  @MinLength(1, { message: 'O nome do produto é obrigatório' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  description?: string | null;

  @IsOptional()
  @IsString({ message: 'A categoria deve ser uma string' })
  category?: string | null;

  @IsOptional()
  @IsNumber({}, { message: 'O preço de custo deve ser um número' })
  @Min(0, { message: 'O preço de custo deve ser maior ou igual a zero' })
  @Type(() => Number)
  costPrice?: number;

  @IsOptional()
  @IsNumber({}, { message: 'O preço de venda deve ser um número' })
  @Min(0, { message: 'O preço de venda deve ser maior ou igual a zero' })
  @Type(() => Number)
  salePrice?: number;

  @IsOptional()
  @IsNumber({}, { message: 'A quantidade em estoque deve ser um número' })
  @Min(0, { message: 'A quantidade em estoque deve ser maior ou igual a zero' })
  @Type(() => Number)
  stockQuantity?: number;
}


