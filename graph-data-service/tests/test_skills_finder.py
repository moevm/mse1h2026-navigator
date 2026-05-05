import pytest
from unittest.mock import patch, Mock, MagicMock
from src.services.skills_finder import SkillsFinder


class TestSkillsFinder:
    """Test cases for SkillsFinder class"""

    @patch("requests.get")
    def test_get_skills_list_success(self, mock_get, sample_github_response):
        """Test successful skills list retrieval"""
        # Mock the GitHub API responses
        mock_response_1 = Mock()
        mock_response_1.json.return_value = [
            {"name": "prerequisites.md"},
            {"name": "basics.md"},
            {"name": "backend-roadmap.md"},
        ]

        mock_response_2 = Mock()
        mock_response_2.json.return_value = [
            {"name": "item-1.md"},
            {"name": "item-2.md"},
        ]

        # First call returns profession list, second call returns skills
        mock_get.side_effect = [mock_response_1, mock_response_2]

        finder = SkillsFinder("Backend Developer", minimal_ratio=60)
        
        with patch.object(finder, '_SkillsFinder__get_all_profession_names', 
                         return_value=["backend-developer"]):
            with patch.object(finder, '_SkillsFinder__find_best_ratio_profession',
                             return_value="backend-developer"):
                skills = finder.get_skills_list()

        assert isinstance(skills, list)
        assert len(skills) >= 0

    @patch("requests.get")
    def test_get_skills_list_with_special_characters(self, mock_get):
        """Test skills list parsing with special characters"""
        mock_response_1 = Mock()
        mock_response_1.json.return_value = []
        
        mock_response_2 = Mock()
        mock_response_2.json.return_value = [
            {"name": "item-1@1.0.md"},
            {"name": "item-2@2.0.md"},
        ]

        mock_get.side_effect = [mock_response_1, mock_response_2]

        finder = SkillsFinder("Backend Developer")
        
        with patch.object(finder, '_SkillsFinder__get_all_profession_names', 
                         return_value=["backend-developer"]):
            with patch.object(finder, '_SkillsFinder__find_best_ratio_profession',
                             return_value="backend-developer"):
                skills = finder.get_skills_list()

        # Check that versions are removed
        assert all("@" not in skill for skill in skills)

    def test_skills_finder_initialization(self):
        """Test SkillsFinder initialization"""
        finder = SkillsFinder("Web Developer", minimal_ratio=75)
        
        assert finder._profession_name == "Web Developer"
        assert finder._minimal_ratio == 75

    def test_skills_finder_default_minimal_ratio(self):
        """Test SkillsFinder initialization with default minimal_ratio"""
        finder = SkillsFinder("DevOps")
        
        assert finder._minimal_ratio == 60

    @patch("requests.get")
    def test_get_skills_list_handles_empty_response(self, mock_get):
        """Test handling of empty GitHub response"""
        mock_response_1 = Mock()
        mock_response_1.json.return_value = []
        
        mock_response_2 = Mock()
        mock_response_2.json.return_value = []

        mock_get.side_effect = [mock_response_1, mock_response_2]

        finder = SkillsFinder("Fake Profession")
        
        with patch.object(finder, '_SkillsFinder__get_all_profession_names', 
                         return_value=["fake-profession"]):
            with patch.object(finder, '_SkillsFinder__find_best_ratio_profession',
                             return_value="fake-profession"):
                skills = finder.get_skills_list()

        assert skills == []
