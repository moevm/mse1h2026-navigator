import { makeAutoObservable, observable } from "mobx";
import type { Connection, Edge, Node, NodeChange } from "@xyflow/react";
import { applyNodeChanges } from "@xyflow/react";
import { GraphProxy } from "../api/graphProxy";
import type { Skill, MainSkill } from "@/entities/skill/types";
import type {
  CreateGraphNodeInput,
  GraphListItem,
  GraphResponse,
  UpdateGraphNodeInput,
} from "@/api/types";
import { mapSkillsToFlow } from "../lib/mapSkillsToFlow";
import { layoutGraph } from "../lib/layoutGraph";
import { resolveHandles } from "../lib/resolveHandles";
import { filterGraphSkills } from "../lib/filterGraphSkills";
import { applyCollapsedSubgraphs } from "../lib/applyCollapsedSubgraphs";

export interface GraphFilters {
  query: string;
  requiredOnly: boolean;
  incompleteOnly: boolean;
  minHours: number;
}

export class GraphStore {
  private graphId_: string | null = null;
  private professionTitle_: string = "";
  private skills_: Skill[] = [];
  private mainSkill_: MainSkill | null = null;
  private graphEdges_: GraphResponse["edges"] = [];
  private savedGraphs_: GraphListItem[] = [];
  private collapsedNodeIds_: Set<string> = new Set();
  private filters_: GraphFilters = {
    query: "",
    requiredOnly: false,
    incompleteOnly: false,
    minHours: 0,
  };

  private flowNodes_: Node[] = [];
  private flowEdges_: Edge[] = [];
  private isLoading_: boolean = false;
  private isEditing_: boolean = false;
  private error_: string | null = null;

  constructor() {
    makeAutoObservable<
      GraphStore,
      | "skills_"
      | "mainSkill_"
      | "graphEdges_"
      | "savedGraphs_"
      | "collapsedNodeIds_"
      | "filters_"
      | "flowNodes_"
      | "flowEdges_"
    >(this, {
      skills_: observable.ref,
      mainSkill_: observable.ref,
      graphEdges_: observable.ref,
      savedGraphs_: observable.ref,
      collapsedNodeIds_: observable.ref,
      filters_: observable.ref,
      flowNodes_: observable.ref,
      flowEdges_: observable.ref,
    });
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

  public get savedGraphs(): GraphListItem[] {
    return this.savedGraphs_;
  }

  public get filters(): GraphFilters {
    return this.filters_;
  }

  public get isLoading(): boolean {
    return this.isLoading_;
  }

  public get isEditing(): boolean {
    return this.isEditing_;
  }

  public get error(): string | null {
    return this.error_;
  }

  public get hasGraph(): boolean {
    return this.mainSkill_ !== null;
  }

  public get completedCount(): number {
    return this.skills_.filter((skill) => skill.isCompleted).length;
  }

  public get totalHours(): number {
    return this.skills_.reduce((sum, skill) => sum + skill.learnHours, 0);
  }

  public get visibleSkillsCount(): number {
    return this.flowNodes_.filter((node) => node.type === "basic").length;
  }

  public onNodesChange = (changes: NodeChange[]) => {
    this.flowNodes_ = applyNodeChanges(changes, this.flowNodes_);
  };

  public toggleCollapsedSubgraph = (nodeId: string): void => {
    const nextCollapsedNodeIds = new Set(this.collapsedNodeIds_);

    if (nextCollapsedNodeIds.has(nodeId)) {
      nextCollapsedNodeIds.delete(nodeId);
    } else {
      const hasVisibleChildren = this.flowEdges_.some(
        (edge) => edge.source === nodeId,
      );
      if (!hasVisibleChildren) {
        return;
      }
      nextCollapsedNodeIds.add(nodeId);
    }

    this.collapsedNodeIds_ = nextCollapsedNodeIds;
    void this.rebuildFlow();
  };

  public setFilter = <TKey extends keyof GraphFilters>(
    key: TKey,
    value: GraphFilters[TKey],
  ): void => {
    this.filters_ = { ...this.filters_, [key]: value };
    void this.rebuildFlow();
  };

  public loadSavedGraphs = async (): Promise<void> => {
    try {
      this.savedGraphs_ = await GraphProxy.listSavedGraphs();
    } catch {
      this.savedGraphs_ = [];
    }
  };

  public createOrLoadGraph = async (params: {
    professionTitle: string;
    initialTechnologies?: string[];
    forceRegenerate?: boolean;
    isMock?: boolean;
  }): Promise<string | null> => {
    const normalizedProfessionTitle = params.professionTitle.trim();
    if (!normalizedProfessionTitle) {
      this.error_ = "Введите профессию";
      return null;
    }

    this.isLoading_ = true;
    this.error_ = null;

    try {
      const graph = await GraphProxy.createOrLoadGraph({
        professionTitle: normalizedProfessionTitle,
        initialTechnologies: params.initialTechnologies ?? [],
        forceRegenerate: params.forceRegenerate ?? false,
        isMock: params.isMock ?? false,
      });
      await this.applyGraph(graph);
      await this.loadSavedGraphs();
      return graph.id;
    } catch (error) {
      this.error_ = this.getErrorMessage(error, "Не удалось загрузить граф");
      return null;
    } finally {
      this.isLoading_ = false;
    }
  };

  public openSavedGraph = async (graphId: string): Promise<void> => {
    this.isLoading_ = true;
    this.error_ = null;

    try {
      await this.applyGraph(await GraphProxy.getSavedGraph(graphId));
    } catch (error) {
      this.error_ = this.getErrorMessage(error, "Не удалось открыть граф");
    } finally {
      this.isLoading_ = false;
    }
  };

  public updateNode = async (
    nodeId: string,
    input: UpdateGraphNodeInput,
  ): Promise<void> => {
    if (!this.graphId_) {
      return;
    }

    this.isEditing_ = true;
    this.error_ = null;
    try {
      const { node, skills } = await GraphProxy.updateGraphNode(
        this.graphId_,
        nodeId,
        input,
      );

      this.skills_ = this.skills_.map((skill) =>
        skill.id === node.id ? { ...skill, ...node } : skill,
      );
      this.syncStoredUserSkills(skills);
      await this.rebuildFlow();
    } catch (error) {
      this.error_ = this.getErrorMessage(error, "Не удалось обновить узел");
    } finally {
      this.isEditing_ = false;
    }
  };

  public updateNodeCompletion = async (
    nodeId: string,
    isCompleted: boolean,
  ): Promise<void> => {
    await this.updateNode(nodeId, { isCompleted });
  };

  public addNode = async (
    input: CreateGraphNodeInput,
    relation?: { nodeId: string; direction: "after" | "before" },
  ): Promise<void> => {
    if (!this.graphId_) {
      this.error_ = "Сначала создайте или откройте граф";
      return;
    }

    const title = input.title.trim();
    if (!title) {
      this.error_ = "Введите название навыка";
      return;
    }

    this.isEditing_ = true;
    this.error_ = null;

    try {
      const existingNodeIds = new Set(this.skills_.map((skill) => skill.id));
      const graphWithNode = await GraphProxy.addGraphNode(this.graphId_, {
        ...input,
        title,
      });
      const createdNode = graphWithNode.nodes.find(
        (node) => !existingNodeIds.has(node.id),
      );

      if (!relation?.nodeId || !createdNode) {
        await this.applyGraph(graphWithNode);
        return;
      }

      const edge =
        relation.direction === "after"
          ? { fromId: relation.nodeId, toId: createdNode.id }
          : { fromId: createdNode.id, toId: relation.nodeId };

      await this.applyGraph(await GraphProxy.addGraphEdge(this.graphId_, edge));
    } catch (error) {
      this.error_ = this.getErrorMessage(error, "Не удалось добавить узел");
    } finally {
      this.isEditing_ = false;
    }
  };

  public deleteNode = async (nodeId: string): Promise<void> => {
    if (!this.graphId_) {
      return;
    }

    this.isEditing_ = true;
    this.error_ = null;
    try {
      await this.applyGraph(await GraphProxy.deleteGraphNode(this.graphId_, nodeId));
    } catch (error) {
      this.error_ = this.getErrorMessage(error, "Не удалось удалить узел");
    } finally {
      this.isEditing_ = false;
    }
  };

  public addEdge = async (edge: { fromId: string; toId: string }): Promise<void> => {
    if (!this.graphId_ || edge.fromId === edge.toId) {
      return;
    }

    this.isEditing_ = true;
    this.error_ = null;
    try {
      await this.applyGraph(await GraphProxy.addGraphEdge(this.graphId_, edge));
    } catch (error) {
      this.error_ = this.getErrorMessage(error, "Не удалось добавить связь");
    } finally {
      this.isEditing_ = false;
    }
  };

  public connectNodes = async (connection: Connection): Promise<void> => {
    if (!connection.source || !connection.target) {
      return;
    }

    await this.addEdge({ fromId: connection.source, toId: connection.target });
  };

  public deleteEdge = async (edgeId: string): Promise<void> => {
    if (!this.graphId_) {
      return;
    }

    const edge = this.flowEdges_.find((item) => item.id === edgeId);
    if (!edge) {
      return;
    }

    this.isEditing_ = true;
    this.error_ = null;
    try {
      await this.applyGraph(
        await GraphProxy.deleteGraphEdge(this.graphId_, {
          fromId: edge.source,
          toId: edge.target,
        }),
      );
    } catch (error) {
      this.error_ = this.getErrorMessage(error, "Не удалось удалить связь");
    } finally {
      this.isEditing_ = false;
    }
  };

  public resetToInitial = async (): Promise<void> => {
    if (!this.graphId_) {
      return;
    }

    this.isEditing_ = true;
    this.error_ = null;
    try {
      await this.applyGraph(await GraphProxy.resetGraphToInitial(this.graphId_));
    } catch (error) {
      this.error_ = this.getErrorMessage(error, "Не удалось сбросить граф");
    } finally {
      this.isEditing_ = false;
    }
  };

  public showSubgraph = async (nodeId: string, depth: number): Promise<void> => {
    if (!this.graphId_) {
      return;
    }

    this.isEditing_ = true;
    this.error_ = null;
    try {
      await this.applyGraph(
        await GraphProxy.getGraphSubgraph({
          graphId: this.graphId_,
          nodeId,
          depth,
        }),
      );
    } catch (error) {
      this.error_ = this.getErrorMessage(error, "Не удалось построить подграф");
    } finally {
      this.isEditing_ = false;
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
    this.graphEdges_ = edges;
    const validNodeIds = new Set([mainSkill.id, ...nodes.map((node) => node.id)]);
    this.collapsedNodeIds_ = new Set(
      [...this.collapsedNodeIds_].filter((nodeId) => validNodeIds.has(nodeId)),
    );
    await this.rebuildFlow();
  };

  private rebuildFlow = async (): Promise<void> => {
    if (!this.mainSkill_) {
      this.flowNodes_ = [];
      this.flowEdges_ = [];
      return;
    }

    const filteredSkills = filterGraphSkills(
      this.mainSkill_,
      this.skills_,
      this.graphEdges_,
      this.filters_,
    );
    const collapsedSubgraphs = applyCollapsedSubgraphs(
      this.mainSkill_,
      filteredSkills,
      this.graphEdges_,
      this.collapsedNodeIds_,
    );
    const mainSkill = {
      ...this.mainSkill_,
      isCollapsed: this.collapsedNodeIds_.has(this.mainSkill_.id),
      hiddenDescendantsCount:
        collapsedSubgraphs.hiddenDescendantCountById.get(this.mainSkill_.id) ?? 0,
    };
    const visibleSkills = collapsedSubgraphs.visibleSkills.map((skill) => ({
      ...skill,
      isCollapsed: this.collapsedNodeIds_.has(skill.id),
      hiddenDescendantsCount:
        collapsedSubgraphs.hiddenDescendantCountById.get(skill.id) ?? 0,
    }));
    const visibleIds = new Set([
      this.mainSkill_.id,
      ...visibleSkills.map((skill) => skill.id),
    ]);
    const visibleEdges = this.graphEdges_.filter(
      (edge) => visibleIds.has(edge.fromId) && visibleIds.has(edge.toId),
    );
    const flow = mapSkillsToFlow(mainSkill, visibleSkills, visibleEdges);
    const layouted = await layoutGraph(flow.nodes, flow.edges);
    this.flowNodes_ = layouted.nodes;
    this.flowEdges_ = resolveHandles(layouted.nodes, layouted.edges).map((edge) => ({
      ...edge,
      animated: true,
      style: { stroke: "#64748b", strokeWidth: 1.8 },
    }));
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

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  }
}
