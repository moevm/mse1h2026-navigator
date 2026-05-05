import pytest
import json
import os
from unittest.mock import patch, Mock, MagicMock, mock_open
from src.services.aggregator import get_skill_graph_data, get_node_names
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
