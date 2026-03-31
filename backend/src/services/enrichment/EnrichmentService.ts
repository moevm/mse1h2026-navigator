import { inject, injectable } from "tsyringe";
import { StepikApiClient } from "../../integrations/stepik/client";
import { OpenLibraryClient } from "../../integrations/openlibrary/client";
import { HabrApiClient } from "../../integrations/habr/client";
import { WikipediaApiClient } from "../../integrations/wikipedia/client";
import { CourseMapper, BookMapper, ArticleMapper } from "../../mappers";
import type { SkillEnrichment } from "./types";

const COURSES_LIMIT = 3;
const BOOKS_LIMIT = 3;
const ARTICLES_LIMIT = 3;
const DESCRIPTION_MAX_LENGTH = 500;

@injectable()
export class EnrichmentService {
  constructor(
    @inject(StepikApiClient) private readonly stepik: StepikApiClient,
    @inject(OpenLibraryClient) private readonly openLibrary: OpenLibraryClient,
    @inject(HabrApiClient) private readonly habr: HabrApiClient,
    @inject(WikipediaApiClient) private readonly wikipedia: WikipediaApiClient,
  ) {}

  public async enrichSkill(skillTitle: string): Promise<SkillEnrichment> {
    const [coursesResult, booksResult, articlesResult, descriptionResult] =
      await Promise.allSettled([
        this.stepik.getAgregatedCourseInfo(skillTitle, COURSES_LIMIT, true),
        this.openLibrary.searchBySubject({ query: skillTitle, limit: BOOKS_LIMIT }),
        this.habr.getParsedArticles(skillTitle),
        this.wikipedia.getArticleExtract(skillTitle),
      ]);

    return {
      courses:
        coursesResult.status === "fulfilled"
          ? CourseMapper.toGqlList(coursesResult.value)
          : [],

      books:
        booksResult.status === "fulfilled"
          ? BookMapper.toGqlList(booksResult.value)
          : [],

      articles:
        articlesResult.status === "fulfilled"
          ? ArticleMapper.toGqlList(
              articlesResult.value.slice(0, ARTICLES_LIMIT),
            )
          : [],

      description:
        descriptionResult.status === "fulfilled"
          ? descriptionResult.value.extract.slice(0, DESCRIPTION_MAX_LENGTH)
          : "",
    };
  }
}
