import json
import os

import dotenv
from fastapi import FastAPI

from .services.skills_finder import SkillsFinder
from .services.skills_normalizer import SkillsNormalizer
from .services.skills_relation_finder import SkillsRelationFinder
from .services.skills_relations_normalizer import SkillRelationNormalizer

dotenv.load_dotenv()

app = FastAPI(title="Graph data service")


@app.get("/")
def read_root():
    return {"status": "working", "message": "Hello, World!"}


@app.get("/get_skill_graph/{job_title}")
def get_skill_graph(job_title: str):
    print("WORKING")
    safe_job_title = job_title.replace(" ", "_").lower()

    skills_file_path = f"normalized_skills_{safe_job_title}.json"
    relations_file_path = f"skill_relations_{safe_job_title}.json"

    if os.path.exists(skills_file_path):
        with open(skills_file_path, "r", encoding="utf-8") as f:
            normalized_skills = json.load(f)
    else:
        _skills_finder = SkillsFinder(job_title)
        skills_list = _skills_finder.get_skills_list()

        skills_normalizer = SkillsNormalizer(skills_list, job_title)
        normalized_skills = skills_normalizer.get_normalized_skills()

        with open(skills_file_path, "w", encoding="utf-8") as f:
            json.dump(normalized_skills, f, ensure_ascii=False, indent=4)

    if os.path.exists(relations_file_path):
        with open(relations_file_path, "r", encoding="utf-8") as f:
            skill_relations = json.load(f)
        print(f"Loaded existing relations from {relations_file_path}")
    else:
        skills_relation_finder = SkillsRelationFinder(job_title, normalized_skills)
        skill_relations = skills_relation_finder.find_skill_relations()

        with open(relations_file_path, "w", encoding="utf-8") as f:
            json.dump(skill_relations, f, ensure_ascii=False, indent=4)
        print(f"Saved new relations to {relations_file_path}")

    skills_relation_normalizer = SkillRelationNormalizer(job_title, skill_relations)
    normalized_relations = skills_relation_normalizer.get_normalized_relations()

    return normalized_relations
