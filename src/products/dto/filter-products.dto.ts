import { IsOptional, IsString, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterProductsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  lowStock?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minSalePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxSalePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minCostPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxCostPrice?: number;
}

