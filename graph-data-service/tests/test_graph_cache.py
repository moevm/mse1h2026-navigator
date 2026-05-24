import json
import os
import sys
import types
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from src.services import aggregator
from src.services import graph_cache


class FailingRedis:
    def get(self, _key):
        raise RuntimeError("redis read failed")

    def setex(self, _key, _ttl, _value):
        raise RuntimeError("redis write failed")


class GraphCacheTests(unittest.TestCase):
    def tearDown(self):
        graph_cache._redis_client = None
        graph_cache._redis_client_initialized = False

    def test_cache_hit_returns_cached_graph_without_building_pipeline(self):
        cached_graph = {
            "nodes": ["HTTP", "Node.js"],
            "edges": [{"from_skill": "HTTP", "to_skill": "Node.js"}],
        }

        with (
            patch.object(aggregator, "get_cached_graph", return_value=cached_graph),
            patch.object(aggregator, "SkillsFinder") as skills_finder,
        ):
            result = aggregator.get_skill_graph_data(
                "Backend Developer", is_mock=False, use_cache=True
            )

        self.assertEqual(result, cached_graph)
        skills_finder.assert_not_called()

    def test_cache_miss_builds_graph_and_stores_final_response_with_ttl(self):
        edge = SimpleNamespace(from_skill="HTTP", to_skill="Node.js")

        with (
            patch.dict(os.environ, {"GRAPH_DATA_SERVICE_USE_DISK_CACHE": "false"}),
            patch.object(aggregator, "get_cached_graph", return_value=None),
            patch.object(aggregator, "set_cached_graph") as set_cached_graph,
            patch.object(aggregator, "SkillsFinder") as skills_finder,
            patch.object(aggregator, "SkillsNormalizer") as skills_normalizer,
            patch.object(aggregator, "SkillsRelationFinder") as relation_finder,
            patch.object(aggregator, "SkillRelationNormalizer") as relation_normalizer,
        ):
            skills_finder.return_value.get_skills_list.return_value = ["HTTP"]
            skills_normalizer.return_value.get_normalized_skills.return_value = [
                "HTTP",
                "Node.js",
            ]
            relation_finder.return_value.find_skill_relations.return_value = [
                {"from_skill": "HTTP", "to_skill": "Node.js"}
            ]
            relation_normalizer.return_value.get_normalized_relations.return_value = [
                edge
            ]

            result = aggregator.get_skill_graph_data(
                "Backend Developer", is_mock=False, use_cache=True
            )

        self.assertCountEqual(result["nodes"], ["HTTP", "Node.js"])
        self.assertEqual(result["edges"], [edge])
        set_cached_graph.assert_called_once_with("Backend Developer", False, result)

    def test_use_cache_false_does_not_read_or_write_redis(self):
        edge = SimpleNamespace(from_skill="HTTP", to_skill="Node.js")

        with (
            patch.object(aggregator, "get_cached_graph") as get_cached_graph,
            patch.object(aggregator, "set_cached_graph") as set_cached_graph,
            patch.object(aggregator, "SkillsFinder") as skills_finder,
            patch.object(aggregator, "SkillsNormalizer") as skills_normalizer,
            patch.object(aggregator, "SkillsRelationFinder") as relation_finder,
            patch.object(aggregator, "SkillRelationNormalizer") as relation_normalizer,
        ):
            skills_finder.return_value.get_skills_list.return_value = ["HTTP"]
            skills_normalizer.return_value.get_normalized_skills.return_value = [
                "HTTP",
                "Node.js",
            ]
            relation_finder.return_value.find_skill_relations.return_value = [
                {"from_skill": "HTTP", "to_skill": "Node.js"}
            ]
            relation_normalizer.return_value.get_normalized_relations.return_value = [
                edge
            ]

            result = aggregator.get_skill_graph_data(
                "Backend Developer", is_mock=False, use_cache=False
            )

        self.assertCountEqual(result["nodes"], ["HTTP", "Node.js"])
        get_cached_graph.assert_not_called()
        set_cached_graph.assert_not_called()

    def test_redis_errors_do_not_break_graph_building(self):
        graph_cache._redis_client = FailingRedis()
        graph_cache._redis_client_initialized = True
        edge = SimpleNamespace(from_skill="HTTP", to_skill="Node.js")

        with (
            patch.dict(os.environ, {"GRAPH_DATA_SERVICE_USE_DISK_CACHE": "false"}),
            patch.object(aggregator, "SkillsFinder") as skills_finder,
            patch.object(aggregator, "SkillsNormalizer") as skills_normalizer,
            patch.object(aggregator, "SkillsRelationFinder") as relation_finder,
            patch.object(aggregator, "SkillRelationNormalizer") as relation_normalizer,
        ):
            skills_finder.return_value.get_skills_list.return_value = ["HTTP"]
            skills_normalizer.return_value.get_normalized_skills.return_value = [
                "HTTP",
                "Node.js",
            ]
            relation_finder.return_value.find_skill_relations.return_value = [
                {"from_skill": "HTTP", "to_skill": "Node.js"}
            ]
            relation_normalizer.return_value.get_normalized_relations.return_value = [
                edge
            ]

            result = aggregator.get_skill_graph_data(
                "Backend Developer", is_mock=False, use_cache=True
            )

        self.assertCountEqual(result["nodes"], ["HTTP", "Node.js"])
        self.assertEqual(result["edges"], [edge])

    def test_cache_payload_serializes_pydantic_like_edges(self):
        graph_data = {
            "nodes": ["HTTP", "Node.js"],
            "edges": [SimpleNamespace(from_skill="HTTP", to_skill="Node.js")],
        }
        redis_client = Mock()
        graph_cache._redis_client = redis_client
        graph_cache._redis_client_initialized = True

        with patch.dict(os.environ, {"GRAPH_CACHE_TTL_SECONDS": "604800"}):
            graph_cache.set_cached_graph("Backend Developer", False, graph_data)

        cache_key, ttl, raw_payload = redis_client.setex.call_args.args
        self.assertEqual(cache_key, "profession_graph:false:backend_developer")
        self.assertEqual(ttl, 604800)
        self.assertEqual(
            json.loads(raw_payload),
            {
                "nodes": ["HTTP", "Node.js"],
                "edges": [{"from_skill": "HTTP", "to_skill": "Node.js"}],
            },
        )

    def test_normalize_profession_cache_key(self):
        normalized = graph_cache.normalize_profession_cache_key(
            "  Backend: Developer  "
        )
        self.assertEqual(normalized, "backend_developer")

    def test_build_graph_cache_key(self):
        cache_key = graph_cache.build_graph_cache_key("Backend Developer", True)
        self.assertEqual(cache_key, "profession_graph:true:backend_developer")

    def test_get_graph_cache_ttl_seconds_invalid_value(self):
        with patch.dict(os.environ, {"GRAPH_CACHE_TTL_SECONDS": "oops"}):
            ttl = graph_cache.get_graph_cache_ttl_seconds()
        self.assertEqual(ttl, graph_cache.DEFAULT_GRAPH_CACHE_TTL_SECONDS)

    def test_get_graph_cache_ttl_seconds_non_positive(self):
        with patch.dict(os.environ, {"GRAPH_CACHE_TTL_SECONDS": "0"}):
            ttl = graph_cache.get_graph_cache_ttl_seconds()
        self.assertEqual(ttl, graph_cache.DEFAULT_GRAPH_CACHE_TTL_SECONDS)

    def test_get_redis_client_success(self):
        class FakeRedis:
            @staticmethod
            def from_url(_url, decode_responses=True):
                return "client"

        fake_module = types.SimpleNamespace(Redis=FakeRedis)

        with patch.dict(sys.modules, {"redis": fake_module}):
            graph_cache._redis_client = None
            graph_cache._redis_client_initialized = False
            client = graph_cache.get_redis_client()

        self.assertEqual(client, "client")


if __name__ == "__main__":
    unittest.main()
