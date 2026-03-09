import { makeAutoObservable } from "mobx";
import type { Edge, Node, NodeChange } from "@xyflow/react";
import { applyNodeChanges } from "@xyflow/react";
import { GraphProxy } from "../api/graphProxy";
import type { Skill, MainSkill } from "@/entities/skill/types";
import { mapSkillsToFlow } from "../lib/mapSkillsToFlow";

export class GraphStore {
  private skills_: Skill[] = [];
  private mainSkill_: MainSkill | null = null;

  private flowNodes_: Node[] = [];
  private flowEdges_: Edge[] = [];

  constructor() {
    makeAutoObservable(this);
    this.initData();
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

  public onNodesChange = (changes: NodeChange[]) => {
    this.flowNodes_ = applyNodeChanges(changes, this.flowNodes_);
  };

  private initData = async (): Promise<void> => {
    const { mainSkill, nodes, edges } = await GraphProxy.getGraphInfo();

    this.mainSkill_ = mainSkill;
    this.skills_ = nodes;

    const flow = mapSkillsToFlow(mainSkill, nodes, edges);

    this.flowNodes_ = flow.nodes;
    this.flowEdges_ = flow.edges;
  };
}
