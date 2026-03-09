import type { Article } from "../article/@x";
import type { Book } from "../book/@x";
import type { Course } from "../course/@x";

export type Skill = {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
  isArchieved: boolean;
  priority: number;
  learnHours: number;
  courses?: Course[];
  books?: Book[];
  articles?: Article[];
};

export type MainSkill = {
  id: string;
  title: string;
  description: string;
};

export type SkillsRelation = {
  fromId: string;
  toId: string;
};
