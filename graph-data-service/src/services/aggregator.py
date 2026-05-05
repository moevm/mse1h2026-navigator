import json
import os

from ..services.graph_cache import get_cached_graph, set_cached_graph
from ..services.skills_finder import SkillsFinder
from ..services.skills_normalizer import SkillsNormalizer
from ..services.skills_relation_finder import SkillsRelationFinder
from ..services.skills_relations_normalizer import SkillRelationNormalizer


def get_node_names(skill_relations):
    node_names = set()
    print(skill_relations)
    for edge in skill_relations:
        node_names.add(edge.from_skill)
        node_names.add(edge.to_skill)
    return list(node_names)


def get_skill_graph_data(
    job_title: str, is_mock: bool = False, use_cache: bool = False
):
    print(f"Processing skill graph for: {job_title}")

    if use_cache:
        cached_graph = get_cached_graph(job_title, is_mock)
        if cached_graph is not None:
            return cached_graph

    if is_mock:
        mock_file_path = "cache/mock_answer.json"
        if os.path.exists(mock_file_path):
            print(f"Using mock data from {mock_file_path}")
            with open(mock_file_path, "r", encoding="utf-8") as f:
                graph_data = json.load(f)

            if use_cache:
                set_cached_graph(job_title, is_mock, graph_data)

            return graph_data
        else:
            print(
                f"Mock file {mock_file_path} not found, falling back to normal processing"
            )

    _skills_finder = SkillsFinder(job_title)
    skills_list = _skills_finder.get_skills_list()

    skills_normalizer = SkillsNormalizer(skills_list, job_title)
    normalized_skills = skills_normalizer.get_normalized_skills()

    skills_relation_finder = SkillsRelationFinder(job_title, normalized_skills)
    skill_relations = skills_relation_finder.find_skill_relations()

    skills_relation_normalizer = SkillRelationNormalizer(job_title, skill_relations)
    normalized_relations = skills_relation_normalizer.get_normalized_relations()

    node_names = get_node_names(normalized_relations)
    graph_data = {
        "nodes": node_names,
        "edges": normalized_relations,
    }

    if use_cache:
        set_cached_graph(job_title, is_mock, graph_data)

    return graph_data
