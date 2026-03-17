from fastapi import FastAPI

app = FastAPI(title="Graph data service")


@app.get("/")
def read_root():
    return {"status": "working", "message": "Hello, World!"}
