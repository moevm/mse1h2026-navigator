import "reflect-metadata";
import "dotenv/config";
import type { Express } from "express";
import request from "supertest";
import { prisma } from "../lib/prisma";
import { createAppToken } from "../lib/token";
import type { RawSkillGraph } from "../routers/graphDataService/types";

interface SkillNode {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
  isArchieved: boolean;
  priority: number;
  learnHours: number;
}

interface SkillEdge {
  fromId: string;
  toId: string;
}

interface SkillGraph {
  id: string;
  professionTitle: string;
  nodes: SkillNode[];
  edges: SkillEdge[];
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

const DEMO_PROFESSION = "Graph Editing Demo Backend";
const DEMO_USER_HASH = `graph-editing-demo-${Date.now()}`;
const mockRawGraph: RawSkillGraph = {
  nodes: ["HTTP", "Node.js", "Databases"],
  edges: [
    { from_skill: "HTTP", to_skill: "Node.js" },
    { from_skill: "Node.js", to_skill: "Databases" },
  ],
};

let app: Express;

function section(title: string): void {
  console.log(`\n${"=".repeat(88)}`);
  console.log(title);
  console.log("=".repeat(88));
}

function logStep(title: string): void {
  console.log(`\n--- ${title} ---`);
}

function printVariables(variables: Record<string, unknown>): void {
  console.log("Variables:");
  console.log(JSON.stringify(variables, null, 2));
}

function printNodes(nodes: SkillNode[]): void {
  console.log("Nodes:");
  console.table(
    nodes.map((node) => ({
      id: node.id,
      title: node.title,
      completed: node.isCompleted,
      required: node.isRequired,
      priority: node.priority,
      learnHours: node.learnHours,
    }))
  );
}

function printEdges(edges: SkillEdge[]): void {
  console.log("Edges:");
  if (edges.length === 0) {
    console.log("  <empty>");
    return;
  }

  edges.forEach((edge) => {
    console.log(`  ${edge.fromId} -> ${edge.toId}`);
  });
}

function printGraph(graph: SkillGraph): void {
  console.log(`Graph: ${graph.id}`);
  console.log(`Profession: ${graph.professionTitle}`);
  printNodes(graph.nodes);
  printEdges(graph.edges);
}

function findNode(graph: SkillGraph, title: string): SkillNode {
  const node = graph.nodes.find((item) => item.title === title);
  if (!node) {
    throw new Error(`Node "${title}" was not found in graph`);
  }

  return node;
}

async function gql<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string
): Promise<T> {
  printVariables(variables);

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
      username: "graph-editing-demo",
      firstName: "Graph",
      lastName: "Demo",
      avatarUrl: "",
      skills: [],
    },
  });

  return {
    id: user.id,
    token: createAppToken(user.id),
  };
}

async function cleanup(userId?: string): Promise<void> {
  if (!userId) {
    return;
  }

  await prisma.graph.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
}

async function main(): Promise<void> {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "graph-editing-demo-secret";
  process.env.IS_MOCK_GRAPH_DATA_SERVICE = "true";

  const { createApp } = await import("../app");
  const { GraphDataServiceClient } = await import(
    "../routers/graphDataService/GraphDataServiceClient"
  );
  const originalGetProfessionGraph = GraphDataServiceClient.prototype.getProfessionGraph;
  GraphDataServiceClient.prototype.getProfessionGraph = async (
    professionTitle: string
  ) => {
    console.log(
      `[Mock GraphDataService] returning stable graph for "${professionTitle}"`
    );
    return mockRawGraph;
  };

  let userId: string | undefined;

  try {
    app = await createApp();
    const demoUser = await createDemoUser();
    userId = demoUser.id;

    section("GRAPH EDITING DEMO START");
    console.log(`Demo user id: ${demoUser.id}`);
    console.log(`Profession: ${DEMO_PROFESSION}`);

    logStep("1. CREATE_OR_LOAD_GRAPH");
    const createData = await gql<{ createOrLoadGraph: SkillGraph }>(
      `
        mutation CreateOrLoadGraph($input: CreateOrLoadGraphInput!) {
          createOrLoadGraph(input: $input) {
            id
            professionTitle
            nodes {
              id
              title
              description
              isCompleted
              isRequired
              isArchieved
              priority
              learnHours
            }
            edges { fromId toId }
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
    let graph = createData.createOrLoadGraph;
    printGraph(graph);

    logStep("2. BEFORE_EDIT");
    const beforeData = await gql<{ savedGraph: SkillGraph }>(
      `
        query SavedGraph($graphId: String!) {
          savedGraph(graphId: $graphId) {
            id
            professionTitle
            nodes {
              id
              title
              description
              isCompleted
              isRequired
              isArchieved
              priority
              learnHours
            }
            edges { fromId toId }
          }
        }
      `,
      { graphId: graph.id },
      demoUser.token
    );
    graph = beforeData.savedGraph;
    printGraph(graph);

    logStep("3. UPDATE_NODE: mark HTTP completed and change metadata");
    const httpBefore = findNode(graph, "HTTP");
    console.log("Before node:");
    console.table([httpBefore]);

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
        graphId: graph.id,
        nodeId: httpBefore.id,
        input: {
          description: "Updated in demo: HTTP fundamentals are completed",
          isCompleted: true,
          priority: 10,
          learnHours: 6,
        },
      },
      demoUser.token
    );
    console.log("After node:");
    console.table([updateData.updateGraphNode.node]);
    console.log("User skills after sync:", updateData.updateGraphNode.skills);

    logStep("4. ADD_NODE: Docker");
    const nodesBeforeAdd = graph.nodes.map((node) => node.title);
    const addNodeData = await gql<{ addGraphNode: SkillGraph }>(
      `
        mutation AddGraphNode($graphId: String!, $input: CreateGraphNodeInput!) {
          addGraphNode(graphId: $graphId, input: $input) {
            id
            professionTitle
            nodes {
              id
              title
              description
              isCompleted
              isRequired
              isArchieved
              priority
              learnHours
            }
            edges { fromId toId }
          }
        }
      `,
      {
        graphId: graph.id,
        input: {
          title: "Docker",
          description: "Containerization basics added by demo",
          isRequired: true,
          priority: 4,
          learnHours: 8,
        },
      },
      demoUser.token
    );
    graph = addNodeData.addGraphNode;
    console.log("Node titles before:", nodesBeforeAdd);
    console.log("Node titles after:", graph.nodes.map((node) => node.title));
    printNodes(graph.nodes);

    logStep("5. ADD_EDGE: Node.js -> Docker");
    const nodeJs = findNode(graph, "Node.js");
    const docker = findNode(graph, "Docker");
    console.log("Edges before:");
    printEdges(graph.edges);

    const addEdgeData = await gql<{ addGraphEdge: SkillGraph }>(
      `
        mutation AddGraphEdge($graphId: String!, $input: GraphEdgeInput!) {
          addGraphEdge(graphId: $graphId, input: $input) {
            id
            professionTitle
            nodes {
              id
              title
              description
              isCompleted
              isRequired
              isArchieved
              priority
              learnHours
            }
            edges { fromId toId }
          }
        }
      `,
      {
        graphId: graph.id,
        input: {
          fromId: nodeJs.id,
          toId: docker.id,
        },
      },
      demoUser.token
    );
    graph = addEdgeData.addGraphEdge;
    console.log("Edges after:");
    printEdges(graph.edges);

    logStep("6. SUBGRAPH around Node.js");
    const subgraphData = await gql<{ graphSubgraph: SkillGraph }>(
      `
        query GraphSubgraph($graphId: String!, $nodeId: String!, $depth: Int!) {
          graphSubgraph(graphId: $graphId, nodeId: $nodeId, depth: $depth) {
            id
            professionTitle
            nodes {
              id
              title
              description
              isCompleted
              isRequired
              isArchieved
              priority
              learnHours
            }
            edges { fromId toId }
          }
        }
      `,
      {
        graphId: graph.id,
        nodeId: nodeJs.id,
        depth: 1,
      },
      demoUser.token
    );
    printGraph(subgraphData.graphSubgraph);

    logStep("7. DELETE_NODE: Docker");
    console.log("Before delete:");
    printGraph(graph);

    const deleteData = await gql<{ deleteGraphNode: SkillGraph }>(
      `
        mutation DeleteGraphNode($graphId: String!, $nodeId: String!) {
          deleteGraphNode(graphId: $graphId, nodeId: $nodeId) {
            id
            professionTitle
            nodes {
              id
              title
              description
              isCompleted
              isRequired
              isArchieved
              priority
              learnHours
            }
            edges { fromId toId }
          }
        }
      `,
      {
        graphId: graph.id,
        nodeId: docker.id,
      },
      demoUser.token
    );
    graph = deleteData.deleteGraphNode;
    console.log("After delete:");
    printGraph(graph);

    section("CLEANUP");
    await cleanup(demoUser.id);
    userId = undefined;
    console.log("Demo graph and demo user removed from MongoDB.");
    section("GRAPH EDITING DEMO DONE");
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
    console.error("\nGRAPH EDITING DEMO FAILED");
    console.error(error);
    process.exit(1);
  });
