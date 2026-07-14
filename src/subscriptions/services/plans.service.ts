import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PlanFeature,
  PlanFeatures,
  PlanLimit,
  PlanLimits,
} from '../constants/subscription.constants';
import {
  SUBSCRIPTION_MESSAGES,
  SubscriptionErrorCode,
} from '../constants/subscription-errors.constants';
import { CreatePlanDto, UpdatePlanDto } from '../dto/plan.dto';
import { Plan } from '../entities/plan.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly plansRepository: Repository<Plan>,
  ) {}

  findActive(): Promise<Plan[]> {
    return this.plansRepository.find({
      where: { isActive: true },
      order: { monthlyPrice: 'ASC' },
    });
  }

  async findActiveByCode(code: string): Promise<Plan> {
    const plan = await this.plansRepository.findOne({ where: { code } });
    if (!plan) {
      throw new NotFoundException({
        code: SubscriptionErrorCode.PlanNotFound,
        message: SUBSCRIPTION_MESSAGES[SubscriptionErrorCode.PlanNotFound],
      });
    }
    if (!plan.isActive) {
      throw new BadRequestException({
        code: SubscriptionErrorCode.PlanInactive,
        message: SUBSCRIPTION_MESSAGES[SubscriptionErrorCode.PlanInactive],
      });
    }
    return plan;
  }

  async findByCode(code: string): Promise<Plan> {
    const plan = await this.plansRepository.findOne({ where: { code } });
    if (!plan) {
      throw new NotFoundException({
        code: SubscriptionErrorCode.PlanNotFound,
        message: SUBSCRIPTION_MESSAGES[SubscriptionErrorCode.PlanNotFound],
      });
    }
    return plan;
  }

  findAllAdmin(): Promise<Plan[]> {
    return this.plansRepository.find({ order: { createdAt: 'ASC' } });
  }

  async create(data: CreatePlanDto): Promise<Plan> {
    const existing = await this.plansRepository.findOne({
      where: { code: data.code },
    });
    if (existing) throw new ConflictException('Já existe um plano com este código.');

    const plan = this.plansRepository.create({
      ...data,
      code: data.code.trim().toLowerCase(),
      name: data.name.trim(),
      description: data.description.trim(),
      trialDays: data.trialDays ?? null,
      durationMonths: data.durationMonths ?? null,
      features: this.validateFeatures(data.features),
      limits: this.validateLimits(data.limits),
      isActive: data.isActive ?? true,
      isRecommended: data.isRecommended ?? false,
    });
    if (plan.isRecommended) await this.clearRecommended();
    return this.plansRepository.save(plan);
  }

  async update(id: string, data: UpdatePlanDto): Promise<Plan> {
    const plan = await this.plansRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plano não encontrado.');

    if (data.name !== undefined) plan.name = data.name.trim();
    if (data.description !== undefined) plan.description = data.description.trim();
    if (data.monthlyPrice !== undefined) plan.monthlyPrice = data.monthlyPrice;
    if (data.yearlyPrice !== undefined) plan.yearlyPrice = data.yearlyPrice;
    if (data.trialDays !== undefined) plan.trialDays = data.trialDays;
    if (data.durationMonths !== undefined) {
      plan.durationMonths = data.durationMonths;
    }
    if (data.features !== undefined) plan.features = this.validateFeatures(data.features);
    if (data.limits !== undefined) plan.limits = this.validateLimits(data.limits);
    if (data.isActive !== undefined) plan.isActive = data.isActive;
    if (data.isRecommended !== undefined) {
      plan.isRecommended = data.isRecommended;
      if (data.isRecommended) await this.clearRecommended(id);
    }

    return this.plansRepository.save(plan);
  }

  private validateFeatures(features: PlanFeatures): PlanFeatures {
    const normalized = {} as PlanFeatures;
    for (const feature of Object.values(PlanFeature)) {
      if (typeof features[feature] !== 'boolean') {
        throw new BadRequestException(`A feature ${feature} deve ser booleana.`);
      }
      normalized[feature] = features[feature];
    }
    return normalized;
  }

  private validateLimits(limits: PlanLimits): PlanLimits {
    const normalized = {} as PlanLimits;
    for (const limitName of Object.values(PlanLimit)) {
      const value = limits[limitName];
      if (value !== null && (!Number.isInteger(value) || value < 0)) {
        throw new BadRequestException(
          `O limite ${limitName} deve ser inteiro não negativo ou null.`,
        );
      }
      normalized[limitName] = value;
    }
    return normalized;
  }

  private async clearRecommended(exceptId?: string): Promise<void> {
    const query = this.plansRepository
      .createQueryBuilder()
      .update(Plan)
      .set({ isRecommended: false });
    if (exceptId) query.where('id != :exceptId', { exceptId });
    await query.execute();
  }
}
