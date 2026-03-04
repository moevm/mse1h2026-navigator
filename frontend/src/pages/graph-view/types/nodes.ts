import type { Node } from "@xyflow/react";

export interface BaseNode extends Node {
  title: string;
  description: string;
}

export interface MainNode extends BaseNode {
  type: "main";
  mainSpecificField?: string;
}

export interface BasicNode extends BaseNode {
  type: "basic";
  data: {
    isCompleted: boolean;
    isRequired: boolean;
    isArchieved: boolean;
    priority: number;
    courses: any[]; // TODO: поменять any[] на типы (когда будут понятны данные)
    books: any[];
    articles: any[];
  };
}

export type GraphNode = MainNode | BasicNode;
