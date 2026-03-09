import { ReactFlow, Controls, ReactFlowProvider } from "@xyflow/react";
import { graphConfig } from "./config/graphSettings";
import { observer } from "mobx-react-lite";
import "@xyflow/react/dist/style.css";
import {
  GraphStoreProvider,
  useGraphStore,
} from "./services/graphStore.context.tsx";
import { MainNode } from "./ui/mainNode.tsx";
import { BasicNode } from "./ui/basicNode.tsx";

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

const nodeTypes = {
  main: MainNode,
  basic: BasicNode,
};

const GraphFlow = observer(() => {
  const graphStore = useGraphStore();
  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={graphStore.nodes}
        edges={graphStore.edges}
        style={{ background: graphConfig.initBgColor }}
        nodesDraggable={true}
        draggable={true}
        onNodesChange={graphStore.onNodesChange}
        defaultViewport={defaultViewport}
        fitView
        // attributionPosition="bottom-left"
        nodeTypes={nodeTypes}
      >
        <Controls />
      </ReactFlow>
    </div>
  );
});

export const GraphPage = () => {
  return (
    <ReactFlowProvider>
      <GraphStoreProvider>
        <GraphFlow />
      </GraphStoreProvider>
    </ReactFlowProvider>
  );
};
