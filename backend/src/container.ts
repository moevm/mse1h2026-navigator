import "reflect-metadata";
import { container } from "tsyringe";
import { GraphDataServiceRepository } from "./repositories/skillGraph/GraphDataServiceRepository";
import type { ISkillGraphRepository } from "./repositories/skillGraph/ISkillGraphRepository";

export function setupContainer(): void {
  container.register<ISkillGraphRepository>("ISkillGraphRepository", {
    useClass: GraphDataServiceRepository,
  });
}
