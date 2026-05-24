import type { Article, Book, Course, Skill } from "@prisma/client";
import type { GraphResponse } from "../graphEditing/types";
import {
  articleUri,
  bookUri,
  courseUri,
  createGraphExportContext,
  renderTypedRdfXmlLiteral,
  skillUri,
  xmlAttr,
  xmlText,
} from "./helpers";
import type {
  ExportableGraph,
  GraphExportContext,
  GraphExportNamespaces,
} from "./types";

export class RdfXmlGraphExporter {
  constructor(private readonly namespaces: GraphExportNamespaces) {}

  export(graph: GraphResponse | ExportableGraph): string {
    const context = createGraphExportContext(graph, this.namespaces);
    const parts = [
      ...this.renderHeader(graph, context.graphUri, context.mainSkillUri),
      this.renderMainSkill(graph, context.mainSkillUri),
      ...graph.nodes.map((node) => this.renderSkill(graph, node, context)),
      ...this.renderMainSkillEdges(graph, context),
      ...this.renderResources(graph),
      "</rdf:RDF>",
    ];

    return `${parts.join("\n")}\n`;
  }

  private renderHeader(
    graph: GraphResponse | ExportableGraph,
    graphUri: string,
    mainSkillUri: string
  ): string[] {
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<rdf:RDF xmlns:rdf="${this.namespaces.rdf}" xmlns:rdfs="${this.namespaces.rdfs}" xmlns:dcterms="${this.namespaces.dcterms}" xmlns:owl="${this.namespaces.owl}" xmlns:xsd="${this.namespaces.xsd}" xmlns:nav="${this.namespaces.nav}">`,
      `  <owl:Ontology rdf:about="${xmlAttr(graphUri)}">`,
      `    <rdfs:label>${xmlText(graph.professionTitle)} skill graph</rdfs:label>`,
      "  </owl:Ontology>",
      `  <nav:SkillGraph rdf:about="${xmlAttr(graphUri)}">`,
      `    <rdfs:label>${xmlText(graph.professionTitle)}</rdfs:label>`,
      `    <nav:hasMainSkill rdf:resource="${xmlAttr(mainSkillUri)}"/>`,
      ...graph.nodes.map(
        (node) =>
          `    <nav:hasSkill rdf:resource="${xmlAttr(
            skillUri(this.namespaces, graph.id, node.id)
          )}"/>`
      ),
      "  </nav:SkillGraph>",
    ];
  }

  private renderMainSkill(
    graph: GraphResponse | ExportableGraph,
    mainSkillUri: string
  ): string {
    return [
      `  <nav:MainSkill rdf:about="${xmlAttr(mainSkillUri)}">`,
      `    <rdfs:label>${xmlText(graph.mainSkill.title)}</rdfs:label>`,
      `    <dcterms:description>${xmlText(
        graph.mainSkill.description
      )}</dcterms:description>`,
      "  </nav:MainSkill>",
    ].join("\n");
  }

  private renderSkill(
    graph: GraphResponse | ExportableGraph,
    node: Skill,
    context: GraphExportContext
  ): string {
    const nodeUri = skillUri(this.namespaces, graph.id, node.id);
    return [
      `  <nav:Skill rdf:about="${xmlAttr(nodeUri)}">`,
      `    <rdfs:label>${xmlText(node.title)}</rdfs:label>`,
      `    <dcterms:description>${xmlText(node.description)}</dcterms:description>`,
      this.renderTypedLiteral("nav:isCompleted", node.isCompleted, "boolean"),
      this.renderTypedLiteral("nav:isRequired", node.isRequired, "boolean"),
      this.renderTypedLiteral("nav:isArchieved", node.isArchieved, "boolean"),
      this.renderTypedLiteral("nav:priority", node.priority, "integer"),
      this.renderTypedLiteral("nav:learnHours", node.learnHours, "integer"),
      ...node.courses.map(
        (course) =>
          `    <nav:hasCourse rdf:resource="${xmlAttr(
            courseUri(this.namespaces, graph.id, course.id)
          )}"/>`
      ),
      ...node.books.map(
        (book) =>
          `    <nav:hasBook rdf:resource="${xmlAttr(
            bookUri(this.namespaces, graph.id, book.id)
          )}"/>`
      ),
      ...node.articles.map(
        (article) =>
          `    <nav:hasArticle rdf:resource="${xmlAttr(
            articleUri(this.namespaces, graph.id, article.id)
          )}"/>`
      ),
      ...this.renderNodeEdges(graph, node, context),
      "  </nav:Skill>",
    ].join("\n");
  }

  private renderNodeEdges(
    graph: GraphResponse | ExportableGraph,
    node: Skill,
    context: GraphExportContext
  ): string[] {
    return graph.edges
      .filter((edge) => edge.fromId === node.id)
      .flatMap((edge) => {
        const targetUri = this.resolveSkillTargetUri(graph, edge.toId, context);
        return targetUri
          ? [`    <nav:dependsOn rdf:resource="${xmlAttr(targetUri)}"/>`]
          : [];
      });
  }

  private renderMainSkillEdges(
    graph: GraphResponse | ExportableGraph,
    context: GraphExportContext
  ): string[] {
    return graph.edges
      .filter(
        (edge) => edge.fromId === graph.mainSkill.id && context.skillById.has(edge.toId)
      )
      .map((edge) =>
        [
          `  <rdf:Description rdf:about="${xmlAttr(context.mainSkillUri)}">`,
          `    <nav:requires rdf:resource="${xmlAttr(
            skillUri(this.namespaces, graph.id, edge.toId)
          )}"/>`,
          "  </rdf:Description>",
        ].join("\n")
      );
  }

  private renderResources(graph: GraphResponse | ExportableGraph): string[] {
    return graph.nodes.flatMap((node) => [
      ...node.courses.map((course) => this.renderCourse(graph.id, course)),
      ...node.books.map((book) => this.renderBook(graph.id, book)),
      ...node.articles.map((article) => this.renderArticle(graph.id, article)),
    ]);
  }

  private renderCourse(graphId: string, course: Course): string {
    return [
      `  <nav:Course rdf:about="${xmlAttr(
        courseUri(this.namespaces, graphId, course.id)
      )}">`,
      `    <rdfs:label>${xmlText(course.title)}</rdfs:label>`,
      `    <dcterms:description>${xmlText(course.description)}</dcterms:description>`,
      `    <nav:link rdf:resource="${xmlAttr(course.link)}"/>`,
      ...(course.image
        ? [`    <nav:image rdf:resource="${xmlAttr(course.image)}"/>`]
        : []),
      ...(course.learningTimeInfo
        ? [
            this.renderTypedLiteral(
              "nav:minHours",
              course.learningTimeInfo.minHours,
              "integer"
            ),
            this.renderTypedLiteral(
              "nav:avgHours",
              course.learningTimeInfo.avgHours,
              "integer"
            ),
            this.renderTypedLiteral(
              "nav:maxHours",
              course.learningTimeInfo.maxHours,
              "integer"
            ),
            this.renderTypedLiteral(
              "nav:coursesAnalyzed",
              course.learningTimeInfo.coursesAnalyzed,
              "integer"
            ),
          ]
        : []),
      "  </nav:Course>",
    ].join("\n");
  }

  private renderBook(graphId: string, book: Book): string {
    return [
      `  <nav:Book rdf:about="${xmlAttr(
        bookUri(this.namespaces, graphId, book.id)
      )}">`,
      `    <rdfs:label>${xmlText(book.title)}</rdfs:label>`,
      `    <dcterms:creator>${xmlText(book.author)}</dcterms:creator>`,
      `    <dcterms:description>${xmlText(book.description)}</dcterms:description>`,
      `    <nav:link rdf:resource="${xmlAttr(book.link)}"/>`,
      ...(book.image ? [`    <nav:image rdf:resource="${xmlAttr(book.image)}"/>`] : []),
      "  </nav:Book>",
    ].join("\n");
  }

  private renderArticle(graphId: string, article: Article): string {
    return [
      `  <nav:Article rdf:about="${xmlAttr(
        articleUri(this.namespaces, graphId, article.id)
      )}">`,
      `    <rdfs:label>${xmlText(article.title)}</rdfs:label>`,
      `    <dcterms:description>${xmlText(article.description)}</dcterms:description>`,
      `    <nav:link rdf:resource="${xmlAttr(article.link)}"/>`,
      this.renderTypedLiteral("nav:rating", article.rating, "double"),
      ...article.tags.map((tag) => `    <nav:tag>${xmlText(tag)}</nav:tag>`),
      "  </nav:Article>",
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

  private renderTypedLiteral(
    tagName: string,
    value: string | number | boolean,
    typeName: "boolean" | "double" | "integer"
  ): string {
    return renderTypedRdfXmlLiteral(this.namespaces, tagName, value, typeName);
  }
}
