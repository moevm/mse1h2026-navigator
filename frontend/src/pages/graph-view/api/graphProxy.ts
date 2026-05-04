import { createGraph, updateGraphNode } from "@/api/graphs";
import type { GraphResponse, UpdateGraphNodeResponse } from "@/api/types";

export class GraphProxy {
  public static createGraph = async (
    professionTitle: string,
    forceRegenerate = false,
  ): Promise<GraphResponse> => {
    return await createGraph({
      professionTitle,
      useCache: true,
      forceRegenerate,
    });
  };

  public static updateGraphNode = async (
    graphId: string,
    nodeId: string,
    isCompleted: boolean,
  ): Promise<UpdateGraphNodeResponse> => {
    return await updateGraphNode(graphId, nodeId, isCompleted);
  };
}
