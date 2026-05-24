import type { Article, Book, Course, MainSkill, Skill, SkillsRelation } from "@prisma/client";
import { extractUriSegment } from "./helpers";
import { dcterms, nav, rdfs, type RdfObject, type RdfTriple } from "./rdfTriples";
import type { GraphExportNamespaces, ImportedGraphData } from "./types";

const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

export class GraphImportError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function mapRdfTriplesToImportedGraph(
  triples: RdfTriple[],
  namespaces: GraphExportNamespaces
): ImportedGraphData {
  const graphUri = findSubjectWithType(triples, nav(namespaces, "SkillGraph"));
  if (!graphUri) {
    throw new GraphImportError("Imported graph must contain nav:SkillGraph");
  }

  const mainSkillUri = firstUriObject(
    triples,
    graphUri,
    nav(namespaces, "hasMainSkill")
  );
  if (!mainSkillUri) {
    throw new GraphImportError("Imported graph must contain nav:hasMainSkill");
  }

  const skillUris = unique([
    ...uriObjects(triples, graphUri, nav(namespaces, "hasSkill")),
    ...subjectsWithType(triples, nav(namespaces, "Skill")),
  ]);
  const courseMap = mapResources<Course>(
    triples,
    namespaces,
    "Course",
    mapCourse
  );
  const bookMap = mapResources<Book>(triples, namespaces, "Book", mapBook);
  const articleMap = mapResources<Article>(
    triples,
    namespaces,
    "Article",
    mapArticle
  );

  const mainSkill = mapMainSkill(triples, namespaces, mainSkillUri);
  const nodes = skillUris.map((skillUriValue, index) =>
    mapSkill(
      triples,
      namespaces,
      skillUriValue,
      index,
      courseMap,
      bookMap,
      articleMap
    )
  );

  return {
    professionTitle: literalValue(triples, graphUri, rdfs(namespaces, "label")) || mainSkill.title,
    mainSkill,
    nodes,
    edges: mapEdges(triples, namespaces, mainSkill, mainSkillUri, nodes),
  };
}

function mapMainSkill(
  triples: RdfTriple[],
  namespaces: GraphExportNamespaces,
  mainSkillUri: string
): MainSkill {
  return {
    id: extractUriSegment(mainSkillUri, "skills") || "main",
    title: literalValue(triples, mainSkillUri, rdfs(namespaces, "label")) || "",
    description:
      literalValue(triples, mainSkillUri, dcterms(namespaces, "description")) || "",
  };
}

function mapSkill(
  triples: RdfTriple[],
  namespaces: GraphExportNamespaces,
  skillUriValue: string,
  index: number,
  courseMap: Map<string, Course>,
  bookMap: Map<string, Book>,
  articleMap: Map<string, Article>
): Skill {
  return {
    id: extractUriSegment(skillUriValue, "skills") || `skill-${index + 1}`,
    title: literalValue(triples, skillUriValue, rdfs(namespaces, "label")) || "",
    description:
      literalValue(triples, skillUriValue, dcterms(namespaces, "description")) || "",
    isCompleted: booleanValue(triples, skillUriValue, nav(namespaces, "isCompleted")),
    isRequired: booleanValue(triples, skillUriValue, nav(namespaces, "isRequired")),
    isArchieved: booleanValue(triples, skillUriValue, nav(namespaces, "isArchieved")),
    priority: integerValue(triples, skillUriValue, nav(namespaces, "priority"), index + 1),
    learnHours: integerValue(triples, skillUriValue, nav(namespaces, "learnHours"), 0),
    courses: uriObjects(triples, skillUriValue, nav(namespaces, "hasCourse"))
      .map((uri) => courseMap.get(uri))
      .filter((course): course is Course => Boolean(course)),
    books: uriObjects(triples, skillUriValue, nav(namespaces, "hasBook"))
      .map((uri) => bookMap.get(uri))
      .filter((book): book is Book => Boolean(book)),
    articles: uriObjects(triples, skillUriValue, nav(namespaces, "hasArticle"))
      .map((uri) => articleMap.get(uri))
      .filter((article): article is Article => Boolean(article)),
  };
}

function mapCourse(
  triples: RdfTriple[],
  namespaces: GraphExportNamespaces,
  uri: string
): Course {
  const learningTimeInfo = [
    nav(namespaces, "minHours"),
    nav(namespaces, "avgHours"),
    nav(namespaces, "maxHours"),
    nav(namespaces, "coursesAnalyzed"),
  ].every((predicate) => literalValue(triples, uri, predicate) !== null)
    ? {
        minHours: integerValue(triples, uri, nav(namespaces, "minHours"), 0),
        avgHours: integerValue(triples, uri, nav(namespaces, "avgHours"), 0),
        maxHours: integerValue(triples, uri, nav(namespaces, "maxHours"), 0),
        coursesAnalyzed: integerValue(
          triples,
          uri,
          nav(namespaces, "coursesAnalyzed"),
          0
        ),
      }
    : null;

  return {
    id: extractUriSegment(uri, "courses") || "",
    title: literalValue(triples, uri, rdfs(namespaces, "label")) || "",
    description: literalValue(triples, uri, dcterms(namespaces, "description")) || "",
    link: firstUriObject(triples, uri, nav(namespaces, "link")) || "",
    image: firstUriObject(triples, uri, nav(namespaces, "image")),
    learningTimeInfo,
  };
}

function mapBook(
  triples: RdfTriple[],
  namespaces: GraphExportNamespaces,
  uri: string
): Book {
  return {
    id: extractUriSegment(uri, "books") || "",
    title: literalValue(triples, uri, rdfs(namespaces, "label")) || "",
    author: literalValue(triples, uri, dcterms(namespaces, "creator")) || "",
    description: literalValue(triples, uri, dcterms(namespaces, "description")) || "",
    link: firstUriObject(triples, uri, nav(namespaces, "link")) || "",
    image: firstUriObject(triples, uri, nav(namespaces, "image")),
  };
}

function mapArticle(
  triples: RdfTriple[],
  namespaces: GraphExportNamespaces,
  uri: string
): Article {
  return {
    id: extractUriSegment(uri, "articles") || "",
    title: literalValue(triples, uri, rdfs(namespaces, "label")) || "",
    description: literalValue(triples, uri, dcterms(namespaces, "description")) || "",
    link: firstUriObject(triples, uri, nav(namespaces, "link")) || "",
    rating: numberValue(triples, uri, nav(namespaces, "rating"), 0),
    tags: literalValues(triples, uri, nav(namespaces, "tag")),
  };
}

function mapEdges(
  triples: RdfTriple[],
  namespaces: GraphExportNamespaces,
  mainSkill: MainSkill,
  mainSkillUri: string,
  nodes: Skill[]
): SkillsRelation[] {
  const nodeByUri = new Map(
    nodes.map((node) => [node.id, node])
  );
  const uriByNodeId = new Map<string, string>();
  subjectsWithType(triples, nav(namespaces, "Skill")).forEach((uri) => {
    const id = extractUriSegment(uri, "skills");
    if (id) {
      uriByNodeId.set(id, uri);
    }
  });

  return uniqueEdges([
    ...uriObjects(triples, mainSkillUri, nav(namespaces, "requires"))
      .map((toUri) => {
        const toId = extractUriSegment(toUri, "skills");
        return toId && nodeByUri.has(toId)
          ? { fromId: mainSkill.id, toId }
          : null;
      })
      .filter((edge): edge is SkillsRelation => edge !== null),
    ...nodes.flatMap((node) => {
      const fromUri = uriByNodeId.get(node.id);
      if (!fromUri) {
        return [];
      }

      return uriObjects(triples, fromUri, nav(namespaces, "dependsOn"))
        .map((toUri) => {
          if (toUri === mainSkillUri) {
            return { fromId: node.id, toId: mainSkill.id };
          }

          const toId = extractUriSegment(toUri, "skills");
          return toId ? { fromId: node.id, toId } : null;
        })
        .filter((edge): edge is SkillsRelation => edge !== null);
    }),
  ]);
}

function mapResources<T extends { id: string }>(
  triples: RdfTriple[],
  namespaces: GraphExportNamespaces,
  rdfTypeName: string,
  mapper: (
    triples: RdfTriple[],
    namespaces: GraphExportNamespaces,
    uri: string
  ) => T
): Map<string, T> {
  return new Map(
    subjectsWithType(triples, nav(namespaces, rdfTypeName)).map((uri) => [
      uri,
      mapper(triples, namespaces, uri),
    ])
  );
}

function findSubjectWithType(triples: RdfTriple[], typeUri: string): string | null {
  return subjectsWithType(triples, typeUri)[0] || null;
}

function subjectsWithType(triples: RdfTriple[], typeUri: string): string[] {
  return unique(
    triples
      .filter(
        (triple) =>
          triple.predicate === RDF_TYPE &&
          triple.object.kind === "uri" &&
          triple.object.value === typeUri
      )
      .map((triple) => triple.subject)
  );
}

function literalValue(
  triples: RdfTriple[],
  subject: string,
  predicate: string
): string | null {
  return literalValues(triples, subject, predicate)[0] || null;
}

function literalValues(
  triples: RdfTriple[],
  subject: string,
  predicate: string
): string[] {
  return objects(triples, subject, predicate)
    .filter((object) => object.kind === "literal")
    .map((object) => object.value);
}

function firstUriObject(
  triples: RdfTriple[],
  subject: string,
  predicate: string
): string | null {
  return uriObjects(triples, subject, predicate)[0] || null;
}

function uriObjects(triples: RdfTriple[], subject: string, predicate: string): string[] {
  return objects(triples, subject, predicate)
    .filter((object) => object.kind === "uri")
    .map((object) => object.value);
}

function objects(
  triples: RdfTriple[],
  subject: string,
  predicate: string
): RdfObject[] {
  return triples
    .filter((triple) => triple.subject === subject && triple.predicate === predicate)
    .map((triple) => triple.object);
}

function booleanValue(
  triples: RdfTriple[],
  subject: string,
  predicate: string
): boolean {
  return literalValue(triples, subject, predicate) === "true";
}

function integerValue(
  triples: RdfTriple[],
  subject: string,
  predicate: string,
  fallback: number
): number {
  const value = Number.parseInt(literalValue(triples, subject, predicate) || "", 10);
  return Number.isFinite(value) ? value : fallback;
}

function numberValue(
  triples: RdfTriple[],
  subject: string,
  predicate: string,
  fallback: number
): number {
  const value = Number(literalValue(triples, subject, predicate));
  return Number.isFinite(value) ? value : fallback;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function uniqueEdges(edges: SkillsRelation[]): SkillsRelation[] {
  const seen = new Set<string>();
  return edges.filter((edge) => {
    const key = `${edge.fromId}->${edge.toId}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
