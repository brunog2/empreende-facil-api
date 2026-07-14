import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { CreatePlanDto } from "../dto/plan.dto";
import { Plan } from "../entities/plan.entity";
import { PlansService } from "./plans.service";

describe("PlansService catalog", () => {
  const repository = {
    find: jest.fn(),
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<Plan>>;
  const service = new PlansService(repository);

  beforeEach(() => jest.clearAllMocks());

  it.each(["founder", "business"])(
    "não permite contratar o plano aposentado %s",
    async (code) => {
      await expect(service.findActiveByCode(code)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.findOne).not.toHaveBeenCalled();
    },
  );

  it("não permite criar um quarto plano pelo painel administrativo", async () => {
    await expect(
      service.create({ code: "enterprise" } as CreatePlanDto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findOne).not.toHaveBeenCalled();
  });
});
