import json
import os
import re

from ..services.graph_cache import get_cached_graph, set_cached_graph
from ..services.skills_finder import SkillsFinder
from ..services.skills_normalizer import SkillsNormalizer
from ..services.skills_relation_finder import SkillsRelationFinder
from ..services.skills_relations_normalizer import SkillRelationNormalizer

DEFAULT_MAX_GRAPH_SKILLS = 0


def get_node_names(skill_relations):
    node_names = set()
    print(skill_relations)
    for edge in skill_relations:
        normalized_edge = normalize_edge(edge)
        if normalized_edge:
            node_names.add(normalized_edge["from_skill"])
            node_names.add(normalized_edge["to_skill"])
    return list(node_names)


def normalize_initial_technologies(initial_technologies=None):
    seen = set()
    result = []
    for technology in initial_technologies or []:
        normalized = technology.strip()
        key = normalized.lower()
        if not normalized or key in seen:
            continue
        seen.add(key)
        result.append(normalized)
    return result


def merge_skill_lists(preferred_skills, discovered_skills):
    return normalize_initial_technologies(
        [*(preferred_skills or []), *(discovered_skills or [])]
    )


def limit_skill_list(skills, initial_technologies):
    max_skills = int(os.getenv("GRAPH_DATA_SERVICE_MAX_SKILLS", DEFAULT_MAX_GRAPH_SKILLS))
    if max_skills <= 0:
        return skills

    seeded = merge_skill_lists(initial_technologies, skills)
    if len(seeded) <= max_skills:
        return seeded

    limited = merge_skill_lists(initial_technologies, seeded[:max_skills])
    if len(limited) > max_skills:
        limited = limited[:max_skills]

    print(
        f"Limited skills for graph building: {len(seeded)} -> {len(limited)} "
        f"(max={max_skills})"
    )
    return limited


def should_use_relation_llm():
    return os.getenv("GRAPH_DATA_SERVICE_USE_RELATION_LLM", "true").lower() in [
        "1",
        "true",
        "yes",
    ]


def should_use_skills_llm():
    return os.getenv("GRAPH_DATA_SERVICE_USE_SKILLS_LLM", "true").lower() in [
        "1",
        "true",
        "yes",
    ]


def should_use_disk_cache():
    return os.getenv("GRAPH_DATA_SERVICE_USE_DISK_CACHE", "true").lower() in [
        "1",
        "true",
        "yes",
    ]


def normalize_edge(edge):
    if isinstance(edge, dict):
        from_skill = edge.get("from_skill")
        to_skill = edge.get("to_skill")
    else:
        from_skill = getattr(edge, "from_skill", None)
        to_skill = getattr(edge, "to_skill", None)

    if not from_skill or not to_skill:
        return None

    return {"from_skill": from_skill, "to_skill": to_skill}


def normalize_edges(edges):
    result = []
    seen = set()
    for edge in edges or []:
        normalized_edge = normalize_edge(edge)
        if not normalized_edge:
            continue

        key = (
            normalized_edge["from_skill"].lower(),
            normalized_edge["to_skill"].lower(),
        )
        if key in seen or key[0] == key[1]:
            continue

        seen.add(key)
        result.append(normalized_edge)
    return result


def add_missing_expansion_edges(edges, nodes, initial_technologies):
    result = normalize_edges(edges)
    known_edges = {
        (edge["from_skill"].lower(), edge["to_skill"].lower()) for edge in result
    }
    connected_nodes = {
        skill.lower()
        for edge in result
        for skill in [edge["from_skill"], edge["to_skill"]]
    }
    anchors = [skill for skill in initial_technologies if skill in nodes]
    if not anchors and nodes:
        anchors = [nodes[0]]

    if not anchors:
        return result

    for index, anchor in enumerate(anchors):
        target = anchors[index + 1] if index + 1 < len(anchors) else None
        if target:
            key = (anchor.lower(), target.lower())
            if key not in known_edges:
                result.append({"from_skill": anchor, "to_skill": target})
                known_edges.add(key)
                connected_nodes.update([anchor.lower(), target.lower()])

    expansion_targets = [
        node
        for node in nodes
        if node.lower() not in connected_nodes and node not in anchors
    ]
    for index, node in enumerate(expansion_targets):
        anchor = anchors[index % len(anchors)]
        key = (anchor.lower(), node.lower())
        if key in known_edges:
            continue

        result.append({"from_skill": anchor, "to_skill": node})
        known_edges.add(key)

    if not result and len(nodes) > 1:
        for index, node in enumerate(nodes[:-1]):
            result.append({"from_skill": node, "to_skill": nodes[index + 1]})

    return result


def build_cache_key(job_title, initial_technologies):
    safe_job_title = re.sub(r"[^a-z0-9_-]+", "_", job_title.lower()).strip("_")
    if not initial_technologies:
        return safe_job_title

    safe_technologies = "_".join(
        re.sub(r"[^a-z0-9_-]+", "_", technology.lower()).strip("_")
        for technology in initial_technologies
    )
    return f"{safe_job_title}__seed_{safe_technologies}"


def merge_mock_graph_with_initial_technologies(mock_graph, initial_technologies):
    if not initial_technologies:
        return mock_graph

    nodes = merge_skill_lists(initial_technologies, mock_graph.get("nodes", []))
    known_edges = {
        (edge.get("from_skill"), edge.get("to_skill"))
        for edge in mock_graph.get("edges", [])
        if isinstance(edge, dict)
    }
    edges = list(mock_graph.get("edges", []))

    for index, technology in enumerate(initial_technologies):
        target = (
            initial_technologies[index + 1]
            if index + 1 < len(initial_technologies)
            else None
        )
        if target and (technology, target) not in known_edges:
            edges.append({"from_skill": technology, "to_skill": target})
            known_edges.add((technology, target))

    return {"nodes": nodes, "edges": edges}


def get_skill_graph_data(
    job_title: str,
    initial_technologies=None,
    is_mock: bool = False,
    use_cache: bool = False,
):
    print(f"Processing skill graph for: {job_title}")
    initial_technologies = normalize_initial_technologies(initial_technologies)
    print(f"Initial technologies: {initial_technologies}")

    if use_cache:
        cached_graph = get_cached_graph(job_title, is_mock)
        if cached_graph is not None:
            return cached_graph

    if is_mock:
        mock_file_path = "cache/mock_answer.json"
        if os.path.exists(mock_file_path):
            print(f"Using mock data from {mock_file_path}")
            with open(mock_file_path, "r", encoding="utf-8") as f:
                graph_data = merge_mock_graph_with_initial_technologies(
                    json.load(f), initial_technologies
                )

            if use_cache:
                set_cached_graph(job_title, is_mock, graph_data)

            return graph_data
        else:
            print(
                f"Mock file {mock_file_path} not found, falling back to normal processing"
            )

    safe_job_title = build_cache_key(job_title, initial_technologies)

    skills_file_path = f"cache/normalized_skills_{safe_job_title}.json"
    relations_file_path = f"cache/skill_relations_{safe_job_title}.json"

    use_disk_cache = use_cache and should_use_disk_cache()

    if use_disk_cache and os.path.exists(skills_file_path):
        with open(skills_file_path, "r", encoding="utf-8") as f:
            normalized_skills = json.load(f)
        print(f"Loaded skills from cache: {skills_file_path}")
        if initial_technologies and len(normalized_skills) <= len(initial_technologies):
            print("Cached skills contain only initial technologies, rebuilding cache")
            normalized_skills = None
        else:
            normalized_skills = limit_skill_list(
                normalized_skills, initial_technologies
            )
    else:
        normalized_skills = None

    if normalized_skills is None:
        _skills_finder = SkillsFinder(job_title)
        skills_list = _skills_finder.get_skills_list()
        skills_list = merge_skill_lists(initial_technologies, skills_list)

        if should_use_skills_llm():
            try:
                skills_normalizer = SkillsNormalizer(skills_list, job_title)
                normalized_skills = skills_normalizer.get_normalized_skills()
            except Exception as error:
                print(f"Skills LLM normalization failed, using roadmap skills: {error}")
                normalized_skills = skills_list
        else:
            print("Skipping skills LLM normalization; using roadmap skills directly")
            normalized_skills = skills_list

        normalized_skills = merge_skill_lists(
            initial_technologies,
            merge_skill_lists(normalized_skills, skills_list),
        )
        normalized_skills = limit_skill_list(normalized_skills, initial_technologies)

        if use_disk_cache:
            os.makedirs("cache", exist_ok=True)
            with open(skills_file_path, "w", encoding="utf-8") as f:
                json.dump(normalized_skills, f, ensure_ascii=False, indent=4)
            print(f"Saved skills to cache: {skills_file_path}")

    if use_disk_cache and os.path.exists(relations_file_path):
        with open(relations_file_path, "r", encoding="utf-8") as f:
            skill_relations = json.load(f)
        print(f"Loaded relations from cache: {relations_file_path}")
    else:
        skills_relation_finder = SkillsRelationFinder(job_title, normalized_skills)
        skill_relations = skills_relation_finder.find_skill_relations()

        if use_disk_cache:
            os.makedirs("cache", exist_ok=True)
            with open(relations_file_path, "w", encoding="utf-8") as f:
                json.dump(skill_relations, f, ensure_ascii=False, indent=4)
            print(f"Saved relations to cache: {relations_file_path}")

    if should_use_relation_llm():
        try:
            skills_relation_normalizer = SkillRelationNormalizer(
                job_title,
                normalized_skills,
                normalize_edges(skill_relations),
                initial_technologies,
            )
            normalized_relations = skills_relation_normalizer.get_normalized_relations()
        except Exception as error:
            print(
                f"Relation LLM normalization failed, using DBpedia relations: {error}"
            )
            normalized_relations = normalize_edges(skill_relations)
    else:
        print("Skipping relation LLM normalization; using DBpedia relations directly")
        normalized_relations = normalize_edges(skill_relations)

    relations_edges = (
        normalized_relations.edges
        if hasattr(normalized_relations, "edges")
        else normalized_relations
    )

    node_names = list({*normalized_skills, *get_node_names(relations_edges)})
    graph_data = {
        "nodes": node_names,
        "edges": relations_edges,
    }
    if use_cache:
        set_cached_graph(job_title, is_mock, graph_data)

    return graph_data
