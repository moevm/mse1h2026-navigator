# Quick Start - Running Tests

## Installation

```bash
# Navigate to graph-data-service directory
cd graph-data-service

# Install test dependencies
pip install -r requirements-dev.txt
```

## Run Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run with verbose output
pytest -v

# Run specific file
pytest tests/test_main.py

# Run specific test
pytest tests/test_main.py::TestMainApp::test_read_root
```

## Using Makefile

```bash
# See all available commands
make help

# Common commands
make test              # Run all tests
make test-cov          # Generate coverage report
make test-v            # Verbose output
make test-debug        # Debug on failure
make clean             # Clean cache/coverage files
```

## Validate Setup

```bash
# Check if everything is properly configured
chmod +x validate_tests.sh
./validate_tests.sh
```

## First Test Run

```bash
# Quick validation - should pass in seconds
pytest tests/test_models.py -v

# Run all tests
pytest -v

# Expected: ~96 tests should pass in 3-4 seconds
```

## Troubleshooting

**Missing dependencies**
```bash
pip install -r requirements-dev.txt
```

**Environment variables needed**
```bash
export HF_TOKEN="test-token"
export HF_MODEL_NAME="test-model"
pytest
```

**Cache issues**
```bash
rm -rf cache/ .pytest_cache/
pytest
```

## Coverage Report

```bash
# Generate HTML coverage report
pytest --cov=src --cov-report=html

# View report
open htmlcov/index.html
```

## CI/CD Integration

Tests automatically run on GitHub Actions for pull requests.
Check `.github/workflows/test-graph-data-service.yml` for details.

## Next Steps

- Read `tests/README.md` for comprehensive documentation
- Check `TESTING.md` for detailed testing guide
- Review test files for examples of test patterns used
