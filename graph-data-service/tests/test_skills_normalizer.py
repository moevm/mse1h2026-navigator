import pytest
from unittest.mock import patch, Mock, MagicMock
from src.services.skills_normalizer import SkillsNormalizer
from src.model.base import NormalizedSkill


class TestSkillsNormalizer:
    """Test cases for SkillsNormalizer class"""

    def test_skills_normalizer_initialization(self, mock_env_vars):
        """Test SkillsNormalizer initialization"""
        skills_list = ["Python", "JavaScript", "Docker"]
        profession = "Backend Developer"
        
        normalizer = SkillsNormalizer(skills_list, profession)
        
        assert normalizer._skills_list == skills_list
        assert normalizer._profession_name == profession
        assert normalizer._hf_model_name == "test-model"

    def test_skills_normalizer_missing_env_vars(self, monkeypatch):
        """Test that SkillsNormalizer raises error when environment variables are missing"""
        monkeypatch.delenv("HF_TOKEN", raising=False)
        monkeypatch.delenv("HF_MODEL_NAME", raising=False)
        
        with pytest.raises(KeyError):
            normalizer = SkillsNormalizer(["Python"], "Backend Developer")

    @patch("instructor.from_openai")
    def test_get_normalized_skills_success(self, mock_instructor, mock_env_vars, 
                                           sample_skills_list):
        """Test successful skills normalization"""
        mock_client = MagicMock()
        mock_instructor.return_value = mock_client
        
        # Mock the API response
        mock_response = MagicMock()
        mock_response.skills = ["Python", "JavaScript", "React", "Docker", "PostgreSQL"]
        mock_client.chat.completions.create.return_value = mock_response
        
        normalizer = SkillsNormalizer(sample_skills_list, "Backend Developer")
        normalized = normalizer.get_normalized_skills()
        
        assert isinstance(normalized, list)
        assert len(normalized) > 0
        assert all(isinstance(skill, str) for skill in normalized)

    @patch("instructor.from_openai")
    def test_get_normalized_skills_empty_list(self, mock_instructor, mock_env_vars):
        """Test normalization of empty skills list"""
        mock_client = MagicMock()
        mock_instructor.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.skills = []
        mock_client.chat.completions.create.return_value = mock_response
        
        normalizer = SkillsNormalizer([], "Backend Developer")
        normalized = normalizer.get_normalized_skills()
        
        assert normalized == []

    @patch("instructor.from_openai")
    def test_get_normalized_skills_api_call_content(self, mock_instructor, 
                                                     mock_env_vars, sample_skills_list):
        """Test that the API is called with correct parameters"""
        mock_client = MagicMock()
        mock_instructor.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.skills = sample_skills_list
        mock_client.chat.completions.create.return_value = mock_response
        
        profession = "Backend Developer"
        normalizer = SkillsNormalizer(sample_skills_list, profession)
        normalizer.get_normalized_skills()
        
        # Verify that the API was called
        assert mock_client.chat.completions.create.called
        
        # Check that profession name is in the system message
        call_args = mock_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        assert any(profession in msg.get("content", "") for msg in messages)

    def test_skills_normalizer_with_custom_model(self, mock_env_vars):
        """Test SkillsNormalizer with custom model name"""
        custom_model = "custom-model-v2"
        
        normalizer = SkillsNormalizer(
            ["Python"], 
            "Developer",
            hf_model_name=custom_model
        )
        
        assert normalizer._hf_model_name == custom_model

    def test_skills_normalizer_with_env_model(self, mock_env_vars):
        """Test SkillsNormalizer uses environment variable for model"""
        normalizer = SkillsNormalizer(["Python"], "Developer")
        
        assert normalizer._hf_model_name == "test-model"
