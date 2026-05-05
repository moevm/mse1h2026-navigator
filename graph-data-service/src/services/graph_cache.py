import json
import os
import re
from typing import Any


DEFAULT_REDIS_URL = "redis://localhost:6379/0"
DEFAULT_GRAPH_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60

_redis_client = None
_redis_client_initialized = False


def normalize_profession_cache_key(profession_title: str) -> str:
    normalized = profession_title.strip().lower()
    normalized = re.sub(r"\s+", "_", normalized)
    normalized = normalized.replace(":", "_")
    return normalized


def build_graph_cache_key(profession_title: str, is_mock: bool) -> str:
    normalized_title = normalize_profession_cache_key(profession_title)
    return f"profession_graph:{str(is_mock).lower()}:{normalized_title}"


def get_graph_cache_ttl_seconds() -> int:
    raw_value = os.environ.get("GRAPH_CACHE_TTL_SECONDS")
    if not raw_value:
        return DEFAULT_GRAPH_CACHE_TTL_SECONDS

    try:
        ttl = int(raw_value)
    except ValueError:
        print(
            "[GraphCache] Invalid GRAPH_CACHE_TTL_SECONDS="
            f"{raw_value!r}; using default"
        )
        return DEFAULT_GRAPH_CACHE_TTL_SECONDS

    if ttl <= 0:
        print(
            "[GraphCache] Non-positive GRAPH_CACHE_TTL_SECONDS="
            f"{raw_value!r}; using default"
        )
        return DEFAULT_GRAPH_CACHE_TTL_SECONDS

    return ttl


def get_redis_client():
    global _redis_client
    global _redis_client_initialized

    if _redis_client_initialized:
        return _redis_client

    _redis_client_initialized = True

    try:
        import redis

        redis_url = os.environ.get("REDIS_URL", DEFAULT_REDIS_URL)
        _redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
        return _redis_client
    except Exception as error:
        print(f"[GraphCache] Redis client is unavailable: {error}")
        _redis_client = None
        return None


def edge_to_dict(edge: Any) -> dict[str, str]:
    if isinstance(edge, dict):
        return {
            "from_skill": edge["from_skill"],
            "to_skill": edge["to_skill"],
        }

    if hasattr(edge, "model_dump"):
        dumped = edge.model_dump()
        return {
            "from_skill": dumped["from_skill"],
            "to_skill": dumped["to_skill"],
        }

    return {
        "from_skill": edge.from_skill,
        "to_skill": edge.to_skill,
    }


def graph_to_cache_payload(graph_data: dict[str, Any]) -> dict[str, Any]:
    return {
        "nodes": list(graph_data["nodes"]),
        "edges": [edge_to_dict(edge) for edge in graph_data["edges"]],
    }


def get_cached_graph(profession_title: str, is_mock: bool) -> dict[str, Any] | None:
    client = get_redis_client()
    if client is None:
        return None

    cache_key = build_graph_cache_key(profession_title, is_mock)

    try:
        cached_value = client.get(cache_key)
        if cached_value is None:
            print(f"[GraphCache] Miss: {cache_key}")
            return None

        print(f"[GraphCache] Hit: {cache_key}")
        return json.loads(cached_value)
    except Exception as error:
        print(f"[GraphCache] Failed to read {cache_key}: {error}")
        return None


def set_cached_graph(
    profession_title: str,
    is_mock: bool,
    graph_data: dict[str, Any],
) -> None:
    client = get_redis_client()
    if client is None:
        return

    cache_key = build_graph_cache_key(profession_title, is_mock)
    ttl_seconds = get_graph_cache_ttl_seconds()

    try:
        payload = json.dumps(graph_to_cache_payload(graph_data), ensure_ascii=False)
        client.setex(cache_key, ttl_seconds, payload)
        print(f"[GraphCache] Stored: {cache_key} ttl={ttl_seconds}")
    except Exception as error:
        print(f"[GraphCache] Failed to write {cache_key}: {error}")
