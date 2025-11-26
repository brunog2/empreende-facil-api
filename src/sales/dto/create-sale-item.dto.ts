import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  @IsString({ message: 'O ID do produto é obrigatório' })
  productId: string;

  @IsNumber({}, { message: 'A quantidade deve ser um número' })
  @Min(1, { message: 'A quantidade deve ser maior que zero' })
  @Type(() => Number)
  quantity: number;

  @IsNumber({}, { message: 'O preço unitário deve ser um número' })
  @Min(0, { message: 'O preço unitário deve ser maior ou igual a zero' })
  @Type(() => Number)
  unitPrice: number;
}


