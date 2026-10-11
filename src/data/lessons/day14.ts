import type { Lesson } from '../../types';

export const day14: Lesson = {
  day: 14,
  title: 'Senior Engineering Practices: Testing, Packaging & Production Readiness',
  subtitle: 'Pytest Fixtures, Mocking Trap, src-layout, Production Logging, and Docker Best Practices',
  estimatedMinutes: 50,
  category: 'architecture',
  seniorBridge: {
    csharp: 'Pytest is the xUnit/NUnit of Python, but cleaner: plain `assert` statements replace `Assert.Equal`, and `@pytest.fixture` provides dependency injection for test suites. The `src/` project layout is like placing C# code in separate class library projects to prevent test assemblies from accidentally resolving un-built local files.',
    c_modula2: 'In C/Modula-2, modules have strict header interfaces and compilation steps. In Python, packaging with `pyproject.toml` and proper `src/` directory layout establishes clean namespace separation and build reproducibility.',
    javascript: 'Pytest is like Jest or Vitest. Mocking with `unittest.mock.patch` is like `vi.spyOn` or `jest.mock`. Standard Python logging matches Winston/Pino with log levels, formatters, and structured JSON output.',
    c64_basic: 'The ultimate evolution: automated testing suites, declarative build pipelines, containerized deployments, and production observability.',
  },
  overview: `Being a senior engineer in Python is not just about syntax—it is about architectural discipline. In this final capstone section, we cover production testing with ` + '`pytest`' + `, the infamous ` + '`unittest.mock.patch`' + ` target gotcha, why professional repositories use the ` + '`src/`' + ` layout, enterprise logging without root-logger pollution, and production Docker containerization for Python web services.`,
  keyTakeaways: [
    'Pytest uses AST bytecode rewriting, allowing plain Python `assert a == b` statements with rich failure introspection, eliminating verbose `self.assertEqual()` boilerplate.',
    'Pytest fixtures provide declarative dependency injection. Use `yield` inside a fixture to execute teardown code after tests finish.',
    'Table-driven testing with `@pytest.mark.parametrize` runs tests across dozens of test cases with clear individual failure reporting.',
    'THE MOCKING GOLDEN RULE: Patch where the object is LOOKED UP, not where it is DEFINED. Patching `myapp.services.requests.get` works; patching `requests.get` fails if the service imported it via `from requests import get`.',
    'Always use the `src/` layout (`src/my_package/`). It prevents tests from accidentally importing uninstalled local directory code rather than the packaged distribution.',
    'Always instantiate module loggers with `logger = logging.getLogger(__name__)`. Never call root logger methods like `logging.info()` in library code.',
    'In Docker, always use `exec` in your entrypoint (or `CMD ["uvicorn", ...]`) so Uvicorn runs as PID 1 to receive SIGTERM signals for graceful termination.',
  ],
  sections: [
    {
      id: 'pytest-fixtures-and-params',
      title: '1. Production Testing with Pytest',
      content:
        'While Python includes the legacy `unittest` module (modeled after Java JUnit in the late 1990s), modern Python exclusively standardizes on **pytest**.\n\n' +
        '**Why Pytest Dominates**:\n' +
        '1. **Plain Asserts**: Write `assert result == 42`. Pytest rewrites the abstract syntax tree (AST) to print detailed sub-expression comparisons on failure.\n' +
        '2. **Fixtures as DI**: Replaces repetitive `setUp()` and `tearDown()` with composable, scoped fixtures.\n' +
        '3. **Parametrization**: Clean table-driven tests with `@pytest.mark.parametrize`.',
      codeSnippet: `import pytest

# Fixture with automatic teardown:
@pytest.fixture
def mock_db_session():
    session = {"connected": True, "records": []}
    yield session  # Handed to the test function
    session["connected"] = False  # Guaranteed teardown!

# Table-driven testing:
@pytest.mark.parametrize("input_val, expected", [
    (10, 20),
    (0, 0),
    (-5, -10),
])
def test_double_number(input_val, expected):
    assert input_val * 2 == expected

def test_db_insert(mock_db_session):
    mock_db_session["records"].append("user_1")
    assert len(mock_db_session["records"]) == 1`,
      seniorInsight: 'Fixtures can have different scopes: `scope="function"` (default), `scope="module"`, or `scope="session"` (ideal for spinning up a single test database container for an entire test suite run).',
    },
    {
      id: 'the-mocking-trap',
      title: '2. Mocking with unittest.mock & The Target Trap',
      content: `\`unittest.mock\` provides \`Mock\`, \`MagicMock\`, and \`patch\`.

**THE INFAMOUS MOCK GOTCHA**:
Where do you patch?
Suppose \`my_service.py\` contains:
\`from requests import get\`

If your test does:
\`@patch("requests.get")\` -> **IT WILL FAIL TO MOCK!**
Because \`my_service\` already imported and bound \`get\` to its own local namespace!

**The Golden Rule**:
Always patch the name where it is **looked up**, NOT where it was defined:
\`@patch("my_app.my_service.get")\`!`,
      codeSnippet: `from unittest.mock import MagicMock, patch

class PaymentService:
    def process_payment(self, card_token: str, amount: float):
        # Calls external gateway
        pass

def checkout(service: PaymentService, token: str, amount: float):
    if amount <= 0:
        return False
    return service.process_payment(token, amount)

def test_checkout_successful():
    mock_service = MagicMock(spec=PaymentService)
    mock_service.process_payment.return_value = True

    status = checkout(mock_service, "tok_123", 99.50)
    assert status is True
    # Verify call count and arguments:
    mock_service.process_payment.assert_called_once_with("tok_123", 99.50)`,
      seniorInsight: 'Always pass `spec=RealClass` when instantiating `MagicMock(spec=RealClass)`. Without `spec`, calling a misspelled method like `mock.proccess_payment()` won\'t throw an AttributeError, leading to silent false-positive tests!',
    },
    {
      id: 'src-layout-and-packaging',
      title: '3. Production Project Structure: The src/ Layout',
      content: `Many beginner tutorials use a flat directory layout:
\`\`\`
my_project/
├── my_package/
│   └── __init__.py
└── tests/
    └── test_core.py
\`\`\`

**Why the Flat Layout is Dangerous**:
When you run \`pytest\` in the project root, Python automatically prepends the current directory (\`.\`) to \`sys.path\`. Tests import \`my_package\` directly from the source directory, completely bypassing whatever wheel package was built or installed! You will miss missing package files, bad imports, and broken installation configs.

**The Production \`src/\` Layout**:
\`\`\`
my_project/
├── pyproject.toml
├── src/
│   └── my_package/
│       ├── __init__.py
│       └── core.py
└── tests/
    └── test_core.py
\`\`\`
Tests are forced to run against the properly installed editable package (\`pip install -e .\` or \`uv pip install -e .\`).`,
      seniorInsight: 'All top-tier Python packaging tools (Hatch, Flit, uv, Poetry) endorse and default to the `src/` layout.',
    },
    {
      id: 'logging-and-docker',
      title: '4. Enterprise Logging & Docker Readiness',
      content: `### Enterprise Logging
Never call root functions like \`logging.info("...")\` or use raw \`print()\` in production.
Always instantiate a module-specific logger:
\`\`\`python
import logging
logger = logging.getLogger(__name__)
\`\`\`
Configure a single root handler in your application entrypoint (e.g. \`main.py\`), formatting logs as JSON for consumption by Datadog, CloudWatch, or Grafana Loki.

### Docker Best Practices for Python
1. Use lightweight base images: \`python:3.12-slim\` (avoid Alpine for Python, as Alpine uses \`musl\` libc which forces wheels to compile from source!).
2. Use multi-stage builds.
3. Run as a non-root user: \`USER appuser\`.
4. Run server with \`exec uvicorn ...\` so the process receives POSIX \`SIGTERM\` signals for graceful rolling deployments.`,
      codeSnippet: `# Dockerfile best practices snippet:
# FROM python:3.12-slim AS builder
# WORKDIR /app
# RUN pip install --no-cache-dir uv
# COPY pyproject.toml uv.lock ./
# RUN uv sync --frozen --no-dev
#
# FROM python:3.12-slim
# WORKDIR /app
# RUN useradd -m -u 1000 appuser
# COPY --from=builder /app/.venv /app/.venv
# COPY src ./src
# USER appuser
# ENV PATH="/app/.venv/bin:$PATH"
# CMD ["uvicorn", "src.my_app.main:app", "--host", "0.0.0.0", "--port", "8000"]`,
      seniorInsight: 'Why avoid Alpine Linux for Python? Pre-compiled C-extension binary wheels (NumPy, Polars, Cryptography, Pydantic) on PyPI are compiled against `glibc` (manylinux). On Alpine (`musl`), pip must compile every C dependency from source, blowing build times from 10 seconds to 25 minutes!',
    },
  ],
  codeExamples: [
    {
      title: 'Structured JSON Logging Formatter',
      description: 'Custom logging formatter producing structured JSON output for cloud telemetry.',
      pythonCode: `import logging
import json
from datetime import datetime, timezone

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "file": record.filename,
            "line": record.lineno,
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)

# Setup logger:
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger = logging.getLogger("enterprise.billing")
logger.addHandler(handler)
logger.setLevel(logging.INFO)

logger.info("Invoice processed successfully")`,
      runnable: true,
      expectedOutput: `{"timestamp": "2026-10-11T17:18:00.000000+00:00", "level": "INFO", "logger": "enterprise.billing", "message": "Invoice processed successfully", "file": "code.py", "line": 26}`,
    },
    {
      title: 'Table-Driven Pytest Pattern with Simulated Runner',
      description: 'Demonstrating parametrization patterns for rigorous edge-case testing.',
      pythonCode: `def calculate_discount(price: float, loyalty_years: int) -> float:
    if price < 0:
        raise ValueError("Price cannot be negative")
    discount_pct = min(loyalty_years * 0.05, 0.25)
    return round(price * (1 - discount_pct), 2)

# Simulated parameterized test matrix:
test_cases = [
    ("New customer no discount", 100.0, 0, 100.0),
    ("2 year customer 10%", 100.0, 2, 90.0),
    ("Max discount capped at 25%", 100.0, 8, 75.0),
    ("Float rounding check", 49.99, 1, 47.49),
]

for test_name, price, years, expected in test_cases:
    actual = calculate_discount(price, years)
    assert actual == expected, f"Failed on {test_name}: expected {expected}, got {actual}"
    print(f"PASS: {test_name} -> \${actual}")`,
      runnable: true,
      expectedOutput: `PASS: New customer no discount -> $100.0
PASS: 2 year customer 10% -> $90.0
PASS: Max discount capped at 25% -> $75.0
PASS: Float rounding check -> $47.49`,
    },
  ],
  quiz: [
    {
      id: 'd14-q1',
      question: 'In pytest, what allows plain Python expressions like `assert a == b` to output detailed variable introspection upon failure without writing `self.assertEqual(a, b)`?',
      options: [
        'A background monitoring thread that watches local memory registers.',
        'Pytest inspects and rewrites the Abstract Syntax Tree (AST) of test modules at import time, injecting rich introspection logic into plain `assert` statements.',
        'Python 3.12 made all assert statements print variables by default.',
        'Pytest uses Python reflection via the `inspect` module after an assertion error is thrown.',
      ],
      correctIndex: 1,
      explanation: 'Pytest uses AST rewriting. When it imports test files, it intercepts the AST and transforms standard `assert` statements into code that captures sub-expression values, giving developers detailed visual diffs on failures without awkward JUnit assertion methods.',
      seniorTrap: 'Newcomers often wonder if `assert` is safe in pytest since `python -O` strips asserts in production. In pytest, AST rewriting ensures asserts always execute during testing.',
    },
    {
      id: 'd14-q2',
      question: 'What is the "Golden Rule of Mocking" when using `unittest.mock.patch`?',
      options: [
        'Always mock built-in Python types.',
        'Patch where the object is LOOKED UP, not where it is DEFINED.',
        'Patch only private methods.',
        'Never patch functions that take more than two arguments.',
      ],
      correctIndex: 1,
      explanation: 'If module `A` imports `from requests import get`, the name `get` is bound inside module `A`. Patching `@patch("requests.get")` modifies the attribute on the `requests` module, but module `A` still holds its own reference to the original function! You must patch where it is looked up: `@patch("A.get")`.',
      seniorTrap: 'This is the #1 most frequently encountered bug in Python unit testing among experienced developers from other languages.',
    },
    {
      id: 'd14-q3',
      question: 'Why is using `spec=RealClass` strongly recommended when creating `mock = MagicMock(spec=RealClass)`?',
      options: [
        'It speeds up mock execution.',
        'It restricts the mock to only the attributes and methods present on `RealClass`. If your code calls a non-existent or misspelled method on the mock, it raises an `AttributeError` instead of returning another mock and creating false-positive tests.',
        'It makes the mock immutable.',
        'It automatically generates unit tests.',
      ],
      correctIndex: 1,
      explanation: 'By default, a `MagicMock` dynamically creates attributes for whatever you access. If your production code refactors a method from `get_user()` to `fetch_user()`, a mock without a spec will silently accept `mock.get_user()` and pass the test, masking a broken production call!',
      seniorTrap: 'Mocks without specs are dangerous sources of silent false-positive unit tests.',
    },
    {
      id: 'd14-q4',
      question: 'What is the primary architectural reason professional Python repositories use the `src/` layout (e.g. `src/my_app/`) instead of a flat layout?',
      options: [
        'The `src/` layout is required by the Linux kernel.',
        'It prevents the local source directory from being accidentally imported during testing via `sys.path[0]`, ensuring tests only run against the properly built, installed package and catching missing package data/dependencies.',
        'It makes git clone faster.',
        'Python 3 refuses to run code outside a `src/` folder.',
      ],
      correctIndex: 1,
      explanation: 'When running pytest from the repository root in a flat layout, Python adds `.` to `sys.path`. Tests import the raw source files, masking missing dependencies, missing C extension builds, and bad packaging configurations in `pyproject.toml`. The `src/` layout forces tests to test the installed distribution.',
      seniorTrap: 'Hynek Schlawack\'s famous essay on the `src/` layout established this as the gold standard for senior Python repository structure.',
    },
    {
      id: 'd14-q5',
      question: 'How should you instantiate a logger in a reusable library module according to Python production best practices?',
      options: [
        '`logger = logging.Logger()`',
        '`logger = logging.getLogger(__name__)`',
        '`logger = logging.root`',
        '`logger = logging.getLogger("DEFAULT")`',
      ],
      correctIndex: 1,
      explanation: 'Using `logging.getLogger(__name__)` establishes a hierarchical logger tree matching your module hierarchy (e.g. `my_app.services.billing`). Application entrypoints can then selectively configure log levels and handlers for specific subtrees.',
      seniorTrap: 'Calling `logging.info()` directly in library code mutates the global root logger and forces handlers onto consuming applications.',
    },
    {
      id: 'd14-q6',
      question: 'Why should you avoid Alpine Linux Docker base images (e.g. `python:3.12-alpine`) for production Python microservices?',
      options: [
        'Alpine does not support Python.',
        'Alpine uses `musl` libc instead of standard `glibc`. Pre-compiled binary wheels on PyPI are built for `glibc` (manylinux), meaning Alpine must compile C/C++ dependencies from source, resulting in massive build times, missing build tools, and subtle runtime bugs.',
        'Alpine requires paid commercial licenses.',
        'Alpine images cannot be deployed to Kubernetes.',
      ],
      correctIndex: 1,
      explanation: 'Official PyPI binary wheels (for NumPy, Cryptography, Pydantic, etc.) target `glibc` (manylinux standards). Because Alpine uses `musl`, pip cannot use pre-compiled wheels and must compile from source on every Docker build. Using `python:3.12-slim` (Debian-based) gives fast, reliable, small builds.',
      seniorTrap: 'Engineers used to Golang or Node.js where Alpine is tiny and fast often assume the same applies to Python. In Python, Debian-slim is almost universally preferred.',
    },
    {
      id: 'd14-q7',
      question: 'How does `@pytest.fixture` handle teardown operations (like closing connections or deleting temporary files)?',
      options: [
        'You must write a separate `@pytest.teardown` function.',
        'Write the teardown code after a `yield` statement inside the fixture function; pytest guarantees the post-yield code runs after the test completes.',
        'Pytest automatically calls `__del__` on all variables.',
        'Teardown is not supported in pytest.',
      ],
      correctIndex: 1,
      explanation: 'A pytest fixture with `yield` acts like a context manager. Everything before `yield` runs during setup; the yielded value is injected into test functions; everything after `yield` runs during teardown, even if the test fails.',
      seniorTrap: 'This provides an elegant, localized lifecycle without needing separate `setUp` and `tearDown` methods.',
    },
    {
      id: 'd14-q8',
      question: 'Why is it critical to use the `exec` form in your Dockerfile CMD (e.g. `CMD ["uvicorn", "main:app"]`) rather than shell form (`CMD uvicorn main:app`)?',
      options: [
        'The shell form is not supported in Linux.',
        'The shell form wraps the command in `/bin/sh -c`, meaning the shell becomes PID 1 and will not forward `SIGTERM` signals to Uvicorn, preventing graceful zero-downtime container termination.',
        'The exec form enables debug logging.',
        'The shell form runs 10x slower.',
      ],
      correctIndex: 1,
      explanation: 'When Kubernetes or Docker stops a container, it sends `SIGTERM` to PID 1. If shell form is used, `/bin/sh` is PID 1 and does not forward the signal to Python. The container hangs until Docker forcefully kills it with `SIGKILL` after 10 seconds, terminating in-flight HTTP requests abruptly.',
      seniorTrap: 'A classic container operational bug that causes 502 Bad Gateway errors during rolling updates in production.',
    },
  ],
};
