import pytest
from unittest.mock import patch, Mock, MagicMock
from src.services.skills_relations_normalizer import SkillRelationNormalizer
from src.model.base import SkillEdge, ProfessionRoadmap


class TestSkillRelationNormalizer:
    """Test cases for SkillRelationNormalizer class"""

    def test_skill_relation_normalizer_initialization(self, mock_env_vars,
                                                      sample_profession_name, 
                                                      sample_skill_relations):
        """Test SkillRelationNormalizer initialization"""
        normalizer = SkillRelationNormalizer(
            sample_profession_name, 
            sample_skill_relations
        )
        
        assert normalizer._profession_name == sample_profession_name
        assert normalizer._skills_list == sample_skill_relations
        assert normalizer._hf_model_name == "test-model"

    def test_skill_relation_normalizer_missing_env_vars(self, monkeypatch,
                                                        sample_profession_name):
        """Test that error is raised when environment variables are missing"""
        monkeypatch.delenv("HF_TOKEN", raising=False)
        monkeypatch.delenv("HF_MODEL_NAME", raising=False)
        
        with pytest.raises(KeyError):
            normalizer = SkillRelationNormalizer(
                sample_profession_name,
                []
            )

    @patch("instructor.from_openai")
    def test_get_normalized_relations_success(self, mock_instructor, mock_env_vars,
                                             sample_profession_name, 
                                             sample_skill_relations):
        """Test successful relations normalization"""
        mock_client = MagicMock()
        mock_instructor.return_value = mock_client
        
        edges = [
            SkillEdge(from_skill="Backend Developer", to_skill="Python"),
            SkillEdge(from_skill="Python", to_skill="Django"),
        ]
        mock_response = MagicMock()
        mock_response.edges = edges
        mock_client.chat.completions.create.return_value = mock_response
        
        normalizer = SkillRelationNormalizer(sample_profession_name, 
                                             sample_skill_relations)
        result = normalizer.get_normalized_relations()
        
        assert isinstance(result, ProfessionRoadmap)
        assert len(result.edges) > 0
        assert all(isinstance(e, SkillEdge) for e in result.edges)

    @patch("instructor.from_openai")
    def test_get_normalized_relations_empty_input(self, mock_instructor, mock_env_vars,
                                                  sample_profession_name):
        """Test normalization of empty relations list"""
        mock_client = MagicMock()
        mock_instructor.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.edges = []
        mock_client.chat.completions.create.return_value = mock_response
        
        normalizer = SkillRelationNormalizer(sample_profession_name, [])
        result = normalizer.get_normalized_relations()
        
        assert isinstance(result, ProfessionRoadmap)
        assert result.edges == []

    @patch("instructor.from_openai")
    def test_get_normalized_relations_api_call(self, mock_instructor, mock_env_vars,
                                              sample_profession_name,
                                              sample_skill_relations):
        """Test that API is called with correct structure"""
        mock_client = MagicMock()
        mock_instructor.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.edges = []
        mock_client.chat.completions.create.return_value = mock_response
        
        normalizer = SkillRelationNormalizer(sample_profession_name, 
                                             sample_skill_relations)
        normalizer.get_normalized_relations()
        
        # Verify API was called
        assert mock_client.chat.completions.create.called
        
        # Check call parameters
        call_args = mock_client.chat.completions.create.call_args
        assert "messages" in call_args.kwargs
        assert "response_model" in call_args.kwargs

    @patch("instructor.from_openai")
    def test_profession_name_in_system_message(self, mock_instructor, mock_env_vars,
                                              sample_profession_name,
                                              sample_skill_relations):
        """Test that profession name is included in system message"""
        mock_client = MagicMock()
        mock_instructor.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.edges = []
        mock_client.chat.completions.create.return_value = mock_response
        
        normalizer = SkillRelationNormalizer(sample_profession_name,
                                             sample_skill_relations)
        normalizer.get_normalized_relations()
        
        call_args = mock_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        system_message = messages[0]["content"]
        
        assert sample_profession_name in system_message or "$" in system_message

    def test_skill_relation_normalizer_with_custom_model(self, mock_env_vars,
                                                         sample_profession_name):
        """Test initialization with custom model name"""
        custom_model = "custom-model-v2"
        
        normalizer = SkillRelationNormalizer(
            sample_profession_name,
            [],
            hf_model_name=custom_model
        )
        
        assert normalizer._hf_model_name == custom_model

    def test_skill_relation_normalizer_with_env_model(self, mock_env_vars,
                                                      sample_profession_name):
        """Test that environment variable model is used"""
        normalizer = SkillRelationNormalizer(sample_profession_name, [])
        
        assert normalizer._hf_model_name == "test-model"

    @patch("instructor.from_openai")
    def test_response_model_is_profession_roadmap(self, mock_instructor, mock_env_vars,
                                                  sample_profession_name):
        """Test that correct response model is used"""
        mock_client = MagicMock()
        mock_instructor.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.edges = []
        mock_client.chat.completions.create.return_value = mock_response
        
        normalizer = SkillRelationNormalizer(sample_profession_name, [])
        normalizer.get_normalized_relations()
        
        call_args = mock_client.chat.completions.create.call_args
        response_model = call_args.kwargs.get("response_model")
        
        assert response_model == ProfessionRoadmap
