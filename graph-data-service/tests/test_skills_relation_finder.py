import pytest
from unittest.mock import patch, Mock, MagicMock
from src.services.skills_relation_finder import SkillsRelationFinder


class TestSkillsRelationFinder:
    """Test cases for SkillsRelationFinder class"""

    def test_skills_relation_finder_initialization(self, sample_profession_name, 
                                                   sample_skills_list):
        """Test SkillsRelationFinder initialization"""
        with patch("SPARQLWrapper.SPARQLWrapper"):
            finder = SkillsRelationFinder(sample_profession_name, sample_skills_list)
            
            assert finder._profession_name == sample_profession_name
            assert finder._skills_list == sample_skills_list
            assert len(finder._uris_map) == len(sample_skills_list)

    def test_skills_relation_finder_uris_mapping(self, sample_profession_name):
        """Test that skills are mapped to URIs"""
        skills = ["Python", "JavaScript"]
        
        with patch("SPARQLWrapper.SPARQLWrapper"):
            finder = SkillsRelationFinder(sample_profession_name, skills)
            
            assert "Python" in finder._uris_map
            assert "JavaScript" in finder._uris_map

    @patch("SPARQLWrapper.SPARQLWrapper")
    def test_find_skill_relations_empty_skills(self, mock_sparql_wrapper, 
                                               sample_profession_name):
        """Test finding relations for empty skills list"""
        with patch("SPARQLWrapper.SPARQLWrapper"):
            finder = SkillsRelationFinder(sample_profession_name, [])
            relations = finder.find_skill_relations()
            
            assert relations == []

    @patch("SPARQLWrapper.SPARQLWrapper")
    def test_find_skill_relations_format(self, mock_sparql_wrapper, 
                                        sample_profession_name, sample_skills_list):
        """Test that relations are returned in correct format"""
        with patch("SPARQLWrapper.SPARQLWrapper"):
            finder = SkillsRelationFinder(sample_profession_name, sample_skills_list)
            
            # Mock the _find_links method to return empty results
            with patch.object(finder, '_SkillsRelationFinder__find_links', 
                            return_value=[]):
                relations = finder.find_skill_relations()
            
            assert isinstance(relations, list)
            assert all(isinstance(r, dict) for r in relations)
            assert all("from_skill" in r and "to_skill" in r for r in relations)

    @patch("SPARQLWrapper.SPARQLWrapper")
    def test_find_skill_relations_graph_created(self, mock_sparql_wrapper,
                                                sample_profession_name, sample_skills_list):
        """Test that graph is properly initialized"""
        with patch("SPARQLWrapper.SPARQLWrapper"):
            finder = SkillsRelationFinder(sample_profession_name, sample_skills_list)
            
            # Check that graph contains all skills as nodes
            assert len(finder._graph.nodes()) == len(sample_skills_list)
            for skill in sample_skills_list:
                assert skill in finder._graph.nodes()

    @patch("SPARQLWrapper.SPARQLWrapper")
    def test_dbpedia_resource_uri_format(self, mock_sparql_wrapper, 
                                         sample_profession_name, sample_skills_list):
        """Test that DBPedia resource URIs are correctly formatted"""
        with patch("SPARQLWrapper.SPARQLWrapper"):
            finder = SkillsRelationFinder(sample_profession_name, sample_skills_list)
            
            # Check URI format
            for skill, uri in finder._uris_map.items():
                if uri:  # Only check non-empty URIs
                    assert "dbpedia.org" in uri

    @patch("SPARQLWrapper.SPARQLWrapper")
    def test_find_skill_relations_deduplication(self, mock_sparql_wrapper,
                                                sample_profession_name):
        """Test that duplicate relations are handled"""
        skills = ["Python", "JavaScript"]
        
        with patch("SPARQLWrapper.SPARQLWrapper"):
            finder = SkillsRelationFinder(sample_profession_name, skills)
            
            # Mock multiple calls returning the same link
            with patch.object(finder, '_SkillsRelationFinder__find_links',
                            side_effect=[["http://dbpedia.org/resource/JavaScript"],
                                        []]):
                with patch.object(finder, '_SkillsRelationFinder__extract_name_from_uri',
                                return_value="JavaScript"):
                    relations = finder.find_skill_relations()
            
            # Should only have one relation
            assert len([r for r in relations 
                       if r["from_skill"] == "Python" and r["to_skill"] == "JavaScript"]) <= 1

    def test_sparql_endpoint_configured(self, sample_profession_name, sample_skills_list):
        """Test that SPARQL endpoint is properly configured"""
        with patch("SPARQLWrapper.SPARQLWrapper") as mock_sparql:
            finder = SkillsRelationFinder(sample_profession_name, sample_skills_list)
            
            assert finder._endpoint == "https://dbpedia.org/sparql"
