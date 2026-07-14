import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  PlanFeatures,
  PlanLimits,
} from '../constants/subscription.constants';

const MONEY_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

export class CreatePlanDto {
  @IsString()
  @Matches(/^[a-z0-9_-]+$/)
  @MaxLength(50)
  code: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(1000)
  description: string;

  @IsString()
  @Matches(MONEY_PATTERN)
  monthlyPrice: string;

  @IsString()
  @Matches(MONEY_PATTERN)
  yearlyPrice: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  trialDays?: number | null;

  @IsObject()
  features: PlanFeatures;

  @IsObject()
  limits: PlanLimits;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  monthlyPrice?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  yearlyPrice?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  trialDays?: number | null;

  @IsOptional()
  @IsObject()
  features?: PlanFeatures;

  @IsOptional()
  @IsObject()
  limits?: PlanLimits;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;
}
