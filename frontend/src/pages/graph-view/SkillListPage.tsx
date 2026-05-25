import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { saveAs } from "file-saver";
import {
  Archive,
  CheckCircle2,
  Clock3,
  Download,
  GitBranch,
  Home,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Skill } from "@/entities/skill";
import { createSkillNode } from "./lib/createSkillNode";
import {
  formatSkillsListMarkdown,
  getSkillsListMarkdownFileName,
} from "./lib/formatSkillsListMarkdown";
import { groupSkillsForList, type SkillPriorityGroup } from "./lib/groupSkillsForList";
import {
  GraphStoreProvider,
  useGraphStore,
} from "./services/graphStore.context";
import {
  NodeModalStoreProvider,
  useNodeModalStore,
} from "./services/nodeModalStore.context";
import { GraphViewSwitcher } from "./ui/GraphViewSwitcher";
import { NodeModal } from "./ui/nodeModal";

const SkillListContent = observer(() => {
  const graphStore = useGraphStore();
  const nodeModalStore = useNodeModalStore();
  const navigate = useNavigate();
  const { graphId } = useParams<{ graphId: string }>();
  const [hasRequestedGraph, setHasRequestedGraph] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("user")) {
      navigate("/", { replace: true });
      return;
    }
    if (!graphId) {
      navigate("/", { replace: true });
      return;
    }

    setHasRequestedGraph(true);
    void graphStore.openSavedGraph(graphId);
  }, [graphId, graphStore, navigate]);

  const groupedSkills = useMemo(
    () => groupSkillsForList(graphStore.skills),
    [graphStore.skills],
  );

  const activeCount = groupedSkills.currentPlan.reduce(
    (sum, group) => sum + group.skills.length,
    0,
  );
  const isLoading = graphStore.isLoading || !hasRequestedGraph;
  const hasGraph = graphStore.hasGraph && !isLoading;

  const handleDownloadMarkdown = () => {
    const markdown = formatSkillsListMarkdown({
      professionTitle: graphStore.professionTitle,
      groups: groupedSkills,
    });
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });

    saveAs(blob, getSkillsListMarkdownFileName(graphStore.professionTitle));
  };

  const handleSkillClick = (skill: Skill) => {
    nodeModalStore.open(createSkillNode(skill));
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <GitBranch className="size-5 shrink-0 text-slate-700" />
            <span className="truncate text-lg font-semibold">Навигатор навыков</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/">
                <Home />
                Главная
              </Link>
            </Button>
            <GraphViewSwitcher
              graphId={graphId ?? graphStore.graphId}
              activeView="list"
              className="min-w-56"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Списочное представление
            </p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {graphStore.professionTitle || "План навыков"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Те же навыки, что и на графе, сгруппированы по статусам и
                  приоритетам для спокойного чтения учебного плана.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadMarkdown}
                  disabled={!hasGraph}
                >
                  <Download />
                  Скачать Markdown
                </Button>
                {graphStore.mainSkill ? (
                  <Badge variant="secondary" className="px-3 py-1 text-slate-700">
                    {graphStore.mainSkill.title}
                  </Badge>
                ) : null}
              </div>
            </div>
          </section>

          {isLoading ? (
            <StateCard icon={<Loader2 className="animate-spin" />} title="Загружаю граф">
              Получаем сохранённые навыки и готовим список.
            </StateCard>
          ) : null}

          {!isLoading && graphStore.error ? (
            <StateCard title="Не удалось открыть граф" tone="error">
              {graphStore.error}
            </StateCard>
          ) : null}

          {!isLoading && !graphStore.error && !hasGraph ? (
            <StateCard title="Граф не найден">
              Вернитесь на главную и выберите сохранённый граф.
            </StateCard>
          ) : null}

          {hasGraph ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Всего навыков" value={graphStore.skills.length} />
                <MetricCard label="В текущем плане" value={activeCount} />
                <MetricCard
                  label="Освоены"
                  value={groupedSkills.completed.length}
                  tone="success"
                />
                <MetricCard label="В архиве" value={groupedSkills.archived.length} />
              </section>

              <SkillListView
                currentPlan={groupedSkills.currentPlan}
                completed={groupedSkills.completed}
                archived={groupedSkills.archived}
                onSkillClick={handleSkillClick}
              />
            </>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Навигация
            </p>
            <AnchorLink href="#current-plan">Текущий план</AnchorLink>
            <AnchorLink href="#completed-skills">Освоенные навыки</AnchorLink>
            <AnchorLink href="#archived-skills">Архивированные навыки</AnchorLink>
          </div>
        </aside>
      </div>
      {graphStore.isEditing ? (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Сохраняю изменения
          </span>
        </div>
      ) : null}
      <NodeModal
        onSubgraphShown={({ nodeId, depth }) => {
          const targetGraphId = graphId ?? graphStore.graphId;
          if (targetGraphId) {
            const params = new URLSearchParams({
              subgraphNodeId: nodeId,
              depth: String(depth),
            });

            navigate(`/graph/${targetGraphId}?${params.toString()}`);
          }
        }}
      />
    </main>
  );
});

function SkillListView({
  currentPlan,
  completed,
  archived,
  onSkillClick,
}: {
  currentPlan: SkillPriorityGroup[];
  completed: Skill[];
  archived: Skill[];
  onSkillClick: (skill: Skill) => void;
}) {
  return (
    <div className="space-y-6">
      <section id="current-plan" className="scroll-mt-24 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeader
          icon={<Clock3 className="size-5 text-slate-600" />}
          title="Текущий план"
          description="Активные навыки сгруппированы по приоритетам."
        />
        <div className="mt-5 space-y-4">
          {currentPlan.length ? (
            currentPlan.map((group) => (
              <PrioritySkillGroup
                key={group.priority}
                group={group}
                onSkillClick={onSkillClick}
              />
            ))
          ) : (
            <EmptyState>Нет активных навыков в текущем плане.</EmptyState>
          )}
        </div>
      </section>

      <SkillSection
        id="completed-skills"
        icon={<CheckCircle2 className="size-5 text-emerald-700" />}
        title="Освоенные навыки"
        description="Навыки со статусом completed."
        empty="Пока нет освоенных навыков."
      >
        {completed.map((skill) => (
          <SkillListItem
            key={skill.id}
            skill={skill}
            status="completed"
            onClick={onSkillClick}
          />
        ))}
      </SkillSection>

      <SkillSection
        id="archived-skills"
        icon={<Archive className="size-5 text-slate-600" />}
        title="Архивированные навыки"
        description="Навыки, скрытые из активного плана."
        empty="Архивированных навыков нет."
      >
        {archived.map((skill) => (
          <SkillListItem
            key={skill.id}
            skill={skill}
            status="archived"
            onClick={onSkillClick}
          />
        ))}
      </SkillSection>
    </div>
  );
}

function PrioritySkillGroup({
  group,
  onSkillClick,
}: {
  group: SkillPriorityGroup;
  onSkillClick: (skill: Skill) => void;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-slate-50/70">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Приоритет {group.priority}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {group.skills.length} {getSkillCountLabel(group.skills.length)}
          </p>
        </div>
        <Badge variant="outline" className="border-slate-300 text-slate-700">
          priority {group.priority}
        </Badge>
      </div>
      <div className="space-y-2 p-3">
        {group.skills.map((skill) => (
          <SkillListItem
            key={skill.id}
            skill={skill}
            status="active"
            onClick={onSkillClick}
          />
        ))}
      </div>
    </section>
  );
}

function SkillSection({
  id,
  icon,
  title,
  description,
  empty,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  empty: string;
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children];
  const hasItems = items.some(Boolean);

  return (
    <section id={id} className="scroll-mt-24 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={icon} title={title} description={description} />
      <div className="mt-5 space-y-2">
        {hasItems ? items : <EmptyState>{empty}</EmptyState>}
      </div>
    </section>
  );
}

function SkillListItem({
  skill,
  status,
  leadingSlot,
  actionSlot,
  onClick,
}: {
  skill: Skill;
  status: "active" | "completed" | "archived";
  leadingSlot?: ReactNode;
  actionSlot?: ReactNode;
  onClick: (skill: Skill) => void;
}) {
  const statusLabel = {
    active: "В плане",
    completed: "Освоен",
    archived: "Архив",
  }[status];
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onClick(skill);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      className={getSkillItemClassName(status)}
      onClick={() => onClick(skill)}
      onKeyDown={handleKeyDown}
      aria-label={`Открыть навык ${skill.title}`}
    >
      {leadingSlot ? <div className="shrink-0">{leadingSlot}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-950">{skill.title}</h4>
          <Badge variant={status === "completed" ? "default" : "secondary"}>
            {statusLabel}
          </Badge>
        </div>
        {skill.description ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">{skill.description}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          <Badge variant="outline">{skill.learnHours} ч</Badge>
          <Badge variant="outline">Приоритет {skill.priority}</Badge>
          <Badge variant="outline">
            {skill.isRequired ? "Обязательный" : "Дополнительный"}
          </Badge>
        </div>
      </div>
      {actionSlot ? (
        <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
          {actionSlot}
        </div>
      ) : null}
    </article>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100">
        {icon}
      </span>
      <div>
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success";
}) {
  return (
    <div
      className={
        tone === "success"
          ? "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3"
          : "rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm"
      }
    >
      <p className="text-2xl font-semibold text-slate-950">{value}</p>
      <p className={tone === "success" ? "text-xs text-emerald-700" : "text-xs text-slate-500"}>
        {label}
      </p>
    </div>
  );
}

function StateCard({
  icon,
  title,
  tone = "default",
  children,
}: {
  icon?: ReactNode;
  title: string;
  tone?: "default" | "error";
  children: ReactNode;
}) {
  return (
    <section
      className={
        tone === "error"
          ? "rounded-md border border-red-200 bg-red-50 px-5 py-4 text-red-700 shadow-sm"
          : "rounded-md border border-slate-200 bg-white px-5 py-4 text-slate-600 shadow-sm"
      }
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <p className="mt-2 text-sm leading-6">{children}</p>
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
      {children}
    </p>
  );
}

function AnchorLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="block rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
    >
      {children}
    </a>
  );
}

function getSkillItemClassName(status: "active" | "completed" | "archived") {
  if (status === "completed") {
    return "flex cursor-pointer gap-3 rounded-md border border-emerald-200 bg-emerald-50/70 px-4 py-3 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30";
  }

  if (status === "archived") {
    return "flex cursor-pointer gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/30";
  }

  return "flex cursor-pointer gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/30";
}

function getSkillCountLabel(count: number): string {
  const normalizedCount = Math.abs(count) % 100;
  const lastDigit = normalizedCount % 10;

  if (normalizedCount > 10 && normalizedCount < 20) {
    return "навыков";
  }
  if (lastDigit === 1) {
    return "навык";
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return "навыка";
  }
  return "навыков";
}

export const SkillListPage = () => {
  return (
    <GraphStoreProvider>
      <NodeModalStoreProvider>
        <SkillListContent />
      </NodeModalStoreProvider>
    </GraphStoreProvider>
  );
};
