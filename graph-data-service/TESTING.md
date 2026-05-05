# Graph Data Service - Unit Test Suite

## Comprehensive unit testing setup for graph-data-service

### Test Files Created

#### 1. **conftest.py** - Shared Test Fixtures
Contains pytest fixtures used across all tests:
- Environment variable mocks
- Sample data fixtures (skills, professions, API responses)
- Normalized data fixtures
- Temporary cache directory fixtures

#### 2. **test_main.py** - FastAPI Application Tests (15 tests)
Tests for the main FastAPI endpoints:
- Root endpoint (`GET /`)
- Profession graph endpoint (`POST /get_profession_graph`)
- Request validation and error handling
- Response format validation
- Parameter passing

#### 3. **test_models.py** - Data Model Tests (25 tests)
Tests for Pydantic models:
- `NormalizedSkill` model validation
- `SkillEdge` model validation
- `ProfessionRoadmap` model validation
- `ProfessionRequest` model validation
- Field validation and type coercion
- Unicode support

#### 4. **test_skills_finder.py** - Skills Finder Service Tests (8 tests)
Tests for GitHub roadmap skills fetching:
- Successful skills retrieval
- Special character handling
- Empty response handling
- Initialization with custom parameters

#### 5. **test_skills_normalizer.py** - Skills Normalization Tests (8 tests)
Tests for LLM-based skills normalization:
- Initialization with environment variables
- Successful normalization
- Empty list handling
- API call validation
- Custom and environment model names

#### 6. **test_skills_relation_finder.py** - Relation Finding Tests (8 tests)
Tests for DBPedia SPARQL relation discovery:
- Initialization and URI mapping
- Relation finding with empty skills
- Graph structure validation
- SPARQL endpoint configuration
- Relation deduplication

#### 7. **test_skills_relations_normalizer.py** - Relation Normalization Tests (8 tests)
Tests for LLM-based relation normalization:
- Initialization validation
- Successful normalization
- Empty input handling
- API call verification
- Response model validation

#### 8. **test_aggregator.py** - Aggregator Service Tests (12 tests)
Tests for the main orchestration service:
- Node name extraction from relations
- Skill graph data retrieval
- Mock file usage
- Cache file handling
- Cache filename normalization
- Result structure validation

#### 9. **test_integration.py** - Integration Tests (12 tests)
End-to-end integration tests:
- Complete workflow execution
- Service instantiation verification
- Large skill set handling
- Model interaction tests
- Data flow validation

### Configuration Files

#### **pytest.ini**
- Test discovery configuration
- Test markers definition (unit, integration, api, slow)
- Output formatting options

#### **requirements-dev.txt**
Testing dependencies:
- pytest==7.4.4
- pytest-asyncio==0.23.3
- pytest-cov==4.1.0
- pytest-mock==3.12.0
- httpx==0.28.1

#### **Makefile**
Convenient test execution commands:
```bash
make test              # Run all tests
make test-cov          # Run with coverage report
make test-v            # Verbose output
make test-fast         # Fast tests only
make test-debug        # Debug mode
make install-test      # Install dependencies
make clean             # Clean cache/coverage
```

#### **tests/README.md**
Comprehensive testing guide with:
- Overview of test structure
- Installation instructions
- How to run tests
- Test organization details
- Coverage targets
- CI/CD integration examples
- Troubleshooting guide

### Test Statistics

- **Total Test Files**: 9
- **Total Test Cases**: ~96 tests
- **Code Coverage Target**: >95%
- **Estimated Runtime**: ~3-4 seconds (all mocked)

### Running the Tests

1. **Install dependencies**:
```bash
pip install -r requirements-dev.txt
```

2. **Run all tests**:
```bash
pytest
# or
make test
```

3. **With coverage report**:
```bash
pytest --cov=src --cov-report=html
# or
make test-cov
```

4. **Run specific test file**:
```bash
pytest tests/test_main.py -v
```

5. **Run specific test**:
```bash
pytest tests/test_main.py::TestMainApp::test_read_root
```

### Key Features

✅ **Comprehensive Coverage**
- All major components tested
- Edge cases and error conditions covered
- Both unit and integration tests

✅ **Isolated Testing**
- All external dependencies mocked
- No real API calls during testing
- Fast execution (~3-4 seconds)

✅ **Well-Organized**
- Fixtures shared via conftest.py
- Tests grouped by component
- Clear test names and docstrings

✅ **Easy to Extend**
- Makefile for common tasks
- Pytest markers for categorization
- Documented patterns for new tests

✅ **CI/CD Ready**
- Coverage reporting
- Fail-on-low-coverage support
- Exit codes for automation

### Testing Strategy

All tests use the following approach:

1. **Arrange** - Set up fixtures and mocks
2. **Act** - Execute the code being tested
3. **Assert** - Verify the results

External dependencies are mocked using `unittest.mock` to ensure:
- Tests run fast
- No external service calls
- Tests are deterministic
- Easy to test error conditions

### Quick Start

```bash
# Navigate to graph-data-service directory
cd graph-data-service

# Install dev dependencies
pip install -r requirements-dev.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html
open htmlcov/index.html

# Or use Makefile
make test-cov
```

### Continuous Integration

Add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: |
    pip install -r requirements-dev.txt
    pytest --cov=src --cov-fail-under=80 --cov-report=term-missing
```

### Future Enhancements

Consider adding:
- Performance benchmarking tests
- End-to-end tests with real LLM calls (marked as slow)
- Contract tests with API clients
- Mutation testing for test quality

### Troubleshooting

**Issue**: Tests fail with missing environment variables
**Solution**: 
```bash
export HF_TOKEN="test-token"
export HF_MODEL_NAME="test-model"
pytest
```

**Issue**: Import errors
**Solution**: Run pytest from project root and ensure Python path is set correctly

**Issue**: Cache-related test failures
**Solution**: Clean cache directory: `rm -rf cache/`
