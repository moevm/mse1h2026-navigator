import type { MainSkill, Skill, SkillsRelation } from "./types";

export const getSkillsGraph = async (): Promise<{
  mainSkill: MainSkill;
  nodes: Skill[];
  edges: SkillsRelation[];
}> => {
  return {
    mainSkill: {
      id: "1",
      title: "Машинное обучение",
      description: "Описание машинного обучения",
    },
    nodes: [
      {
        id: "2",
        title: "Математика",
        description: "Описание математики",
        learnHours: 10,
        priority: 1,
        isArchieved: false,
        isCompleted: false,
        isRequired: false,
        articles: [],
        books: [],
        courses: [],
      },
      {
        id: "3",
        title: "Python",
        description: "Описание Python",
        learnHours: 20,
        priority: 2,
        isArchieved: false,
        isCompleted: false,
        isRequired: false,
        articles: [],
        books: [],
        courses: [],
      },
    ],
    edges: [
      { fromId: "1", toId: "2" },
      { fromId: "1", toId: "3" },
    ],
  };
};
