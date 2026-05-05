import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from src.main import app
from src.model.base import SkillEdge


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


class TestMainApp:
    """Test cases for main FastAPI app"""

    def test_read_root(self, client):
        """Test root endpoint"""
        response = client.get("/")
        
        assert response.status_code == 200
        assert response.json()["status"] == "working"
        assert "message" in response.json()

    def test_read_root_response_format(self, client):
        """Test that root endpoint returns correct format"""
        response = client.get("/")
        
        data = response.json()
        assert isinstance(data, dict)
        assert "status" in data
        assert "message" in data

    @patch("src.main.get_skill_graph_data")
    def test_get_profession_graph_success(self, mock_aggregator, client):
        """Test profession graph endpoint success"""
        edges = [SkillEdge(from_skill="Backend", to_skill="Python")]
        mock_aggregator.return_value = {
            "nodes": ["Backend", "Python"],
            "edges": edges
        }
        
        response = client.post(
            "/get_profession_graph",
            json={"profession_title": "Backend Developer"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "nodes" in data
        assert "edges" in data

    @patch("src.main.get_skill_graph_data")
    def test_get_profession_graph_with_mock_flag(self, mock_aggregator, client):
        """Test profession graph endpoint with mock flag"""
        mock_aggregator.return_value = {"nodes": [], "edges": []}
        
        response = client.post(
            "/get_profession_graph",
            json={
                "profession_title": "Backend Developer",
                "is_mock": True
            }
        )
        
        assert response.status_code == 200
        mock_aggregator.assert_called_once()
        args = mock_aggregator.call_args
        assert args.kwargs["is_mock"] is True

    @patch("src.main.get_skill_graph_data")
    def test_get_profession_graph_with_cache_flag(self, mock_aggregator, client):
        """Test profession graph endpoint with cache flag"""
        mock_aggregator.return_value = {"nodes": [], "edges": []}
        
        response = client.post(
            "/get_profession_graph",
            json={
                "profession_title": "Frontend Developer",
                "use_cache": True
            }
        )
        
        assert response.status_code == 200
        mock_aggregator.assert_called_once()
        args = mock_aggregator.call_args
        assert args.kwargs["use_cache"] is True

    @patch("src.main.get_skill_graph_data")
    def test_get_profession_graph_both_flags(self, mock_aggregator, client):
        """Test profession graph with both is_mock and use_cache flags"""
        mock_aggregator.return_value = {"nodes": [], "edges": []}
        
        response = client.post(
            "/get_profession_graph",
            json={
                "profession_title": "DevOps Engineer",
                "is_mock": True,
                "use_cache": True
            }
        )
        
        assert response.status_code == 200
        args = mock_aggregator.call_args
        assert args.kwargs["is_mock"] is True
        assert args.kwargs["use_cache"] is True

    def test_get_profession_graph_missing_profession_title(self, client):
        """Test that missing profession_title returns error"""
        response = client.post(
            "/get_profession_graph",
            json={}
        )
        
        assert response.status_code == 422

    def test_get_profession_graph_invalid_json(self, client):
        """Test that invalid JSON returns error"""
        response = client.post(
            "/get_profession_graph",
            data="invalid json"
        )
        
        assert response.status_code in [422, 400]

    @patch("src.main.get_skill_graph_data")
    def test_get_profession_graph_profession_title_passed_correctly(self, 
                                                                    mock_aggregator, client):
        """Test that profession_title is correctly passed to aggregator"""
        mock_aggregator.return_value = {"nodes": [], "edges": []}
        
        profession = "Full Stack Developer"
        response = client.post(
            "/get_profession_graph",
            json={"profession_title": profession}
        )
        
        assert response.status_code == 200
        args = mock_aggregator.call_args
        assert args.kwargs["job_title"] == profession

    @patch("src.main.get_skill_graph_data")
    def test_get_profession_graph_default_flags(self, mock_aggregator, client):
        """Test default values for is_mock and use_cache"""
        mock_aggregator.return_value = {"nodes": [], "edges": []}
        
        response = client.post(
            "/get_profession_graph",
            json={"profession_title": "Engineer"}
        )
        
        assert response.status_code == 200
        args = mock_aggregator.call_args
        # is_mock defaults to False, use_cache defaults to False
        assert args.kwargs["is_mock"] is False
        assert args.kwargs["use_cache"] is False

    @patch("src.main.get_skill_graph_data")
    def test_get_profession_graph_response_contains_data(self, mock_aggregator, client):
        """Test that response contains expected data structure"""
        nodes = ["Python", "Django", "FastAPI"]
        edges = [
            SkillEdge(from_skill="Python", to_skill="Django"),
            SkillEdge(from_skill="Django", to_skill="FastAPI")
        ]
        mock_aggregator.return_value = {
            "nodes": nodes,
            "edges": edges
        }
        
        response = client.post(
            "/get_profession_graph",
            json={"profession_title": "Backend Developer"}
        )
        
        data = response.json()
        assert data["nodes"] == nodes
        assert len(data["edges"]) == 2

    @patch("src.main.get_skill_graph_data")
    def test_get_profession_graph_handles_empty_response(self, mock_aggregator, client):
        """Test handling of empty graph data"""
        mock_aggregator.return_value = {"nodes": [], "edges": []}
        
        response = client.post(
            "/get_profession_graph",
            json={"profession_title": "Unknown Profession"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["nodes"] == []
        assert data["edges"] == []

    @patch("src.main.get_skill_graph_data")
    def test_get_profession_graph_exception_handling(self, mock_aggregator, client):
        """Test that exceptions from aggregator are properly handled"""
        mock_aggregator.side_effect = Exception("Service error")
        
        with pytest.raises(Exception):
            response = client.post(
                "/get_profession_graph",
                json={"profession_title": "Backend Developer"}
            )
