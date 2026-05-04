import {
  addGraphEdge,
  addGraphNode,
  createOrLoadGraph,
  deleteGraphEdge,
  deleteGraphNode,
  getGraphSubgraph,
  getSavedGraph,
  listSavedGraphs,
  resetGraphToInitial,
  updateGraphNode,
} from "@/api/graphs";
import type {
  CreateGraphNodeInput,
  GraphEdgeInput,
  GraphListItem,
  GraphResponse,
  GraphSearchParams,
  UpdateGraphNodeInput,
  UpdateGraphNodeResponse,
} from "@/api/types";

export class GraphProxy {
  public static createOrLoadGraph = async (
    input: GraphSearchParams,
  ): Promise<GraphResponse> => {
    return await createOrLoadGraph(input);
  };

  public static listSavedGraphs = async (): Promise<GraphListItem[]> => {
    return await listSavedGraphs();
  };

  public static getSavedGraph = async (graphId: string): Promise<GraphResponse> => {
    return await getSavedGraph(graphId);
  };

  public static updateGraphNode = async (
    graphId: string,
    nodeId: string,
    input: UpdateGraphNodeInput,
  ): Promise<UpdateGraphNodeResponse> => {
    return await updateGraphNode(graphId, nodeId, input);
  };

  public static addGraphNode = async (
    graphId: string,
    input: CreateGraphNodeInput,
  ): Promise<GraphResponse> => {
    return await addGraphNode(graphId, input);
  };

  public static deleteGraphNode = async (
    graphId: string,
    nodeId: string,
  ): Promise<GraphResponse> => {
    return await deleteGraphNode(graphId, nodeId);
  };

  public static addGraphEdge = async (
    graphId: string,
    input: GraphEdgeInput,
  ): Promise<GraphResponse> => {
    return await addGraphEdge(graphId, input);
  };

  public static deleteGraphEdge = async (
    graphId: string,
    input: GraphEdgeInput,
  ): Promise<GraphResponse> => {
    return await deleteGraphEdge(graphId, input);
  };

  public static resetGraphToInitial = async (
    graphId: string,
  ): Promise<GraphResponse> => {
    return await resetGraphToInitial(graphId);
  };

  public static getGraphSubgraph = async (params: {
    graphId: string;
    nodeId: string;
    depth: number;
  }): Promise<GraphResponse> => {
    return await getGraphSubgraph(params);
  };
}
