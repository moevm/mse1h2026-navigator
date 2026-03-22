import { Arg, Query, Resolver } from "type-graphql";
import { inject, injectable } from "tsyringe";
import { SkillGraphService } from "../../services/skillGraph/SkillGraphService";
import { SkillGraphGql } from "../types/SkillGraph.type";

@injectable()
@Resolver()
export class SkillGraphResolver {
  constructor(
    @inject(SkillGraphService)
    private readonly skillGraphService: SkillGraphService,
  ) {}

  @Query(() => SkillGraphGql, {
    description: "Граф навыков по названию профессии",
  })
  async skillGraph(
    @Arg("professionName", {
      description: "Название профессии, например 'Backend Developer'",
    })
    professionName: string,

    @Arg("isMock", {
      description:
        "Если true — возвращает mock-данные без вызовов внешних сервисов. " +
        "Если false — запускает полный пайплайн: граф из graph-data-service + обогащение через Stepik / Habr / OpenLibrary / Wikipedia",
      nullable: true,
      defaultValue: false,
    })
    isMock: boolean,
  ): Promise<SkillGraphGql> {
    return this.skillGraphService.getSkillGraph(professionName, isMock);
  }
}
