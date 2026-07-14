import { SetMetadata } from '@nestjs/common';
import { PlanFeature } from '../constants/subscription.constants';

export const REQUIRED_FEATURE_KEY = 'required-plan-feature';

export const RequireFeature = (feature: PlanFeature) =>
  SetMetadata(REQUIRED_FEATURE_KEY, feature);
