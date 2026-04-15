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
  createdAt: string;
  updatedAt: string;
}

export interface UpdateGraphNodeResponse {
  node: GraphResponse["nodes"][number];
  skills: string[];
}
