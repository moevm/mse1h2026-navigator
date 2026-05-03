import "dotenv/config";
import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../app";
import { prisma } from "../../lib/prisma";
import { createAppToken } from "../../lib/token";
import { GraphDataServiceClient } from "../../routers/graphDataService/GraphDataServiceClient";

const testUserIds: string[] = [];
let app: Express;

function authHeader(userId: string): string {
  return `Bearer ${createAppToken(userId)}`;
}

async function gql(params: {
  query: string;
  variables?: Record<string, unknown>;
  userId?: string;
}) {
  const req = request(app).post("/graphql").send({
    query: params.query,
    variables: params.variables ?? {},
  });

  if (params.userId) {
    req.set("Authorization", authHeader(params.userId));
  }

  return await req;
}

async function createTestUser(suffix: string) {
  const user = await prisma.user.create({
    data: {
      yandexIdHash: `test-graphql-graphs-${Date.now()}-${suffix}`,
      username: `test-${suffix}`,
      firstName: "Test",
      lastName: "User",
      avatarUrl: "",
      skills: [],
    },
  });

  testUserIds.push(user.id);

  return user;
}

async function createTestGraph(userId: string, suffix: string) {
  return await prisma.graph.create({
    data: {
      userId,
      professionTitle: `Backend Developer ${suffix}`,
      normalizedProfessionTitle: `backend developer ${suffix} ${Date.now()}`,
      mainSkill: {
        id: "main",
        title: `Backend Developer ${suffix}`,
        description: "Backend roadmap",
      },
      nodes: [
        {
          id: "skill-a",
          title: "HTTP",
          description: "",
          isCompleted: false,
          isRequired: true,
          isArchieved: false,
          priority: 1,
          learnHours: 4,
          courses: [],
          books: [],
          articles: [],
        },
        {
          id: "skill-b",
          title: "Node.js",
          description: "",
          isCompleted: false,
          isRequired: true,
          isArchieved: false,
          priority: 2,
          learnHours: 12,
          courses: [],
          books: [],
          articles: [],
        },
        {
          id: "skill-c",
          title: "Databases",
          description: "",
          isCompleted: false,
          isRequired: false,
          isArchieved: false,
          priority: 3,
          learnHours: 10,
          courses: [],
          books: [],
          articles: [],
        },
      ],
      edges: [
        { fromId: "main", toId: "skill-a" },
        { fromId: "skill-a", toId: "skill-b" },
        { fromId: "skill-b", toId: "skill-c" },
      ],
    },
  });
}

describe("skill graph GraphQL integration", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    vi.spyOn(GraphDataServiceClient.prototype, "getProfessionGraph").mockResolvedValue({
      nodes: ["HTTP", "Node.js"],
      edges: [{ from_skill: "HTTP", to_skill: "Node.js" }],
    });
    app = await createApp();
  });

  beforeEach(async () => {
    if (testUserIds.length === 0) {
      return;
    }

    await prisma.graph.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
    testUserIds.length = 0;
  });

  afterAll(async () => {
    if (testUserIds.length > 0) {
      await prisma.graph.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
    }
    vi.restoreAllMocks();
    await prisma.$disconnect();
  });

  it("creates and loads a graph through GraphQL", async () => {
    const user = await createTestUser("create");

    const response = await gql({
      userId: user.id,
      query: `
        mutation CreateOrLoadGraph($input: CreateOrLoadGraphInput!) {
          createOrLoadGraph(input: $input) {
            id
            professionTitle
            nodes { id title }
            edges { fromId toId }
          }
        }
      `,
      variables: {
        input: {
          professionTitle: "Backend Developer",
          isMock: true,
          forceRegenerate: true,
        },
      },
    });

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createOrLoadGraph.professionTitle).toBe(
      "Backend Developer"
    );
    expect(response.body.data.createOrLoadGraph.nodes).toHaveLength(2);
  });

  it("loads only graphs owned by authenticated user", async () => {
    const user = await createTestUser("owner");
    const otherUser = await createTestUser("other");
    const graph = await createTestGraph(user.id, "owner");
    const otherGraph = await createTestGraph(otherUser.id, "other");

    const response = await gql({
      userId: user.id,
      query: `
        query SavedGraph($graphId: String!) {
          savedGraph(graphId: $graphId) { id professionTitle }
        }
      `,
      variables: { graphId: graph.id },
    });

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.savedGraph.id).toBe(graph.id);

    const forbiddenResponse = await gql({
      userId: user.id,
      query: `
        query SavedGraph($graphId: String!) {
          savedGraph(graphId: $graphId) { id }
        }
      `,
      variables: { graphId: otherGraph.id },
    });

    expect(forbiddenResponse.body.errors?.[0]?.message).toBe("Graph not found");
  });

  it("updates node fields and syncs completed user skills", async () => {
    const user = await createTestUser("patch-node");
    const graph = await createTestGraph(user.id, "patch-node");

    const response = await gql({
      userId: user.id,
      query: `
        mutation UpdateGraphNode(
          $graphId: String!
          $nodeId: String!
          $input: UpdateGraphNodeInput!
        ) {
          updateGraphNode(graphId: $graphId, nodeId: $nodeId, input: $input) {
            node { id description isCompleted isRequired priority learnHours }
            skills
          }
        }
      `,
      variables: {
        graphId: graph.id,
        nodeId: "skill-a",
        input: {
          description: "Core protocol knowledge",
          isCompleted: true,
          isRequired: false,
          priority: 5,
          learnHours: 8,
        },
      },
    });

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateGraphNode.node).toMatchObject({
      id: "skill-a",
      description: "Core protocol knowledge",
      isCompleted: true,
      isRequired: false,
      priority: 5,
      learnHours: 8,
    });
    expect(response.body.data.updateGraphNode.skills).toEqual(["HTTP"]);
  });

  it("adds and deletes nodes and validates edges", async () => {
    const user = await createTestUser("node-edge-crud");
    const graph = await createTestGraph(user.id, "node-edge-crud");

    const addNodeResponse = await gql({
      userId: user.id,
      query: `
        mutation AddGraphNode($graphId: String!, $input: CreateGraphNodeInput!) {
          addGraphNode(graphId: $graphId, input: $input) {
            nodes { id title }
          }
        }
      `,
      variables: { graphId: graph.id, input: { title: "Docker" } },
    });

    expect(addNodeResponse.body.errors).toBeUndefined();
    const createdNode = addNodeResponse.body.data.addGraphNode.nodes.find(
      (node: { title: string }) => node.title === "Docker"
    );

    const addEdgeResponse = await gql({
      userId: user.id,
      query: `
        mutation AddGraphEdge($graphId: String!, $input: GraphEdgeInput!) {
          addGraphEdge(graphId: $graphId, input: $input) {
            edges { fromId toId }
          }
        }
      `,
      variables: {
        graphId: graph.id,
        input: { fromId: "skill-b", toId: createdNode.id },
      },
    });

    expect(addEdgeResponse.body.errors).toBeUndefined();

    const duplicateEdgeResponse = await gql({
      userId: user.id,
      query: `
        mutation AddGraphEdge($graphId: String!, $input: GraphEdgeInput!) {
          addGraphEdge(graphId: $graphId, input: $input) { id }
        }
      `,
      variables: {
        graphId: graph.id,
        input: { fromId: "skill-b", toId: createdNode.id },
      },
    });

    expect(duplicateEdgeResponse.body.errors?.[0]?.message).toBe(
      "Graph edge already exists"
    );

    const deleteNodeResponse = await gql({
      userId: user.id,
      query: `
        mutation DeleteGraphNode($graphId: String!, $nodeId: String!) {
          deleteGraphNode(graphId: $graphId, nodeId: $nodeId) {
            nodes { id }
            edges { fromId toId }
          }
        }
      `,
      variables: { graphId: graph.id, nodeId: createdNode.id },
    });

    expect(deleteNodeResponse.body.errors).toBeUndefined();
    expect(
      deleteNodeResponse.body.data.deleteGraphNode.nodes.some(
        (node: { id: string }) => node.id === createdNode.id
      )
    ).toBe(false);
    expect(
      deleteNodeResponse.body.data.deleteGraphNode.edges.some(
        (edge: { fromId: string; toId: string }) =>
          edge.fromId === createdNode.id || edge.toId === createdNode.id
      )
    ).toBe(false);
  });

  it("returns a bounded subgraph around selected node", async () => {
    const user = await createTestUser("subgraph");
    const graph = await createTestGraph(user.id, "subgraph");

    const response = await gql({
      userId: user.id,
      query: `
        query GraphSubgraph($graphId: String!, $nodeId: String!, $depth: Int!) {
          graphSubgraph(graphId: $graphId, nodeId: $nodeId, depth: $depth) {
            nodes { id }
            edges { fromId toId }
          }
        }
      `,
      variables: { graphId: graph.id, nodeId: "skill-b", depth: 1 },
    });

    expect(response.body.errors).toBeUndefined();
    expect(
      response.body.data.graphSubgraph.nodes
        .map((node: { id: string }) => node.id)
        .sort()
    ).toEqual(["skill-a", "skill-b", "skill-c"]);
    expect(response.body.data.graphSubgraph.edges).toEqual([
      { fromId: "skill-a", toId: "skill-b" },
      { fromId: "skill-b", toId: "skill-c" },
    ]);
  });
});
