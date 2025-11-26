import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString({ message: 'A descrição da despesa deve ser uma string' })
  @MinLength(1, { message: 'A descrição da despesa é obrigatória' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'O valor da despesa deve ser um número' })
  @Min(0.01, { message: 'O valor da despesa deve ser maior que zero' })
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsString({ message: 'A categoria da despesa deve ser uma string' })
  @MinLength(1, { message: 'A categoria da despesa é obrigatória' })
  category?: string;

  @IsOptional()
  @Type(() => Date)
  expenseDate?: Date;

  @IsOptional()
  @IsBoolean({ message: 'is_recurring deve ser um booleano' })
  @Type(() => Boolean)
  isRecurring?: boolean;

  @IsOptional()
  @IsString({ message: 'O período de recorrência deve ser uma string' })
  recurrencePeriod?: string | null;
}


