import json
import os

import dotenv
from fastapi import FastAPI

from .services.skills_finder import SkillsFinder
from .services.skills_normalizer import SkillsNormalizer
from .services.skills_relation_finder import SkillsRelationFinder

dotenv.load_dotenv()

app = FastAPI(title="Graph data service")


@app.get("/")
def read_root():
    return {"status": "working", "message": "Hello, World!"}


@app.get("/get_skill_graph/{job_title}")
def get_skill_graph(job_title: str):
    print("WORKING")
    safe_job_title = job_title.replace(" ", "_").lower()
    file_path = f"normalized_skills_{safe_job_title}.json"

    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            normalized_skills = json.load(f)
    else:
        _skills_finder = SkillsFinder(job_title)
        skills_list = _skills_finder.get_skills_list()

        skills_normalizer = SkillsNormalizer(skills_list, job_title)
        normalized_skills = skills_normalizer.get_normalized_skills()

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(normalized_skills, f, ensure_ascii=False, indent=4)

    skills_relation_finder = SkillsRelationFinder(job_title, normalized_skills)
    skill_relations = skills_relation_finder.find_skill_relations()

    return {"response": skill_relations}
