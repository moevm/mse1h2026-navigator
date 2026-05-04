import { apiClient } from "./client";
import type { GraphResponse, UpdateGraphNodeResponse } from "./types";

export async function createGraph(params: {
  professionTitle: string;
  useCache?: boolean;
  isMock?: boolean;
  forceRegenerate?: boolean;
}): Promise<GraphResponse> {
  const { data } = await apiClient.post<GraphResponse>("/api/graphs", params);
  return data;
}

export async function updateGraphNode(
  graphId: string,
  nodeId: string,
  isCompleted: boolean,
): Promise<UpdateGraphNodeResponse> {
  const { data } = await apiClient.patch<UpdateGraphNodeResponse>(
    `/api/graphs/${graphId}/nodes/${nodeId}`,
    { isCompleted },
  );
  return data;
}
