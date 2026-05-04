import React, { useEffect, useRef, useState } from "react";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import { GraphProxy } from "../graph-view/api/graphProxy";

type GraphResource = {
  title: string;
  url?: string;
  description?: string;
};

type ReportSkill = {
  id: string;
  title: string;
  description?: string;
  learnHours?: number;
  priority?: number;
  articles: GraphResource[];
  books: GraphResource[];
  courses: GraphResource[];
  parentTitles: string[];
  ancestorTitles: string[];
};

type ReportPlan = {
  profession: string;
  skills: ReportSkill[];
  prelimSkills: string[];
};

const collator = new Intl.Collator("ru", { numeric: true, sensitivity: "base" });

const getNodeWeight = (node: any) => {
  const dataId = node?.data?.id;
  if (typeof dataId === "number") return String(dataId);
  if (typeof dataId === "string" && dataId.trim().length > 0) return dataId;
  return node.id;
};

const compareByWeight = (a: string, b: string) => collator.compare(a, b);

const formatHours = (hours?: number) => (typeof hours === "number" ? `${hours} ч` : "—");

const uniqueSorted = (values: string[]) => Array.from(new Set(values)).sort((left, right) => collator.compare(left, right));

const mapGraphResources = (items: any[] | undefined): GraphResource[] =>
  (items ?? []).map((item) => ({
    title: item.title,
    url: item.link,
    description: item.description,
  }));

const buttonLinkClass =
  "inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-900/10";

const tagClass = "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700";

const panelClass = "rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]";

const CYRILLIC_FONT_NAME = "DejaVuSans";
const CYRILLIC_FONT_FILE = "DejaVuSans.ttf";

let cyrillicFontPromise: Promise<string> | null = null;

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
};

const loadCyrillicFont = async () => {
  if (!cyrillicFontPromise) {
    cyrillicFontPromise = fetch("/fonts/DejaVuSans.ttf")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load font: ${response.status}`);
        }

        return response.arrayBuffer();
      })
      .then((buffer) => arrayBufferToBase64(buffer));
  }

  return cyrillicFontPromise;
};

export const ReportPage: React.FC = () => {
  const [plan, setPlan] = useState<ReportPlan | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const { mainSkill, nodes, edges } = await GraphProxy.getGraphInfo();

      const nodeById = new Map<string, any>();
      nodes.forEach((node: any) => nodeById.set(node.id, node));

      const parentMap = new Map<string, string[]>();
      nodes.forEach((node: any) => parentMap.set(node.id, []));

      edges.forEach((edge: any) => {
        const currentParents = parentMap.get(edge.toId) ?? [];
        currentParents.push(edge.fromId);
        parentMap.set(edge.toId, currentParents);
      });

      const collectAncestors = (nodeId: string, visited = new Set<string>()): string[] => {
        const directParents = parentMap.get(nodeId) ?? [];
        const collected: string[] = [];

        for (const parentId of directParents) {
          if (visited.has(parentId)) {
            continue;
          }

          visited.add(parentId);
          collected.push(parentId);
          collected.push(...collectAncestors(parentId, visited));
        }

        return collected;
      };

      const graphSkills = nodes.map((node: any) => {
        const ancestorIds = uniqueSorted(collectAncestors(node.id));
        const ancestorTitles = ancestorIds
          .map((id) => nodeById.get(id)?.title)
          .filter((title): title is string => Boolean(title));

        return {
          id: node.id,
          title: node.title,
          description: node.description,
          learnHours: node.learnHours,
          priority: node.priority,
          articles: mapGraphResources(node.articles),
          books: mapGraphResources(node.books),
          courses: mapGraphResources(node.courses),
          parentTitles: uniqueSorted(
            (parentMap.get(node.id) ?? [])
              .map((id) => nodeById.get(id)?.title)
              .filter((title): title is string => Boolean(title)),
          ),
          ancestorTitles: uniqueSorted(ancestorTitles),
        } satisfies ReportSkill;
      });

      const skillById = new Map(graphSkills.map((skill) => [skill.id, skill]));

      const orderedSkills = [...nodes]
        .sort((left: any, right: any) => compareByWeight(getNodeWeight(left), getNodeWeight(right)))
        .map((node: any) => skillById.get(node.id)!)
        .filter(Boolean);

      const prelimSkills = uniqueSorted(orderedSkills.flatMap((skill) => skill.parentTitles));

      setPlan({
        profession: mainSkill.title,
        skills: orderedSkills,
        prelimSkills,
      });
    })();
  }, []);

  const downloadMarkdown = () => {
    if (!plan) return;

    let markdown = `# Учебный план — ${plan.profession}\n\n`;
    markdown += `## Навыки (порядок по весу узлов на графе)\n\n`;

    plan.skills.forEach((skill, index) => {
      markdown += `${index + 1}. **${skill.title}** — Оценочное время: ${formatHours(skill.learnHours)}\n`;
      if (skill.description) markdown += `   - Описание: ${skill.description}\n`;
      if (skill.parentTitles.length) markdown += `   - Предварительные навыки: ${skill.parentTitles.join(", ")}\n`;
      if (skill.articles.length) {
        markdown += `   - Статьи:\n`;
        skill.articles.forEach((resource) => {
          markdown += `     - ${resource.title}${resource.url ? ` — ${resource.url}` : ""}${resource.description ? ` — ${resource.description}` : ""}\n`;
        });
      }
      if (skill.books.length) {
        markdown += `   - Книги:\n`;
        skill.books.forEach((resource) => {
          markdown += `     - ${resource.title}${resource.url ? ` — ${resource.url}` : ""}${resource.description ? ` — ${resource.description}` : ""}\n`;
        });
      }
      if (skill.courses.length) {
        markdown += `   - Курсы:\n`;
        skill.courses.forEach((resource) => {
          markdown += `     - ${resource.title}${resource.url ? ` — ${resource.url}` : ""}${resource.description ? ` — ${resource.description}` : ""}\n`;
        });
      }
    });

    

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    saveAs(blob, `${plan.profession.replace(/\s+/g, "_")}_plan.md`);
  };

  const exportPdf = async () => {
    if (!plan) return;

    setIsExportingPdf(true);
    setExportError(null);

    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const fontBase64 = await loadCyrillicFont();
      pdf.addFileToVFS(CYRILLIC_FONT_FILE, fontBase64);
      pdf.addFont(CYRILLIC_FONT_FILE, CYRILLIC_FONT_NAME, "normal");
      pdf.addFont(CYRILLIC_FONT_FILE, CYRILLIC_FONT_NAME, "bold");
      pdf.setFont(CYRILLIC_FONT_NAME, "normal");

      const marginX = 40;
      const marginTop = 42;
      const marginBottom = 40;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - marginX * 2;
      const lineHeight = 15;
      let cursorY = marginTop;

      const ensureSpace = (neededHeight: number) => {
        if (cursorY + neededHeight <= pageHeight - marginBottom) {
          return;
        }

        pdf.addPage();
        cursorY = marginTop;
      };

      const writeWrapped = (text: string, options?: { size?: number; bold?: boolean; indent?: number }) => {
        const size = options?.size ?? 11;
        const indent = options?.indent ?? 0;
        pdf.setFont(CYRILLIC_FONT_NAME, options?.bold ? "bold" : "normal");
        pdf.setFontSize(size);

        const lines = pdf.splitTextToSize(text, contentWidth - indent);

        lines.forEach((line: string) => {
          ensureSpace(lineHeight + 2);
          pdf.text(line, marginX + indent, cursorY);
          cursorY += lineHeight;
        });

        cursorY += 2;
      };

      const writeSpacer = (height = 6) => {
        ensureSpace(height);
        cursorY += height;
      };

      writeWrapped(`Учебный план — ${plan.profession}`, { size: 18, bold: true });
      writeWrapped("Навыки в порядке по весу узлов графа", { size: 11 });
      writeSpacer(8);

      plan.skills.forEach((skill, index) => {
        ensureSpace(40);
        writeWrapped(`${index + 1}. ${skill.title}`, { size: 13, bold: true });
        writeWrapped(`Оценочное время: ${formatHours(skill.learnHours)}`, { size: 10 });

        if (skill.description) {
          writeWrapped(`Описание: ${skill.description}`, { size: 10, indent: 10 });
        }

        if (skill.ancestorTitles.length) {
          writeWrapped(`Предварительные навыки: ${skill.ancestorTitles.join(", ")}`, {
            size: 10,
            indent: 10,
          });
        }

        const writeResourceGroup = (label: string, resources: GraphResource[]) => {
          if (!resources.length) return;

          writeWrapped(`${label}:`, { size: 10, bold: true, indent: 10 });
          resources.forEach((resource) => {
            const resourceText = resource.url ? `${resource.title} (${resource.url})` : resource.title;
            writeWrapped(`• ${resourceText}${resource.description ? ` — ${resource.description}` : ""}`, {
              size: 10,
              indent: 20,
            });
          });
        };

        writeResourceGroup("Статьи", skill.articles);
        writeResourceGroup("Книги", skill.books);
        writeResourceGroup("Курсы", skill.courses);

        writeSpacer(6);
      });

      

      pdf.save(`${plan.profession.replace(/\s+/g, "_")}_plan.pdf`);
    } catch (error) {
      console.error("PDF export failed", error);
      setExportError("Не удалось сформировать PDF. Попробуйте ещё раз или скачайте Markdown.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.98),_rgba(226,232,240,0.72))] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-3xl border border-slate-200 bg-slate-950 px-6 py-6 text-white shadow-[0_25px_80px_-40px_rgba(15,23,42,0.7)] md:flex md:items-end md:justify-between md:gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-200">
              Отчёт по учебному графу
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Учебный план</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
                Отчёт построен по данным графа. Порядок навыков совпадает с весом узлов на странице /graph,
                а предшественники отображаются как все родительские узлы, собранные по транзитивному замыканию.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
            <button
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={downloadMarkdown}
              disabled={!plan}
            >
              Скачать Markdown
            </button>
            <button
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={exportPdf}
              disabled={!plan}
            >
              Скачать PDF
            </button>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
          <main ref={previewRef} className={`${panelClass} overflow-hidden`}>
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Предпросмотр</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">{plan?.profession ?? "Загрузка..."}</h2>
                </div>
              </div>
            </div>

            <div className="p-6">
              {!plan ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-sm text-slate-500">
                  Загружаем данные графа...
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Целевая профессия</div>
                      <div className="mt-2 text-lg font-semibold text-slate-950">{plan.profession}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Навыков</div>
                      <div className="mt-2 text-lg font-semibold text-slate-950">{plan.skills.length}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Предварительных</div>
                      <div className="mt-2 text-lg font-semibold text-slate-950">{plan.prelimSkills.length}</div>
                    </div>
                  </div>

                  <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">Навыки</h3>
                        <p className="text-sm text-slate-500">Порядок соответствует весам узлов графа.</p>
                      </div>
                      <span className={tagClass}>graph-weight order</span>
                    </div>

                    <ol className="space-y-4">
                      {plan.skills.map((skill, index) => (
                        <li key={skill.id} className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={tagClass}>{String(index + 1).padStart(2, "0")}</span>
                                <h4 className="text-lg font-semibold text-slate-950">{skill.title}</h4>
                              </div>
                              {skill.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{skill.description}</p> : null}
                            </div>

                            
                          </div>

                          <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Предварительные навыки</div>
                              {skill.ancestorTitles.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {skill.ancestorTitles.map((ancestorTitle) => (
                                    <span key={ancestorTitle} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
                                      {ancestorTitle}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-2 text-sm text-slate-500">Нет предшествующих навыков.</p>
                              )}
                            </div>

                            <div className="grid gap-4">
                              <div className="rounded-2xl bg-slate-50 p-4">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Статьи</div>
                                {skill.articles.length ? (
                                  <div className="mt-3 flex flex-col gap-2">
                                    {skill.articles.map((resource) => (
                                      <div key={`${skill.id}-article-${resource.title}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                                        <div className="min-w-0">
                                          <div className="text-sm font-medium text-slate-900">{resource.title}</div>
                                          {resource.description ? <div className="mt-1 text-xs leading-5 text-slate-500">{resource.description}</div> : null}
                                        </div>
                                        {resource.url ? (
                                          <a className={buttonLinkClass} href={resource.url} target="_blank" rel="noreferrer">
                                            Открыть
                                          </a>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-2 text-sm text-slate-500">Статьи не указаны.</p>
                                )}
                              </div>

                              <div className="rounded-2xl bg-slate-50 p-4">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Книги</div>
                                {skill.books.length ? (
                                  <div className="mt-3 flex flex-col gap-2">
                                    {skill.books.map((resource) => (
                                      <div key={`${skill.id}-book-${resource.title}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                                        <div className="min-w-0">
                                          <div className="text-sm font-medium text-slate-900">{resource.title}</div>
                                          {resource.description ? <div className="mt-1 text-xs leading-5 text-slate-500">{resource.description}</div> : null}
                                        </div>
                                        {resource.url ? (
                                          <a className={buttonLinkClass} href={resource.url} target="_blank" rel="noreferrer">
                                            Открыть
                                          </a>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-2 text-sm text-slate-500">Книги не указаны.</p>
                                )}
                              </div>

                              <div className="rounded-2xl bg-slate-50 p-4">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Курсы</div>
                                {skill.courses.length ? (
                                  <div className="mt-3 flex flex-col gap-2">
                                    {skill.courses.map((resource) => (
                                      <div key={`${skill.id}-course-${resource.title}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                                        <div className="min-w-0">
                                          <div className="text-sm font-medium text-slate-900">{resource.title}</div>
                                          {resource.description ? <div className="mt-1 text-xs leading-5 text-slate-500">{resource.description}</div> : null}
                                        </div>
                                        {resource.url ? (
                                          <a className={buttonLinkClass} href={resource.url} target="_blank" rel="noreferrer">
                                            Открыть
                                          </a>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-2 text-sm text-slate-500">Курсы не указаны.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>

                  
                </div>
              )}
            </div>
          </main>

          <aside className={`${panelClass} p-6`}>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Экспорт</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950">Файлы отчёта</h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-600">
                  Markdown удобен для документации и code review. PDF сохраняет визуальную структуру страницы отчёта.
                </p>
              </div>

              <div className="grid gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={downloadMarkdown}
                  disabled={!plan}
                >
                  Скачать Markdown
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={exportPdf}
                  disabled={!plan || isExportingPdf}
                >
                  {isExportingPdf ? "Формирование PDF..." : "Скачать PDF"}
                </button>
              </div>

              {exportError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
                  {exportError}
                </div>
              ) : null}

            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;