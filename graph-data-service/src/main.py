from fastapi import FastAPI, HTTPException

from .services.skills_finder import SkillsFinder

app = FastAPI(title="Graph data service")


@app.get("/")
def read_root():
    return {"status": "working", "message": "Hello, World!"}


@app.get("/get_skill_graph/{job_title}")
def get_skill_graph(job_title: str):
    _skills_finder = SkillsFinder(job_title)
    return {"response": _skills_finder.get_skills_list()}
