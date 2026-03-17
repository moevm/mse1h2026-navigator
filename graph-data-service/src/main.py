import dotenv
from fastapi import FastAPI

from .services.skills_finder import SkillsFinder
from .services.skills_normalizer import SkillsNormalizer

dotenv.load_dotenv()

app = FastAPI(title="Graph data service")


@app.get("/")
def read_root():
    return {"status": "working", "message": "Hello, World!"}


@app.get("/get_skill_graph/{job_title}")
def get_skill_graph(job_title: str):
    _skills_finder = SkillsFinder(job_title)
    skills_list = _skills_finder.get_skills_list()

    skills_normalizer = SkillsNormalizer(skills_list, job_title)
    normalized_skills = skills_normalizer.get_normalized_skills()

    return {"response": normalized_skills}
