import { apiClient } from "./client";
import type {
  CreateGraphNodeInput,
  GraphEdgeInput,
  GraphFileFormat,
  GraphListItem,
  GraphResponse,
  GraphSearchParams,
  UpdateGraphNodeInput,
  UpdateGraphNodeResponse,
} from "./types";

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
    books { id title author description link image }
    articles { id title description link rating tags }
  }
  initialEdges { fromId toId }
  createdAt
  updatedAt
`;

async function gql<TData>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const { data } = await apiClient.post<{
    data?: TData;
    errors?: { message: string }[];
  }>("/api/graphql", { query, variables });

  if (data.errors?.length) {
    throw new Error(data.errors.map((error) => error.message).join("\n"));
  }

  if (!data.data) {
    throw new Error("GraphQL response does not contain data");
  }

  return data.data;
}

export async function createOrLoadGraph(
  input: GraphSearchParams,
): Promise<GraphResponse> {
  const data = await gql<{ createOrLoadGraph: GraphResponse }>(
    `
      mutation CreateOrLoadGraph($input: CreateOrLoadGraphInput!) {
        createOrLoadGraph(input: $input) {
          ${graphFields}
        }
      }
    `,
    { input },
  );
  return data.createOrLoadGraph;
}

export async function listSavedGraphs(): Promise<GraphListItem[]> {
  const data = await gql<{ savedGraphs: GraphListItem[] }>(`
    query SavedGraphs {
      savedGraphs {
        id
        professionTitle
        normalizedProfessionTitle
        createdAt
        updatedAt
      }
    }
  `);
  return data.savedGraphs;
}

export async function getSavedGraph(graphId: string): Promise<GraphResponse> {
  const data = await gql<{ savedGraph: GraphResponse }>(
    `
      query SavedGraph($graphId: String!) {
        savedGraph(graphId: $graphId) {
          ${graphFields}
        }
      }
    `,
    { graphId },
  );
  return data.savedGraph;
}

export async function deleteGraph(graphId: string): Promise<boolean> {
  const data = await gql<{ deleteGraph: boolean }>(
    `
      mutation DeleteGraph($graphId: String!) {
        deleteGraph(graphId: $graphId)
      }
    `,
    { graphId },
  );
  return data.deleteGraph;
}

export async function exportGraphFile(
  graphId: string,
  format: GraphFileFormat,
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(
    `/api/graphs/${graphId}/export?format=${format}`,
    { responseType: "blob" },
  );

  return data;
}

export async function importGraphFile(
  file: File,
  format: GraphFileFormat,
): Promise<GraphResponse> {
  const { data } = await apiClient.post<GraphResponse>(
    `/api/graphs/import?format=${format}`,
    file,
    {
      headers: {
        "Content-Type": file.type || contentTypeByFormat[format],
      },
    },
  );

  return data;
}

export async function updateGraphNode(
  graphId: string,
  nodeId: string,
  input: UpdateGraphNodeInput,
): Promise<UpdateGraphNodeResponse> {
  const data = await gql<{ updateGraphNode: UpdateGraphNodeResponse }>(
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
    courses { id title description link image }
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
    books { id title author description link image }
    articles { id title description link rating tags }
  }
          skills
        }
      }
    `,
    { graphId, nodeId, input },
  );
  return data.updateGraphNode;
}

export async function addGraphNode(
  graphId: string,
  input: CreateGraphNodeInput,
): Promise<GraphResponse> {
  const data = await gql<{ addGraphNode: GraphResponse }>(
    `
      mutation AddGraphNode($graphId: String!, $input: CreateGraphNodeInput!) {
        addGraphNode(graphId: $graphId, input: $input) {
          ${graphFields}
        }
      }
    `,
    { graphId, input },
  );
  return data.addGraphNode;
}

export async function deleteGraphNode(
  graphId: string,
  nodeId: string,
): Promise<GraphResponse> {
  const data = await gql<{ deleteGraphNode: GraphResponse }>(
    `
      mutation DeleteGraphNode($graphId: String!, $nodeId: String!) {
        deleteGraphNode(graphId: $graphId, nodeId: $nodeId) {
          ${graphFields}
        }
      }
    `,
    { graphId, nodeId },
  );
  return data.deleteGraphNode;
}

export async function addGraphEdge(
  graphId: string,
  input: GraphEdgeInput,
): Promise<GraphResponse> {
  const data = await gql<{ addGraphEdge: GraphResponse }>(
    `
      mutation AddGraphEdge($graphId: String!, $input: GraphEdgeInput!) {
        addGraphEdge(graphId: $graphId, input: $input) {
          ${graphFields}
        }
      }
    `,
    { graphId, input },
  );
  return data.addGraphEdge;
}

export async function deleteGraphEdge(
  graphId: string,
  input: GraphEdgeInput,
): Promise<GraphResponse> {
  const data = await gql<{ deleteGraphEdge: GraphResponse }>(
    `
      mutation DeleteGraphEdge($graphId: String!, $input: GraphEdgeInput!) {
        deleteGraphEdge(graphId: $graphId, input: $input) {
          ${graphFields}
        }
      }
    `,
    { graphId, input },
  );
  return data.deleteGraphEdge;
}

export async function resetGraphToInitial(graphId: string): Promise<GraphResponse> {
  const data = await gql<{ resetGraphToInitial: GraphResponse }>(
    `
      mutation ResetGraphToInitial($graphId: String!) {
        resetGraphToInitial(graphId: $graphId) {
          ${graphFields}
        }
      }
    `,
    { graphId },
  );
  return data.resetGraphToInitial;
}

export async function getGraphSubgraph(params: {
  graphId: string;
  nodeId: string;
  depth: number;
}): Promise<GraphResponse> {
  const data = await gql<{ graphSubgraph: GraphResponse }>(
    `
      query GraphSubgraph($graphId: String!, $nodeId: String!, $depth: Int!) {
        graphSubgraph(graphId: $graphId, nodeId: $nodeId, depth: $depth) {
          ${graphFields}
        }
      }
    `,
    params,
  );
  return data.graphSubgraph;
}

const contentTypeByFormat: Record<GraphFileFormat, string> = {
  rdfxml: "application/rdf+xml",
  turtle: "text/turtle",
};
