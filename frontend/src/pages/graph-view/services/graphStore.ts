import { makeAutoObservable } from "mobx";
import type { Edge, Node, NodeChange } from "@xyflow/react";
import { applyNodeChanges } from "@xyflow/react";
import { GraphProxy } from "../api/graphProxy";
import type { Skill, MainSkill } from "@/entities/skill/types";
import type { GraphResponse } from "@/api/types";
import { mapSkillsToFlow } from "../lib/mapSkillsToFlow";
import { layoutGraph } from "../lib/layoutGraph";
import { resolveHandles } from "../lib/resolveHandles";

export class GraphStore {
  private graphId_: string | null = null;
  private professionTitle_: string = "";
  private skills_: Skill[] = [];
  private mainSkill_: MainSkill | null = null;

  private flowNodes_: Node[] = [];
  private flowEdges_: Edge[] = [];
  private isLoading_: boolean = false;
  private error_: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  public get graphId(): string | null {
    return this.graphId_;
  }

  public get professionTitle(): string {
    return this.professionTitle_;
  }

  public get skills(): Skill[] {
    return this.skills_;
  }

  public get mainSkill(): MainSkill | null {
    return this.mainSkill_;
  }

  public get nodes(): Node[] {
    return this.flowNodes_;
  }

  public get edges(): Edge[] {
    return this.flowEdges_;
  }

  public get isLoading(): boolean {
    return this.isLoading_;
  }

  public get error(): string | null {
    return this.error_;
  }

  public get hasGraph(): boolean {
    return this.mainSkill_ !== null;
  }

  public onNodesChange = (changes: NodeChange[]) => {
    this.flowNodes_ = applyNodeChanges(changes, this.flowNodes_);
  };

  public createOrLoadGraph = async (
    professionTitle: string,
    forceRegenerate = false,
  ): Promise<void> => {
    const normalizedProfessionTitle = professionTitle.trim();
    if (!normalizedProfessionTitle) {
      this.error_ = "Введите профессию";
      return;
    }

    this.isLoading_ = true;
    this.error_ = null;

    try {
      const graph = await GraphProxy.createGraph(
        normalizedProfessionTitle,
        forceRegenerate,
      );
      await this.applyGraph(graph);
    } catch {
      this.error_ = "Не удалось загрузить граф";
    } finally {
      this.isLoading_ = false;
    }
  };

  public updateNodeCompletion = async (
    nodeId: string,
    isCompleted: boolean,
  ): Promise<void> => {
    if (!this.graphId_) {
      return;
    }

    this.error_ = null;
    try {
      const { node, skills } = await GraphProxy.updateGraphNode(
        this.graphId_,
        nodeId,
        isCompleted,
      );

      this.skills_ = this.skills_.map((skill) =>
        skill.id === node.id ? { ...skill, isCompleted: node.isCompleted } : skill,
      );
      this.flowNodes_ = this.flowNodes_.map((flowNode) =>
        flowNode.id === node.id
          ? { ...flowNode, data: { ...flowNode.data, isCompleted: node.isCompleted } }
          : flowNode,
      );
      this.syncStoredUserSkills(skills);
    } catch {
      this.error_ = "Не удалось обновить прогресс";
    }
  };

  private applyGraph = async ({
    id,
    professionTitle,
    mainSkill,
    nodes,
    edges,
  }: GraphResponse): Promise<void> => {
    this.graphId_ = id;
    this.professionTitle_ = professionTitle;
    this.mainSkill_ = mainSkill;
    this.skills_ = nodes;

    const flow = mapSkillsToFlow(mainSkill, nodes, edges);

    const layouted = await layoutGraph(flow.nodes, flow.edges);

    const edgesWithHandles = resolveHandles(layouted.nodes, layouted.edges);

    this.flowNodes_ = layouted.nodes;
    this.flowEdges_ = edgesWithHandles;
  };

  private syncStoredUserSkills = (skills: string[]): void => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      return;
    }

    try {
      const user = JSON.parse(raw) as object;
      localStorage.setItem("user", JSON.stringify({ ...user, skills }));
    } catch {
      return;
    }
  };
}
