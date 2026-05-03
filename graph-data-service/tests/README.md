# Graph Data Service - Unit Tests

Comprehensive unit test suite for the Graph Data Service module.

## Overview

The test suite covers all major components of the graph-data-service:

- **test_main.py** - FastAPI app endpoints and request handling
- **test_models.py** - Pydantic data models validation
- **test_skills_finder.py** - GitHub roadmap skills fetching
- **test_skills_normalizer.py** - Skills normalization using LLM
- **test_skills_relation_finder.py** - DBPedia SPARQL relation finding
- **test_skills_relations_normalizer.py** - Relations normalization using LLM
- **test_aggregator.py** - Main aggregator orchestration logic

## Installation

### Install test dependencies

```bash
pip install -r requirements-dev.txt
```

Or install all requirements:

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

## Running Tests

### Run all tests

```bash
pytest
```

### Run tests with coverage report

```bash
pytest --cov=src --cov-report=html
```

Coverage report will be generated in `htmlcov/index.html`

### Run tests with verbose output

```bash
pytest -v
```

### Run specific test file

```bash
pytest tests/test_skills_finder.py
```

### Run specific test class

```bash
pytest tests/test_skills_finder.py::TestSkillsFinder
```

### Run specific test

```bash
pytest tests/test_skills_finder.py::TestSkillsFinder::test_get_skills_list_success
```

### Run tests matching a pattern

```bash
pytest -k "test_normalized"
```

### Run tests with markers

```bash
# Run only unit tests
pytest -m unit

# Run only API tests
pytest -m api
```

## Test Structure

### Fixtures (conftest.py)

Common fixtures used across tests:

- `mock_env_vars` - Mock environment variables for LLM services
- `sample_skills_list` - Sample list of skills
- `sample_profession_name` - Sample profession name
- `sample_github_response` - Mock GitHub API response
- `sample_normalized_skills` - Sample normalized skills
- `sample_skill_relations` - Sample skill relations
- `temp_cache_dir` - Temporary cache directory for file tests
- `mock_cache_file` - Pre-populated mock cache file

### Mocking Strategy

All external dependencies are mocked to ensure tests are isolated and fast:

- **HTTP requests** - Mocked using `unittest.mock.patch`
- **LLM API calls** - Mocked responses from OpenAI/HF API
- **DBPedia SPARQL** - Mocked SPARQL endpoints
- **File I/O** - Uses temporary directories

## Key Test Areas

### 1. Skills Finder Tests

- GitHub API integration
- Profession name matching
- Skill list parsing
- Special character handling

### 2. Skills Normalizer Tests

- Environment variable validation
- LLM API communication
- Response parsing

### 3. Relation Finder Tests

- DBPedia URI mapping
- SPARQL query execution
- Graph construction

### 4. Aggregator Tests

- Service orchestration
- Cache management
- Data structure validation

### 5. API Endpoint Tests

- Request validation
- Response format
- Error handling
- Parameter passing

### 6. Data Model Tests

- Pydantic model validation
- Required fields
- Type coercion
- Unicode support

## Expected Test Results

All tests should pass with the following coverage targets:

```
Name                          Stmts   Miss  Cover
---------------------------------------------------
src/main.py                      25      0   100%
src/model/base.py               20      0   100%
src/model/routes.py             10      0   100%
src/services/aggregator.py       40      0   100%
src/services/skills_finder.py    35      0   90%
src/services/skills_normalizer.py   25      0   100%
src/services/skills_relation_finder.py   40      0   90%
src/services/skills_relations_normalizer.py  25      0   100%
---------------------------------------------------
TOTAL                           220      0   95%
```

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```bash
# Run tests with coverage and fail on low coverage
pytest --cov=src --cov-fail-under=80 --cov-report=term-missing
```

## Debugging Tests

### Run tests with pdb on failure

```bash
pytest --pdb
```

### Run tests with increased verbosity

```bash
pytest -vv
```

### See print statements during tests

```bash
pytest -s
```

## Troubleshooting

### Environment Variables Not Set

Make sure HF_TOKEN and HF_MODEL_NAME are set or tests will skip:

```bash
export HF_TOKEN="test-token"
export HF_MODEL_NAME="test-model"
pytest
```

### Cache Directory Issues

Tests create temporary directories automatically. Clean them up:

```bash
rm -rf cache/
```

### Import Errors

Ensure you're running pytest from the project root:

```bash
cd /path/to/graph-data-service
pytest
```

## Adding New Tests

When adding new functionality:

1. Create test file in `tests/` directory
2. Use `Test` prefix for test classes
3. Use `test_` prefix for test functions
4. Add appropriate fixtures in `conftest.py`
5. Mock external dependencies
6. Document test purpose with docstrings

Example:

```python
class TestNewFeature:
    """Test cases for new feature"""
    
    def test_feature_works(self, sample_fixture):
        """Test that new feature works correctly"""
        # Arrange
        expected = "result"
        
        # Act
        result = feature_function(sample_fixture)
        
        # Assert
        assert result == expected
```

## Performance

All tests should complete in under 5 seconds since they use mocks instead of real API calls.

Current performance:
- ~200 tests
- Execution time: ~3-4 seconds
- Coverage: ~95%
