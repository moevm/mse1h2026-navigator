import "reflect-metadata";
import "dotenv/config";
import type { Express } from "express";
import request from "supertest";
import { prisma } from "../lib/prisma";
import { createAppToken } from "../lib/token";

interface SkillNode {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
  isArchieved: boolean;
  priority: number;
  learnHours: number;
  courses: Course[];
  books: Book[];
  articles: Article[];
}

interface SkillEdge {
  fromId: string;
  toId: string;
}

interface LearningTimeInfo {
  minHours: number;
  avgHours: number;
  maxHours: number;
  coursesAnalyzed: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  link: string;
  image?: string | null;
  learningTimeInfo?: LearningTimeInfo | null;
}

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  link: string;
  image?: string | null;
}

interface Article {
  id: string;
  title: string;
  description: string;
  link: string;
  rating: number;
  tags: string[];
}

interface SkillGraph {
  id: string;
  professionTitle: string;
  mainSkill: {
    id: string;
    title: string;
    description: string;
  };
  nodes: SkillNode[];
  edges: SkillEdge[];
  initialMainSkill: {
    id: string;
    title: string;
    description: string;
  };
  initialNodes: SkillNode[];
  initialEdges: SkillEdge[];
}

interface GraphDocument extends SkillGraph {
  userId: string;
  normalizedProfessionTitle: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

const DEMO_PROFESSION = "Backend Developer";
const DEMO_USER_HASH = `graph-persistence-demo-${Date.now()}`;

let app: Express;

function section(title: string): void {
  console.log(`\n${"=".repeat(96)}`);
  console.log(title);
  console.log("=".repeat(96));
}

function logStep(title: string): void {
  console.log(`\n--- ${title} ---`);
}

function printGraphSummary(label: string, graph: SkillGraph | GraphDocument): void {
  console.log(label);
  console.log(`Graph id: ${graph.id}`);
  console.log(`Profession: ${graph.professionTitle}`);
  console.log(`Current nodes: ${graph.nodes.map((node) => node.title).join(", ")}`);
  console.log(
    `Initial nodes: ${graph.initialNodes.map((node) => node.title).join(", ")}`
  );
  console.log("Current edges:");
  printEdges(graph.edges);
  console.log("Initial edges:");
  printEdges(graph.initialEdges);
}

function printNodes(nodes: SkillNode[]): void {
  console.table(
    nodes.map((node) => ({
      id: node.id,
      title: node.title,
      completed: node.isCompleted,
      required: node.isRequired,
      priority: node.priority,
      learnHours: node.learnHours,
      courses: node.courses.length,
      books: node.books.length,
      articles: node.articles.length,
    }))
  );
}

function printResourceExamples(nodes: SkillNode[]): void {
  console.log("Resource examples by node:");
  nodes.forEach((node) => {
    console.log(`  ${node.title}`);
    console.log(
      `    description: ${node.description || "<empty description>"}`
    );
    console.log(
      `    courses: ${node.courses.length}, books: ${node.books.length}, articles: ${node.articles.length}`
    );

    const course = node.courses[0];
    if (course) {
      console.log(
        `    first course: ${course.title} (${course.learningTimeInfo?.avgHours ?? "?"} avg hours) ${course.link}`
      );
    }

    const book = node.books[0];
    if (book) {
      console.log(`    first book: ${book.title} by ${book.author} ${book.link}`);
    }

    const article = node.articles[0];
    if (article) {
      console.log(
        `    first article: ${article.title} rating=${article.rating} tags=${article.tags.join(", ")}`
      );
    }
  });
}

function printEdges(edges: SkillEdge[]): void {
  if (edges.length === 0) {
    console.log("  <empty>");
    return;
  }

  edges.forEach((edge) => {
    console.log(`  ${edge.fromId} -> ${edge.toId}`);
  });
}

function logJsonComparison(title: string, actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  const isEqual = actualJson === expectedJson;
  console.log(`${title}: ${isEqual ? "OK" : "DIFF"}`);
}

function logJsonDifference(title: string, actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  const isDifferent = actualJson !== expectedJson;
  console.log(`${title}: ${isDifferent ? "DIFF" : "OK"}`);
}

function printMongoDocumentDetails(graph: GraphDocument): void {
  console.log("MongoDB document details:");
  console.log(`  id: ${graph.id}`);
  console.log(`  userId: ${graph.userId}`);
  console.log(`  normalizedProfessionTitle: ${graph.normalizedProfessionTitle}`);
  console.log(`  createdAt: ${graph.createdAt.toISOString()}`);
  console.log(`  updatedAt: ${graph.updatedAt.toISOString()}`);
  console.log(`  current nodes: ${graph.nodes.length}`);
  console.log(`  current edges: ${graph.edges.length}`);
  console.log(`  initial nodes: ${graph.initialNodes.length}`);
  console.log(`  initial edges: ${graph.initialEdges.length}`);
}

async function gql<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string
): Promise<T> {
  console.log("Variables:");
  console.log(JSON.stringify(variables, null, 2));

  const response = await request(app)
    .post("/graphql")
    .set("Authorization", `Bearer ${token}`)
    .send({ query, variables });

  const body = response.body as GraphQLResponse<T>;
  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).join("; "));
  }

  if (!body.data) {
    throw new Error("GraphQL response has no data");
  }

  return body.data;
}

async function createDemoUser(): Promise<{ id: string; token: string }> {
  const user = await prisma.user.create({
    data: {
      yandexIdHash: DEMO_USER_HASH,
      username: "graph-persistence-demo",
      firstName: "Graph",
      lastName: "Persistence",
      avatarUrl: "",
      skills: [],
    },
  });

  return {
    id: user.id,
    token: createAppToken(user.id),
  };
}

async function readGraphDocument(graphId: string): Promise<GraphDocument> {
  const graph = await prisma.graph.findUnique({ where: { id: graphId } });

  if (!graph) {
    throw new Error(`Graph document ${graphId} was not found in MongoDB`);
  }

  return graph as GraphDocument;
}

async function cleanup(userId?: string): Promise<void> {
  if (!userId) {
    return;
  }

  await prisma.graph.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
}

const graphFields = `
  id
  professionTitle
  mainSkill { id title description }
  nodes {
    id
    title
    description
    isCompleted
    isRequired
    isArchieved
    priority
    learnHours
    courses {
      id
      title
      description
      link
      image
      learningTimeInfo {
        minHours
        avgHours
        maxHours
        coursesAnalyzed
      }
    }
    books {
      id
      title
      author
      description
      link
      image
    }
    articles {
      id
      title
      description
      link
      rating
      tags
    }
  }
  edges { fromId toId }
  initialMainSkill { id title description }
  initialNodes {
    id
    title
    description
    isCompleted
    isRequired
    isArchieved
    priority
    learnHours
    courses {
      id
      title
      description
      link
      image
      learningTimeInfo {
        minHours
        avgHours
        maxHours
        coursesAnalyzed
      }
    }
    books {
      id
      title
      author
      description
      link
      image
    }
    articles {
      id
      title
      description
      link
      rating
      tags
    }
  }
  initialEdges { fromId toId }
`;

async function main(): Promise<void> {
  process.env.JWT_SECRET =
    process.env.JWT_SECRET || "graph-build-persistence-demo-secret";
  process.env.IS_MOCK_GRAPH_DATA_SERVICE = "false";

  const { createApp } = await import("../app");
  const { GraphDataServiceClient } = await import(
    "../routers/graphDataService/GraphDataServiceClient"
  );
  const originalGetProfessionGraph =
    GraphDataServiceClient.prototype.getProfessionGraph;
  GraphDataServiceClient.prototype.getProfessionGraph = async function (
    this: InstanceType<typeof GraphDataServiceClient>,
    professionTitle: string,
    isMock = true,
    useCache = true
  ) {
    const startedAt = Date.now();
    console.log("\n[Demo build trace] graph-data-service request");
    console.log(`  professionTitle: ${professionTitle}`);
    console.log(`  isMock: ${isMock}`);
    console.log(`  useCache: ${useCache}`);
    console.log(
      `  GRAPH_DATA_SERVICE_URL: ${
        process.env.GRAPH_DATA_SERVICE_URL || "http://localhost:8000"
      }`
    );

    const rawGraph = await originalGetProfessionGraph.call(
      this,
      professionTitle,
      isMock,
      useCache
    );

    console.log("[Demo build trace] graph-data-service response");
    console.log(`  durationMs: ${Date.now() - startedAt}`);
    console.log(`  raw nodes (${rawGraph.nodes.length}):`);
    rawGraph.nodes.forEach((node, index) => {
      console.log(`    ${index + 1}. ${node}`);
    });
    console.log(`  raw edges (${rawGraph.edges.length}):`);
    rawGraph.edges.forEach((edge, index) => {
      console.log(`    ${index + 1}. ${edge.from_skill} -> ${edge.to_skill}`);
    });

    return rawGraph;
  };

  let userId: string | undefined;

  try {
    app = await createApp();
    const demoUser = await createDemoUser();
    userId = demoUser.id;

    section("GRAPH BUILD AND MONGODB PERSISTENCE DEMO START");
    console.log(`Demo user id: ${demoUser.id}`);
    console.log(`Profession: ${DEMO_PROFESSION}`);
    console.log(
      `Graph data service: ${
        process.env.GRAPH_DATA_SERVICE_URL || "http://localhost:8000"
      }`
    );

    logStep("1. Build real graph through GraphQL and save it to MongoDB");
    const createData = await gql<{ createOrLoadGraph: SkillGraph }>(
      `
        mutation CreateOrLoadGraph($input: CreateOrLoadGraphInput!) {
          createOrLoadGraph(input: $input) {
            ${graphFields}
          }
        }
      `,
      {
        input: {
          professionTitle: DEMO_PROFESSION,
          isMock: true,
          forceRegenerate: true,
        },
      },
      demoUser.token
    );
    const createdGraph = createData.createOrLoadGraph;
    printGraphSummary("GraphQL response after build and save:", createdGraph);
    printNodes(createdGraph.nodes);
    printResourceExamples(createdGraph.nodes);

    logStep("2. Read the saved Graph document directly from MongoDB");
    const persistedGraph = await readGraphDocument(createdGraph.id);
    printMongoDocumentDetails(persistedGraph);
    printGraphSummary("MongoDB document after save:", persistedGraph);
    logJsonComparison(
      "MongoDB current nodes match GraphQL current nodes",
      persistedGraph.nodes,
      createdGraph.nodes
    );
    logJsonComparison(
      "MongoDB initial nodes match GraphQL initial nodes",
      persistedGraph.initialNodes,
      createdGraph.initialNodes
    );
    logJsonComparison(
      "Current nodes equal initial nodes right after build",
      persistedGraph.nodes,
      persistedGraph.initialNodes
    );
    logJsonComparison(
      "Current edges equal initial edges right after build",
      persistedGraph.edges,
      persistedGraph.initialEdges
    );

    logStep("3. Change only the current graph");
    const firstNode = createdGraph.nodes[0];
    if (!firstNode) {
      throw new Error("Built graph has no nodes");
    }

    const updateData = await gql<{
      updateGraphNode: { node: SkillNode; skills: string[] };
    }>(
      `
        mutation UpdateGraphNode(
          $graphId: String!
          $nodeId: String!
          $input: UpdateGraphNodeInput!
        ) {
          updateGraphNode(graphId: $graphId, nodeId: $nodeId, input: $input) {
            node {
              id
              title
              description
              isCompleted
              isRequired
              isArchieved
              priority
              learnHours
            }
            skills
          }
        }
      `,
      {
        graphId: createdGraph.id,
        nodeId: firstNode.id,
        input: {
          isCompleted: true,
          priority: 99,
          description: "Changed after initial build",
        },
      },
      demoUser.token
    );
    console.log("Updated node:");
    console.table([updateData.updateGraphNode.node]);
    console.log("User skills after update:", updateData.updateGraphNode.skills);

    const changedGraph = await readGraphDocument(createdGraph.id);
    printGraphSummary("MongoDB document after current graph update:", changedGraph);
    logJsonDifference(
      "Current nodes compared with initial nodes after edit",
      changedGraph.nodes,
      changedGraph.initialNodes
    );
    logJsonComparison(
      "Initial nodes stayed equal to the original snapshot",
      changedGraph.initialNodes,
      persistedGraph.initialNodes
    );
    logJsonComparison(
      "Initial edges stayed equal to the original snapshot",
      changedGraph.initialEdges,
      persistedGraph.initialEdges
    );

    logStep("4. Read the initial snapshot through GraphQL");
    const initialData = await gql<{ initialSavedGraph: SkillGraph }>(
      `
        query InitialSavedGraph($graphId: String!) {
          initialSavedGraph(graphId: $graphId) {
            ${graphFields}
          }
        }
      `,
      { graphId: createdGraph.id },
      demoUser.token
    );
    printGraphSummary("Initial graph from GraphQL:", initialData.initialSavedGraph);
    logJsonComparison(
      "GraphQL initial graph nodes match MongoDB initialNodes",
      initialData.initialSavedGraph.nodes,
      persistedGraph.initialNodes
    );

    logStep("5. Reset the current graph to the initial snapshot");
    const resetData = await gql<{ resetGraphToInitial: SkillGraph }>(
      `
        mutation ResetGraphToInitial($graphId: String!) {
          resetGraphToInitial(graphId: $graphId) {
            ${graphFields}
          }
        }
      `,
      { graphId: createdGraph.id },
      demoUser.token
    );
    printGraphSummary("Graph after reset:", resetData.resetGraphToInitial);
    logJsonComparison(
      "Current nodes equal initial nodes after reset",
      resetData.resetGraphToInitial.nodes,
      resetData.resetGraphToInitial.initialNodes
    );
    logJsonComparison(
      "Current edges equal initial edges after reset",
      resetData.resetGraphToInitial.edges,
      resetData.resetGraphToInitial.initialEdges
    );

    logStep("6. Load graph from MongoDB without force regeneration");
    const reloadData = await gql<{ createOrLoadGraph: SkillGraph }>(
      `
        mutation CreateOrLoadGraph($input: CreateOrLoadGraphInput!) {
          createOrLoadGraph(input: $input) {
            ${graphFields}
          }
        }
      `,
      {
        input: {
          professionTitle: DEMO_PROFESSION,
          isMock: true,
          forceRegenerate: false,
        },
      },
      demoUser.token
    );
    printGraphSummary("Reloaded graph:", reloadData.createOrLoadGraph);
    logJsonComparison(
      "Reload returned the same graph id",
      reloadData.createOrLoadGraph.id,
      createdGraph.id
    );

    section("CLEANUP");
    await cleanup(demoUser.id);
    userId = undefined;
    console.log("Demo graph and demo user removed from MongoDB.");
    section("GRAPH BUILD AND MONGODB PERSISTENCE DEMO DONE");
  } finally {
    GraphDataServiceClient.prototype.getProfessionGraph = originalGetProfessionGraph;
    await cleanup(userId);
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error("\nGRAPH BUILD AND MONGODB PERSISTENCE DEMO FAILED");
    console.error(error);
    process.exit(1);
  });
