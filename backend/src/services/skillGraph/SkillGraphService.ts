import { inject, injectable } from "tsyringe";
import { EnrichmentService } from "../enrichment/EnrichmentService";
import type { ISkillGraphRepository } from "../../repositories/skillGraph/ISkillGraphRepository";
import { SkillGraphGql } from "../../graphql/types/SkillGraph.type";
import { SkillGql } from "../../graphql/types/Skill.type";
import { MainSkillGql } from "../../graphql/types/MainSkill.type";
import { SkillsRelationGql } from "../../graphql/types/SkillsRelation.type";
import { CourseGql } from "../../graphql/types/Course.type";
import { BookGql } from "../../graphql/types/Book.type";
import { ArticleGql } from "../../graphql/types/Article.type";
import { LearningTimeInfoGql } from "../../graphql/types/LearningTimeInfo.type";

const SKILL_GRAPH_REPOSITORY_TOKEN = "ISkillGraphRepository";

@injectable()
export class SkillGraphService {
  constructor(
    @inject(SKILL_GRAPH_REPOSITORY_TOKEN)
    private readonly graphRepo: ISkillGraphRepository,
    @inject(EnrichmentService)
    private readonly enrichmentService: EnrichmentService,
  ) {}

  public async getSkillGraph(
    professionName: string,
    isMock: boolean,
  ): Promise<SkillGraphGql> {
    console.log(`\n[SkillGraph] ── START ──────────────────────────────────`);
    console.log(`[SkillGraph] profession="${professionName}"  isMock=${isMock}`);

    console.log(`[SkillGraph] [1/3] Fetching raw graph from graph-data-service...`);
    const rawGraph = await this.graphRepo.getGraph(professionName, isMock);
    console.log(`[SkillGraph] [1/3] Done. nodes=${rawGraph.nodes.length}, edges=${rawGraph.edges.length}`);
    console.log(`[SkillGraph]       nodes: [${rawGraph.nodes.join(", ")}]`);

    const titleToId = new Map<string, string>(
      rawGraph.nodes.map((title) => [title, this.toSlugId(title)]),
    );

    console.log(`[SkillGraph] [2/3] Building skill nodes (isMock=${isMock})...`);
    const nodes = await Promise.all(
      rawGraph.nodes.map((title) =>
        isMock
          ? Promise.resolve(this.buildMockSkill(title, titleToId.get(title)!))
          : this.buildSkill(title, titleToId.get(title)!),
      ),
    );
    console.log(`[SkillGraph] [2/3] Done. Built ${nodes.length} nodes.`);

    console.log(`[SkillGraph] [3/3] Mapping edges...`);
    const edges = rawGraph.edges
      .map((e) => {
        const rel = new SkillsRelationGql();
        rel.fromId = titleToId.get(e.from_skill) ?? "";
        rel.toId = titleToId.get(e.to_skill) ?? "";
        return rel;
      })
      .filter((e) => e.fromId && e.toId);
    console.log(`[SkillGraph] [3/3] Done. Mapped ${edges.length} edges.`);

    const mainSkill = new MainSkillGql();
    mainSkill.id = this.toSlugId(professionName);
    mainSkill.title = professionName;
    mainSkill.description = `Граф навыков для профессии «${professionName}»`;

    const result = new SkillGraphGql();
    result.mainSkill = mainSkill;
    result.nodes = nodes;
    result.edges = edges;

    console.log(`[SkillGraph] ── DONE ───────────────────────────────────\n`);
    return result;
  }

  private async buildSkill(title: string, id: string): Promise<SkillGql> {
    console.log(`[SkillGraph]   enriching skill "${title}"...`);
    const enrichment = await this.enrichmentService.enrichSkill(title);
    console.log(
      `[SkillGraph]   "${title}" enriched: courses=${enrichment.courses.length}, books=${enrichment.books.length}, articles=${enrichment.articles.length}`,
    );

    const skill = new SkillGql();
    skill.id = id;
    skill.title = title;
    skill.description = enrichment.description;
    skill.isCompleted = false;
    skill.isRequired = true;
    skill.isArchieved = false;
    skill.priority = 1;
    skill.learnHours = enrichment.courses[0]?.learningTimeInfo?.avgHours ?? 0;
    skill.courses = enrichment.courses;
    skill.books = enrichment.books;
    skill.articles = enrichment.articles;

    return skill;
  }

  /** Mock-путь: без вызовов внешних API, мгновенный ответ */
  private buildMockSkill(title: string, id: string): SkillGql {
    const timeInfo = new LearningTimeInfoGql();
    timeInfo.minHours = 10;
    timeInfo.avgHours = 20;
    timeInfo.maxHours = 40;
    timeInfo.coursesAnalyzed = 5;

    const course = new CourseGql();
    course.id = `course-${id}`;
    course.title = `${title} — полный курс`;
    course.description = `Изучите ${title} с нуля до профессионального уровня`;
    course.link = `https://stepik.org/search?q=${encodeURIComponent(title)}`;
    course.learningTimeInfo = timeInfo;

    const book = new BookGql();
    book.id = `book-${id}`;
    book.title = `Mastering ${title}`;
    book.author = "Mock Author";
    book.description = `Comprehensive guide to ${title}`;
    book.link = `https://openlibrary.org/search?q=${encodeURIComponent(title)}`;

    const article = new ArticleGql();
    article.title = `Введение в ${title}`;
    article.description = `Обзорная статья про ${title} для начинающих`;
    article.link = `https://habr.com/ru/search/?q=${encodeURIComponent(title)}`;
    article.rating = 42;
    article.tags = [title.toLowerCase(), "tutorial"];

    const skill = new SkillGql();
    skill.id = id;
    skill.title = title;
    skill.description = `${title} — ключевой навык для профессионального разработчика`;
    skill.isCompleted = false;
    skill.isRequired = true;
    skill.isArchieved = false;
    skill.priority = 1;
    skill.learnHours = timeInfo.avgHours;
    skill.courses = [course];
    skill.books = [book];
    skill.articles = [article];

    return skill;
  }

  private toSlugId(title: string): string {
    return title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }
}
