import type { MainSkill, Skill } from "@/entities/skill";
import type { Node } from "@xyflow/react";

export type MainFlowNode = Node<MainSkill, "main">;

export type BasicFlowNode = Node<Skill, "basic">;

export type GraphNode = MainFlowNode | BasicFlowNode;
