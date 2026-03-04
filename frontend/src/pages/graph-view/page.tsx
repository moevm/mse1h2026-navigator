import { ReactFlow, Controls } from "@xyflow/react";
import { graphConfig } from "./config/graphSettings";

import "@xyflow/react/dist/style.css";

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

export const GraphPage = () => {
  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={[]}
        edges={[]}
        style={{ background: graphConfig.initBgColor }}
        snapToGrid={true}
        defaultViewport={defaultViewport}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
      </ReactFlow>
    </div>
  );
};
