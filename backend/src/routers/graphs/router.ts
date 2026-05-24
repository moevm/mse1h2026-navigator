import { Router, Request, Response, text } from "express";
import axios from "axios";
import { prisma } from "../../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth";
import {
  GraphServiceError,
  getUserGraph,
  importUserGraph,
} from "../../services/graphEditing/service";
import {
  exportGraph,
  GraphImportError,
  importGraph,
  parseGraphExportFormat,
  parseGraphImportFormat,
} from "../../services/graphExport/service";
import {
  CreateGraphRequest,
  GraphDataServiceResponse,
  GraphListItemResponse,
  GraphResponse,
  GraphSkill,
  GraphSkillsRelation,
  UpdateGraphNodeRequest,
} from "./types";

export const router = Router();

router.use(requireAuth);

function normalizeProfessionTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildSkillId(title: string, index: number): string {
  return `skill-${index + 1}-${title
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")}`;
}

function graphDataServiceUrl(): string {
  return process.env.GRAPH_DATA_SERVICE_URL || "http://localhost:8000";
}

function mapGraphResponse(graph: {
  id: string;
  professionTitle: string;
  mainSkill: GraphResponse["mainSkill"];
  nodes: GraphSkill[];
  edges: GraphSkillsRelation[];
  createdAt: Date;
  updatedAt: Date;
}): GraphResponse {
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

function mapGraphListItem(graph: {
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

function convertGraphData(
  professionTitle: string,
  graphData: GraphDataServiceResponse
): {
  mainSkill: GraphResponse["mainSkill"];
  nodes: GraphSkill[];
  edges: GraphSkillsRelation[];
  initialMainSkill: GraphResponse["mainSkill"];
  initialNodes: GraphSkill[];
  initialEdges: GraphSkillsRelation[];
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

  const nodes: GraphSkill[] = Array.from(skillTitleById.entries()).map(
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

  const edges: GraphSkillsRelation[] = graphData.edges
    .map((edge) => {
      const fromId = skillIdByTitle.get(edge.from_skill.trim());
      const toId = skillIdByTitle.get(edge.to_skill.trim());
      if (!fromId || !toId) {
        return null;
      }
      return { fromId, toId };
    })
    .filter((edge): edge is GraphSkillsRelation => edge !== null);

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

  return {
    mainSkill,
    nodes,
    edges,
    initialMainSkill: mainSkill,
    initialNodes: nodes,
    initialEdges: edges,
  };
}

async function fetchGraphData(
  professionTitle: string,
  useCache: boolean,
  isMock: boolean
): Promise<GraphDataServiceResponse> {
  const { data } = await axios.post<GraphDataServiceResponse>(
    `${graphDataServiceUrl()}/get_profession_graph`,
    {
      profession_title: professionTitle,
      use_cache: useCache,
      is_mock: isMock,
    },
    { timeout: 120000 }
  );

  return data;
}

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const graphs = await prisma.graph.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      professionTitle: true,
      normalizedProfessionTitle: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json(graphs.map(mapGraphListItem));
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const {
    professionTitle,
    useCache = true,
    isMock = false,
    forceRegenerate = false,
  } = req.body as CreateGraphRequest;

  if (
    !professionTitle ||
    typeof professionTitle !== "string" ||
    professionTitle.trim().length === 0
  ) {
    res.status(400).json({ error: "professionTitle is required" });
    return;
  }

  const normalizedProfessionTitle = normalizeProfessionTitle(professionTitle);

  const existingGraph = await prisma.graph.findUnique({
    where: {
      userId_normalizedProfessionTitle: {
        userId: user.id,
        normalizedProfessionTitle,
      },
    },
  });

  if (existingGraph && !forceRegenerate) {
    res.json(mapGraphResponse(existingGraph));
    return;
  }

  try {
    const graphData = await fetchGraphData(
      professionTitle.trim(),
      Boolean(useCache),
      Boolean(isMock)
    );
    const convertedGraph = convertGraphData(professionTitle.trim(), graphData);

    const graph = existingGraph
      ? await prisma.graph.update({
          where: { id: existingGraph.id },
          data: convertedGraph,
        })
      : await prisma.graph.create({
          data: {
            userId: user.id,
            professionTitle: professionTitle.trim(),
            normalizedProfessionTitle,
            ...convertedGraph,
          },
        });

    res.json(mapGraphResponse(graph));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      res.status(502).json({ error: "Failed to get graph data from graph service" });
      return;
    }

    throw error;
  }
});

router.get("/:graphId/export", async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const graphId = req.params.graphId;
  const format = parseGraphExportFormat(req.query.format);

  if (typeof graphId !== "string") {
    res.status(400).json({ error: "graphId is required" });
    return;
  }

  if (!format) {
    res.status(400).json({ error: "Unsupported export format" });
    return;
  }

  try {
    const graph = await getUserGraph(user.id, graphId);
    const exportedGraph = exportGraph(graph, format);

    res.setHeader("Content-Type", exportedGraph.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="graph-${graphId}.${exportedGraph.fileExtension}"`
    );
    res.send(exportedGraph.content);
  } catch (error) {
    if (error instanceof GraphServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    throw error;
  }
});

router.post(
  "/import",
  text({
    type: ["application/rdf+xml", "application/xml", "text/turtle", "text/plain"],
    limit: "5mb",
  }),
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const format = parseGraphImportFormat(req.query.format);

    if (!format) {
      res.status(400).json({ error: "Unsupported import format" });
      return;
    }

    if (typeof req.body !== "string" || req.body.trim().length === 0) {
      res.status(400).json({ error: "Import file content is required" });
      return;
    }

    try {
      const importedGraph = importGraph(req.body, format);
      const graph = await importUserGraph({
        userId: user.id,
        graphData: importedGraph.graphData,
      });

      res.status(201).json(graph);
    } catch (error) {
      if (error instanceof GraphImportError) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error instanceof GraphServiceError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      throw error;
    }
  }
);

router.get("/:graphId", async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const graphId = req.params.graphId;

  if (typeof graphId !== "string") {
    res.status(400).json({ error: "graphId is required" });
    return;
  }

  const graph = await prisma.graph.findFirst({
    where: {
      id: graphId,
      userId: user.id,
    },
  });

  if (!graph) {
    res.status(404).json({ error: "Graph not found" });
    return;
  }

  res.json(mapGraphResponse(graph));
});

router.patch("/:graphId/nodes/:nodeId", async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const graphId = req.params.graphId;
  const nodeId = req.params.nodeId;
  const { isCompleted } = req.body as UpdateGraphNodeRequest;

  if (typeof graphId !== "string" || typeof nodeId !== "string") {
    res.status(400).json({ error: "graphId and nodeId are required" });
    return;
  }

  if (typeof isCompleted !== "boolean") {
    res.status(400).json({ error: "isCompleted must be a boolean" });
    return;
  }

  const graph = await prisma.graph.findFirst({
    where: {
      id: graphId,
      userId: user.id,
    },
  });

  if (!graph) {
    res.status(404).json({ error: "Graph not found" });
    return;
  }

  const nodeIndex = graph.nodes.findIndex((node) => node.id === nodeId);
  if (nodeIndex === -1) {
    res.status(404).json({ error: "Graph node not found" });
    return;
  }

  const nodes = graph.nodes.map((node) =>
    node.id === nodeId ? { ...node, isCompleted } : node
  );
  const updatedNode = nodes[nodeIndex];

  if (!updatedNode) {
    res.status(404).json({ error: "Graph node not found" });
    return;
  }

  await prisma.graph.update({
    where: { id: graph.id },
    data: { nodes },
  });

  const userGraphs = await prisma.graph.findMany({
    where: { userId: user.id },
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
    where: { id: user.id },
    data: { skills },
  });

  res.json({
    node: updatedNode,
    skills: updatedUser.skills,
  });
});
