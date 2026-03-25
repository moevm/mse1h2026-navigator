import { getSkillsGraph } from "@/entities/skill/mock";

export class GraphProxy {
  public static getGraphInfo = async (): Promise<
    ReturnType<typeof getSkillsGraph>
  > => {
    return await getSkillsGraph();
  };
}
