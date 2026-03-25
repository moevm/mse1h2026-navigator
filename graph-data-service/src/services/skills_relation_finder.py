from typing import Any, Dict, List

import networkx as nx
from SPARQLWrapper import JSON, SPARQLWrapper
from tqdm import tqdm


class SkillsRelationFinder:
    _endpoint = "https://dbpedia.org/sparql"

    def __init__(self, profession_name: str, skills_list: List[str]):
        self._profession_name = profession_name
        self._skills_list = skills_list
        self._sparql = SPARQLWrapper(self._endpoint)
        self._sparql.setReturnFormat(JSON)

        self._graph = nx.DiGraph()
        self._graph.add_nodes_from(skills_list)

        self._uris_map = {skill: self._dbpedia_resource(skill) for skill in skills_list}
        print(f"[INIT] Profession: {profession_name}")
        print(f"[INIT] Skills list: {skills_list}")
        print(f"[INIT] Mapped skills to URIs: {self._uris_map}")

    def find_skill_relations(self):
        relations_set = set()
        print("[FIND] Starting to find skill relations...")

        for skill, source_uri in tqdm(self._uris_map.items(), desc="Processing skills"):
            if not source_uri:
                print(f"[SKIP] Skill '{skill}' has no URI")
                continue

            print(f"[PROCESS] Finding links for '{skill}' ({source_uri})")
            target_uris = self._find_links(source_uri)

            for target_uri in target_uris:
                target_name = self._extract_name_from_uri(target_uri)
                for s in self._skills_list:
                    if target_name.lower() == s.lower():
                        edge = (skill, s)
                        if edge not in relations_set:
                            relations_set.add(edge)
                            self._graph.add_edge(skill, s)
                            print(f"[EDGE] {skill} → {s}")
                        break

        relations = [{"from_skill": f, "to_skill": t} for f, t in relations_set]
        print(f"[DONE] Total unique relations found: {len(relations)}")
        return relations

    def _dbpedia_resource(self, name: str) -> str:
        query = f"""
        SELECT ?resource WHERE {{
          ?resource rdfs:label "{name}"@en .
        }}
        LIMIT 1
        """
        self._sparql.setQuery(query)
        try:
            results = self._sparql.query().convert()
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
        self._sparql.setQuery(query)
        try:
            results: Dict[str, Any] = self._sparql.query().convert()
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
