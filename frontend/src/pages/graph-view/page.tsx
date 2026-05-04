import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type EdgeMouseHandler,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import {
  CheckCircle2,
  Filter,
  GitBranch,
  Home,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import "@xyflow/react/dist/style.css";
import { graphConfig } from "./config/graphSettings";
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
import { parseTechnologyList } from "@/lib/parseTechnologyList";

const defaultViewport = { x: 80, y: 80, zoom: 1.2 };

const nodeTypes: NodeTypes = {
  main: MainNode,
  basic: BasicNode,
};

const GraphFlow = observer(() => {
  const graphStore = useGraphStore();
  const nodeModalStore = useNodeModalStore();
  const navigate = useNavigate();
  const { graphId } = useParams<{ graphId: string }>();
  const [professionTitle, setProfessionTitle] = useState("");
  const [initialTechnologiesInput, setInitialTechnologiesInput] = useState("");
  const [isMock, setIsMock] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newNodeDescription, setNewNodeDescription] = useState("");
  const [newNodeHours, setNewNodeHours] = useState(4);
  const [attachToNodeId, setAttachToNodeId] = useState("");
  const [attachDirection, setAttachDirection] = useState<"after" | "before">(
    "after",
  );

  useEffect(() => {
    if (!localStorage.getItem("user")) {
      navigate("/", { replace: true });
      return;
    }
    if (!graphId) {
      navigate("/", { replace: true });
      return;
    }
    void graphStore.openSavedGraph(graphId);
  }, [graphId, graphStore, navigate]);

  useEffect(() => {
    if (graphStore.professionTitle) {
      setProfessionTitle(graphStore.professionTitle);
    }
  }, [graphStore.professionTitle]);

  useEffect(() => {
    if (!attachToNodeId && graphStore.mainSkill?.id) {
      setAttachToNodeId(graphStore.mainSkill.id);
    }
  }, [attachToNodeId, graphStore.mainSkill?.id]);

  const progress = useMemo(() => {
    if (!graphStore.skills.length) {
      return 0;
    }
    return Math.round((graphStore.completedCount / graphStore.skills.length) * 100);
  }, [graphStore.completedCount, graphStore.skills.length]);

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    nodeModalStore.open(node);
  };

  const handleNodeContextMenu: NodeMouseHandler = (event, node) => {
    event.preventDefault();
    graphStore.toggleCollapsedSubgraph(node.id);
  };

  const handleEdgeClick: EdgeMouseHandler = (_, edge) => {
    void graphStore.deleteEdge(edge.id);
  };

  const handleRegenerate = () => {
    void graphStore
      .createOrLoadGraph({
        professionTitle: professionTitle || graphStore.professionTitle,
        initialTechnologies: parseTechnologyList(initialTechnologiesInput),
        forceRegenerate: true,
        isMock,
      })
      .then((createdGraphId) => {
        if (createdGraphId && createdGraphId !== graphId) {
          navigate(`/graph/${createdGraphId}`, { replace: true });
        }
      });
  };

  const handleAddNode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void graphStore
      .addNode({
        title: newNodeTitle,
        description: newNodeDescription,
        learnHours: newNodeHours,
        priority: 3,
        isRequired: true,
        isCompleted: false,
        isArchieved: false,
      },
      attachToNodeId
        ? { nodeId: attachToNodeId, direction: attachDirection }
        : undefined,
      )
      .then(() => {
        setNewNodeTitle("");
        setNewNodeDescription("");
        setNewNodeHours(4);
      });
  };

  const attachOptions = useMemo(() => {
    const mainOption = graphStore.mainSkill
      ? [{ id: graphStore.mainSkill.id, title: graphStore.mainSkill.title }]
      : [];

    return [
      ...mainOption,
      ...graphStore.skills.map((skill) => ({ id: skill.id, title: skill.title })),
    ];
  }, [graphStore.mainSkill, graphStore.skills]);

  useEffect(() => {
    if (
      attachOptions.length > 0 &&
      !attachOptions.some((node) => node.id === attachToNodeId)
    ) {
      setAttachToNodeId(attachOptions[0].id);
    }
  }, [attachOptions, attachToNodeId]);

  return (
    <div className="grid h-screen w-full grid-cols-[380px_minmax(0,1fr)] bg-slate-100 text-slate-950">
      <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-white shadow-[18px_0_48px_-42px_rgba(15,23,42,0.8)]">
        <div className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-5 py-5 text-white">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/15">
              <GitBranch className="size-5 text-emerald-200" />
            </span>
            <h1 className="text-lg font-semibold">Навигатор навыков</h1>
          </div>
          <p className="mt-2 text-sm leading-5 text-slate-300">
            Фильтрация и ручная правка графа профессии.
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
          <section className="space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/">
                <Home />
                Главная
              </Link>
            </Button>

            <label className="block text-sm font-medium text-slate-700">
              Профессия
              <input
                value={professionTitle}
                onChange={(event) => setProfessionTitle(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-600"
                placeholder="Например, Frontend Developer"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Стартовые технологии
              <textarea
                value={initialTechnologiesInput}
                onChange={(event) => setInitialTechnologiesInput(event.target.value)}
                className="mt-1 min-h-20 w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-600"
                placeholder="React, TypeScript, GraphQL"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isMock}
                  onChange={(event) => setIsMock(event.target.checked)}
                  className="size-4 accent-slate-900"
                />
                Mock API
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={graphStore.isLoading || !professionTitle.trim()}
                onClick={handleRegenerate}
              >
                {graphStore.isLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Пересоздать
              </Button>
            </div>
          </section>

          <div className="grid grid-cols-3 gap-2">
            <Metric label="Навыки" value={graphStore.skills.length} />
            <Metric label="Видно" value={graphStore.visibleSkillsCount} />
            <Metric label="Часы" value={graphStore.totalHours} />
          </div>

          <div className="rounded-md border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 font-medium text-emerald-950">
                <CheckCircle2 className="size-4 text-emerald-700" />
                Прогресс
              </span>
              <span className="text-emerald-700">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-emerald-800">
              {graphStore.completedCount} из {graphStore.skills.length} навыков
              отмечено изученными.
            </p>
          </div>

          <section className="space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Filter className="size-4 text-slate-500" />
              Фильтры
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={graphStore.filters.requiredOnly}
                  onChange={(event) =>
                    graphStore.setFilter("requiredOnly", event.target.checked)
                  }
                  className="size-4 accent-slate-900"
                />
                Обязательные
              </label>
              <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={graphStore.filters.incompleteOnly}
                  onChange={(event) =>
                    graphStore.setFilter("incompleteOnly", event.target.checked)
                  }
                  className="size-4 accent-slate-900"
                />
                Не изучены
              </label>
            </div>
            <label className="block text-sm text-slate-700">
              Минимум часов: {graphStore.filters.minHours}
              <input
                type="range"
                min="0"
                max="80"
                value={graphStore.filters.minHours}
                onChange={(event) =>
                  graphStore.setFilter("minHours", Number(event.target.value))
                }
                className="mt-2 w-full accent-slate-900"
              />
            </label>
          </section>

          <form onSubmit={handleAddNode} className="space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <SlidersHorizontal className="size-4 text-slate-500" />
              Добавить навык
            </h2>
            <input
              value={newNodeTitle}
              onChange={(event) => setNewNodeTitle(event.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
              placeholder="Название узла"
            />
            <textarea
              value={newNodeDescription}
              onChange={(event) => setNewNodeDescription(event.target.value)}
              className="min-h-20 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
              placeholder="Короткое описание"
            />
            <label className="block text-sm text-slate-700">
              Оценка: {newNodeHours} ч
              <input
                type="range"
                min="1"
                max="80"
                value={newNodeHours}
                onChange={(event) => setNewNodeHours(Number(event.target.value))}
                className="mt-2 w-full accent-slate-900"
              />
            </label>
            <label className="block text-sm text-slate-700">
              Связать с
              <select
                value={attachToNodeId}
                onChange={(event) => setAttachToNodeId(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-600"
                disabled={!attachOptions.length}
              >
                {attachOptions.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="radio"
                  checked={attachDirection === "after"}
                  onChange={() => setAttachDirection("after")}
                  className="size-4 accent-slate-900"
                />
                После
              </label>
              <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="radio"
                  checked={attachDirection === "before"}
                  onChange={() => setAttachDirection("before")}
                  className="size-4 accent-slate-900"
                />
                Перед
              </label>
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={graphStore.isEditing || !graphStore.hasGraph}
            >
              <Plus />
              Добавить узел
            </Button>
          </form>

        </div>
      </aside>

      <main className="relative min-w-0">
        {graphStore.hasGraph && (
          <div className="absolute left-1/2 top-4 z-10 w-[min(560px,calc(100%-32px))] -translate-x-1/2">
            <label className="relative block rounded-md border border-slate-200 bg-white/95 shadow-sm backdrop-blur">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={graphStore.filters.query}
                onChange={(event) =>
                  graphStore.setFilter("query", event.target.value)
                }
                className="h-11 w-full rounded-md bg-transparent px-10 pr-20 text-sm outline-none focus:ring-2 focus:ring-slate-500/25"
                placeholder="Найти и показать подграф"
              />
              {graphStore.filters.query && (
                <button
                  type="button"
                  onClick={() => graphStore.setFilter("query", "")}
                  className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Очистить поиск"
                >
                  <X className="size-4" />
                </button>
              )}
            </label>
          </div>
        )}

        {graphStore.error && (
          <div className="absolute bottom-4 left-4 right-4 z-10 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {graphStore.error}
          </div>
        )}

        {graphStore.hasGraph ? (
          <ReactFlow
            nodes={graphStore.nodes}
            edges={graphStore.edges}
            style={{ background: graphConfig.initBgColor }}
            nodesDraggable
            draggable
            onConnect={(connection) => void graphStore.connectNodes(connection)}
            onNodesChange={graphStore.onNodesChange}
            onNodeClick={handleNodeClick}
            onNodeContextMenu={handleNodeContextMenu}
            onEdgeClick={handleEdgeClick}
            defaultViewport={defaultViewport}
            fitView
            nodeTypes={nodeTypes}
          >
            <Background color="#cbd5e1" gap={18} />
            <MiniMap pannable zoomable nodeStrokeWidth={3} />
            <Controls />
          </ReactFlow>
        ) : (
          <div
            className="flex h-full items-center justify-center px-6 text-center text-slate-500"
            style={{ background: graphConfig.initBgColor }}
          >
            <div className="max-w-sm rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm">
                Введите профессию слева и отправьте запрос на backend, чтобы
                построить граф навыков.
              </p>
            </div>
          </div>
        )}

        {(graphStore.isLoading || graphStore.isEditing) && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
              <Loader2 className="animate-spin" />
              {graphStore.isLoading ? "Загружаю граф" : "Сохраняю изменения"}
            </div>
          </div>
        )}

        <NodeModal />
      </main>
    </div>
  );
});

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-lg font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

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
