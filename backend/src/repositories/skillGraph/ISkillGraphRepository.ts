import type { RawSkillGraph } from "../../routers/graphDataService/types";

export interface ISkillGraphRepository {
  getGraph(professionName: string, isMock: boolean): Promise<RawSkillGraph>;
}
