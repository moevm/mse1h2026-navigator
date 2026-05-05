#!/bin/bash

# Validate test setup for graph-data-service
# This script checks that the test environment is properly configured

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"

echo "=== Graph Data Service Test Validation ==="
echo ""

# Check Python version
echo "✓ Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "  Python version: $python_version"
echo ""

# Check if requirements are installed
echo "✓ Checking test dependencies..."
deps_needed=("pytest" "pytest-cov" "httpx" "pydantic" "fastapi")
for dep in "${deps_needed[@]}"; do
    if python3 -c "import $dep" 2>/dev/null; then
        echo "  ✓ $dep is installed"
    else
        echo "  ✗ $dep is NOT installed"
        echo "    Run: pip install -r requirements-dev.txt"
        exit 1
    fi
done
echo ""

# Check if test files exist
echo "✓ Checking test files..."
test_files=(
    "tests/__init__.py"
    "tests/conftest.py"
    "tests/test_main.py"
    "tests/test_models.py"
    "tests/test_skills_finder.py"
    "tests/test_skills_normalizer.py"
    "tests/test_skills_relation_finder.py"
    "tests/test_skills_relations_normalizer.py"
    "tests/test_aggregator.py"
    "tests/test_integration.py"
)

all_files_exist=true
for file in "${test_files[@]}"; do
    if [ -f "$PROJECT_DIR/$file" ]; then
        echo "  ✓ $file exists"
    else
        echo "  ✗ $file is missing"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    echo "  Some test files are missing!"
    exit 1
fi
echo ""

# Check if pytest can discover tests
echo "✓ Checking pytest test discovery..."
num_tests=$(cd "$PROJECT_DIR" && python3 -m pytest --collect-only -q 2>/dev/null | tail -1 | awk '{print $1}')
echo "  Found $num_tests tests"
echo ""

# Attempt to run a quick validation
echo "✓ Running validation test..."
cd "$PROJECT_DIR"
python3 -m pytest tests/test_models.py::TestNormalizedSkill::test_normalized_skill_valid -v 2>/dev/null

if [ $? -eq 0 ]; then
    echo "  ✓ Test execution successful"
else
    echo "  ✗ Test execution failed"
    exit 1
fi
echo ""

echo "=== All Validation Checks Passed! ==="
echo ""
echo "You can now run tests with:"
echo "  pytest                    # Run all tests"
echo "  pytest tests/test_*.py -v # Run with verbose output"
echo "  make test                 # Using Makefile"
echo "  make test-cov             # With coverage report"
