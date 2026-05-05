.PHONY: test test-cov test-v test-fast test-mark clean install-test

# Install test dependencies
install-test:
	pip install -r requirements-dev.txt

# Run all tests
test:
	pytest

# Run tests with coverage report
test-cov:
	pytest --cov=src --cov-report=html --cov-report=term-missing

# Run tests with verbose output
test-v:
	pytest -v

# Run fast tests only (excluding slow markers)
test-fast:
	pytest -m "not slow" -v

# Run with specific marker
test-mark:
	pytest -m unit

# Run specific test file
test-file:
	pytest tests/$(FILE)

# Run tests matching pattern
test-pattern:
	pytest -k $(PATTERN)

# Run with debugging enabled
test-debug:
	pytest --pdb -s

# Run with maximum verbosity and output
test-verbose:
	pytest -vv -s --tb=long

# Clean test cache and coverage
clean:
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

# Setup: install dependencies and run tests
setup: install-test test

# Run all checks: tests + coverage
check: test-cov
	@echo "✓ All tests passed with coverage report"

help:
	@echo "Available targets:"
	@echo "  test          - Run all tests"
	@echo "  test-cov      - Run tests with coverage report"
	@echo "  test-v        - Run tests with verbose output"
	@echo "  test-fast     - Run fast tests (exclude slow)"
	@echo "  test-mark     - Run tests with unit marker"
	@echo "  test-file FILE=tests/test_main.py - Run specific file"
	@echo "  test-pattern PATTERN=normalized - Run matching tests"
	@echo "  test-debug    - Run with debugger on failure"
	@echo "  test-verbose  - Run with max verbosity"
	@echo "  install-test  - Install test dependencies"
	@echo "  clean         - Clean cache and coverage files"
	@echo "  setup         - Install dependencies and run tests"
	@echo "  check         - Run tests and coverage check"
