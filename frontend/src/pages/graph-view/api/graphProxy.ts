import {
  addGraphEdge,
  addGraphNode,
  createOrLoadGraph,
  deleteGraphEdge,
  deleteGraphNode,
  exportGraphFile,
  getGraphSubgraph,
  getSavedGraph,
  importGraphFile,
  listSavedGraphs,
  resetGraphToInitial,
  updateGraphNode,
} from "@/api/graphs";
import type {
  CreateGraphNodeInput,
  GraphEdgeInput,
  GraphFileFormat,
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

  public static getGraphInfo = async (): Promise<GraphResponse> => {
    const graphs = await listSavedGraphs();
    const graph = graphs[0];
    if (!graph) {
      throw new Error("Нет сохранённых графов для отчёта");
    }

    return await getSavedGraph(graph.id);
  };

  public static getSavedGraph = async (graphId: string): Promise<GraphResponse> => {
    return await getSavedGraph(graphId);
  };

  public static exportGraphFile = async (
    graphId: string,
    format: GraphFileFormat,
  ): Promise<Blob> => {
    return await exportGraphFile(graphId, format);
  };

  public static importGraphFile = async (
    file: File,
    format: GraphFileFormat,
  ): Promise<GraphResponse> => {
    return await importGraphFile(file, format);
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
