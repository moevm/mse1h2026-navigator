import "dotenv/config";
import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../app";
import { prisma } from "../../lib/prisma";
import { createAppToken } from "../../lib/token";
import { GraphDataServiceClient } from "../../routers/graphDataService/GraphDataServiceClient";
import { HHClient } from "../../integrations/hh";

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
  const mainSkill = {
    id: "main",
    title: `Backend Developer ${suffix}`,
    description: "Backend roadmap",
  };
  const nodes = [
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
  ];
  const edges = [
    { fromId: "main", toId: "skill-a" },
    { fromId: "skill-a", toId: "skill-b" },
    { fromId: "skill-b", toId: "skill-c" },
  ];

  return await prisma.graph.create({
    data: {
      userId,
      professionTitle: `Backend Developer ${suffix}`,
      normalizedProfessionTitle: `backend developer ${suffix} ${Date.now()}`,
      mainSkill,
      nodes,
      edges,
      initialMainSkill: mainSkill,
      initialNodes: nodes,
      initialEdges: edges,
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
    vi.spyOn(HHClient.prototype, "findVacancySkillsForProfession").mockResolvedValue(
      []
    );
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
    const getProfessionGraphMock = vi.mocked(
      GraphDataServiceClient.prototype.getProfessionGraph
    );
    getProfessionGraphMock.mockClear();

    const response = await gql({
      userId: user.id,
      query: `
        mutation CreateOrLoadGraph($input: CreateOrLoadGraphInput!) {
          createOrLoadGraph(input: $input) {
            id
            professionTitle
            nodes { id title }
            edges { fromId toId }
            initialNodes { id title }
            initialEdges { fromId toId }
          }
        }
      `,
      variables: {
        input: {
          professionTitle: "Backend Developer",
          initialTechnologies: ["Node.js", "PostgreSQL"],
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
    expect(response.body.data.createOrLoadGraph.initialNodes).toHaveLength(2);
    expect(response.body.data.createOrLoadGraph.initialEdges).toEqual(
      response.body.data.createOrLoadGraph.edges
    );
    expect(getProfessionGraphMock).toHaveBeenCalledWith(
      "Backend Developer",
      true,
      true,
      ["Node.js", "PostgreSQL"]
    );
  });

  it("uses HeadHunter vacancy skills as initial technologies when creating a graph", async () => {
    const user = await createTestUser("create-hh");
    const getProfessionGraphMock = vi.mocked(
      GraphDataServiceClient.prototype.getProfessionGraph
    );
    const findVacancySkillsMock = vi.mocked(
      HHClient.prototype.findVacancySkillsForProfession
    );
    getProfessionGraphMock.mockClear();
    findVacancySkillsMock.mockResolvedValueOnce(["React", "TypeScript", "React"]);

    const response = await gql({
      userId: user.id,
      query: `
        mutation CreateOrLoadGraph($input: CreateOrLoadGraphInput!) {
          createOrLoadGraph(input: $input) {
            id
            professionTitle
            nodes { id title }
          }
        }
      `,
      variables: {
        input: {
          professionTitle: "Frontend Developer",
          vacancyTitle: "React Frontend разработчик",
          initialTechnologies: ["HTML", "React"],
          isMock: true,
          forceRegenerate: true,
        },
      },
    });

    expect(response.body.errors).toBeUndefined();
    expect(findVacancySkillsMock).toHaveBeenCalledWith(
      "React Frontend разработчик"
    );
    expect(getProfessionGraphMock).toHaveBeenCalledWith(
      "Frontend Developer",
      true,
      true,
      ["HTML", "React", "TypeScript"]
    );
  });

  it("normalizes generated graph edges into a tree without feedback edges", async () => {
    const user = await createTestUser("create-tree");
    const getProfessionGraphMock = vi.mocked(
      GraphDataServiceClient.prototype.getProfessionGraph
    );
    getProfessionGraphMock.mockResolvedValueOnce({
      nodes: ["React", "TypeScript", "CSS"],
      edges: [
        { from_skill: "React", to_skill: "TypeScript" },
        { from_skill: "TypeScript", to_skill: "React" },
        { from_skill: "CSS", to_skill: "TypeScript" },
        { from_skill: "TypeScript", to_skill: "CSS" },
      ],
    });

    const response = await gql({
      userId: user.id,
      query: `
        mutation CreateOrLoadGraph($input: CreateOrLoadGraphInput!) {
          createOrLoadGraph(input: $input) {
            mainSkill { id }
            nodes { id title }
            edges { fromId toId }
          }
        }
      `,
      variables: {
        input: {
          professionTitle: "Frontend Developer",
          isMock: true,
          forceRegenerate: true,
        },
      },
    });

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createOrLoadGraph.edges).toEqual([
      { fromId: "react", toId: "typescript" },
      { fromId: "typescript", toId: "css" },
      { fromId: "frontend-developer", toId: "react" },
    ]);
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

  it("returns saved graph skills grouped for list view", async () => {
    const user = await createTestUser("skill-list-owner");
    const otherUser = await createTestUser("skill-list-other");
    const graph = await createTestGraph(user.id, "skill-list-owner");
    const otherGraph = await createTestGraph(otherUser.id, "skill-list-other");

    await prisma.graph.update({
      where: { id: graph.id },
      data: {
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
            isCompleted: true,
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
            isArchieved: true,
            priority: 0,
            learnHours: 10,
            courses: [],
            books: [],
            articles: [],
          },
          {
            id: "skill-d",
            title: "CSS",
            description: "",
            isCompleted: false,
            isRequired: true,
            isArchieved: false,
            priority: 0,
            learnHours: 3,
            courses: [],
            books: [],
            articles: [],
          },
          {
            id: "skill-e",
            title: "Algorithms",
            description: "",
            isCompleted: false,
            isRequired: true,
            isArchieved: false,
            priority: 0,
            learnHours: 16,
            courses: [],
            books: [],
            articles: [],
          },
          {
            id: "skill-f",
            title: "Legacy Framework",
            description: "",
            isCompleted: true,
            isRequired: false,
            isArchieved: true,
            priority: 3,
            learnHours: 1,
            courses: [],
            books: [],
            articles: [],
          },
        ],
      },
    });

    const response = await gql({
      userId: user.id,
      query: `
        query SavedGraphSkillList($graphId: String!) {
          savedGraphSkillList(graphId: $graphId) {
            graphId
            professionTitle
            currentPlan {
              priority
              skills { id title priority isCompleted isArchieved learnHours }
            }
            completedSkills { id title priority isCompleted isArchieved }
            archivedSkills { id title priority isCompleted isArchieved }
          }
        }
      `,
      variables: { graphId: graph.id },
    });

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.savedGraphSkillList.graphId).toBe(graph.id);
    expect(response.body.data.savedGraphSkillList.currentPlan).toEqual([
      {
        priority: 0,
        skills: [
          {
            id: "skill-e",
            title: "Algorithms",
            priority: 0,
            isCompleted: false,
            isArchieved: false,
            learnHours: 16,
          },
          {
            id: "skill-d",
            title: "CSS",
            priority: 0,
            isCompleted: false,
            isArchieved: false,
            learnHours: 3,
          },
        ],
      },
      {
        priority: 1,
        skills: [
          {
            id: "skill-a",
            title: "HTTP",
            priority: 1,
            isCompleted: false,
            isArchieved: false,
            learnHours: 4,
          },
        ],
      },
    ]);
    expect(response.body.data.savedGraphSkillList.completedSkills).toEqual([
      {
        id: "skill-b",
        title: "Node.js",
        priority: 2,
        isCompleted: true,
        isArchieved: false,
      },
    ]);
    expect(response.body.data.savedGraphSkillList.archivedSkills).toEqual([
      {
        id: "skill-c",
        title: "Databases",
        priority: 0,
        isCompleted: false,
        isArchieved: true,
      },
      {
        id: "skill-f",
        title: "Legacy Framework",
        priority: 3,
        isCompleted: true,
        isArchieved: true,
      },
    ]);

    const forbiddenResponse = await gql({
      userId: user.id,
      query: `
        query SavedGraphSkillList($graphId: String!) {
          savedGraphSkillList(graphId: $graphId) { graphId }
        }
      `,
      variables: { graphId: otherGraph.id },
    });

    expect(forbiddenResponse.body.errors?.[0]?.message).toBe("Graph not found");
  });

  it("exports an owned graph as RDF/XML and Turtle through REST", async () => {
    const user = await createTestUser("export");
    const graph = await createTestGraph(user.id, "export");

    const rdfResponse = await request(app)
      .get(`/graphs/${graph.id}/export?format=rdfxml`)
      .set("Authorization", authHeader(user.id));

    expect(rdfResponse.status).toBe(200);
    expect(rdfResponse.headers["content-type"]).toContain("application/rdf+xml");
    expect(rdfResponse.headers["content-disposition"]).toContain(
      `graph-${graph.id}.owl`
    );
    expect(rdfResponse.text).toContain("<rdf:RDF");
    expect(rdfResponse.text).toContain("<nav:SkillGraph");
    expect(rdfResponse.text).toContain("<rdfs:label>HTTP</rdfs:label>");

    const turtleResponse = await request(app)
      .get(`/graphs/${graph.id}/export?format=turtle`)
      .set("Authorization", authHeader(user.id));

    expect(turtleResponse.status).toBe(200);
    expect(turtleResponse.headers["content-type"]).toContain("text/turtle");
    expect(turtleResponse.headers["content-disposition"]).toContain(
      `graph-${graph.id}.ttl`
    );
    expect(turtleResponse.text).toContain("@prefix nav:");
    expect(turtleResponse.text).toContain("a owl:Ontology, nav:SkillGraph");
    expect(turtleResponse.text).toContain('rdfs:label "HTTP"');
  });

  it("imports exported RDF/XML and Turtle graphs as new saved graphs", async () => {
    const user = await createTestUser("import");
    const graph = await createTestGraph(user.id, "import");

    const rdfResponse = await request(app)
      .get(`/graphs/${graph.id}/export?format=rdfxml`)
      .set("Authorization", authHeader(user.id));
    const rdfImportResponse = await request(app)
      .post("/graphs/import?format=rdfxml")
      .set("Authorization", authHeader(user.id))
      .set("Content-Type", "application/rdf+xml")
      .send(rdfResponse.text);

    expect(rdfImportResponse.status).toBe(201);
    expect(rdfImportResponse.body.id).not.toBe(graph.id);
    expect(rdfImportResponse.body.nodes.map((node: { title: string }) => node.title)).toEqual([
      "HTTP",
      "Node.js",
      "Databases",
    ]);
    expect(rdfImportResponse.body.initialNodes).toEqual(rdfImportResponse.body.nodes);
    expect(rdfImportResponse.body.initialEdges).toEqual(rdfImportResponse.body.edges);

    const turtleResponse = await request(app)
      .get(`/graphs/${graph.id}/export?format=turtle`)
      .set("Authorization", authHeader(user.id));
    const turtleImportResponse = await request(app)
      .post("/graphs/import?format=turtle")
      .set("Authorization", authHeader(user.id))
      .set("Content-Type", "text/turtle")
      .send(turtleResponse.text);

    expect(turtleImportResponse.status).toBe(201);
    expect(turtleImportResponse.body.id).not.toBe(graph.id);
    expect(turtleImportResponse.body.nodes).toHaveLength(3);
    expect(turtleImportResponse.body.edges).toEqual(
      expect.arrayContaining([
        { fromId: "main", toId: "skill-a" },
        { fromId: "skill-a", toId: "skill-b" },
        { fromId: "skill-b", toId: "skill-c" },
      ])
    );
  });

  it("rejects invalid graph import payloads", async () => {
    const user = await createTestUser("import-invalid");
    const unsupportedFormatResponse = await request(app)
      .post("/graphs/import?format=jsonld")
      .set("Authorization", authHeader(user.id))
      .set("Content-Type", "text/plain")
      .send("graph");

    expect(unsupportedFormatResponse.status).toBe(400);
    expect(unsupportedFormatResponse.body.error).toBe("Unsupported import format");

    const malformedResponse = await request(app)
      .post("/graphs/import?format=turtle")
      .set("Authorization", authHeader(user.id))
      .set("Content-Type", "text/turtle")
      .send("not valid turtle");

    expect(malformedResponse.status).toBe(400);
    expect(malformedResponse.body.error).toBe("Invalid graph import content");

    const unknownEdgeResponse = await request(app)
      .post("/graphs/import?format=turtle")
      .set("Authorization", authHeader(user.id))
      .set("Content-Type", "text/turtle")
      .send(`
@prefix nav: <https://mse1h2026-navigator.local/ontology#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<https://mse1h2026-navigator.local/graphs/import-invalid> a owl:Ontology, nav:SkillGraph ;
  rdfs:label "Imported Graph" ;
  nav:hasMainSkill <https://mse1h2026-navigator.local/graphs/import-invalid/skills/main> ;
  nav:hasSkill <https://mse1h2026-navigator.local/graphs/import-invalid/skills/skill-a> .

<https://mse1h2026-navigator.local/graphs/import-invalid/skills/main> a nav:MainSkill ;
  rdfs:label "Imported Graph" ;
  dcterms:description "Imported roadmap" .

<https://mse1h2026-navigator.local/graphs/import-invalid/skills/skill-a> a nav:Skill ;
  rdfs:label "HTTP" ;
  dcterms:description "" ;
  nav:isCompleted "false"^^xsd:boolean ;
  nav:isRequired "true"^^xsd:boolean ;
  nav:isArchieved "false"^^xsd:boolean ;
  nav:priority "1"^^xsd:integer ;
  nav:learnHours "4"^^xsd:integer .

<https://mse1h2026-navigator.local/graphs/import-invalid/skills/skill-a>
  nav:dependsOn <https://mse1h2026-navigator.local/graphs/import-invalid/skills/missing> .
      `);

    expect(unknownEdgeResponse.status).toBe(400);
    expect(unknownEdgeResponse.body.error).toBe(
      "Edge references unknown target node: missing"
    );
  });

  it("protects graph export through REST authorization and ownership", async () => {
    const user = await createTestUser("export-owner");
    const otherUser = await createTestUser("export-other");
    const graph = await createTestGraph(user.id, "export-owner");

    const unauthorizedResponse = await request(app).get(
      `/graphs/${graph.id}/export?format=rdfxml`
    );

    expect(unauthorizedResponse.status).toBe(401);
    expect(unauthorizedResponse.body.error).toBe("Authorization token is required");

    const forbiddenResponse = await request(app)
      .get(`/graphs/${graph.id}/export?format=rdfxml`)
      .set("Authorization", authHeader(otherUser.id));

    expect(forbiddenResponse.status).toBe(404);
    expect(forbiddenResponse.body.error).toBe("Graph not found");
  });

  it("rejects unsupported graph export formats", async () => {
    const user = await createTestUser("export-format");
    const graph = await createTestGraph(user.id, "export-format");

    const response = await request(app)
      .get(`/graphs/${graph.id}/export?format=jsonld`)
      .set("Authorization", authHeader(user.id));

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Unsupported export format");
  });

  it("deletes a saved graph owned by the authenticated user", async () => {
    const user = await createTestUser("delete-graph");
    const graph = await createTestGraph(user.id, "delete-graph");

    const deleteResponse = await gql({
      userId: user.id,
      query: `
        mutation DeleteGraph($graphId: String!) {
          deleteGraph(graphId: $graphId)
        }
      `,
      variables: { graphId: graph.id },
    });

    expect(deleteResponse.body.errors).toBeUndefined();
    expect(deleteResponse.body.data.deleteGraph).toBe(true);

    const listResponse = await gql({
      userId: user.id,
      query: `
        query SavedGraphs {
          savedGraphs { id }
        }
      `,
    });

    expect(listResponse.body.data.savedGraphs).toEqual([]);
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

  it("keeps initial graph immutable and resets current graph to it", async () => {
    const user = await createTestUser("initial-reset");
    const graph = await createTestGraph(user.id, "initial-reset");

    const addNodeResponse = await gql({
      userId: user.id,
      query: `
        mutation AddGraphNode($graphId: String!, $input: CreateGraphNodeInput!) {
          addGraphNode(graphId: $graphId, input: $input) {
            nodes { id title }
            initialNodes { id title }
          }
        }
      `,
      variables: { graphId: graph.id, input: { title: "Docker" } },
    });

    expect(addNodeResponse.body.errors).toBeUndefined();
    expect(addNodeResponse.body.data.addGraphNode.nodes).toHaveLength(4);
    expect(addNodeResponse.body.data.addGraphNode.initialNodes).toHaveLength(3);

    const initialResponse = await gql({
      userId: user.id,
      query: `
        query InitialSavedGraph($graphId: String!) {
          initialSavedGraph(graphId: $graphId) {
            nodes { id title }
            edges { fromId toId }
          }
        }
      `,
      variables: { graphId: graph.id },
    });

    expect(initialResponse.body.errors).toBeUndefined();
    expect(
      initialResponse.body.data.initialSavedGraph.nodes.map(
        (node: { title: string }) => node.title
      )
    ).toEqual(["HTTP", "Node.js", "Databases"]);

    const resetResponse = await gql({
      userId: user.id,
      query: `
        mutation ResetGraphToInitial($graphId: String!) {
          resetGraphToInitial(graphId: $graphId) {
            nodes { id title }
            edges { fromId toId }
            initialNodes { id title }
            initialEdges { fromId toId }
          }
        }
      `,
      variables: { graphId: graph.id },
    });

    expect(resetResponse.body.errors).toBeUndefined();
    expect(resetResponse.body.data.resetGraphToInitial.nodes).toEqual(
      resetResponse.body.data.resetGraphToInitial.initialNodes
    );
    expect(resetResponse.body.data.resetGraphToInitial.edges).toEqual(
      resetResponse.body.data.resetGraphToInitial.initialEdges
    );
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
