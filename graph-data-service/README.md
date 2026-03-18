# How to setup

Install dependencies
```
pip install -r requirements.txt
```

Add env-s 
```.env.example
APP_PORT=
HF_TOKEN=
```

Start app
```
docker compose up -d
```
or 
```
uvicorn src.main:app --reload
```

# Docs
To see docs visit `{domain}/docs`
There will be 2 routes
GET "/" - use as a health check route.
POST "/get_profession_graph" - main route.
Params for "/get_profession_graph":
- profession_title: STR - the profession title in Russian or English.
- is_mock: BOOLEAN - if true, returns mock data with the same structure as real data (no tokens spent).
- use_cache: BOOLEAN - if true, reads from (or creates, if not yet created) cached .json files with data. Works for everything except final LLM edge normalizing.


# Examples
```request
curl -X 'POST' \
  'http://localhost:8000/get_profession_graph' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "profession_title": "vibe-coding",
  "is_mock": true,
  "use_cache": true
}'
```

```response
{
  "nodes": [
    "GitHub",
    "Code refactoring",
    "Test-driven development",
    "Git",
    "Debugging",
    "Modular programming",
    "Version control",
    "Software testing"
  ],
  "edges": [
    {
      "from_skill": "Test-driven development",
      "to_skill": "Software testing"
    },
    {
      "from_skill": "Test-driven development",
      "to_skill": "Code refactoring"
    },
    {
      "from_skill": "Code refactoring",
      "to_skill": "Modular programming"
    },
    {
      "from_skill": "Software testing",
      "to_skill": "Debugging"
    },
    {
      "from_skill": "Debugging",
      "to_skill": "Git"
    },
    {
      "from_skill": "Git",
      "to_skill": "Version control"
    },
    {
      "from_skill": "Git",
      "to_skill": "GitHub"
    }
  ]
}
```
