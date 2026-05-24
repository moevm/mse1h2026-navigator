import type { MainSkill, Skill, SkillsRelation } from "@/entities/skill";

export interface AuthResponse {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  skills: string[];
  token: string;
}

export type CurrentUserResponse = Omit<AuthResponse, "token">;

export interface GraphResponse {
  id: string;
  professionTitle: string;
  mainSkill: MainSkill;
  nodes: Skill[];
  edges: SkillsRelation[];
  initialMainSkill?: MainSkill;
  initialNodes?: Skill[];
  initialEdges?: SkillsRelation[];
  createdAt: string;
  updatedAt: string;
}

export interface GraphListItem {
  id: string;
  professionTitle: string;
  normalizedProfessionTitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface GraphSearchParams {
  professionTitle: string;
  vacancyTitle?: string;
  initialTechnologies?: string[];
  isMock?: boolean;
  forceRegenerate?: boolean;
}

export type UpdateGraphNodeInput = Partial<
  Pick<
    Skill,
    | "title"
    | "description"
    | "isCompleted"
    | "isRequired"
    | "isArchieved"
    | "priority"
    | "learnHours"
    | "courses"
    | "books"
    | "articles"
  >
>;

export type CreateGraphNodeInput = Pick<Skill, "title"> &
  Partial<
    Pick<
      Skill,
      | "description"
      | "isCompleted"
      | "isRequired"
      | "isArchieved"
      | "priority"
      | "learnHours"
      | "courses"
      | "books"
      | "articles"
    >
  >;

export type GraphEdgeInput = SkillsRelation;

export interface UpdateGraphNodeResponse {
  node: GraphResponse["nodes"][number];
  skills: string[];
}
