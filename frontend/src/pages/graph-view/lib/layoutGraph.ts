import ELK from "elkjs";

const elk = new ELK();

export async function layoutGraph(nodes, edges) {
  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "radial",
      "elk.spacing.nodeNode": "120",
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: 120,
      height: 120,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout = await elk.layout(graph);

  const positionedNodes = nodes.map((node) => {
    const elkNode = layout.children.find((n) => n.id === node.id);

    return {
      ...node,
      position: {
        x: elkNode.x,
        y: elkNode.y,
      },
    };
  });

  return {
    nodes: positionedNodes,
    edges,
  };
}
