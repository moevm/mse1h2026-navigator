import type { Article, Book, Course, MainSkill, Skill, SkillsRelation } from "@prisma/client";

export interface CreateGraphRequest {
  professionTitle?: string;
  useCache?: boolean;
  isMock?: boolean;
  forceRegenerate?: boolean;
}

export interface UpdateGraphNodeRequest {
  isCompleted?: boolean;
}

export interface GraphDataServiceResponse {
  nodes: string[];
  edges: Array<{
    from_skill: string;
    to_skill: string;
  }>;
}

export interface GraphResponse {
  id: string;
  professionTitle: string;
  mainSkill: MainSkill;
  nodes: Skill[];
  edges: SkillsRelation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphListItemResponse {
  id: string;
  professionTitle: string;
  normalizedProfessionTitle: string;
  createdAt: Date;
  updatedAt: Date;
}

export type GraphSkill = Skill;
export type GraphMainSkill = MainSkill;
export type GraphSkillsRelation = SkillsRelation;
export type GraphArticle = Article;
export type GraphBook = Book;
export type GraphCourse = Course;
