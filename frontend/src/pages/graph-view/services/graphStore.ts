import { makeAutoObservable } from "mobx";
import type { GraphNode } from "../types/nodes";
import type { Edge } from "@xyflow/react";

export class GraphStore {
  private readonly nodes_: GraphNode[] = [];
  private readonly edges_: Edge[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  public get edges(): Edge[] {
    return this.edges;
  }

  public get nodes(): GraphNode[] {
    return this.nodes;
  }
}
