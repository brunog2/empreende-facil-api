import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @IsString({ message: 'A descrição da despesa é obrigatória' })
  @MinLength(1, { message: 'A descrição da despesa é obrigatória' })
  description: string;

  @IsNumber({}, { message: 'O valor da despesa deve ser um número' })
  @Min(0.01, { message: 'O valor da despesa deve ser maior que zero' })
  @Type(() => Number)
  amount: number;

  @IsString({ message: 'A categoria da despesa é obrigatória' })
  @MinLength(1, { message: 'A categoria da despesa é obrigatória' })
  category: string;

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


