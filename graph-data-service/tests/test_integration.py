import pytest
from unittest.mock import patch, MagicMock
from src.services.aggregator import get_skill_graph_data
from src.services.skills_finder import SkillsFinder
from src.services.skills_normalizer import SkillsNormalizer
from src.services.skills_relation_finder import SkillsRelationFinder
from src.services.skills_relations_normalizer import SkillRelationNormalizer
from src.model.base import SkillEdge


class TestIntegrationAggregator:
    """Integration tests for the complete aggregation pipeline"""

    @patch("src.services.aggregator.SkillsRelationFinder")
    @patch("src.services.aggregator.SkillRelationNormalizer")
    @patch("src.services.aggregator.SkillsNormalizer")
    @patch("src.services.aggregator.SkillsFinder")
    def test_complete_workflow_success(self, mock_finder, mock_normalizer,
                                      mock_relation_normalizer, 
                                      mock_relation_finder):
        """Test complete workflow from skills discovery to graph generation"""
        # Setup the chain of mocks
        finder_instance = MagicMock()
        finder_instance.get_skills_list.return_value = [
            "Python", "JavaScript", "React", "Node.js", "Express"
        ]
        mock_finder.return_value = finder_instance
        
        normalizer_instance = MagicMock()
        normalizer_instance.get_normalized_skills.return_value = [
            "Python", "JavaScript", "React", "Node.js", "Express"
        ]
        mock_normalizer.return_value = normalizer_instance
        
        relation_finder_instance = MagicMock()
        relation_finder_instance.find_skill_relations.return_value = [
            {"from_skill": "Python", "to_skill": "Django"},
            {"from_skill": "JavaScript", "to_skill": "React"},
            {"from_skill": "Node.js", "to_skill": "Express"},
        ]
        mock_relation_finder.return_value = relation_finder_instance
        
        edges = [
            SkillEdge(from_skill="Backend Developer", to_skill="Python"),
            SkillEdge(from_skill="Python", to_skill="Django"),
            SkillEdge(from_skill="Backend Developer", to_skill="JavaScript"),
            SkillEdge(from_skill="JavaScript", to_skill="React"),
        ]
        relation_normalizer_instance = MagicMock()
        relation_normalizer_instance.get_normalized_relations.return_value = MagicMock(
            edges=edges
        )
        mock_relation_normalizer.return_value = relation_normalizer_instance
        
        # Execute
        result = get_skill_graph_data("Backend Developer", is_mock=False, use_cache=False)
        
        # Verify the complete pipeline was executed
        assert mock_finder.called
        assert mock_normalizer.called
        assert mock_relation_finder.called
        assert mock_relation_normalizer.called
        
        # Verify output structure
        assert "nodes" in result
        assert "edges" in result
        assert len(result["nodes"]) >= 5
        assert len(result["edges"]) >= 1

    @patch("src.services.aggregator.SkillsRelationFinder")
    @patch("src.services.aggregator.SkillRelationNormalizer")
    @patch("src.services.aggregator.SkillsNormalizer")
    @patch("src.services.aggregator.SkillsFinder")
    def test_workflow_with_no_relations(self, mock_finder, mock_normalizer,
                                       mock_relation_normalizer, 
                                       mock_relation_finder):
        """Test workflow when no relations are found"""
        finder_instance = MagicMock()
        finder_instance.get_skills_list.return_value = ["Python"]
        mock_finder.return_value = finder_instance
        
        normalizer_instance = MagicMock()
        normalizer_instance.get_normalized_skills.return_value = ["Python"]
        mock_normalizer.return_value = normalizer_instance
        
        relation_finder_instance = MagicMock()
        relation_finder_instance.find_skill_relations.return_value = []
        mock_relation_finder.return_value = relation_finder_instance
        
        relation_normalizer_instance = MagicMock()
        relation_normalizer_instance.get_normalized_relations.return_value = MagicMock(
            edges=[]
        )
        mock_relation_normalizer.return_value = relation_normalizer_instance
        
        result = get_skill_graph_data("Minimal Developer", is_mock=False, use_cache=False)
        
        assert "nodes" in result
        assert "edges" in result
        assert len(result["edges"]) == 0
        assert "Python" in result["nodes"]

    @patch("src.services.aggregator.SkillsRelationFinder")
    @patch("src.services.aggregator.SkillRelationNormalizer")
    @patch("src.services.aggregator.SkillsNormalizer")
    @patch("src.services.aggregator.SkillsFinder")
    def test_workflow_service_instantiation(self, mock_finder, mock_normalizer,
                                           mock_relation_normalizer, 
                                           mock_relation_finder):
        """Test that services are instantiated with correct parameters"""
        finder_instance = MagicMock()
        finder_instance.get_skills_list.return_value = []
        mock_finder.return_value = finder_instance
        
        normalizer_instance = MagicMock()
        normalizer_instance.get_normalized_skills.return_value = []
        mock_normalizer.return_value = normalizer_instance
        
        relation_finder_instance = MagicMock()
        relation_finder_instance.find_skill_relations.return_value = []
        mock_relation_finder.return_value = relation_finder_instance
        
        relation_normalizer_instance = MagicMock()
        relation_normalizer_instance.get_normalized_relations.return_value = MagicMock(
            edges=[]
        )
        mock_relation_normalizer.return_value = relation_normalizer_instance
        
        job_title = "Test Developer"
        result = get_skill_graph_data(job_title, is_mock=False, use_cache=False)
        
        # Verify SkillsFinder was instantiated with job_title
        mock_finder.assert_called_once_with(job_title)
        
        # Verify SkillsNormalizer was instantiated
        assert mock_normalizer.called
        
        # Verify SkillsRelationFinder was instantiated
        assert mock_relation_finder.called

    @patch("src.services.aggregator.SkillsRelationFinder")
    @patch("src.services.aggregator.SkillRelationNormalizer")
    @patch("src.services.aggregator.SkillsNormalizer")
    @patch("src.services.aggregator.SkillsFinder")
    def test_workflow_with_large_skill_set(self, mock_finder, mock_normalizer,
                                          mock_relation_normalizer, 
                                          mock_relation_finder):
        """Test workflow with large number of skills"""
        # Create a large list of skills
        skills = [f"Skill_{i}" for i in range(50)]
        
        finder_instance = MagicMock()
        finder_instance.get_skills_list.return_value = skills
        mock_finder.return_value = finder_instance
        
        normalizer_instance = MagicMock()
        normalizer_instance.get_normalized_skills.return_value = skills
        mock_normalizer.return_value = normalizer_instance
        
        # Create many relations
        relations = []
        for i in range(len(skills) - 1):
            relations.append({
                "from_skill": skills[i],
                "to_skill": skills[i + 1]
            })
        
        relation_finder_instance = MagicMock()
        relation_finder_instance.find_skill_relations.return_value = relations
        mock_relation_finder.return_value = relation_finder_instance
        
        edges = [SkillEdge(from_skill=r["from_skill"], to_skill=r["to_skill"]) 
                for r in relations[:20]]  # Limit for test
        relation_normalizer_instance = MagicMock()
        relation_normalizer_instance.get_normalized_relations.return_value = MagicMock(
            edges=edges
        )
        mock_relation_normalizer.return_value = relation_normalizer_instance
        
        result = get_skill_graph_data("Large Developer", is_mock=False, use_cache=False)
        
        assert len(result["nodes"]) == 50
        assert len(result["edges"]) > 0


class TestIntegrationWithRealModels:
    """Integration tests using real model classes"""

    def test_profession_request_to_graph_data(self):
        """Test that ProfessionRequest flows to graph data correctly"""
        from src.model.routes import ProfessionRequest
        
        request = ProfessionRequest(
            profession_title="Backend Developer",
            is_mock=False,
            use_cache=False
        )
        
        assert request.profession_title == "Backend Developer"
        assert not request.is_mock
        assert not request.use_cache

    def test_skill_edge_list_to_roadmap(self):
        """Test that skill edges form a valid roadmap"""
        from src.model.base import ProfessionRoadmap
        
        edges = [
            SkillEdge(from_skill="Start", to_skill="Python"),
            SkillEdge(from_skill="Python", to_skill="Django"),
            SkillEdge(from_skill="Python", to_skill="FastAPI"),
        ]
        
        roadmap = ProfessionRoadmap(edges=edges)
        
        assert len(roadmap.edges) == 3
        # Count nodes
        nodes = set()
        for edge in roadmap.edges:
            nodes.add(edge.from_skill)
            nodes.add(edge.to_skill)
        
        assert len(nodes) == 4

    def test_normalized_skill_in_roadmap(self):
        """Test normalized skills in roadmap context"""
        from src.model.base import NormalizedSkill, ProfessionRoadmap
        
        normalized = NormalizedSkill(skills=["Python", "Django", "REST API"])
        
        edges = [
            SkillEdge(from_skill="Start", to_skill=normalized.skills[0]),
            SkillEdge(from_skill=normalized.skills[0], to_skill=normalized.skills[1]),
        ]
        
        roadmap = ProfessionRoadmap(edges=edges)
        
        assert roadmap.edges[0].to_skill == "Python"
        assert roadmap.edges[1].from_skill == "Python"


class TestDataFlowIntegration:
    """Test data flow between components"""

    def test_skills_to_relations_flow(self):
        """Test that skills flow correctly to relation finder"""
        skills = ["Python", "Django", "PostgreSQL"]
        
        with patch("SPARQLWrapper.SPARQLWrapper"):
            finder = SkillsRelationFinder("Backend Developer", skills)
            
            # Check that all skills are registered
            assert len(finder._skills_list) == 3
            assert len(finder._uris_map) == 3
            
            # Check that graph contains all skills as nodes
            for skill in skills:
                assert skill in finder._graph.nodes()

    @patch("src.services.aggregator.SkillsRelationFinder")
    @patch("src.services.aggregator.SkillRelationNormalizer")
    @patch("src.services.aggregator.SkillsNormalizer")
    @patch("src.services.aggregator.SkillsFinder")
    def test_skill_list_to_normalized_flow(self, mock_finder, mock_normalizer,
                                          mock_relation_normalizer, 
                                          mock_relation_finder):
        """Test that raw skills are properly normalized through pipeline"""
        raw_skills = ["Python Programming", "JavaScript ES6", "React JS"]
        normalized_skills = ["Python", "JavaScript", "React"]
        
        finder_instance = MagicMock()
        finder_instance.get_skills_list.return_value = raw_skills
        mock_finder.return_value = finder_instance
        
        normalizer_instance = MagicMock()
        normalizer_instance.get_normalized_skills.return_value = normalized_skills
        mock_normalizer.return_value = normalizer_instance
        
        relation_finder_instance = MagicMock()
        relation_finder_instance.find_skill_relations.return_value = []
        mock_relation_finder.return_value = relation_finder_instance
        
        relation_normalizer_instance = MagicMock()
        relation_normalizer_instance.get_normalized_relations.return_value = MagicMock(
            edges=[]
        )
        mock_relation_normalizer.return_value = relation_normalizer_instance
        
        result = get_skill_graph_data("Developer", is_mock=False, use_cache=False)
        
        # Verify that normalized skills are in the output
        for skill in normalized_skills:
            assert skill in result["nodes"]
