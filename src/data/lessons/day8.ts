import type { Lesson } from '../../types';

export const day8: Lesson = {
  day: 8,
  title: 'Modern Typing & Static Analysis',
  subtitle: 'PEP 604 (|), Generics, TypedDict, Literal, Annotated, and Mypy/Pyright',
  estimatedMinutes: 45,
  category: 'core',
  seniorBridge: {
    csharp: 'Unlike C# where types are enforced by the CLR compiler and JIT, Python type hints are metadata stored in `__annotations__`. Python will happily run with type mismatches at runtime unless checked statically by `mypy`/`pyright` or validated at boundaries by Pydantic. Python 3.12+ type parameter syntax `def fn[T](x: T)` looks and feels almost identical to C# generics `T Fn<T>(T x)`.',
    c_modula2: 'Coming from Modula-2\'s strict compile-time typing: Python uses "gradual typing". You can incrementally add type signatures to mission-critical modules while leaving dynamic scripts untyped.',
    javascript: 'Python\'s typing system is conceptually closer to TypeScript than to C# or Java. Types are erased at runtime execution, `TypedDict` matches TypeScript interfaces, `Literal` matches TS string literal union types, and `Union` matches `A | B`.',
    c64_basic: 'No more guessing whether a variable is a float or an integer based on the variable suffix `%` or `$`. Python type annotations provide IDE autocompletion and static verification.',
  },
  overview: `In modern production Python, type annotations are no longer optional for senior engineers. Writing untyped Python in 2026 is considered an anti-pattern. Modern Python (3.10+) provides clean union syntax (` + '`A | B`' + `), native generic collections (` + '`list[int]`' + `), ` + '`TypedDict`' + `, and structural type checking that rivals TypeScript and C#.`,
  keyTakeaways: [
    'Type annotations are annotations, not runtime enforcement. `x: int = "hello"` will NOT throw an error at runtime unless validated by a tool like Pydantic or checked with Mypy.',
    'Modern syntax (Python 3.10+): use `X | Y` instead of `Union[X, Y]`, and `T | None` instead of `Optional[T]`.',
    'Built-in types are generic (PEP 585): write `list[str]`, `dict[str, Any]`, and `tuple[int, ...]` directly—no need to import capitalized `List` or `Dict` from `typing`.',
    '`TypedDict` specifies exact dictionary key structures, providing TypeScript-like interface validation for dictionary payloads.',
    '`Literal["dev", "prod"]` constrains arguments to exact fixed literal values.',
    '`typing.Annotated[T, Metadata]` allows attaching runtime metadata to types (used heavily by FastAPI for query/body validation and dependency injection).',
    '`from __future__ import annotations` stringifies type annotations at compile time, eliminating forward reference errors and circular import issues.',
  ],
  sections: [
    {
      id: 'modern-syntax',
      title: '1. Modern Syntax: PEP 604 Unions & PEP 585 Generics',
      content: `If you see code importing \`from typing import List, Dict, Optional, Union\`, that is legacy Python 3.8 style.

Modern Python uses native types and the bitwise OR \`|\` operator:
- Instead of \`Union[int, str]\` -> use \`int | str\`
- Instead of \`Optional[User]\` -> use \`User | None\`
- Instead of \`typing.List[int]\` -> use \`list[int]\`
- Instead of \`typing.Dict[str, float]\` -> use \`dict[str, float]\`

**Forward References and PEP 563**:
If a method returns an instance of its own class, Python evaluated type hints at class creation time, causing \`NameError: name 'User' is not defined\`.
Adding \`from __future__ import annotations\` at the top of the file stores all hints as lazy strings, solving circular imports and forward references!`,
      codeSnippet: `from __future__ import annotations
from dataclasses import dataclass

@dataclass
class TreeNode:
    value: int
    left: TreeNode | None = None   # Valid without quotes due to __future__ annotations!
    right: TreeNode | None = None

def find_leaf(node: TreeNode | None) -> int | None:
    if node is None:
        return None
    return node.value`,
      seniorInsight: 'In Python 3.11+, you can also use `typing.Self` for methods that return `self`, providing perfect type inference for fluent builders.',
    },
    {
      id: 'typeddict-and-literal',
      title: '2. TypedDict & Literal: The TypeScript Parallels',
      content: `When working with external JSON APIs or legacy dictionaries, converting everything to classes is often unnecessary or slow.

### TypedDict
Defines a dictionary type with fixed keys and value types. It remains a standard Python \`dict\` at runtime with zero memory overhead, but static type checkers verify key presence and types.

### Literal
Restricts a variable to specific constant values (like enum-style strings).`,
      codeSnippet: `from typing import TypedDict, Literal

Environment = Literal["development", "staging", "production"]

class DatabaseConfig(TypedDict, total=False):  # total=False means keys are optional
    host: str
    port: int
    ssl: bool

class AppConfig(TypedDict):
    app_name: str
    env: Environment
    db: DatabaseConfig

# Static type checker verifies keys and types:
config: AppConfig = {
    "app_name": "BillingService",
    "env": "production",
    "db": {"host": "db.internal", "port": 5432, "ssl": True},
}
# config["env"] = "local"  -> Mypy error: Expression of type 'local' cannot be assigned to 'Environment'`,
      seniorInsight: 'Use `TypedDict` when receiving JSON over HTTP or parsing configuration files where you want dictionary speed with type safety.',
    },
    {
      id: 'generics-and-pep695',
      title: '3. Generics: TypeVar vs Python 3.12+ Native Type Parameters',
      content: `Traditionally, writing generic functions required defining explicit \`TypeVar\` objects:

\`\`\`python
from typing import TypeVar, Sequence
T = TypeVar("T")

def first_item(items: Sequence[T]) -> T | None:
    return items[0] if items else None
\`\`\`

In **Python 3.12+ (PEP 695)**, Python introduced native type parameter syntax that mirrors C# and TypeScript:

\`\`\`python
def first_item[T](items: list[T]) -> T | None:
    return items[0] if items else None
\`\`\``,
      codeSnippet: `from typing import TypeVar, Generic

T = TypeVar("T")

class Repository(Generic[T]):
    def __init__(self):
        self._storage: dict[str, T] = {}

    def save(self, entity_id: str, entity: T) -> None:
        self._storage[entity_id] = entity

    def get(self, entity_id: str) -> T | None:
        return self._storage.get(entity_id)

user_repo: Repository[str] = Repository()
user_repo.save("u1", "Alice")
# user_repo.save("u2", 123)  -> Mypy flags error: expected str, got int`,
      seniorInsight: 'Like C# generics, Python supports variance: `TypeVar("T_co", covariant=True)` and contravariance.',
    },
    {
      id: 'annotated-and-tooling',
      title: '4. Annotated & The Static Analysis Ecosystem',
      content: `\`typing.Annotated[T, ...]\` attaches arbitrary metadata to a type hint without affecting how static type checkers view the type.

For example, \`Annotated[int, Gt(0)]\` or \`Annotated[str, Header()]\`. Static checkers only see \`int\` or \`str\`, but runtime libraries (Pydantic, FastAPI) read the metadata to enforce database constraints, validation rules, or dependency injection!

**The Production Tooling Stack**:
- **mypy**: The official reference type checker.
- **pyright / basedpyright**: Microsoft\'s lightning-fast type checker (powers VS Code / Pylance).
- **ruff**: Linter and formatter that enforces import ordering, modern syntax migration (e.g. replacing \`Union\` with \`|\`), and type annotation consistency.`,
      codeSnippet: `from typing import Annotated

# Metadata attached for runtime validators (like Pydantic):
PositiveInt = Annotated[int, "Must be > 0", {"constraint": "gt:0"}]

def calculate_shares(quantity: PositiveInt) -> float:
    return quantity * 1.5

# Introspecting annotations at runtime:
import typing
print("Base type:", typing.get_args(PositiveInt)[0])       # <class 'int'>
print("Metadata:", typing.get_args(PositiveInt)[1:])        # ('Must be > 0', {'constraint': 'gt:0'})`,
      seniorInsight: 'Whenever you write APIs in FastAPI, `Annotated[Depends(...)]` is the modern idiomatic standard for dependency injection.',
    },
  ],
  codeExamples: [
    {
      title: 'Structural Subtyping with Protocol vs Nominal Inheritance',
      description: 'Using Protocol with runtime checking and generic types.',
      pythonCode: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Serializable(Protocol):
    def to_json(self) -> str: ...

class OrderPayload:
    def __init__(self, order_id: str):
        self.order_id = order_id
    def to_json(self) -> str:
        return f'{{"order_id": "{self.order_id}"}}'

def publish_message(msg: Serializable):
    print("Publishing:", msg.to_json())

order = OrderPayload("ORD-991")
print("Complies with protocol:", isinstance(order, Serializable))
publish_message(order)`,
      runnable: true,
      expectedOutput: `Complies with protocol: True
Publishing: {"order_id": "ORD-991"}`,
    },
    {
      title: 'Type Checking Inspection at Runtime',
      description: 'Inspecting __annotations__ dictionary dynamically.',
      pythonCode: `class UserProfile:
    user_id: int
    email: str
    is_active: bool = True

print("Declared annotations:")
for attr, type_hint in UserProfile.__annotations__.items():
    print(f" - {attr}: {type_hint}")`,
      runnable: true,
      expectedOutput: `Declared annotations:
 - user_id: <class 'int'>
 - email: <class 'str'>
 - is_active: <class 'bool'>`,
    },
  ],
  quiz: [
    {
      id: 'd8-q1',
      question: 'What happens at runtime in standard Python when you assign a string to a variable annotated as `x: int = "hello"`?',
      options: [
        'Python raises a `TypeError` immediately.',
        'Python converts the string into an integer automatically.',
        'Python executes without error; type annotations are ignored by the CPython runtime unless inspected or validated by a third-party tool.',
        'Python prints a compiler warning to stderr.',
      ],
      correctIndex: 2,
      explanation: 'Python uses gradual typing. The interpreter does not enforce type annotations at runtime; they are stored as metadata in `__annotations__`. Type errors must be caught ahead of time using static analysis tools like `mypy` or `pyright`.',
      seniorTrap: 'Engineers from C# or Java often assume type annotations act like static variable declarations that reject invalid types at runtime. In Python, they are strictly informational unless parsed by Pydantic.',
    },
    {
      id: 'd8-q2',
      question: 'In Python 3.10+, how should you annotate a function parameter that accepts an integer or can be `None`?',
      options: [
        '`Optional[int]` only',
        '`int | None`',
        '`Nullable<int>`',
        '`int?`',
      ],
      correctIndex: 1,
      explanation: 'PEP 604 introduced the union operator `|`. In Python 3.10+, `int | None` is the standard, readable idiom replacing legacy `Optional[int]` (which was always just alias for `Union[int, None]`).',
      seniorTrap: 'Coming from C# where `int?` is nullable, developers try `int?` in Python which is a syntax error. Use `int | None`.',
    },
    {
      id: 'd8-q3',
      question: 'What is the purpose of `from __future__ import annotations` (PEP 563)?',
      options: [
        'It enables asynchronous execution for all functions in the module.',
        'It causes type annotations to be stored as lazy string literals rather than being evaluated at module load time, eliminating forward reference and circular dependency issues.',
        'It makes all dataclasses immutable.',
        'It forces strict runtime type checking on every function call.',
      ],
      correctIndex: 1,
      explanation: 'By default, Python evaluates type hints when the class or function is defined. If a class references itself inside its own methods before it is fully defined, Python throws a `NameError`. `from __future__ import annotations` defers evaluation by storing hints as strings.',
      seniorTrap: 'Without this import, recursive data structures like `left: TreeNode | None` require awkward string quotes `"TreeNode" | None`.',
    },
    {
      id: 'd8-q4',
      question: 'What is `typing.TypedDict` primarily used for?',
      options: [
        'Creating a dictionary that enforces cryptographic hashing of keys.',
        'Providing static type checking for dictionary structures and JSON payloads with expected key names and value types, while remaining a regular Python `dict` at runtime.',
        'A thread-safe concurrent dictionary implementation.',
        'A dictionary that automatically sorts its keys in memory.',
      ],
      correctIndex: 1,
      explanation: '`TypedDict` allows developers to define types for dictionaries with specific string keys and value types. It behaves exactly like an interface in TypeScript: checked statically by mypy/pyright, with zero runtime performance cost.',
      seniorTrap: 'Unlike Pydantic models or dataclasses which create new object instances, `TypedDict` operates on raw dictionary objects directly.',
    },
    {
      id: 'd8-q5',
      question: 'What does `typing.Literal["GET", "POST"]` indicate to a static type checker?',
      options: [
        'The argument must be an HTTP request object.',
        'The argument must be the exact string literal "GET" or the exact string literal "POST", and no other string value.',
        'The argument is an immutable binary array.',
        'The function can only be invoked using HTTP GET or POST methods.',
      ],
      correctIndex: 1,
      explanation: '`Literal` allows typing a value to exact literal instances. This is common for string enums, configuration flags, and file modes (e.g. `Literal["r", "w", "a"]`).',
      seniorTrap: 'Using `Literal` avoids creating full Enum classes when passing constrained string flags to library functions.',
    },
    {
      id: 'd8-q6',
      question: 'How does `typing.Annotated[int, ...]` differ from a regular type hint?',
      options: [
        'It compiles the integer into a 64-bit C long.',
        'It allows attaching arbitrary metadata or validation constraints to the type, which static type checkers ignore as the underlying type, but runtime libraries (like FastAPI and Pydantic) can inspect and enforce.',
        'It encrypts the variable value in RAM.',
        'It makes the variable private to the current thread.',
      ],
      correctIndex: 1,
      explanation: '`Annotated[T, ...]` decorates a type with extra metadata. To a type checker like Mypy, `Annotated[int, Gt(0)]` is just `int`. But runtime frameworks inspect the metadata to apply schema validations, query parameters, or dependency injection.',
      seniorTrap: '`Annotated` is the architectural bridge between static analysis and runtime dependency injection in modern Python frameworks.',
    },
    {
      id: 'd8-q7',
      question: 'In Python 3.9+, why is importing `from typing import List, Dict, Set` discouraged in new code?',
      options: [
        'Because those types were deleted from the Python standard library.',
        'Because standard built-in collections (`list`, `dict`, `set`, `tuple`) natively support generics (PEP 585), e.g. `list[str]` and `dict[str, int]`.',
        'Because `List` is slower than `list` at runtime.',
        'Because type annotations are no longer allowed on collections.',
      ],
      correctIndex: 1,
      explanation: 'PEP 585 made built-in types generic. You can directly write `list[int]`, `dict[str, float]`, and `set[str]` without importing uppercase aliases from `typing`.',
      seniorTrap: 'Importing `typing.List` in Python 3.10+ is an outdated idiom that linters like `ruff` will flag for modernization.',
    },
    {
      id: 'd8-q8',
      question: 'Which tool is the modern, ultra-fast Rust-based linter and code formatter that has become the industry standard for Python codebases in place of Flake8, Black, and isort?',
      options: [
        'Babel',
        'ESLint',
        'Ruff',
        'Webpack',
      ],
      correctIndex: 2,
      explanation: '`ruff` (by Astral) is an extremely fast Python linter and formatter written in Rust. It replaces Flake8, Black, isort, pydocstyle, pyupgrade, and bandit, running orders of magnitude faster.',
      seniorTrap: 'Legacy codebases use separate configurations for Black, Flake8, and isort. Modern senior Python projects consolidate formatting and linting into `ruff` via `pyproject.toml`.',
    },
  ],
};
