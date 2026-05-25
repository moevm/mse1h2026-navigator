import { GitBranch, ListTree } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GraphViewMode = "graph" | "list";

interface GraphViewSwitcherProps {
  graphId?: string | null;
  activeView: GraphViewMode;
  className?: string;
}

export function GraphViewSwitcher({
  graphId,
  activeView,
  className,
}: GraphViewSwitcherProps) {
  if (!graphId) {
    return null;
  }

  const graphPath = `/graph/${graphId}`;
  const listPath = `${graphPath}/list`;

  return (
    <nav
      aria-label="Переключение представления графа"
      className={cn(
        "grid grid-cols-2 gap-1 rounded-md border border-slate-200 bg-slate-100 p-1",
        className,
      )}
    >
      <Button
        asChild
        size="sm"
        variant={activeView === "graph" ? "default" : "ghost"}
        className="justify-center"
      >
        <Link to={graphPath}>
          <GitBranch />
          Граф
        </Link>
      </Button>
      <Button
        asChild
        size="sm"
        variant={activeView === "list" ? "default" : "ghost"}
        className="justify-center"
      >
        <Link to={listPath}>
          <ListTree />
          Список
        </Link>
      </Button>
    </nav>
  );
}
