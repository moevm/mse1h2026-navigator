import json
import os
import sys
import types
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch


class PlaceholderService:
    pass


def stub_service_module(module_name, **attrs):
    module = types.ModuleType(module_name)
    for attr_name, attr_value in attrs.items():
        setattr(module, attr_name, attr_value)
    sys.modules[module_name] = module


stub_service_module(
    "src.services.skills_finder",
    SkillsFinder=PlaceholderService,
)
stub_service_module(
    "src.services.skills_normalizer",
    SkillsNormalizer=PlaceholderService,
)
stub_service_module(
    "src.services.skills_relation_finder",
    SkillsRelationFinder=PlaceholderService,
)
stub_service_module(
    "src.services.skills_relations_normalizer",
    SkillRelationNormalizer=PlaceholderService,
)

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


if __name__ == "__main__":
    unittest.main()
