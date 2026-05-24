import type { Article, Book, Course, Skill } from "@prisma/client";
import { GraphImportError } from "./rdfGraphMapper";
import type { ImportedGraphData } from "./types";

export function validateImportedGraph(graph: ImportedGraphData): void {
  assertNonEmptyString(graph.professionTitle, "professionTitle");
  assertNonEmptyString(graph.mainSkill.id, "mainSkill.id");
  assertNonEmptyString(graph.mainSkill.title, "mainSkill.title");

  if (graph.nodes.length === 0) {
    throw new GraphImportError("Imported graph must contain at least one skill node");
  }

  const nodeIds = new Set<string>();
  graph.nodes.forEach((node, index) => {
    validateSkill(node, index);
    if (node.id === graph.mainSkill.id) {
      throw new GraphImportError(`Skill node id duplicates main skill id: ${node.id}`);
    }
    if (nodeIds.has(node.id)) {
      throw new GraphImportError(`Duplicate skill node id: ${node.id}`);
    }
    nodeIds.add(node.id);
  });

  const allowedEdgeIds = new Set([graph.mainSkill.id, ...nodeIds]);
  graph.edges.forEach((edge) => {
    if (!allowedEdgeIds.has(edge.fromId)) {
      throw new GraphImportError(`Edge references unknown source node: ${edge.fromId}`);
    }
    if (!allowedEdgeIds.has(edge.toId)) {
      throw new GraphImportError(`Edge references unknown target node: ${edge.toId}`);
    }
    if (edge.fromId === edge.toId) {
      throw new GraphImportError(`Self edge is not allowed: ${edge.fromId}`);
    }
  });
}

function validateSkill(node: Skill, index: number): void {
  assertNonEmptyString(node.id, `nodes[${index}].id`);
  assertNonEmptyString(node.title, `nodes[${index}].title`);
  assertInteger(node.priority, `nodes[${index}].priority`);
  assertInteger(node.learnHours, `nodes[${index}].learnHours`);

  if (node.learnHours < 0) {
    throw new GraphImportError(`nodes[${index}].learnHours must be non-negative`);
  }

  validateResources(node.courses, `nodes[${index}].courses`, validateCourse);
  validateResources(node.books, `nodes[${index}].books`, validateBook);
  validateResources(node.articles, `nodes[${index}].articles`, validateArticle);
}

function validateCourse(course: Course, path: string): void {
  assertNonEmptyString(course.id, `${path}.id`);
  assertNonEmptyString(course.title, `${path}.title`);
  assertValidUrl(course.link, `${path}.link`);

  if (course.learningTimeInfo) {
    assertInteger(course.learningTimeInfo.minHours, `${path}.learningTimeInfo.minHours`);
    assertInteger(course.learningTimeInfo.avgHours, `${path}.learningTimeInfo.avgHours`);
    assertInteger(course.learningTimeInfo.maxHours, `${path}.learningTimeInfo.maxHours`);
    assertInteger(
      course.learningTimeInfo.coursesAnalyzed,
      `${path}.learningTimeInfo.coursesAnalyzed`
    );
  }
}

function validateBook(book: Book, path: string): void {
  assertNonEmptyString(book.id, `${path}.id`);
  assertNonEmptyString(book.title, `${path}.title`);
  assertNonEmptyString(book.author, `${path}.author`);
  assertValidUrl(book.link, `${path}.link`);
}

function validateArticle(article: Article, path: string): void {
  assertNonEmptyString(article.id, `${path}.id`);
  assertNonEmptyString(article.title, `${path}.title`);
  assertValidUrl(article.link, `${path}.link`);
  if (!Number.isFinite(article.rating)) {
    throw new GraphImportError(`${path}.rating must be a finite number`);
  }
}

function validateResources<T extends { id: string }>(
  resources: T[],
  path: string,
  validator: (resource: T, path: string) => void
): void {
  const ids = new Set<string>();
  resources.forEach((resource, index) => {
    validator(resource, `${path}[${index}]`);
    if (ids.has(resource.id)) {
      throw new GraphImportError(`Duplicate resource id: ${resource.id}`);
    }
    ids.add(resource.id);
  });
}

function assertNonEmptyString(value: string, path: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new GraphImportError(`${path} is required`);
  }
}

function assertInteger(value: number, path: string): void {
  if (!Number.isInteger(value)) {
    throw new GraphImportError(`${path} must be an integer`);
  }
}

function assertValidUrl(value: string, path: string): void {
  assertNonEmptyString(value, path);
  try {
    new URL(value);
  } catch {
    throw new GraphImportError(`${path} must be a valid URL`);
  }
}
