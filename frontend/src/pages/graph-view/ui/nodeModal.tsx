import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Eye, Plus, Save, Trash2 } from "lucide-react";
import { useNodeModalStore } from "../services/nodeModalStore.context";
import { useGraphStore } from "../services/graphStore.context";
import type { Article } from "@/entities/article";
import type { Book } from "@/entities/book";
import type { Course } from "@/entities/course";
import type { MainSkill, Skill } from "@/entities/skill";
import { Badge } from "@/components/ui/badge";
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
  const isSkillNode = Boolean(selectedNode && typeof data.isCompleted === "boolean");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [learnHours, setLearnHours] = useState(0);
  const [priority, setPriority] = useState(3);
  const [isRequired, setIsRequired] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subgraphDepth, setSubgraphDepth] = useState(1);

  useEffect(() => {
    setTitle(data.title ?? "");
    setDescription(data.description ?? "");
    setLearnHours(data.learnHours ?? 0);
    setPriority(data.priority ?? 3);
    setIsRequired(data.isRequired ?? true);
    setIsCompleted(data.isCompleted ?? false);
    setArticles(cloneArticles(data.articles));
    setBooks(cloneBooks(data.books));
    setCourses(cloneCourses(data.courses));
  }, [
    data.articles,
    data.books,
    data.description,
    data.courses,
    data.isCompleted,
    data.isRequired,
    data.learnHours,
    data.priority,
    data.title,
  ]);

  const handleSave = () => {
    if (!selectedNode || !isSkillNode) {
      return;
    }

    void graphStore
      .updateNode(selectedNode.id, {
        title,
        description,
        learnHours,
        priority,
        isRequired,
        isCompleted,
        articles: sanitizeArticles(articles),
        books: sanitizeBooks(books),
        courses: sanitizeCourses(courses),
      })
      .then(() => nodeModalStore.close());
  };

  const handleDelete = () => {
    if (!selectedNode || !isSkillNode) {
      return;
    }

    void graphStore.deleteNode(selectedNode.id).then(() => nodeModalStore.close());
  };

  const handleSubgraph = () => {
    if (!selectedNode) {
      return;
    }

    void graphStore
      .showSubgraph(selectedNode.id, subgraphDepth)
      .then(() => nodeModalStore.close());
  };

  return (
    <Dialog
      open={nodeModalStore.isOpen}
      onOpenChange={(open) => {
        if (!open) {
          nodeModalStore.close();
        }
      }}
    >
      <DialogContent className="flex h-[86vh] max-h-[86vh] w-[92vw] max-w-none overflow-hidden border-slate-200 p-0 shadow-[0_24px_80px_-46px_rgba(15,23,42,0.6)]">
        <div className="grid min-h-0 flex-1 grid-cols-[360px_minmax(0,1fr)] bg-white">
          <aside className="flex min-h-0 flex-col border-r border-slate-200">
            <div className="border-b border-slate-200 px-6 py-5">
              <DialogTitle className="text-xl text-slate-900">
                {data.title ?? "Без названия"}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-slate-600">
                {isSkillNode
                  ? "Изменения узла и его ресурсов сохраняются через backend GraphQL."
                  : "Главный узел описывает выбранную профессию."}
              </DialogDescription>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {isSkillNode ? (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Название
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Описание
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className="mt-1 min-h-28 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Часы
                      <input
                        type="number"
                        min="0"
                        value={learnHours}
                        onChange={(event) =>
                          setLearnHours(Number(event.target.value))
                        }
                        className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Приоритет
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={priority}
                        onChange={(event) => setPriority(Number(event.target.value))}
                        className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isRequired}
                        onChange={(event) => setIsRequired(event.target.checked)}
                        className="size-4 accent-slate-900"
                      />
                      Обязательный
                    </label>
                    <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={(event) => setIsCompleted(event.target.checked)}
                        className="size-4 accent-emerald-600"
                      />
                      Изучен
                    </label>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  {data.description || "Описание профессии пока не добавлено."}
                </p>
              )}

              <div className="mt-6 rounded-md border border-slate-200 p-3">
                <label className="block text-sm font-medium text-slate-700">
                  Глубина подграфа: {subgraphDepth}
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={subgraphDepth}
                    onChange={(event) => setSubgraphDepth(Number(event.target.value))}
                    className="mt-2 w-full accent-slate-900"
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={handleSubgraph}
                >
                  <Eye />
                  Показать окружение
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
              {isSkillNode && (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={graphStore.isEditing}
                  >
                    <Trash2 />
                    Удалить
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={graphStore.isEditing}
                  >
                    <Save />
                    Сохранить
                  </Button>
                </>
              )}
              <DialogClose asChild>
                <Button variant="secondary">Закрыть</Button>
              </DialogClose>
            </div>
          </aside>

          <div className="flex min-h-0 flex-col overflow-hidden text-sm text-slate-700">
            <div className="border-b border-slate-200 px-7 py-4">
              <div className="flex flex-wrap gap-2">
              {isSkillNode && (
                <>
                  <Badge variant={data.isCompleted ? "default" : "secondary"}>
                    {data.isCompleted ? "Изучен" : "В работе"}
                  </Badge>
                  <Badge variant="outline">{data.learnHours ?? 0} ч</Badge>
                  <Badge variant="outline">Приоритет {data.priority ?? 0}</Badge>
                </>
              )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-7 py-6">
            {isSkillNode ? (
              <div className="grid gap-4">
                <EditableResourceSection
                  title="Статьи"
                  empty="Пока нет статей."
                  addLabel="Добавить статью"
                  onAdd={() => setArticles((current) => [...current, createEmptyArticle()])}
                >
                  {articles.map((article, index) => (
                    <ArticleEditorCard
                      key={article.id}
                      article={article}
                      onChange={(next) =>
                        setArticles((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? next : item,
                          ),
                        )
                      }
                      onDelete={() =>
                        setArticles((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    />
                  ))}
                </EditableResourceSection>

                <EditableResourceSection
                  title="Книги"
                  empty="Пока нет книг."
                  addLabel="Добавить книгу"
                  onAdd={() => setBooks((current) => [...current, createEmptyBook()])}
                >
                  {books.map((book, index) => (
                    <BookEditorCard
                      key={book.id}
                      book={book}
                      onChange={(next) =>
                        setBooks((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? next : item,
                          ),
                        )
                      }
                      onDelete={() =>
                        setBooks((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    />
                  ))}
                </EditableResourceSection>

                <EditableResourceSection
                  title="Курсы"
                  empty="Пока нет курсов."
                  addLabel="Добавить курс"
                  onAdd={() => setCourses((current) => [...current, createEmptyCourse()])}
                >
                  {courses.map((course, index) => (
                    <CourseEditorCard
                      key={course.id}
                      course={course}
                      onChange={(next) =>
                        setCourses((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? next : item,
                          ),
                        )
                      }
                      onDelete={() =>
                        setCourses((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    />
                  ))}
                </EditableResourceSection>
              </div>
            ) : (
              <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Редактирование ресурсов доступно для узлов навыков.
              </p>
            )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

function EditableResourceSection({
  title,
  empty,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  empty: string;
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children];
  const hasItems = items.some(Boolean);

  return (
    <section className="min-h-0 rounded-md border border-slate-200 bg-slate-50/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus />
          {addLabel}
        </Button>
      </div>
      <div className="mt-3 grid max-h-[46vh] gap-3 overflow-y-auto overscroll-contain pr-1">
        {hasItems ? items : <p className="text-sm text-slate-500">{empty}</p>}
      </div>
    </section>
  );
}

function ArticleEditorCard({
  article,
  onChange,
  onDelete,
}: {
  article: Article;
  onChange: (article: Article) => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <label className="block flex-1 text-sm font-medium text-slate-700">
          Заголовок
          <input
            value={article.title}
            onChange={(event) => onChange({ ...article, title: event.target.value })}
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
            placeholder="Название статьи"
          />
        </label>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label="Удалить статью"
        >
          <Trash2 />
        </Button>
      </div>

      <div className="mt-3 grid gap-3">
        <label className="block text-sm font-medium text-slate-700">
          Ссылка
          <input
            value={article.link}
            onChange={(event) => onChange({ ...article, link: event.target.value })}
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
            placeholder="https://..."
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Описание
          <textarea
            value={article.description}
            onChange={(event) =>
              onChange({ ...article, description: event.target.value })
            }
            className="mt-1 min-h-24 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-slate-700">
            Рейтинг
            <input
              type="number"
              step="0.1"
              min="0"
              value={article.rating}
              onChange={(event) =>
                onChange({ ...article, rating: Number(event.target.value) })
              }
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Теги
            <input
              value={article.tags.join(", ")}
              onChange={(event) =>
                onChange({
                  ...article,
                  tags: splitTags(event.target.value),
                })
              }
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
              placeholder="React, TypeScript"
            />
          </label>
        </div>
      </div>
    </article>
  );
}

function BookEditorCard({
  book,
  onChange,
  onDelete,
}: {
  book: Book;
  onChange: (book: Book) => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <label className="block flex-1 text-sm font-medium text-slate-700">
          Заголовок
          <input
            value={book.title}
            onChange={(event) => onChange({ ...book, title: event.target.value })}
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
            placeholder="Название книги"
          />
        </label>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label="Удалить книгу"
        >
          <Trash2 />
        </Button>
      </div>

      <div className="mt-3 grid gap-3">
        <label className="block text-sm font-medium text-slate-700">
          Автор
          <input
            value={book.author}
            onChange={(event) => onChange({ ...book, author: event.target.value })}
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
            placeholder="Автор"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Ссылка
          <input
            value={book.link}
            onChange={(event) => onChange({ ...book, link: event.target.value })}
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
            placeholder="https://..."
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Изображение
          <input
            value={book.image ?? ""}
            onChange={(event) =>
              onChange({ ...book, image: event.target.value.trim() || undefined })
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
            placeholder="https://..."
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Описание
          <textarea
            value={book.description}
            onChange={(event) => onChange({ ...book, description: event.target.value })}
            className="mt-1 min-h-24 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
          />
        </label>
      </div>
    </article>
  );
}

function CourseEditorCard({
  course,
  onChange,
  onDelete,
}: {
  course: Course;
  onChange: (course: Course) => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <label className="block flex-1 text-sm font-medium text-slate-700">
          Заголовок
          <input
            value={course.title}
            onChange={(event) => onChange({ ...course, title: event.target.value })}
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
            placeholder="Название курса"
          />
        </label>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label="Удалить курс"
        >
          <Trash2 />
        </Button>
      </div>

      <div className="mt-3 grid gap-3">
        <label className="block text-sm font-medium text-slate-700">
          Ссылка
          <input
            value={course.link}
            onChange={(event) => onChange({ ...course, link: event.target.value })}
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
            placeholder="https://..."
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Изображение
          <input
            value={course.image ?? ""}
            onChange={(event) =>
              onChange({ ...course, image: event.target.value.trim() || undefined })
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
            placeholder="https://..."
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Описание
          <textarea
            value={course.description}
            onChange={(event) =>
              onChange({ ...course, description: event.target.value })
            }
            className="mt-1 min-h-24 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
          />
        </label>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <label className="block text-sm font-medium text-slate-700">
            Мин. часы
            <input
              type="number"
              min="0"
              value={course.learningTimeInfo.minHours}
              onChange={(event) =>
                onChange({
                  ...course,
                  learningTimeInfo: {
                    ...course.learningTimeInfo,
                    minHours: Number(event.target.value),
                  },
                })
              }
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Сред. часы
            <input
              type="number"
              min="0"
              value={course.learningTimeInfo.avgHours}
              onChange={(event) =>
                onChange({
                  ...course,
                  learningTimeInfo: {
                    ...course.learningTimeInfo,
                    avgHours: Number(event.target.value),
                  },
                })
              }
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Макс. часы
            <input
              type="number"
              min="0"
              value={course.learningTimeInfo.maxHours}
              onChange={(event) =>
                onChange({
                  ...course,
                  learningTimeInfo: {
                    ...course.learningTimeInfo,
                    maxHours: Number(event.target.value),
                  },
                })
              }
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Курсов
            <input
              type="number"
              min="0"
              value={course.learningTimeInfo.coursesAnalyzed}
              onChange={(event) =>
                onChange({
                  ...course,
                  learningTimeInfo: {
                    ...course.learningTimeInfo,
                    coursesAnalyzed: Number(event.target.value),
                  },
                })
              }
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-600"
            />
          </label>
        </div>
      </div>
    </article>
  );
}

function cloneArticles(articles?: Article[]): Article[] {
  return (articles ?? []).map((article) => ({
    ...article,
    tags: [...(article.tags ?? [])],
  }));
}

function cloneBooks(books?: Book[]): Book[] {
  return (books ?? []).map((book) => ({ ...book }));
}

function cloneCourses(courses?: Course[]): Course[] {
  return (courses ?? []).map((course) => ({
    ...course,
    learningTimeInfo: {
      minHours: course.learningTimeInfo?.minHours ?? 0,
      avgHours: course.learningTimeInfo?.avgHours ?? 0,
      maxHours: course.learningTimeInfo?.maxHours ?? 0,
      coursesAnalyzed: course.learningTimeInfo?.coursesAnalyzed ?? 0,
    },
  }));
}

function createEmptyArticle(): Article {
  return {
    id: createLocalId("article"),
    title: "",
    description: "",
    link: "",
    rating: 0,
    tags: [],
  };
}

function createEmptyBook(): Book {
  return {
    id: createLocalId("book"),
    title: "",
    author: "",
    description: "",
    link: "",
    image: undefined,
  };
}

function createEmptyCourse(): Course {
  return {
    id: createLocalId("course"),
    title: "",
    description: "",
    learningTimeInfo: {
      minHours: 0,
      avgHours: 0,
      maxHours: 0,
      coursesAnalyzed: 0,
    },
    link: "",
    image: undefined,
  };
}

function sanitizeArticles(articles: Article[]): Article[] {
  return articles
    .map((article) => ({
      ...article,
      title: article.title.trim(),
      description: article.description.trim(),
      link: article.link.trim(),
      tags: article.tags.map((tag) => tag.trim()).filter(Boolean),
      rating: Number.isFinite(article.rating) ? article.rating : 0,
    }))
    .filter(
      (article) =>
        Boolean(article.title) ||
        Boolean(article.description) ||
        Boolean(article.link) ||
        article.tags.length > 0 ||
        article.rating !== 0,
    );
}

function sanitizeBooks(books: Book[]): Book[] {
  return books
    .map((book) => ({
      ...book,
      title: book.title.trim(),
      author: book.author.trim(),
      description: book.description.trim(),
      link: book.link.trim(),
      image: book.image?.trim() || undefined,
    }))
    .filter(
      (book) =>
        Boolean(book.title) ||
        Boolean(book.author) ||
        Boolean(book.description) ||
        Boolean(book.link) ||
        Boolean(book.image),
    );
}

function sanitizeCourses(courses: Course[]): Course[] {
  return courses
    .map((course) => ({
      ...course,
      title: course.title.trim(),
      description: course.description.trim(),
      link: course.link.trim(),
      image: course.image?.trim() || undefined,
      learningTimeInfo: {
        minHours: course.learningTimeInfo.minHours,
        avgHours: course.learningTimeInfo.avgHours,
        maxHours: course.learningTimeInfo.maxHours,
        coursesAnalyzed: course.learningTimeInfo.coursesAnalyzed,
      },
    }))
    .filter(
      (course) =>
        Boolean(course.title) ||
        Boolean(course.description) ||
        Boolean(course.link) ||
        Boolean(course.image) ||
        course.learningTimeInfo.minHours !== 0 ||
        course.learningTimeInfo.avgHours !== 0 ||
        course.learningTimeInfo.maxHours !== 0 ||
        course.learningTimeInfo.coursesAnalyzed !== 0,
    );
}

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function createLocalId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
