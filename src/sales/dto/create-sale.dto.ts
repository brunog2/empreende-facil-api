import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSaleItemDto } from './create-sale-item.dto';

export class CreateSaleDto {
  @IsOptional()
  @IsString({ message: 'O ID do cliente deve ser uma string' })
  customerId?: string | null;

  @IsNumber({}, { message: 'O valor total deve ser um número' })
  @Min(0, { message: 'O valor total deve ser maior ou igual a zero' })
  @Type(() => Number)
  totalAmount: number;

  @IsOptional()
  @IsString({ message: 'O método de pagamento deve ser uma string' })
  paymentMethod?: string | null;

  @IsOptional()
  @IsString({ message: 'As observações devem ser uma string' })
  notes?: string | null;

  @IsOptional()
  @Type(() => Date)
  saleDate?: Date;

  @IsArray({ message: 'Os itens da venda são obrigatórios' })
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}


