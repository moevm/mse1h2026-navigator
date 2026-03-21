import json
import os

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

    if is_mock:
        mock_file_path = "cache/mock_answer.json"
        if os.path.exists(mock_file_path):
            print(f"Using mock data from {mock_file_path}")
            with open(mock_file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        else:
            print(
                f"Mock file {mock_file_path} not found, falling back to normal processing"
            )

    safe_job_title = job_title.replace(" ", "_").lower()

    skills_file_path = f"cache/normalized_skills_{safe_job_title}.json"
    relations_file_path = f"cache/skill_relations_{safe_job_title}.json"

    if use_cache and os.path.exists(skills_file_path):
        with open(skills_file_path, "r", encoding="utf-8") as f:
            normalized_skills = json.load(f)
        print(f"Loaded skills from cache: {skills_file_path}")
    else:
        _skills_finder = SkillsFinder(job_title)
        skills_list = _skills_finder.get_skills_list()

        skills_normalizer = SkillsNormalizer(skills_list, job_title)
        normalized_skills = skills_normalizer.get_normalized_skills()

        if use_cache:
            os.makedirs("cache", exist_ok=True)
            with open(skills_file_path, "w", encoding="utf-8") as f:
                json.dump(normalized_skills, f, ensure_ascii=False, indent=4)
            print(f"Saved skills to cache: {skills_file_path}")

    if use_cache and os.path.exists(relations_file_path):
        with open(relations_file_path, "r", encoding="utf-8") as f:
            skill_relations = json.load(f)
        print(f"Loaded relations from cache: {relations_file_path}")
    else:
        skills_relation_finder = SkillsRelationFinder(job_title, normalized_skills)
        skill_relations = skills_relation_finder.find_skill_relations()

        if use_cache:
            os.makedirs("cache", exist_ok=True)
            with open(relations_file_path, "w", encoding="utf-8") as f:
                json.dump(skill_relations, f, ensure_ascii=False, indent=4)
            print(f"Saved relations to cache: {relations_file_path}")

    skills_relation_normalizer = SkillRelationNormalizer(job_title, skill_relations)
    normalized_relations = skills_relation_normalizer.get_normalized_relations()

    node_names = get_node_names(normalized_relations)
    return {
        "nodes": node_names,
        "edges": normalized_relations,
    }
