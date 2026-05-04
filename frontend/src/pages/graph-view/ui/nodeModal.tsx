import { observer } from "mobx-react-lite";
import { useNodeModalStore } from "../services/nodeModalStore.context";
import { useGraphStore } from "../services/graphStore.context";
import type { MainSkill, Skill } from "@/entities/skill";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type NodeModalData = Partial<Skill & MainSkill>;

export const NodeModal = observer(() => {
  const nodeModalStore = useNodeModalStore();
  const graphStore = useGraphStore();

  const selectedNode = nodeModalStore.selectedNode;
  const data = (selectedNode?.data ?? {}) as NodeModalData;
  const canUpdateProgress = typeof data.isCompleted === "boolean" && selectedNode;

  return (
    <Dialog
      open={nodeModalStore.isOpen}
      onOpenChange={(open) => {
        if (!open) {
          nodeModalStore.close();
        }
      }}
    >
      <DialogContent className="h-[80vh] w-[90vw] max-w-none overflow-x-hidden border-blue-100/70 p-0 shadow-[0_20px_70px_-40px_rgba(30,64,175,0.35)]">
        <div className="flex h-full flex-col bg-white">
          <div className="border-b border-blue-100/70 px-8 pb-5 pt-7">
            <DialogTitle className="text-2xl text-slate-900">
              {data.title ?? "Без названия"}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-slate-600">
              {data.description ?? "Описание пока не добавлено."}
            </DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 text-sm text-slate-700">
            <div className="flex flex-col gap-4">
              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <h3 className="text-xs uppercase tracking-[0.18em] text-blue-700">
                  Статьи
                </h3>
                {data.articles?.length ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {data.articles.map((article) => (
                      <div
                        key={article.id}
                        className="rounded-lg border border-slate-200 bg-white p-3 text-slate-700"
                      >
                        <p className="text-xs text-slate-900">
                          {article.title}
                        </p>
                        {article.description && (
                          <p className="mt-1 text-[11px] text-slate-600">
                            {article.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-blue-700/80">
                          {article.rating && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5">
                              Рейтинг: {article.rating}
                            </span>
                          )}
                          {article.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-blue-50 px-2 py-0.5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {article.link && (
                          <p className="mt-2 text-[11px] text-blue-700">
                            {article.link}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Пока нет доступных статей.
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <h3 className="text-xs uppercase tracking-[0.18em] text-blue-700">
                  Книги
                </h3>
                {data.books?.length ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {data.books.map((book) => (
                      <div
                        key={book.id}
                        className="rounded-lg border border-slate-200 bg-white p-3 text-slate-700"
                      >
                        <p className="text-xs text-slate-900">{book.title}</p>
                        {book.description && (
                          <p className="mt-1 text-[11px] text-slate-600">
                            {book.description}
                          </p>
                        )}
                        {book.author && (
                          <p className="mt-2 text-[11px] text-slate-500">
                            Автор: {book.author}
                          </p>
                        )}
                        {book.link && (
                          <p className="mt-2 text-[11px] text-blue-700">
                            {book.link}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Пока нет доступных книг.
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <h3 className="text-xs uppercase tracking-[0.18em] text-blue-700">
                  Курсы
                </h3>
                {data.courses?.length ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {data.courses.map((course) => (
                      <div
                        key={course.id}
                        className="rounded-lg border border-slate-200 bg-white p-3 text-slate-700"
                      >
                        <p className="text-xs text-slate-900">{course.title}</p>
                        {course.description && (
                          <p className="mt-1 text-[11px] text-slate-600">
                            {course.description}
                          </p>
                        )}
                        {course.learningTimeInfo && (
                          <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                            <span>
                              Мин: {course.learningTimeInfo.minHours} ч
                            </span>
                            <span>
                              Средн: {course.learningTimeInfo.avgHours} ч
                            </span>
                            <span>
                              Макс: {course.learningTimeInfo.maxHours} ч
                            </span>
                            <span>
                              Проанализировано:{" "}
                              {course.learningTimeInfo.coursesAnalyzed}
                            </span>
                          </div>
                        )}
                        {course.link && (
                          <p className="mt-2 text-[11px] text-blue-700">
                            {course.link}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Пока нет доступных курсов.
                  </p>
                )}
              </section>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-blue-100/70 px-8 py-5">
            {canUpdateProgress && (
              <Button
                type="button"
                variant={data.isCompleted ? "outline" : "default"}
                onClick={() => {
                  void graphStore.updateNodeCompletion(
                    selectedNode.id,
                    !data.isCompleted,
                  ).then(() => nodeModalStore.close());
                }}
              >
                {data.isCompleted ? "Снять отметку" : "Отметить изученным"}
              </Button>
            )}
            <DialogClose asChild>
              <Button
                variant="secondary"
                className="border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                Закрыть
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
