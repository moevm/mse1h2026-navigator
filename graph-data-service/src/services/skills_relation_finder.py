import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List

import networkx as nx
from SPARQLWrapper import JSON, SPARQLWrapper
from tqdm import tqdm


class SkillsRelationFinder:
    _endpoint = "https://dbpedia.org/sparql"

    def __init__(self, profession_name: str, skills_list: List[str]):
        self._profession_name = profession_name
        self._skills_list = skills_list
        self._workers = int(os.getenv("DBPEDIA_WORKERS", "12"))
        self._timeout = int(os.getenv("DBPEDIA_TIMEOUT_SECONDS", "6"))

        self._graph = nx.DiGraph()
        self._graph.add_nodes_from(skills_list)

        self._uris_map = self._build_uris_map(skills_list)
        print(f"[INIT] Profession: {profession_name}")
        print(f"[INIT] Skills list: {skills_list}")
        print(f"[INIT] Mapped skills to URIs: {self._uris_map}")

    def find_skill_relations(self):
        relations_set = set()
        print("[FIND] Starting to find skill relations...")
        skills_by_lower_name = {skill.lower(): skill for skill in self._skills_list}

        uri_items = [
            (skill, source_uri)
            for skill, source_uri in self._uris_map.items()
            if source_uri
        ]
        skipped_count = len(self._uris_map) - len(uri_items)
        if skipped_count:
            print(f"[SKIP] Skills without DBpedia URI: {skipped_count}")

        with ThreadPoolExecutor(max_workers=self._workers) as executor:
            futures = {
                executor.submit(self._find_links, source_uri): skill
                for skill, source_uri in uri_items
            }

            for future in tqdm(
                as_completed(futures),
                total=len(futures),
                desc="Processing skills",
            ):
                skill = futures[future]
                target_uris = future.result()

                for target_uri in target_uris:
                    target_name = self._extract_name_from_uri(target_uri)
                    target_skill = skills_by_lower_name.get(target_name.lower())
                    if not target_skill:
                        continue

                    edge = (skill, target_skill)
                    if edge in relations_set:
                        continue

                    relations_set.add(edge)
                    self._graph.add_edge(skill, target_skill)
                    print(f"[EDGE] {skill} → {target_skill}")

        relations = [{"from_skill": f, "to_skill": t} for f, t in relations_set]
        print(f"[DONE] Total unique relations found: {len(relations)}")
        return relations

    def _build_uris_map(self, skills_list: List[str]) -> Dict[str, str]:
        with ThreadPoolExecutor(max_workers=self._workers) as executor:
            futures = {
                executor.submit(self._dbpedia_resource, skill): skill
                for skill in skills_list
            }

            result: Dict[str, str] = {}
            for future in tqdm(
                as_completed(futures),
                total=len(futures),
                desc="Resolving DBpedia resources",
            ):
                skill = futures[future]
                result[skill] = future.result()

        return result

    def _create_sparql(self) -> SPARQLWrapper:
        sparql = SPARQLWrapper(self._endpoint)
        sparql.setReturnFormat(JSON)
        sparql.setTimeout(self._timeout)
        return sparql

    def _dbpedia_resource(self, name: str) -> str:
        query = f"""
        SELECT ?resource WHERE {{
          ?resource rdfs:label "{name}"@en .
        }}
        LIMIT 1
        """
        sparql = self._create_sparql()
        sparql.setQuery(query)
        try:
            results = sparql.query().convert()
            if results["results"]["bindings"]:
                return results["results"]["bindings"][0]["resource"]["value"]
            else:
                print(f"[WARN] No DBpedia resource for '{name}'")
                return ""
        except Exception as e:
            print(f"[ERROR] Querying DBpedia for '{name}': {e}")
            return ""

    def _find_links(self, source_uri: str) -> List[str]:
        query = f"""
        PREFIX dbo: <http://dbpedia.org/ontology/>
        SELECT ?target
        WHERE {{
            <{source_uri}> dbo:wikiPageWikiLink ?target .
        }}
        """
        sparql = self._create_sparql()
        sparql.setQuery(query)
        try:
            results: Dict[str, Any] = sparql.query().convert()
            return [
                binding["target"]["value"] for binding in results["results"]["bindings"]
            ]
        except Exception as e:
            print(f"[ERROR] Querying {source_uri}: {e}")
            return []

    def _extract_name_from_uri(self, uri: str) -> str:
        name = uri.split("/")[-1].replace("_", " ")
        if "(" in name:
            name = name.split("(")[0].strip()
        return name
