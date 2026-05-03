import pytest
from pydantic import ValidationError
from src.model.base import NormalizedSkill, SkillEdge, ProfessionRoadmap
from src.model.routes import ProfessionRequest


class TestNormalizedSkill:
    """Test cases for NormalizedSkill model"""

    def test_normalized_skill_valid(self):
        """Test valid NormalizedSkill creation"""
        skill = NormalizedSkill(skills=["Python", "JavaScript", "React"])
        
        assert skill.skills == ["Python", "JavaScript", "React"]

    def test_normalized_skill_empty_list(self):
        """Test NormalizedSkill with empty list"""
        skill = NormalizedSkill(skills=[])
        
        assert skill.skills == []

    def test_normalized_skill_single_skill(self):
        """Test NormalizedSkill with single skill"""
        skill = NormalizedSkill(skills=["Python"])
        
        assert skill.skills == ["Python"]

    def test_normalized_skill_missing_required_field(self):
        """Test that missing skills field raises error"""
        with pytest.raises(ValidationError):
            NormalizedSkill()

    def test_normalized_skill_wrong_type(self):
        """Test that wrong type for skills raises error"""
        with pytest.raises(ValidationError):
            NormalizedSkill(skills="not a list")

    def test_normalized_skill_with_unicode(self):
        """Test NormalizedSkill with unicode characters"""
        skill = NormalizedSkill(skills=["Python", "JavaScript", "Разработка"])
        
        assert "Разработка" in skill.skills


class TestSkillEdge:
    """Test cases for SkillEdge model"""

    def test_skill_edge_valid(self):
        """Test valid SkillEdge creation"""
        edge = SkillEdge(from_skill="Python", to_skill="Django")
        
        assert edge.from_skill == "Python"
        assert edge.to_skill == "Django"

    def test_skill_edge_same_skill(self):
        """Test SkillEdge where from and to are same"""
        edge = SkillEdge(from_skill="Python", to_skill="Python")
        
        assert edge.from_skill == edge.to_skill

    def test_skill_edge_missing_from_skill(self):
        """Test that missing from_skill raises error"""
        with pytest.raises(ValidationError):
            SkillEdge(to_skill="Django")

    def test_skill_edge_missing_to_skill(self):
        """Test that missing to_skill raises error"""
        with pytest.raises(ValidationError):
            SkillEdge(from_skill="Python")

    def test_skill_edge_empty_skills(self):
        """Test SkillEdge with empty strings"""
        edge = SkillEdge(from_skill="", to_skill="")
        
        assert edge.from_skill == ""
        assert edge.to_skill == ""

    def test_skill_edge_with_unicode(self):
        """Test SkillEdge with unicode"""
        edge = SkillEdge(from_skill="Python", to_skill="Разработка")
        
        assert edge.to_skill == "Разработка"


class TestProfessionRoadmap:
    """Test cases for ProfessionRoadmap model"""

    def test_profession_roadmap_valid(self):
        """Test valid ProfessionRoadmap creation"""
        edges = [
            SkillEdge(from_skill="Python", to_skill="Django"),
            SkillEdge(from_skill="Django", to_skill="REST API"),
        ]
        roadmap = ProfessionRoadmap(edges=edges)
        
        assert len(roadmap.edges) == 2
        assert roadmap.edges[0].from_skill == "Python"

    def test_profession_roadmap_empty_edges(self):
        """Test ProfessionRoadmap with empty edges"""
        roadmap = ProfessionRoadmap(edges=[])
        
        assert roadmap.edges == []

    def test_profession_roadmap_single_edge(self):
        """Test ProfessionRoadmap with single edge"""
        edges = [SkillEdge(from_skill="Start", to_skill="End")]
        roadmap = ProfessionRoadmap(edges=edges)
        
        assert len(roadmap.edges) == 1

    def test_profession_roadmap_missing_edges(self):
        """Test that missing edges field raises error"""
        with pytest.raises(ValidationError):
            ProfessionRoadmap()

    def test_profession_roadmap_wrong_type_edges(self):
        """Test that wrong type for edges raises error"""
        with pytest.raises(ValidationError):
            ProfessionRoadmap(edges="not a list")

    def test_profession_roadmap_complex_graph(self):
        """Test ProfessionRoadmap with complex edge structure"""
        edges = [
            SkillEdge(from_skill="Backend Developer", to_skill="Python"),
            SkillEdge(from_skill="Python", to_skill="Django"),
            SkillEdge(from_skill="Python", to_skill="FastAPI"),
            SkillEdge(from_skill="Backend Developer", to_skill="Database"),
            SkillEdge(from_skill="Database", to_skill="PostgreSQL"),
        ]
        roadmap = ProfessionRoadmap(edges=edges)
        
        assert len(roadmap.edges) == 5
        # Count outgoing edges from Backend Developer
        backend_edges = [e for e in roadmap.edges if e.from_skill == "Backend Developer"]
        assert len(backend_edges) == 2


class TestProfessionRequest:
    """Test cases for ProfessionRequest model"""

    def test_profession_request_required_field(self):
        """Test valid ProfessionRequest with only required field"""
        request = ProfessionRequest(profession_title="Backend Developer")
        
        assert request.profession_title == "Backend Developer"
        assert request.is_mock is False
        assert request.use_cache is True

    def test_profession_request_all_fields(self):
        """Test ProfessionRequest with all fields"""
        request = ProfessionRequest(
            profession_title="Frontend Developer",
            is_mock=True,
            use_cache=False
        )
        
        assert request.profession_title == "Frontend Developer"
        assert request.is_mock is True
        assert request.use_cache is False

    def test_profession_request_missing_title(self):
        """Test that missing profession_title raises error"""
        with pytest.raises(ValidationError):
            ProfessionRequest()

    def test_profession_request_default_is_mock(self):
        """Test default value for is_mock"""
        request = ProfessionRequest(profession_title="Developer")
        
        assert request.is_mock is False

    def test_profession_request_default_use_cache(self):
        """Test default value for use_cache"""
        request = ProfessionRequest(profession_title="Developer")
        
        assert request.use_cache is True

    def test_profession_request_empty_title(self):
        """Test ProfessionRequest with empty title"""
        request = ProfessionRequest(profession_title="")
        
        assert request.profession_title == ""

    def test_profession_request_with_unicode(self):
        """Test ProfessionRequest with unicode title"""
        request = ProfessionRequest(profession_title="Backend Разработчик")
        
        assert "Разработчик" in request.profession_title

    def test_profession_request_none_flags(self):
        """Test ProfessionRequest with None values for optional fields"""
        request = ProfessionRequest(
            profession_title="Developer",
            is_mock=None,
            use_cache=None
        )
        
        assert request.is_mock is None
        assert request.use_cache is None

    def test_profession_request_type_coercion(self):
        """Test that request validates types correctly"""
        with pytest.raises(ValidationError):
            ProfessionRequest(
                profession_title="Developer",
                is_mock="yes"  # Should be boolean
            )
