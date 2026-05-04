import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  GitBranch,
  Loader2,
  LogIn,
  RefreshCw,
  Search,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createOrLoadGraph, listSavedGraphs } from "@/api/graphs";
import type { AuthResponse, GraphListItem } from "@/api/types";
import { parseTechnologyList } from "@/lib/parseTechnologyList";

const YANDEX_CLIENT_ID = import.meta.env.VITE_YANDEX_CLIENT_ID;
const YANDEX_REDIRECT_URI = import.meta.env.VITE_YANDEX_REDIRECT_URI;

function handleYandexLogin() {
  const redirectUri = encodeURIComponent(
    YANDEX_REDIRECT_URI || window.location.origin + "/auth/callback",
  );
  window.location.href = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${redirectUri}`;
}

function getStoredUser(): Partial<AuthResponse> | null {
  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    const user = JSON.parse(raw) as Partial<AuthResponse>;
    return typeof user.token === "string" ? user : null;
  } catch {
    return null;
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const MainPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<Partial<AuthResponse> | null>(() =>
    getStoredUser(),
  );
  const [professionTitle, setProfessionTitle] = useState("");
  const [initialTechnologiesInput, setInitialTechnologiesInput] = useState("");
  const [isMock, setIsMock] = useState(false);
  const [graphs, setGraphs] = useState<GraphListItem[]>([]);
  const [isLoadingGraphs, setIsLoadingGraphs] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedGraphs = useMemo(
    () =>
      [...graphs].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      ),
    [graphs],
  );

  const loadGraphs = async () => {
    setIsLoadingGraphs(true);
    setError(null);

    try {
      setGraphs(await listSavedGraphs());
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Не удалось загрузить сохранённые графы",
      );
    } finally {
      setIsLoadingGraphs(false);
    }
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);

    if (storedUser) {
      void loadGraphs();
    }
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = professionTitle.trim();
    if (!title) {
      setError("Введите профессию");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const initialTechnologies = parseTechnologyList(initialTechnologiesInput);
      const graph = await createOrLoadGraph({
        professionTitle: title,
        initialTechnologies,
        forceRegenerate: initialTechnologies.length > 0,
        isMock,
      });
      navigate(`/graph/${graph.id}`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Не удалось создать граф",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setGraphs([]);
  };

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-slate-950">
        <section className="w-full max-w-md rounded-md border border-slate-200 bg-white px-6 py-6 shadow-sm">
          <div className="flex items-center gap-2">
            <GitBranch className="size-5 text-slate-700" />
            <h1 className="text-lg font-semibold">Навигатор навыков</h1>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Войдите, чтобы создавать графы профессий и возвращаться к сохранённым
            маршрутам обучения.
          </p>
          <Button onClick={handleYandexLogin} className="mt-5 w-full" size="lg">
            <LogIn />
            Войти через Яндекс ID
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <GitBranch className="size-5 text-slate-700" />
            <span className="text-lg font-semibold">Навигатор навыков</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to="/profile">
                <User />
                Профиль
              </Link>
            </Button>
            <Button type="button" variant="outline" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Search className="size-5 text-slate-700" />
            <h1 className="text-xl font-semibold">Создать граф</h1>
          </div>

          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Название вакансии или профессии
              <input
                value={professionTitle}
                onChange={(event) => setProfessionTitle(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-600"
                placeholder="Например, Frontend React developer"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Стартовые технологии
              <textarea
                value={initialTechnologiesInput}
                onChange={(event) => setInitialTechnologiesInput(event.target.value)}
                className="mt-1 min-h-24 w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-600"
                placeholder="Например: React, TypeScript, GraphQL"
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Можно через запятую или с новой строки.
              </span>
            </label>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isMock}
                  onChange={(event) => setIsMock(event.target.checked)}
                  className="size-4 accent-slate-900"
                />
                Mock API
              </label>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? <Loader2 className="animate-spin" /> : <Search />}
                Создать
              </Button>
            </div>
          </form>

          {error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </section>

        <section className="min-w-0 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Ваши графы</h2>
              <p className="mt-1 text-sm text-slate-500">
                Открываются по адресу `/graph/:graphId`.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={isLoadingGraphs}
              onClick={() => void loadGraphs()}
            >
              <RefreshCw className={isLoadingGraphs ? "animate-spin" : undefined} />
              Обновить
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {sortedGraphs.map((graph) => (
              <Link
                key={graph.id}
                to={`/graph/${graph.id}`}
                className="grid gap-2 rounded-md border border-slate-200 px-3 py-3 transition hover:border-slate-400 hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {graph.professionTitle}
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate-500">
                    {graph.id}
                  </span>
                </span>
                <span className="flex items-center gap-3 text-xs text-slate-500">
                  {formatDate(graph.updatedAt)}
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}

            {!isLoadingGraphs && !sortedGraphs.length && (
              <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">
                Пока нет сохранённых графов.
              </p>
            )}

            {isLoadingGraphs && (
              <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">
                <Loader2 className="animate-spin" />
                Загружаю список
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};
