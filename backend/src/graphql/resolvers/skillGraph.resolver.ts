import { Arg, Query, Resolver } from "type-graphql";
import { SkillGraphGql } from "../types/SkillGraph.type";
import { SkillGql } from "../types/Skill.type";
import { MainSkillGql } from "../types/MainSkill.type";
import { SkillsRelationGql } from "../types/SkillsRelation.type";
import { CourseGql } from "../types/Course.type";
import { BookGql } from "../types/Book.type";
import { ArticleGql } from "../types/Article.type";
import { LearningTimeInfoGql } from "../types/LearningTimeInfo.type";

function buildMockCourse(title: string): CourseGql {
  const course = new CourseGql();
  course.id = `course-${title.toLowerCase().replace(/\s+/g, "-")}`;
  course.title = `${title} — полный курс`;
  course.description = `Изучите ${title} с нуля до профессионального уровня`;
  course.link = `https://stepik.org/search?q=${encodeURIComponent(title)}`;
  course.image = undefined;
  const timeInfo = new LearningTimeInfoGql();
  timeInfo.minHours = 10;
  timeInfo.avgHours = 20;
  timeInfo.maxHours = 40;
  timeInfo.coursesAnalyzed = 5;
  course.learningTimeInfo = timeInfo;
  return course;
}

function buildMockBook(title: string): BookGql {
  const book = new BookGql();
  book.id = `book-${title.toLowerCase().replace(/\s+/g, "-")}`;
  book.title = `Mastering ${title}`;
  book.author = "Mock Author";
  book.description = `Comprehensive guide to ${title}`;
  book.link = `https://openlibrary.org/search?q=${encodeURIComponent(title)}`;
  return book;
}

function buildMockArticle(title: string): ArticleGql {
  const article = new ArticleGql();
  article.title = `Введение в ${title}`;
  article.description = `Обзорная статья про ${title} для начинающих`;
  article.link = `https://habr.com/ru/search/?q=${encodeURIComponent(title)}`;
  article.rating = Math.floor(Math.random() * 50) + 10;
  article.tags = [title.toLowerCase(), "tutorial"];
  return article;
}

function buildMockSkill(id: string, title: string): SkillGql {
  const skill = new SkillGql();
  skill.id = id;
  skill.title = title;
  skill.description = `${title} — ключевой навык для профессионального разработчика`;
  skill.isCompleted = false;
  skill.isRequired = true;
  skill.isArchieved = false;
  skill.priority = 1;
  skill.learnHours = 20;
  skill.courses = [buildMockCourse(title)];
  skill.books = [buildMockBook(title)];
  skill.articles = [buildMockArticle(title)];
  return skill;
}

@Resolver()
export class SkillGraphResolver {
  @Query(() => SkillGraphGql, { description: "Граф навыков по названию профессии" })
  async skillGraph(
    @Arg("professionName", { description: "Название профессии, например 'Backend Developer'" })
    professionName: string,
  ): Promise<SkillGraphGql> {
    const mainSkill = new MainSkillGql();
    mainSkill.id = `main-${professionName.toLowerCase().replace(/\s+/g, "-")}`;
    mainSkill.title = professionName;
    mainSkill.description = `Граф навыков для профессии «${professionName}»`;

    const rawNodes = [
      { id: "skill-1", title: "Git" },
      { id: "skill-2", title: "Version control" },
      { id: "skill-3", title: "GitHub" },
      { id: "skill-4", title: "Debugging" },
      { id: "skill-5", title: "Software testing" },
      { id: "skill-6", title: "Test-driven development" },
      { id: "skill-7", title: "Code refactoring" },
      { id: "skill-8", title: "Modular programming" },
    ];

    const nodes: SkillGql[] = rawNodes.map((n) => buildMockSkill(n.id, n.title));

    const edges: SkillsRelationGql[] = [
      { fromId: "skill-6", toId: "skill-5" },
      { fromId: "skill-6", toId: "skill-7" },
      { fromId: "skill-7", toId: "skill-8" },
      { fromId: "skill-5", toId: "skill-4" },
      { fromId: "skill-4", toId: "skill-1" },
      { fromId: "skill-1", toId: "skill-2" },
      { fromId: "skill-1", toId: "skill-3" },
    ].map((e) => {
      const rel = new SkillsRelationGql();
      rel.fromId = e.fromId;
      rel.toId = e.toId;
      return rel;
    });

    const result = new SkillGraphGql();
    result.mainSkill = mainSkill;
    result.nodes = nodes;
    result.edges = edges;
    return result;
  }
}
