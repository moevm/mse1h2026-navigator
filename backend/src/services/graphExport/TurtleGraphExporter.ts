import type { Article, Book, Course, Skill } from "@prisma/client";
import type { GraphResponse } from "../graphEditing/types";
import {
  articleUri,
  bookUri,
  courseUri,
  createGraphExportContext,
  escapeUri,
  skillUri,
  ttlBoolean,
  ttlDouble,
  ttlInteger,
  ttlString,
} from "./helpers";
import type {
  ExportableGraph,
  GraphExportContext,
  GraphExportNamespaces,
} from "./types";

export class TurtleGraphExporter {
  constructor(private readonly namespaces: GraphExportNamespaces) {}

  export(graph: GraphResponse | ExportableGraph): string {
    const context = createGraphExportContext(graph, this.namespaces);
    const parts = [
      ...this.renderPrefixes(),
      ...this.renderGraph(graph, context.graphUri, context.mainSkillUri),
      this.renderMainSkill(graph, context.mainSkillUri),
      ...this.renderMainSkillEdges(graph, context),
      ...graph.nodes.flatMap((node) => this.renderSkill(graph, node, context)),
      ...this.renderResources(graph),
    ];

    return `${parts.join("\n")}\n`;
  }

  private renderPrefixes(): string[] {
    return [
      `@prefix nav: <${this.namespaces.nav}> .`,
      `@prefix rdf: <${this.namespaces.rdf}> .`,
      `@prefix rdfs: <${this.namespaces.rdfs}> .`,
      `@prefix dcterms: <${this.namespaces.dcterms}> .`,
      `@prefix owl: <${this.namespaces.owl}> .`,
      `@prefix xsd: <${this.namespaces.xsd}> .`,
      "",
    ];
  }

  private renderGraph(
    graph: GraphResponse | ExportableGraph,
    graphUri: string,
    mainSkillUri: string
  ): string[] {
    return [
      `<${graphUri}> a owl:Ontology, nav:SkillGraph ;`,
      `  rdfs:label ${ttlString(graph.professionTitle)} ;`,
      `  nav:hasMainSkill <${mainSkillUri}>${graph.nodes.length ? " ;" : " ."}`,
      ...graph.nodes.map((node, index) => {
        const suffix = index === graph.nodes.length - 1 ? " ." : " ;";
        return `  nav:hasSkill <${skillUri(this.namespaces, graph.id, node.id)}>${suffix}`;
      }),
    ];
  }

  private renderMainSkill(
    graph: GraphResponse | ExportableGraph,
    mainSkillUri: string
  ): string {
    return [
      "",
      `<${mainSkillUri}> a nav:MainSkill ;`,
      `  rdfs:label ${ttlString(graph.mainSkill.title)} ;`,
      `  dcterms:description ${ttlString(graph.mainSkill.description)} .`,
    ].join("\n");
  }

  private renderMainSkillEdges(
    graph: GraphResponse | ExportableGraph,
    context: GraphExportContext
  ): string[] {
    return graph.edges
      .filter(
        (edge) => edge.fromId === graph.mainSkill.id && context.skillById.has(edge.toId)
      )
      .map(
        (edge) =>
          `<${context.mainSkillUri}> nav:requires <${skillUri(
            this.namespaces,
            graph.id,
            edge.toId
          )}> .`
      );
  }

  private renderSkill(
    graph: GraphResponse | ExportableGraph,
    node: Skill,
    context: GraphExportContext
  ): string[] {
    const nodeUri = skillUri(this.namespaces, graph.id, node.id);
    return [
      "",
      `<${nodeUri}> a nav:Skill ;`,
      `  rdfs:label ${ttlString(node.title)} ;`,
      `  dcterms:description ${ttlString(node.description)} ;`,
      `  nav:isCompleted ${ttlBoolean(node.isCompleted)} ;`,
      `  nav:isRequired ${ttlBoolean(node.isRequired)} ;`,
      `  nav:isArchieved ${ttlBoolean(node.isArchieved)} ;`,
      `  nav:priority ${ttlInteger(node.priority)} ;`,
      `  nav:learnHours ${ttlInteger(node.learnHours)} .`,
      ...node.courses.map(
        (course) =>
          `<${nodeUri}> nav:hasCourse <${courseUri(
            this.namespaces,
            graph.id,
            course.id
          )}> .`
      ),
      ...node.books.map(
        (book) =>
          `<${nodeUri}> nav:hasBook <${bookUri(
            this.namespaces,
            graph.id,
            book.id
          )}> .`
      ),
      ...node.articles.map(
        (article) =>
          `<${nodeUri}> nav:hasArticle <${articleUri(
            this.namespaces,
            graph.id,
            article.id
          )}> .`
      ),
      ...this.renderNodeEdges(graph, node, nodeUri, context),
    ];
  }

  private renderNodeEdges(
    graph: GraphResponse | ExportableGraph,
    node: Skill,
    nodeUri: string,
    context: GraphExportContext
  ): string[] {
    return graph.edges
      .filter((edge) => edge.fromId === node.id)
      .flatMap((edge) => {
        const targetUri = this.resolveSkillTargetUri(graph, edge.toId, context);
        return targetUri ? [`<${nodeUri}> nav:dependsOn <${targetUri}> .`] : [];
      });
  }

  private renderResources(graph: GraphResponse | ExportableGraph): string[] {
    return graph.nodes.flatMap((node) => [
      ...node.courses.map((course) => this.renderCourse(graph.id, course)),
      ...node.books.map((book) => this.renderBook(graph.id, book)),
      ...node.articles.map((article) => this.renderArticle(graph.id, article)),
    ]);
  }

  private renderCourse(graphId: string, course: Course): string {
    const lines = [
      "",
      `<${courseUri(this.namespaces, graphId, course.id)}> a nav:Course ;`,
      `  rdfs:label ${ttlString(course.title)} ;`,
      `  dcterms:description ${ttlString(course.description)} ;`,
      `  nav:link <${escapeUri(course.link)}>${
        course.image || course.learningTimeInfo ? " ;" : " ."
      }`,
    ];

    if (course.image) {
      lines.push(
        `  nav:image <${escapeUri(course.image)}>${
          course.learningTimeInfo ? " ;" : " ."
        }`
      );
    }
    if (course.learningTimeInfo) {
      lines.push(
        `  nav:minHours ${ttlInteger(course.learningTimeInfo.minHours)} ;`,
        `  nav:avgHours ${ttlInteger(course.learningTimeInfo.avgHours)} ;`,
        `  nav:maxHours ${ttlInteger(course.learningTimeInfo.maxHours)} ;`,
        `  nav:coursesAnalyzed ${ttlInteger(
          course.learningTimeInfo.coursesAnalyzed
        )} .`
      );
    }

    return lines.join("\n");
  }

  private renderBook(graphId: string, book: Book): string {
    return [
      "",
      `<${bookUri(this.namespaces, graphId, book.id)}> a nav:Book ;`,
      `  rdfs:label ${ttlString(book.title)} ;`,
      `  dcterms:creator ${ttlString(book.author)} ;`,
      `  dcterms:description ${ttlString(book.description)} ;`,
      `  nav:link <${escapeUri(book.link)}>${book.image ? " ;" : " ."}`,
      ...(book.image ? [`  nav:image <${escapeUri(book.image)}> .`] : []),
    ].join("\n");
  }

  private renderArticle(graphId: string, article: Article): string {
    return [
      "",
      `<${articleUri(this.namespaces, graphId, article.id)}> a nav:Article ;`,
      `  rdfs:label ${ttlString(article.title)} ;`,
      `  dcterms:description ${ttlString(article.description)} ;`,
      `  nav:link <${escapeUri(article.link)}> ;`,
      `  nav:rating ${ttlDouble(article.rating)}${
        article.tags.length ? " ;" : " ."
      }`,
      ...article.tags.map((tag, index) => {
        const suffix = index === article.tags.length - 1 ? " ." : " ;";
        return `  nav:tag ${ttlString(tag)}${suffix}`;
      }),
    ].join("\n");
  }

  private resolveSkillTargetUri(
    graph: GraphResponse | ExportableGraph,
    targetId: string,
    context: GraphExportContext
  ): string | null {
    if (targetId === graph.mainSkill.id) {
      return context.mainSkillUri;
    }

    return context.skillById.has(targetId)
      ? skillUri(this.namespaces, graph.id, targetId)
      : null;
  }
}
