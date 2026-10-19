import {
  IsEnum,
  IsIn,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import {
  BillingCycle,
  SUPPORTED_PLAN_CODES,
  SubscriptionStatus,
} from "../constants/subscription.constants";

export class CreateCheckoutDto {
  @IsString()
  @IsIn(SUPPORTED_PLAN_CODES)
  @MaxLength(50)
  planCode: string;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;
}

export class ChangePlanDto extends CreateCheckoutDto {}

export class ExtendTrialDto {
  @IsInt()
  @Min(1)
  @Max(365)
  days: number;
}

export class AdminChangePlanDto {
  @IsString()
  @IsIn(SUPPORTED_PLAN_CODES)
  @MaxLength(50)
  planCode: string;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;
}

export class SuspendSubscriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @IsOptional()
  @IsDateString()
  currentPeriodEnd?: string;

  @IsOptional()
  @IsDateString()
  gracePeriodEndsAt?: string;
}
