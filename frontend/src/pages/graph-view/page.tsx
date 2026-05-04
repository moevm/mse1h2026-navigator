import {
  ReactFlow,
  Controls,
  ReactFlowProvider,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react";
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
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
import { Button } from "@/components/ui/button";

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

const nodeTypes: NodeTypes = {
  main: MainNode,
  basic: BasicNode,
};

const GraphFlow = observer(() => {
  const graphStore = useGraphStore();
  const nodeModalStore = useNodeModalStore();
  const navigate = useNavigate();
  const [professionTitle, setProfessionTitle] = useState(
    graphStore.professionTitle,
  );

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    nodeModalStore.open(node);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!localStorage.getItem("user")) {
      navigate("/");
      return;
    }

    void graphStore.createOrLoadGraph(professionTitle);
  };

  return (
    <div className="relative h-screen w-full">
      <form
        onSubmit={handleSubmit}
        className="absolute left-4 top-4 z-10 flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white p-3 shadow-sm"
      >
        <input
          value={professionTitle}
          onChange={(event) => setProfessionTitle(event.target.value)}
          className="h-9 min-w-56 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
          placeholder="Профессия"
        />
        <Button type="submit" disabled={graphStore.isLoading}>
          {graphStore.isLoading ? "Загрузка..." : "Создать граф"}
        </Button>
        {graphStore.hasGraph && (
          <Button
            type="button"
            variant="outline"
            disabled={graphStore.isLoading}
            onClick={() => void graphStore.createOrLoadGraph(professionTitle, true)}
          >
            Пересоздать
          </Button>
        )}
        {graphStore.error && (
          <p className="basis-full text-sm text-red-600">{graphStore.error}</p>
        )}
      </form>

      {graphStore.hasGraph ? (
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
      ) : (
        <div
          className="flex h-full items-center justify-center px-6 text-center text-slate-500"
          style={{ background: graphConfig.initBgColor }}
        >
          Введите профессию, чтобы построить граф навыков.
        </div>
      )}

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
