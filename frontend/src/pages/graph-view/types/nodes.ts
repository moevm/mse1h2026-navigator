import type { MainSkill, Skill } from "@/entities/skill";
import type { Node } from "@xyflow/react";

export type GraphNodeUiState = {
  isCollapsed?: boolean;
  hiddenDescendantsCount?: number;
};

export type MainFlowNode = Node<MainSkill & GraphNodeUiState, "main">;

export type BasicFlowNode = Node<Skill & GraphNodeUiState, "basic">;

export type GraphNode = MainFlowNode | BasicFlowNode;
