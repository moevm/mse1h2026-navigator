import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";
import { inject, injectable } from "tsyringe";
import { SkillGraphService } from "../../services/skillGraph/SkillGraphService";
import {
  CreateGraphNodeInput,
  CreateOrLoadGraphInput,
  GraphEdgeInput,
  GraphListItemGql,
  SavedSkillGraphGql,
  SkillGraphGql,
  UpdateGraphNodeInput,
  UpdateGraphNodeResultGql,
} from "../types";
import { requireGraphQLUser, type GraphQLContext } from "../context";
import {
  createGraphEdge as createGraphEdgeService,
  createGraphNode as createGraphNodeService,
  createOrLoadUserGraph,
  deleteUserGraph,
  deleteGraphEdge as deleteGraphEdgeService,
  deleteGraphNode as deleteGraphNodeService,
  getGraphSubgraph,
  getInitialUserGraph,
  getUserGraph,
  listUserGraphs,
  normalizeBuiltGraphData,
  resetUserGraphToInitial,
  updateGraphNode as updateGraphNodeService,
} from "../../services/graphEditing/service";
import type {
  CreateGraphNodeRequest,
  GraphListItemResponse,
  GraphResponse,
  UpdateGraphNodeRequest,
  UpdateGraphNodeResponse,
} from "../../services/graphEditing/types";

@injectable()
@Resolver()
export class SkillGraphResolver {
  constructor(
    @inject(SkillGraphService)
    private readonly skillGraphService: SkillGraphService,
  ) {}

  @Query(() => SkillGraphGql, {
    description: "Граф навыков по названию профессии",
  })
  async skillGraph(
    @Arg("professionName", {
      description: "Название профессии, например 'Backend Developer'",
    })
    professionName: string,

    @Arg("isMock", {
      description:
        "Если true — возвращает mock-данные без вызовов внешних сервисов. " +
        "Если false — запускает полный пайплайн: граф из graph-data-service + обогащение через Stepik / Habr / OpenLibrary / Wikipedia",
      nullable: true,
      defaultValue: false,
    })
    isMock: boolean,
  ): Promise<SkillGraphGql> {
    return this.skillGraphService.getSkillGraph(professionName, isMock);
  }

  @Query(() => [GraphListItemGql], {
    description: "Список сохраненных графов текущего пользователя",
  })
  async savedGraphs(@Ctx() context: GraphQLContext): Promise<GraphListItemGql[]> {
    const user = requireGraphQLUser(context);
    return (await listUserGraphs(user.id)).map(this.toGraphListItemGql);
  }

  @Query(() => SavedSkillGraphGql, {
    description: "Сохраненный граф текущего пользователя по id",
  })
  async savedGraph(
    @Arg("graphId") graphId: string,
    @Ctx() context: GraphQLContext
  ): Promise<SavedSkillGraphGql> {
    const user = requireGraphQLUser(context);
    return this.toSavedSkillGraphGql(await getUserGraph(user.id, graphId));
  }

  @Query(() => SavedSkillGraphGql, {
    description: "Исходный снимок сохраненного графа текущего пользователя",
  })
  async initialSavedGraph(
    @Arg("graphId") graphId: string,
    @Ctx() context: GraphQLContext
  ): Promise<SavedSkillGraphGql> {
    const user = requireGraphQLUser(context);
    return this.toSavedSkillGraphGql(await getInitialUserGraph(user.id, graphId));
  }

  @Query(() => SavedSkillGraphGql, {
    description: "Подграф вокруг выбранного узла",
  })
  async graphSubgraph(
    @Arg("graphId") graphId: string,
    @Arg("nodeId") nodeId: string,
    @Arg("depth", () => Int, { defaultValue: 1 }) depth: number,
    @Ctx() context: GraphQLContext
  ): Promise<SavedSkillGraphGql> {
    const user = requireGraphQLUser(context);
    return this.toSavedSkillGraphGql(
      await getGraphSubgraph(user.id, graphId, nodeId, depth)
    );
  }

  @Mutation(() => SavedSkillGraphGql, {
    description: "Создать, загрузить или пересоздать пользовательский граф",
  })
  async createOrLoadGraph(
    @Arg("input") input: CreateOrLoadGraphInput,
    @Ctx() context: GraphQLContext
  ): Promise<SavedSkillGraphGql> {
    const user = requireGraphQLUser(context);
    const graph = await createOrLoadUserGraph({
      userId: user.id,
      professionTitle: input.professionTitle,
      forceRegenerate: input.forceRegenerate,
      buildGraph: async () =>
        normalizeBuiltGraphData(
          await this.skillGraphService.getSkillGraph(
            input.professionTitle,
            input.isMock,
            input.initialTechnologies ?? [],
            input.vacancyTitle
          )
        ),
    });

    return this.toSavedSkillGraphGql(graph);
  }

  @Mutation(() => UpdateGraphNodeResultGql, {
    description: "Обновить параметры узла графа",
  })
  async updateGraphNode(
    @Arg("graphId") graphId: string,
    @Arg("nodeId") nodeId: string,
    @Arg("input") input: UpdateGraphNodeInput,
    @Ctx() context: GraphQLContext
  ): Promise<UpdateGraphNodeResultGql> {
    const user = requireGraphQLUser(context);
    return this.toUpdateGraphNodeResultGql(
      await updateGraphNodeService(
        user.id,
        graphId,
        nodeId,
        this.toUpdateGraphNodeRequest(input)
      )
    );
  }

  @Mutation(() => SavedSkillGraphGql, {
    description: "Добавить навык в граф",
  })
  async addGraphNode(
    @Arg("graphId") graphId: string,
    @Arg("input") input: CreateGraphNodeInput,
    @Ctx() context: GraphQLContext
  ): Promise<SavedSkillGraphGql> {
    const user = requireGraphQLUser(context);
    return this.toSavedSkillGraphGql(
      await createGraphNodeService(
        user.id,
        graphId,
        this.toCreateGraphNodeRequest(input)
      )
    );
  }

  @Mutation(() => SavedSkillGraphGql, {
    description: "Удалить навык и связанные с ним ребра",
  })
  async deleteGraphNode(
    @Arg("graphId") graphId: string,
    @Arg("nodeId") nodeId: string,
    @Ctx() context: GraphQLContext
  ): Promise<SavedSkillGraphGql> {
    const user = requireGraphQLUser(context);
    return this.toSavedSkillGraphGql(
      await deleteGraphNodeService(user.id, graphId, nodeId)
    );
  }

  @Mutation(() => Boolean, {
    description: "Полностью удалить сохраненный граф текущего пользователя",
  })
  async deleteGraph(
    @Arg("graphId") graphId: string,
    @Ctx() context: GraphQLContext
  ): Promise<boolean> {
    const user = requireGraphQLUser(context);
    await deleteUserGraph(user.id, graphId);
    return true;
  }

  @Mutation(() => SavedSkillGraphGql, {
    description: "Добавить зависимость между навыками",
  })
  async addGraphEdge(
    @Arg("graphId") graphId: string,
    @Arg("input") input: GraphEdgeInput,
    @Ctx() context: GraphQLContext
  ): Promise<SavedSkillGraphGql> {
    const user = requireGraphQLUser(context);
    return this.toSavedSkillGraphGql(
      await createGraphEdgeService(user.id, graphId, input.fromId, input.toId)
    );
  }

  @Mutation(() => SavedSkillGraphGql, {
    description: "Удалить зависимость между навыками",
  })
  async deleteGraphEdge(
    @Arg("graphId") graphId: string,
    @Arg("input") input: GraphEdgeInput,
    @Ctx() context: GraphQLContext
  ): Promise<SavedSkillGraphGql> {
    const user = requireGraphQLUser(context);
    return this.toSavedSkillGraphGql(
      await deleteGraphEdgeService(user.id, graphId, input.fromId, input.toId)
    );
  }

  @Mutation(() => SavedSkillGraphGql, {
    description: "Сбросить текущий граф к исходному снимку",
  })
  async resetGraphToInitial(
    @Arg("graphId") graphId: string,
    @Ctx() context: GraphQLContext
  ): Promise<SavedSkillGraphGql> {
    const user = requireGraphQLUser(context);
    return this.toSavedSkillGraphGql(
      await resetUserGraphToInitial(user.id, graphId)
    );
  }

  private toGraphListItemGql(graph: GraphListItemResponse): GraphListItemGql {
    return Object.assign(new GraphListItemGql(), graph);
  }

  private toSavedSkillGraphGql(graph: GraphResponse): SavedSkillGraphGql {
    return Object.assign(new SavedSkillGraphGql(), graph);
  }

  private toUpdateGraphNodeResultGql({
    node,
    skills,
  }: UpdateGraphNodeResponse): UpdateGraphNodeResultGql {
    return Object.assign(new UpdateGraphNodeResultGql(), { node, skills });
  }

  private toUpdateGraphNodeRequest(
    input: UpdateGraphNodeInput
  ): UpdateGraphNodeRequest {
    return this.normalizeNodeInput(input);
  }

  private toCreateGraphNodeRequest(
    input: CreateGraphNodeInput
  ): CreateGraphNodeRequest {
    return this.normalizeNodeInput(input);
  }

  private normalizeNodeInput(
    input: UpdateGraphNodeInput | CreateGraphNodeInput
  ): UpdateGraphNodeRequest {
    return {
      ...input,
      courses: input.courses?.map((course) => ({
        ...course,
        image: course.image ?? null,
        learningTimeInfo: course.learningTimeInfo ?? null,
      })),
      books: input.books?.map((book) => ({
        ...book,
        image: book.image ?? null,
      })),
      articles: input.articles,
    };
  }
}
