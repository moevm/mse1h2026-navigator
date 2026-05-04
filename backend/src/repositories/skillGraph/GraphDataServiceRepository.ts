import { inject, injectable } from "tsyringe";
import { GraphDataServiceClient } from "../../routers/graphDataService/GraphDataServiceClient";
import type { RawSkillGraph } from "../../routers/graphDataService/types";
import type { ISkillGraphRepository } from "./ISkillGraphRepository";

@injectable()
export class GraphDataServiceRepository implements ISkillGraphRepository {
  constructor(
    @inject(GraphDataServiceClient)
    private readonly client: GraphDataServiceClient,
  ) {}

  public async getGraph(professionName: string, isMock: boolean): Promise<RawSkillGraph> {
    return this.client.getProfessionGraph(professionName, isMock, true);
  }
}
