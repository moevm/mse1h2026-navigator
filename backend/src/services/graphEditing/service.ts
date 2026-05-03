import type {
  Article,
  Book,
  Course,
  Graph,
  MainSkill,
  Skill,
  SkillsRelation,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type {
  CreateGraphNodeRequest,
  GraphDataServiceResponse,
  GraphListItemResponse,
  GraphResponse,
  UpdateGraphNodeRequest,
  UpdateGraphNodeResponse,
} from "./types";

export class GraphServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
  }
}

type GraphWithData = Graph & {
  mainSkill: MainSkill;
  nodes: Skill[];
  edges: SkillsRelation[];
};

interface BuiltGraphData {
  mainSkill: MainSkill;
  nodes: Skill[];
  edges: SkillsRelation[];
}

interface BuiltLearningTimeInfo {
  minHours: number;
  avgHours: number;
  maxHours: number;
  coursesAnalyzed: number;
}

interface BuiltCourse {
  id: string;
  title: string;
  description: string;
  learningTimeInfo?: BuiltLearningTimeInfo | null;
  link: string;
  image?: string | null;
}

interface BuiltBook {
  id: string;
  title: string;
  author: string;
  description: string;
  link: string;
  image?: string | null;
}

interface BuiltArticle {
  id?: string;
  title: string;
  description: string;
  link: string;
  rating: number;
  tags: string[];
}

type EditableSkillPatch = Partial<
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

export function normalizeProfessionTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeSkillTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function buildSkillId(title: string, index: number): string {
  return `skill-${index + 1}-${title
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")}`;
}

function buildUniqueSkillId(graph: GraphWithData, title: string): string {
  const existingIds = new Set([
    graph.mainSkill.id,
    ...graph.nodes.map((node) => node.id),
  ]);
  let index = graph.nodes.length;
  let id = buildSkillId(title, index);

  while (existingIds.has(id)) {
    index += 1;
    id = buildSkillId(title, index);
  }

  return id;
}

export function mapGraphResponse(graph: GraphWithData): GraphResponse {
  return {
    id: graph.id,
    professionTitle: graph.professionTitle,
    mainSkill: graph.mainSkill,
    nodes: graph.nodes,
    edges: graph.edges,
    createdAt: graph.createdAt,
    updatedAt: graph.updatedAt,
  };
}

export function mapGraphListItem(graph: {
  id: string;
  professionTitle: string;
  normalizedProfessionTitle: string;
  createdAt: Date;
  updatedAt: Date;
}): GraphListItemResponse {
  return {
    id: graph.id,
    professionTitle: graph.professionTitle,
    normalizedProfessionTitle: graph.normalizedProfessionTitle,
    createdAt: graph.createdAt,
    updatedAt: graph.updatedAt,
  };
}

function buildResourceId(value: string, fallback: string): string {
  const id = value
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return id || fallback;
}

export function normalizeBuiltGraphData(graph: {
  mainSkill: MainSkill;
  nodes: Array<{
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    isRequired: boolean;
    isArchieved: boolean;
    priority: number;
    learnHours: number;
    courses?: BuiltCourse[];
    books?: BuiltBook[];
    articles?: BuiltArticle[];
  }>;
  edges: SkillsRelation[];
}): BuiltGraphData {
  return {
    mainSkill: {
      id: graph.mainSkill.id,
      title: graph.mainSkill.title,
      description: graph.mainSkill.description,
    },
    nodes: graph.nodes.map((node, nodeIndex) => ({
      id: node.id,
      title: node.title,
      description: node.description,
      isCompleted: node.isCompleted,
      isRequired: node.isRequired,
      isArchieved: node.isArchieved,
      priority: node.priority,
      learnHours: Math.max(0, Math.round(node.learnHours)),
      courses: (node.courses ?? []).map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        learningTimeInfo: course.learningTimeInfo ?? null,
        link: course.link,
        image: course.image ?? null,
      })),
      books: (node.books ?? []).map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        link: book.link,
        image: book.image ?? null,
      })),
      articles: (node.articles ?? []).map((article, articleIndex) => ({
        id:
          article.id ??
          buildResourceId(
            article.link || article.title || "",
            `article-${nodeIndex + 1}-${articleIndex + 1}`
          ),
        title: article.title,
        description: article.description,
        link: article.link,
        rating: article.rating,
        tags: article.tags,
      })),
    })),
    edges: graph.edges,
  };
}

export function convertGraphData(
  professionTitle: string,
  graphData: GraphDataServiceResponse
): {
  mainSkill: GraphResponse["mainSkill"];
  nodes: Skill[];
  edges: SkillsRelation[];
} {
  const skillTitleById = new Map<string, string>();
  const skillIdByTitle = new Map<string, string>();

  graphData.nodes.forEach((rawTitle, index) => {
    const title = rawTitle.trim();
    if (!title || skillIdByTitle.has(title)) {
      return;
    }

    const id = buildSkillId(title, index);
    skillIdByTitle.set(title, id);
    skillTitleById.set(id, title);
  });

  const mainSkill = {
    id: "main",
    title: professionTitle,
    description: `Граф навыков для профессии ${professionTitle}`,
  };

  const nodes: Skill[] = Array.from(skillTitleById.entries()).map(
    ([id, title], index) => ({
      id,
      title,
      description: "",
      isCompleted: false,
      isRequired: false,
      isArchieved: false,
      priority: index + 1,
      learnHours: 0,
      courses: [],
      books: [],
      articles: [],
    })
  );

  const edges: SkillsRelation[] = graphData.edges
    .map((edge) => {
      const fromId = skillIdByTitle.get(edge.from_skill.trim());
      const toId = skillIdByTitle.get(edge.to_skill.trim());
      if (!fromId || !toId) {
        return null;
      }
      return { fromId, toId };
    })
    .filter((edge): edge is SkillsRelation => edge !== null);

  const targetNodeIds = new Set<string>();
  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.fromId);
    connectedNodeIds.add(edge.toId);
    targetNodeIds.add(edge.toId);
  });

  nodes.forEach((node) => {
    if (!connectedNodeIds.has(node.id) || !targetNodeIds.has(node.id)) {
      edges.push({ fromId: mainSkill.id, toId: node.id });
    }
  });

  return { mainSkill, nodes, edges };
}

export async function findUserGraph(
  userId: string,
  graphId: string
): Promise<GraphWithData> {
  const graph = await prisma.graph.findFirst({
    where: {
      id: graphId,
      userId,
    },
  });

  if (!graph) {
    throw new GraphServiceError(404, "Graph not found");
  }

  return graph as GraphWithData;
}

export async function listUserGraphs(userId: string): Promise<GraphListItemResponse[]> {
  const graphs = await prisma.graph.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      professionTitle: true,
      normalizedProfessionTitle: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return graphs.map(mapGraphListItem);
}

export async function getUserGraph(
  userId: string,
  graphId: string
): Promise<GraphResponse> {
  return mapGraphResponse(await findUserGraph(userId, graphId));
}

export async function createOrLoadUserGraph(params: {
  userId: string;
  professionTitle: string;
  forceRegenerate?: boolean;
  buildGraph: () => Promise<BuiltGraphData>;
}): Promise<GraphResponse> {
  const { userId, professionTitle, forceRegenerate = false, buildGraph } = params;

  if (!professionTitle || professionTitle.trim().length === 0) {
    throw new GraphServiceError(400, "professionTitle is required");
  }

  const normalizedProfessionTitle = normalizeProfessionTitle(professionTitle);
  const existingGraph = await prisma.graph.findUnique({
    where: {
      userId_normalizedProfessionTitle: {
        userId,
        normalizedProfessionTitle,
      },
    },
  });

  if (existingGraph && !forceRegenerate) {
    return mapGraphResponse(existingGraph as GraphWithData);
  }

  const graphData = await buildGraph();
  const graph = existingGraph
    ? await prisma.graph.update({
        where: { id: existingGraph.id },
        data: graphData,
      })
    : await prisma.graph.create({
        data: {
          userId,
          professionTitle: professionTitle.trim(),
          normalizedProfessionTitle,
          ...graphData,
        },
      });

  return mapGraphResponse(graph as GraphWithData);
}

function assertStringField(
  value: unknown,
  fieldName: string,
  options: { required?: boolean } = {}
): string | undefined {
  if (value === undefined) {
    if (options.required) {
      throw new GraphServiceError(400, `${fieldName} is required`);
    }
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new GraphServiceError(400, `${fieldName} must be a non-empty string`);
  }

  return value.trim();
}

function assertBooleanField(value: unknown, fieldName: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new GraphServiceError(400, `${fieldName} must be a boolean`);
  }

  return value;
}

function assertNonNegativeInteger(
  value: unknown,
  fieldName: string
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new GraphServiceError(400, `${fieldName} must be a non-negative integer`);
  }

  return value;
}

function assertArrayField<T>(
  value: unknown,
  fieldName: string
): T[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new GraphServiceError(400, `${fieldName} must be an array`);
  }

  return value as T[];
}

function buildSkillPatch(request: UpdateGraphNodeRequest): EditableSkillPatch {
  const patch: EditableSkillPatch = {};
  const title = assertStringField(request.title, "title");
  const description = assertStringField(request.description, "description");
  const isCompleted = assertBooleanField(request.isCompleted, "isCompleted");
  const isRequired = assertBooleanField(request.isRequired, "isRequired");
  const isArchieved = assertBooleanField(request.isArchieved, "isArchieved");
  const priority = assertNonNegativeInteger(request.priority, "priority");
  const learnHours = assertNonNegativeInteger(request.learnHours, "learnHours");
  const courses = assertArrayField<Course>(request.courses, "courses");
  const books = assertArrayField<Book>(request.books, "books");
  const articles = assertArrayField<Article>(request.articles, "articles");

  if (title !== undefined) {
    patch.title = title;
  }
  if (description !== undefined) {
    patch.description = description;
  }
  if (isCompleted !== undefined) {
    patch.isCompleted = isCompleted;
  }
  if (isRequired !== undefined) {
    patch.isRequired = isRequired;
  }
  if (isArchieved !== undefined) {
    patch.isArchieved = isArchieved;
  }
  if (priority !== undefined) {
    patch.priority = priority;
  }
  if (learnHours !== undefined) {
    patch.learnHours = learnHours;
  }
  if (courses !== undefined) {
    patch.courses = courses;
  }
  if (books !== undefined) {
    patch.books = books;
  }
  if (articles !== undefined) {
    patch.articles = articles;
  }

  if (Object.keys(patch).length === 0) {
    throw new GraphServiceError(400, "At least one node field is required");
  }

  return patch;
}

function buildNewSkill(graph: GraphWithData, request: CreateGraphNodeRequest): Skill {
  const title = assertStringField(request.title, "title", { required: true });
  const description = assertStringField(request.description, "description") ?? "";
  const priority =
    assertNonNegativeInteger(request.priority, "priority") ?? graph.nodes.length + 1;
  const learnHours = assertNonNegativeInteger(request.learnHours, "learnHours") ?? 0;

  if (!title) {
    throw new GraphServiceError(400, "title is required");
  }

  return {
    id: buildUniqueSkillId(graph, title),
    title,
    description,
    isCompleted: assertBooleanField(request.isCompleted, "isCompleted") ?? false,
    isRequired: assertBooleanField(request.isRequired, "isRequired") ?? false,
    isArchieved: assertBooleanField(request.isArchieved, "isArchieved") ?? false,
    priority,
    learnHours,
    courses: assertArrayField<Course>(request.courses, "courses") ?? [],
    books: assertArrayField<Book>(request.books, "books") ?? [],
    articles: assertArrayField<Article>(request.articles, "articles") ?? [],
  };
}

function ensureUniqueSkillTitle(
  graph: GraphWithData,
  title: string,
  ignoredNodeId?: string
): void {
  const normalizedTitle = normalizeSkillTitle(title);
  const hasDuplicate = graph.nodes.some(
    (node) =>
      node.id !== ignoredNodeId && normalizeSkillTitle(node.title) === normalizedTitle
  );

  if (hasDuplicate || normalizeSkillTitle(graph.mainSkill.title) === normalizedTitle) {
    throw new GraphServiceError(409, "Graph node with this title already exists");
  }
}

function nodeExists(graph: GraphWithData, nodeId: string): boolean {
  return graph.mainSkill.id === nodeId || graph.nodes.some((node) => node.id === nodeId);
}

function edgeExists(edges: SkillsRelation[], fromId: string, toId: string): boolean {
  return edges.some((edge) => edge.fromId === fromId && edge.toId === toId);
}

function assertEdgeCanBeAdded(
  graph: GraphWithData,
  fromId: string,
  toId: string
): void {
  if (!fromId || !toId) {
    throw new GraphServiceError(400, "fromId and toId are required");
  }

  if (fromId === toId) {
    throw new GraphServiceError(400, "Edge endpoints must be different");
  }

  if (toId === graph.mainSkill.id) {
    throw new GraphServiceError(400, "Main skill cannot be an edge target");
  }

  if (!nodeExists(graph, fromId) || !nodeExists(graph, toId)) {
    throw new GraphServiceError(404, "Edge endpoints must exist in graph");
  }

  if (edgeExists(graph.edges, fromId, toId)) {
    throw new GraphServiceError(409, "Graph edge already exists");
  }

  if (wouldCreateCycle(graph.edges, fromId, toId)) {
    throw new GraphServiceError(400, "Graph edge would create a cycle");
  }
}

function wouldCreateCycle(
  currentEdges: SkillsRelation[],
  fromId: string,
  toId: string
): boolean {
  const adjacency = new Map<string, string[]>();
  [...currentEdges, { fromId, toId }].forEach((edge) => {
    const targets = adjacency.get(edge.fromId) ?? [];
    targets.push(edge.toId);
    adjacency.set(edge.fromId, targets);
  });

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (visiting.has(nodeId)) {
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visiting.add(nodeId);
    for (const nextId of adjacency.get(nodeId) ?? []) {
      if (hasCycle(nextId)) {
        return true;
      }
    }
    visiting.delete(nodeId);
    visited.add(nodeId);

    return false;
  }

  return Array.from(adjacency.keys()).some(hasCycle);
}

async function syncCompletedUserSkills(userId: string): Promise<string[]> {
  const userGraphs = await prisma.graph.findMany({
    where: { userId },
    select: { nodes: true },
  });
  const skills = Array.from(
    new Set(
      userGraphs.flatMap((userGraph) =>
        userGraph.nodes
          .filter((node) => node.isCompleted)
          .map((node) => node.title)
      )
    )
  );
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { skills },
  });

  return updatedUser.skills;
}

export async function updateGraphNode(
  userId: string,
  graphId: string,
  nodeId: string,
  request: UpdateGraphNodeRequest
): Promise<UpdateGraphNodeResponse> {
  const graph = await findUserGraph(userId, graphId);
  const nodeIndex = graph.nodes.findIndex((node) => node.id === nodeId);

  if (nodeIndex === -1) {
    throw new GraphServiceError(404, "Graph node not found");
  }

  const patch = buildSkillPatch(request);
  if (patch.title) {
    ensureUniqueSkillTitle(graph, patch.title, nodeId);
  }

  const nodes = graph.nodes.map((node) =>
    node.id === nodeId ? { ...node, ...patch } : node
  );
  const updatedNode = nodes[nodeIndex];

  if (!updatedNode) {
    throw new GraphServiceError(404, "Graph node not found");
  }

  await prisma.graph.update({
    where: { id: graph.id },
    data: { nodes },
  });

  const skills = await syncCompletedUserSkills(userId);

  return {
    node: updatedNode,
    skills,
  };
}

export async function createGraphNode(
  userId: string,
  graphId: string,
  request: CreateGraphNodeRequest
): Promise<GraphResponse> {
  const graph = await findUserGraph(userId, graphId);
  const node = buildNewSkill(graph, request);
  ensureUniqueSkillTitle(graph, node.title);

  const updatedGraph = await prisma.graph.update({
    where: { id: graph.id },
    data: { nodes: [...graph.nodes, node] },
  });

  if (node.isCompleted) {
    await syncCompletedUserSkills(userId);
  }

  return mapGraphResponse(updatedGraph as GraphWithData);
}

export async function deleteGraphNode(
  userId: string,
  graphId: string,
  nodeId: string
): Promise<GraphResponse> {
  const graph = await findUserGraph(userId, graphId);

  if (nodeId === graph.mainSkill.id) {
    throw new GraphServiceError(400, "Main skill cannot be deleted");
  }

  if (!graph.nodes.some((node) => node.id === nodeId)) {
    throw new GraphServiceError(404, "Graph node not found");
  }

  const updatedGraph = await prisma.graph.update({
    where: { id: graph.id },
    data: {
      nodes: graph.nodes.filter((node) => node.id !== nodeId),
      edges: graph.edges.filter(
        (edge) => edge.fromId !== nodeId && edge.toId !== nodeId
      ),
    },
  });

  await syncCompletedUserSkills(userId);

  return mapGraphResponse(updatedGraph as GraphWithData);
}

export async function createGraphEdge(
  userId: string,
  graphId: string,
  fromId: string,
  toId: string
): Promise<GraphResponse> {
  const graph = await findUserGraph(userId, graphId);
  assertEdgeCanBeAdded(graph, fromId, toId);

  const updatedGraph = await prisma.graph.update({
    where: { id: graph.id },
    data: { edges: [...graph.edges, { fromId, toId }] },
  });

  return mapGraphResponse(updatedGraph as GraphWithData);
}

export async function deleteGraphEdge(
  userId: string,
  graphId: string,
  fromId: string,
  toId: string
): Promise<GraphResponse> {
  const graph = await findUserGraph(userId, graphId);

  if (!fromId || !toId) {
    throw new GraphServiceError(400, "fromId and toId are required");
  }

  if (!edgeExists(graph.edges, fromId, toId)) {
    throw new GraphServiceError(404, "Graph edge not found");
  }

  const updatedGraph = await prisma.graph.update({
    where: { id: graph.id },
    data: {
      edges: graph.edges.filter(
        (edge) => edge.fromId !== fromId || edge.toId !== toId
      ),
    },
  });

  return mapGraphResponse(updatedGraph as GraphWithData);
}

export async function getGraphSubgraph(
  userId: string,
  graphId: string,
  nodeId: string,
  depth: number
): Promise<GraphResponse> {
  const graph = await findUserGraph(userId, graphId);

  if (!nodeExists(graph, nodeId)) {
    throw new GraphServiceError(404, "Graph node not found");
  }

  if (!Number.isInteger(depth) || depth < 0) {
    throw new GraphServiceError(400, "depth must be a non-negative integer");
  }

  const maxDepth = Math.min(depth, 5);
  const adjacency = new Map<string, string[]>();
  graph.edges.forEach((edge) => {
    adjacency.set(edge.fromId, [...(adjacency.get(edge.fromId) ?? []), edge.toId]);
    adjacency.set(edge.toId, [...(adjacency.get(edge.toId) ?? []), edge.fromId]);
  });

  const selectedNodeIds = new Set<string>([nodeId]);
  const queue: Array<{ nodeId: string; distance: number }> = [
    { nodeId, distance: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.distance >= maxDepth) {
      continue;
    }

    for (const nextId of adjacency.get(current.nodeId) ?? []) {
      if (selectedNodeIds.has(nextId)) {
        continue;
      }

      selectedNodeIds.add(nextId);
      queue.push({ nodeId: nextId, distance: current.distance + 1 });
    }
  }

  const subgraph: GraphWithData = {
    ...graph,
    nodes: graph.nodes.filter((node) => selectedNodeIds.has(node.id)),
    edges: graph.edges.filter(
      (edge) => selectedNodeIds.has(edge.fromId) && selectedNodeIds.has(edge.toId)
    ),
  };

  return mapGraphResponse(subgraph);
}
