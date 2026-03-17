import {
  ReactFlow,
  Controls,
  ReactFlowProvider,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react";
import { graphConfig } from "./config/graphSettings";
import { observer } from "mobx-react-lite";
import "@xyflow/react/dist/style.css";
import {
  GraphStoreProvider,
  useGraphStore,
} from "./services/graphStore.context.tsx";
import {
  NodeModalStoreProvider,
  useNodeModalStore,
} from "./services/nodeModalStore.context.tsx";
import { MainNode } from "./ui/mainNode.tsx";
import { BasicNode } from "./ui/basicNode.tsx";
import { NodeModal } from "./ui/nodeModal";

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

const nodeTypes: NodeTypes = {
  main: MainNode,
  basic: BasicNode,
};

const GraphFlow = observer(() => {
  const graphStore = useGraphStore();
  const nodeModalStore = useNodeModalStore();

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    nodeModalStore.open(node);
  };

  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={graphStore.nodes}
        edges={graphStore.edges}
        style={{ background: graphConfig.initBgColor }}
        nodesDraggable={true}
        draggable={true}
        onNodesChange={graphStore.onNodesChange}
        onNodeClick={handleNodeClick}
        defaultViewport={defaultViewport}
        fitView
        nodeTypes={nodeTypes}
      >
        <Controls />
      </ReactFlow>

      <NodeModal />
    </div>
  );
});

export const GraphPage = () => {
  return (
    <ReactFlowProvider>
      <GraphStoreProvider>
        <NodeModalStoreProvider>
          <GraphFlow />
        </NodeModalStoreProvider>
      </GraphStoreProvider>
    </ReactFlowProvider>
  );
};
