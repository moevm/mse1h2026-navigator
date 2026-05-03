import os
import json
import pytest
from unittest.mock import Mock, MagicMock, patch


@pytest.fixture
def mock_env_vars(monkeypatch):
    """Set up mock environment variables"""
    monkeypatch.setenv("HF_MODEL_NAME", "test-model")
    monkeypatch.setenv("HF_TOKEN", "test-token")
    return {"HF_MODEL_NAME": "test-model", "HF_TOKEN": "test-token"}


@pytest.fixture
def sample_skills_list():
    """Sample skills list for testing"""
    return ["Python", "JavaScript", "React", "Docker", "PostgreSQL"]


@pytest.fixture
def sample_profession_name():
    """Sample profession name for testing"""
    return "Backend Developer"


@pytest.fixture
def sample_github_response():
    """Mock response from GitHub API for skills"""
    return [
        {"name": "python.md", "type": "file"},
        {"name": "javascript.md", "type": "file"},
        {"name": "react.md", "type": "file"},
        {"name": "docker.md", "type": "file"},
        {"name": "postgresql.md", "type": "file"},
    ]


@pytest.fixture
def sample_normalized_skills():
    """Sample normalized skills response"""
    return ["Python", "JavaScript", "React", "Docker", "PostgreSQL"]


@pytest.fixture
def sample_skill_relations():
    """Sample skill relations"""
    return [
        {"from_skill": "Python", "to_skill": "Django"},
        {"from_skill": "Docker", "to_skill": "Kubernetes"},
        {"from_skill": "PostgreSQL", "to_skill": "Database Design"},
    ]


@pytest.fixture
def sample_normalized_relations():
    """Sample normalized relations"""
    try:
        from src.model.base import SkillEdge, ProfessionRoadmap
    except ImportError:
        from model.base import SkillEdge, ProfessionRoadmap
    
    edges = [
        SkillEdge(from_skill="Backend Developer", to_skill="Python"),
        SkillEdge(from_skill="Python", to_skill="Django"),
        SkillEdge(from_skill="Backend Developer", to_skill="PostgreSQL"),
    ]
    return ProfessionRoadmap(edges=edges)


@pytest.fixture
def temp_cache_dir(tmp_path, monkeypatch):
    """Create a temporary cache directory"""
    cache_dir = tmp_path / "cache"
    cache_dir.mkdir()
    monkeypatch.chdir(tmp_path)
    return cache_dir


@pytest.fixture
def mock_cache_file(temp_cache_dir):
    """Create a mock cache file"""
    mock_data = {
        "nodes": ["Backend Developer", "Python", "Django", "PostgreSQL"],
        "edges": [
            {"from_skill": "Backend Developer", "to_skill": "Python"},
            {"from_skill": "Python", "to_skill": "Django"},
        ]
    }
    cache_file = temp_cache_dir / "mock_answer.json"
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(mock_data, f)
    return cache_file
