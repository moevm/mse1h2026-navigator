import pytest
import json
import os
from unittest.mock import patch, Mock, MagicMock, mock_open
from src.services.aggregator import (
    add_missing_expansion_edges,
    build_cache_key,
    get_node_names,
    get_skill_graph_data,
    limit_skill_list,
    merge_mock_graph_with_initial_technologies,
    merge_skill_lists,
    normalize_edge,
    normalize_edges,
    normalize_initial_technologies,
    should_use_disk_cache,
    should_use_relation_llm,
    should_use_skills_llm,
)
from src.model.base import SkillEdge


class TestAggregator:
    """Test cases for aggregator functions"""

    def test_get_node_names_from_relations(self):
        """Test extracting node names from relations"""
        edges = [
            SkillEdge(from_skill="Python", to_skill="Django"),
            SkillEdge(from_skill="Django", to_skill="REST API"),
            SkillEdge(from_skill="REST API", to_skill="FastAPI"),
        ]
        
        nodes = get_node_names(edges)
        
        assert set(nodes) == {"Python", "Django", "REST API", "FastAPI"}
        assert len(nodes) == 4

    def test_get_node_names_empty_relations(self):
        """Test extracting nodes from empty relations list"""
        edges = []
        nodes = get_node_names(edges)
        
        assert nodes == []

    def test_get_node_names_single_edge(self):
        """Test extracting nodes from single edge"""
        edges = [SkillEdge(from_skill="Python", to_skill="JavaScript")]
        nodes = get_node_names(edges)
        
        assert set(nodes) == {"Python", "JavaScript"}

    def test_get_node_names_removes_duplicates(self):
        """Test that node names are deduplicated"""
        edges = [
            SkillEdge(from_skill="Python", to_skill="Django"),
            SkillEdge(from_skill="Python", to_skill="FastAPI"),
            SkillEdge(from_skill="JavaScript", to_skill="Django"),
        ]
        
        nodes = get_node_names(edges)
        
        # Django appears twice as to_skill but should be in list only once
        assert nodes.count("Django") == 1

    @patch("src.services.aggregator.SkillsRelationFinder")
    @patch("src.services.aggregator.SkillRelationNormalizer")
    @patch("src.services.aggregator.SkillsNormalizer")
    @patch("src.services.aggregator.SkillsFinder")
    def test_get_skill_graph_data_success(self, mock_finder, mock_normalizer,
                                         mock_relation_normalizer, 
                                         mock_relation_finder):
        """Test successful skill graph data retrieval"""
        # Setup mocks
        mock_finder_instance = MagicMock()
        mock_finder_instance.get_skills_list.return_value = ["Python", "Django"]
        mock_finder.return_value = mock_finder_instance
        
        mock_normalizer_instance = MagicMock()
        mock_normalizer_instance.get_normalized_skills.return_value = ["Python", "Django"]
        mock_normalizer.return_value = mock_normalizer_instance
        
        mock_relation_finder_instance = MagicMock()
        mock_relation_finder_instance.find_skill_relations.return_value = [
            {"from_skill": "Python", "to_skill": "Django"}
        ]
        mock_relation_finder.return_value = mock_relation_finder_instance
        
        mock_relation_normalizer_instance = MagicMock()
        mock_relation_normalizer_instance.get_normalized_relations.return_value = MagicMock(
            edges=[SkillEdge(from_skill="Python", to_skill="Django")]
        )
        mock_relation_normalizer.return_value = mock_relation_normalizer_instance
        
        result = get_skill_graph_data("Backend Developer", is_mock=False, use_cache=False)
        
        assert "nodes" in result
        assert "edges" in result
        assert len(result["nodes"]) > 0

    def test_get_skill_graph_data_with_mock_file(self, temp_cache_dir, mock_cache_file):
        """Test that mock file is used when is_mock=True"""
        result = get_skill_graph_data("Any Profession", is_mock=True, use_cache=False)
        
        assert "nodes" in result
        assert "edges" in result
        expected_nodes = ["Backend Developer", "Python", "Django", "PostgreSQL"]
        assert set(result["nodes"]) == set(expected_nodes)

    @patch("src.services.aggregator.SkillsRelationFinder")
    @patch("src.services.aggregator.SkillRelationNormalizer")
    @patch("src.services.aggregator.SkillsNormalizer")
    @patch("src.services.aggregator.SkillsFinder")
    def test_get_skill_graph_data_uses_cache_skills(self, mock_finder, 
                                                    mock_normalizer,
                                                    mock_relation_normalizer, 
                                                    mock_relation_finder,
                                                    temp_cache_dir):
        """Test that cached skills are used when use_cache=True"""
        # Create cache file
        cache_data = ["Python", "Django"]
        cache_file = temp_cache_dir / "normalized_skills_test_profession.json"
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(cache_data, f)
        
        # Setup mocks
        mock_finder.return_value = MagicMock()
        mock_normalizer.return_value = MagicMock()
        
        mock_relation_finder_instance = MagicMock()
        mock_relation_finder_instance.find_skill_relations.return_value = []
        mock_relation_finder.return_value = mock_relation_finder_instance
        
        mock_relation_normalizer_instance = MagicMock()
        mock_relation_normalizer_instance.get_normalized_relations.return_value = MagicMock(
            edges=[]
        )
        mock_relation_normalizer.return_value = mock_relation_normalizer_instance
        
        result = get_skill_graph_data("test_profession", is_mock=False, use_cache=True)
        
        # Verify SkillsFinder was not called
        mock_finder.assert_not_called()
        assert "nodes" in result
        assert "edges" in result

    @patch("src.services.aggregator.SkillsRelationFinder")
    @patch("src.services.aggregator.SkillRelationNormalizer")
    @patch("src.services.aggregator.SkillsNormalizer")
    @patch("src.services.aggregator.SkillsFinder")
    def test_get_skill_graph_data_uses_cache_relations(self, mock_finder, 
                                                       mock_normalizer,
                                                       mock_relation_normalizer, 
                                                       mock_relation_finder,
                                                       temp_cache_dir):
        """Test that cached relations are used when use_cache=True"""
        # Create cache file for relations
        cache_data = [{"from_skill": "Python", "to_skill": "Django"}]
        cache_file = temp_cache_dir / "skill_relations_test_profession.json"
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(cache_data, f)
        
        # Also create skills cache
        skills_cache = temp_cache_dir / "normalized_skills_test_profession.json"
        with open(skills_cache, "w", encoding="utf-8") as f:
            json.dump(["Python", "Django"], f)
        
        # Setup mocks
        mock_finder.return_value = MagicMock()
        mock_normalizer.return_value = MagicMock()
        
        mock_relation_normalizer_instance = MagicMock()
        mock_relation_normalizer_instance.get_normalized_relations.return_value = MagicMock(
            edges=[SkillEdge(from_skill="Python", to_skill="Django")]
        )
        mock_relation_normalizer.return_value = mock_relation_normalizer_instance
        
        result = get_skill_graph_data("test_profession", is_mock=False, use_cache=True)
        
        # Verify SkillsRelationFinder was not called
        mock_relation_finder.assert_not_called()
        assert "nodes" in result

    def test_get_skill_graph_data_cache_filename_normalization(self, temp_cache_dir):
        """Test that profession names are normalized for cache filenames"""
        job_title = "Senior Backend Developer"
        
        # Mock all dependencies
        with patch("src.services.aggregator.SkillsFinder") as mock_finder:
            with patch("src.services.aggregator.SkillsNormalizer") as mock_normalizer:
                with patch("src.services.aggregator.SkillsRelationFinder") as mock_rel_finder:
                    with patch("src.services.aggregator.SkillRelationNormalizer") as mock_rel_norm:
                        
                        mock_finder_instance = MagicMock()
                        mock_finder_instance.get_skills_list.return_value = ["Python"]
                        mock_finder.return_value = mock_finder_instance
                        
                        mock_normalizer_instance = MagicMock()
                        mock_normalizer_instance.get_normalized_skills.return_value = ["Python"]
                        mock_normalizer.return_value = mock_normalizer_instance
                        
                        mock_rel_finder_instance = MagicMock()
                        mock_rel_finder_instance.find_skill_relations.return_value = []
                        mock_rel_finder.return_value = mock_rel_finder_instance
                        
                        mock_rel_norm_instance = MagicMock()
                        mock_rel_norm_instance.get_normalized_relations.return_value = MagicMock(
                            edges=[]
                        )
                        mock_rel_norm.return_value = mock_rel_norm_instance
                        
                        result = get_skill_graph_data(job_title, is_mock=False, use_cache=True)
                        
                        # Check cache file was created with normalized name
                        expected_file = temp_cache_dir / "normalized_skills_senior_backend_developer.json"
                        assert expected_file.exists()

    def test_get_skill_graph_data_returns_correct_structure(self):
        """Test that result has correct structure"""
        with patch("src.services.aggregator.SkillsFinder") as mock_finder:
            with patch("src.services.aggregator.SkillsNormalizer") as mock_normalizer:
                with patch("src.services.aggregator.SkillsRelationFinder") as mock_rel_finder:
                    with patch("src.services.aggregator.SkillRelationNormalizer") as mock_rel_norm:
                        
                        mock_finder_instance = MagicMock()
                        mock_finder_instance.get_skills_list.return_value = ["Python", "Django"]
                        mock_finder.return_value = mock_finder_instance
                        
                        mock_normalizer_instance = MagicMock()
                        mock_normalizer_instance.get_normalized_skills.return_value = ["Python", "Django"]
                        mock_normalizer.return_value = mock_normalizer_instance
                        
                        mock_rel_finder_instance = MagicMock()
                        mock_rel_finder_instance.find_skill_relations.return_value = [
                            {"from_skill": "Python", "to_skill": "Django"}
                        ]
                        mock_rel_finder.return_value = mock_rel_finder_instance
                        
                        edges = [SkillEdge(from_skill="Python", to_skill="Django")]
                        mock_rel_norm_instance = MagicMock()
                        mock_rel_norm_instance.get_normalized_relations.return_value = MagicMock(
                            edges=edges
                        )
                        mock_rel_norm.return_value = mock_rel_norm_instance
                        
                        result = get_skill_graph_data("Developer", is_mock=False, use_cache=False)
                        
                        assert isinstance(result, dict)
                        assert "nodes" in result and "edges" in result
                        assert isinstance(result["nodes"], list)
                        assert isinstance(result["edges"], list)


class TestAggregatorHelpers:
    def test_normalize_initial_technologies_dedup(self):
        result = normalize_initial_technologies(["  Python ", "python", "", "Go "])
        assert result == ["Python", "Go"]

    def test_merge_skill_lists_prefers_initial(self):
        result = merge_skill_lists(["Python"], ["Go", "Python"])
        assert result[0] == "Python"
        assert "Go" in result

    def test_limit_skill_list_respects_max(self):
        with patch.dict(os.environ, {"GRAPH_DATA_SERVICE_MAX_SKILLS": "3"}):
            result = limit_skill_list(["Go", "Rust", "Python", "JS"], ["Python"])
        assert len(result) == 3
        assert "Python" in result

    def test_normalize_edges_dedup_and_filter(self):
        edges = [
            {"from_skill": "Python", "to_skill": "Django"},
            {"from_skill": "python", "to_skill": "django"},
            {"from_skill": "Go", "to_skill": "Go"},
            {"from_skill": None, "to_skill": "Rust"},
        ]
        result = normalize_edges(edges)
        assert result == [{"from_skill": "Python", "to_skill": "Django"}]

    def test_add_missing_expansion_edges_adds_anchor(self):
        result = add_missing_expansion_edges([], ["Python", "Go"], ["Python"])
        assert result == [{"from_skill": "Python", "to_skill": "Go"}]

    def test_normalize_edge_from_object(self):
        edge = SkillEdge(from_skill="Python", to_skill="Django")
        result = normalize_edge(edge)
        assert result == {"from_skill": "Python", "to_skill": "Django"}

    def test_normalize_edge_invalid(self):
        result = normalize_edge({"from_skill": "", "to_skill": "Django"})
        assert result is None

    def test_merge_mock_graph_with_initial_technologies(self):
        mock_graph = {
            "nodes": ["Python"],
            "edges": [{"from_skill": "Python", "to_skill": "Django"}],
        }
        result = merge_mock_graph_with_initial_technologies(mock_graph, ["Go", "Python"])
        assert "Go" in result["nodes"]
        assert {"from_skill": "Go", "to_skill": "Python"} in result["edges"]

    def test_build_cache_key_with_seeds(self):
        key = build_cache_key("Backend Developer", ["Python", "Go"])
        assert key == "backend_developer__seed_python_go"

    def test_should_use_llm_flags_true(self):
        with patch.dict(
            os.environ,
            {
                "GRAPH_DATA_SERVICE_USE_SKILLS_LLM": "true",
                "GRAPH_DATA_SERVICE_USE_RELATION_LLM": "1",
                "GRAPH_DATA_SERVICE_USE_DISK_CACHE": "yes",
            },
        ):
            assert should_use_skills_llm() is True
            assert should_use_relation_llm() is True
            assert should_use_disk_cache() is True

    def test_should_use_llm_flags_false(self):
        with patch.dict(
            os.environ,
            {
                "GRAPH_DATA_SERVICE_USE_SKILLS_LLM": "false",
                "GRAPH_DATA_SERVICE_USE_RELATION_LLM": "0",
                "GRAPH_DATA_SERVICE_USE_DISK_CACHE": "no",
            },
        ):
            assert should_use_skills_llm() is False
            assert should_use_relation_llm() is False
            assert should_use_disk_cache() is False

    def test_add_missing_expansion_edges_no_anchor(self):
        result = add_missing_expansion_edges([], ["Python", "Go"], [])
        assert result == [{"from_skill": "Python", "to_skill": "Go"}]

    def test_add_missing_expansion_edges_fills_empty(self):
        result = add_missing_expansion_edges([], ["Python", "Go", "Rust"], [])
        assert result == [
            {"from_skill": "Python", "to_skill": "Go"},
            {"from_skill": "Python", "to_skill": "Rust"},
        ]


class TestAggregatorCacheAndLLM:
    def test_get_skill_graph_data_uses_cached_graph(self):
        cached_graph = {"nodes": ["HTTP"], "edges": []}
        with patch("src.services.aggregator.get_cached_graph", return_value=cached_graph):
            result = get_skill_graph_data("Backend Developer", use_cache=True)
        assert result == cached_graph

    def test_get_skill_graph_data_rebuilds_when_cache_only_seeds(self, temp_cache_dir):
        cache_file = (
            temp_cache_dir / "normalized_skills_backend_developer__seed_python_go.json"
        )
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(["Python"], f)

        with (
            patch("src.services.aggregator.SkillsFinder") as mock_finder,
            patch("src.services.aggregator.SkillsNormalizer") as mock_normalizer,
            patch("src.services.aggregator.SkillsRelationFinder") as mock_rel_finder,
            patch("src.services.aggregator.SkillRelationNormalizer") as mock_rel_norm,
        ):
            mock_finder.return_value.get_skills_list.return_value = ["Go"]
            mock_normalizer.return_value.get_normalized_skills.return_value = ["Go"]
            mock_rel_finder.return_value.find_skill_relations.return_value = []
            mock_rel_norm.return_value.get_normalized_relations.return_value = MagicMock(
                edges=[]
            )

            result = get_skill_graph_data(
                "Backend Developer",
                initial_technologies=["Python", "Go"],
                use_cache=True,
            )

        assert "Python" in result["nodes"]
        assert "Go" in result["nodes"]

    def test_get_skill_graph_data_skills_llm_error_fallback(self, temp_cache_dir):
        with (
            patch.dict(os.environ, {"GRAPH_DATA_SERVICE_USE_SKILLS_LLM": "true"}),
            patch("src.services.aggregator.SkillsFinder") as mock_finder,
            patch("src.services.aggregator.SkillsNormalizer") as mock_normalizer,
            patch("src.services.aggregator.SkillsRelationFinder") as mock_rel_finder,
            patch("src.services.aggregator.SkillRelationNormalizer") as mock_rel_norm,
        ):
            mock_finder.return_value.get_skills_list.return_value = ["Python"]
            mock_normalizer.return_value.get_normalized_skills.side_effect = RuntimeError(
                "boom"
            )
            mock_rel_finder.return_value.find_skill_relations.return_value = []
            mock_rel_norm.return_value.get_normalized_relations.return_value = MagicMock(
                edges=[]
            )

            result = get_skill_graph_data("Backend Developer", use_cache=False)

        assert "Python" in result["nodes"]

    def test_get_skill_graph_data_relation_llm_error_fallback(self, temp_cache_dir):
        with (
            patch.dict(os.environ, {"GRAPH_DATA_SERVICE_USE_RELATION_LLM": "true"}),
            patch("src.services.aggregator.SkillsFinder") as mock_finder,
            patch("src.services.aggregator.SkillsNormalizer") as mock_normalizer,
            patch("src.services.aggregator.SkillsRelationFinder") as mock_rel_finder,
            patch("src.services.aggregator.SkillRelationNormalizer") as mock_rel_norm,
        ):
            mock_finder.return_value.get_skills_list.return_value = ["Python"]
            mock_normalizer.return_value.get_normalized_skills.return_value = ["Python"]
            mock_rel_finder.return_value.find_skill_relations.return_value = [
                {"from_skill": "Python", "to_skill": "Django"}
            ]
            mock_rel_norm.return_value.get_normalized_relations.side_effect = RuntimeError(
                "boom"
            )

            result = get_skill_graph_data("Backend Developer", use_cache=False)

        assert result["edges"] == [{"from_skill": "Python", "to_skill": "Django"}]
