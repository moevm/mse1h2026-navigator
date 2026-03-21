import dotenv
from fastapi import FastAPI

from .model.routes import ProfessionRequest
from .services.aggregator import get_skill_graph_data

dotenv.load_dotenv()

app = FastAPI(title="Graph data service")


@app.get("/")
def read_root():
    return {"status": "working", "message": "Hello, World!"}


@app.post("/get_profession_graph")
def get_profession_graph(request: ProfessionRequest):
    print(f"WORKING - Processing profession: {request.profession_title}")
    print(f"is_mock: {request.is_mock}, use_cache: {request.use_cache}")

    result = get_skill_graph_data(
        job_title=request.profession_title,
        is_mock=request.is_mock or False,
        use_cache=request.use_cache or False,
    )
    return result
