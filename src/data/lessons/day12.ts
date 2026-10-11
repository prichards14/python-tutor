import type { Lesson } from '../../types';

export const day12: Lesson = {
  day: 12,
  title: 'Creating Web APIs: FastAPI, Pydantic & Dependency Injection',
  subtitle: 'ASGI Architecture, Pydantic v2 Models, Route Anatomy, and FastAPI Depends()',
  estimatedMinutes: 50,
  category: 'api',
  seniorBridge: {
    csharp: 'FastAPI combined with Pydantic v2 is the Python equivalent of ASP.NET Core Web API with Model Validation and built-in Dependency Injection (`IServiceCollection`). `Depends()` functions like ASP.NET Core service injection, while Pydantic handles strongly-typed DTO validation with automatic OpenAPI (Swagger) generation.',
    c_modula2: 'Instead of procedural CGI scripts or low-level socket handling, FastAPI runs on ASGI (Asynchronous Server Gateway Interface), processing thousands of concurrent HTTP connections non-blockingly.',
    javascript: 'FastAPI feels like Express or Fastify combined with Zod validation and automatic Swagger UI at `/docs`. Route parameter definitions directly map to TypeScript-style typed function signatures.',
    c64_basic: 'Modern web APIs return structured JSON payloads with typed contracts, automatic documentation, and schema enforcement.',
  },
  overview: `FastAPI has revolutionized Python backend development. By integrating Starlette (high-performance ASGI web framework) with Pydantic (Rust-backed data validation), FastAPI generates interactive OpenAPI/Swagger documentation automatically, validates incoming HTTP payloads against type hints, and provides a powerful Dependency Injection system through ` + '`Depends()`' + `. In this lesson, we explore Pydantic v2, route design, response filtering, and production DI patterns.`,
  keyTakeaways: [
    'FastAPI uses ASGI (Asynchronous Server Gateway Interface), allowing worker servers like Uvicorn to handle asynchronous WebSocket and HTTP traffic.',
    'Pydantic is a parsing and validation engine, not just a type checker. It coerces compatible data types (e.g. string `"42"` into integer `42`) and rejects incompatible data with structured 422 Unprocessable Entity errors.',
    'FastAPI determines whether a parameter is a path parameter, query parameter, or request body strictly from function signatures and Pydantic types.',
    'Always use `response_model` on routes. It acts as an output filter, ensuring internal database fields (like `hashed_password` or internal tenant IDs) are NEVER serialized to external API clients.',
    'FastAPI\'s Dependency Injection (`Depends()`) resolves dependencies hierarchically. Using generator dependencies (`yield db; finally: db.close()`) guarantees resource teardown after the HTTP response completes.',
    'Raise `HTTPException(status_code=..., detail=...)` for standard business errors; configure `@app.exception_handler` for global custom exception translation.',
  ],
  sections: [
    {
      id: 'pydantic-v2-foundations',
      title: '1. Pydantic v2: Data Modeling & Validation',
      content: `Pydantic v2 is rewritten in Rust (pydantic-core), making validation 5x-50x faster. 

A Pydantic model inherits from \`pydantic.BaseModel\`. It validates inputs, coerces types, enforces constraints, and serializes to JSON.

**Key Features**:
- \`Field(ge=0, le=1000, description="...")\`: Adds schema constraints.
- \`@field_validator\`: Custom per-field validation rules.
- \`model.model_dump()\`: Converts model to Python dict.
- \`model.model_dump_json()\`: Converts model directly to JSON string.`,
      codeSnippet: `from pydantic import BaseModel, Field, field_validator, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: str
    age: int = Field(ge=18, le=120)
    tags: list[str] = Field(default_factory=list)

    @field_validator("username")
    @classmethod
    def validate_alphanumeric(cls, v: str) -> str:
        if not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        return v.lower()

# Pydantic coerces compatible types automatically:
user = UserCreate(username="PatSmith99", email="pat@co.com", age="45")
print("Parsed age as int:", type(user.age), user.age)  # <class 'int'> 45
print("Sanitized username:", user.username)            # 'patsmith99'
print("Serialized JSON:", user.model_dump_json())`,
      seniorInsight: 'Notice age was passed as string `"45"` and coerced to integer `45`. Pydantic is a parsing library: it guarantees the resulting object matches the schema, not that the input was rigidly typed.',
    },
    {
      id: 'fastapi-route-anatomy',
      title: '2. FastAPI Route Anatomy & Parameter Resolution',
      content: `FastAPI resolves parameters using a clean convention:
1. **Path Parameter**: Declared in route path: \`@app.get("/items/{item_id}")\` -> \`def get_item(item_id: int):\`
2. **Query Parameter**: Primitive type NOT in route path: \`def get_items(limit: int = 10, offset: int = 0):\`
3. **Request Body**: A parameter typed as a Pydantic \`BaseModel\`: \`def create_item(payload: ItemCreate):\`
4. **Header / Cookie**: Explicitly declared using \`Header()\` or \`Cookie()\`.`,
      codeSnippet: `from fastapi import FastAPI, status, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Inventory API", version="1.0.0")

class Product(BaseModel):
    name: str
    price: float

# In-memory store:
DB = {}

@app.post("/products/{sku}", status_code=status.HTTP_201_CREATED)
def create_product(sku: str, product: Product, notify_admin: bool = False):
    # sku: Path param
    # product: Request Body (JSON)
    # notify_admin: Query param (?notify_admin=true)
    if sku in DB:
        raise HTTPException(status_code=400, detail="Product already exists")
    DB[sku] = product
    return {"sku": sku, "status": "created", "notified": notify_admin}`,
      seniorInsight: 'Interactive Swagger UI is automatically available at `/docs`, and ReDoc is at `/redoc`. FastAPI generates these from your Pydantic schemas and type hints with zero extra documentation code.',
    },
    {
      id: 'response-models-security',
      title: '3. Response Models & Data Leaks Prevention',
      content: `A common vulnerability in web APIs is returning internal database models directly, accidentally leaking password hashes, internal IDs, or credit card tokens.

FastAPI solves this with \`response_model\`. It filters the returned object through the output schema, serializing ONLY the fields defined in the response model.`,
      codeSnippet: `class UserInDB(BaseModel):
    id: int
    username: str
    email: str
    hashed_password: str  # SECRET!
    internal_notes: str

class UserPublic(BaseModel):
    id: int
    username: str
    email: str
    # hashed_password and internal_notes are OMITTED!

# Even if the route returns a UserInDB instance or ORM model:
# @app.get("/users/{user_id}", response_model=UserPublic)
# def get_user(user_id: int):
#     db_user = db.query(user_id) # Contains hashed_password
#     return db_user # FastAPI automatically filters out hashed_password!`,
      seniorInsight: 'Using separate Input DTOs (`UserCreate`) and Output DTOs (`UserPublic`) is the gold standard for clean architecture in FastAPI.',
    },
    {
      id: 'dependency-injection',
      title: '4. Dependency Injection with Depends()',
      content: `FastAPI includes a built-in Dependency Injection system via \`Depends(dependency_callable)\`.

What DI solves:
- Shared database session lifecycles (open transaction, yield to handler, commit/rollback, close).
- Authentication & JWT token extraction.
- Reusable pagination, rate limiting, and permissions checks.

**Generator Dependencies (Yield)**:
If a dependency contains \`yield\`, code before \`yield\` executes before the route handler, and code after \`yield\` executes after the response is sent.`,
      codeSnippet: `from fastapi import Depends, Header, HTTPException

def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != "secret-token-123":
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return {"client": "TrustedPartner"}

def get_db():
    print("Opening database connection...")
    db = {"connected": True}
    try:
        yield db  # Injected into route handler!
    finally:
        print("Closing database connection safely!")

# Route using multiple injected dependencies:
# @app.get("/secure-metrics")
# def get_metrics(auth = Depends(verify_api_key), db = Depends(get_db)):
#     return {"data": "confidential_metrics", "client": auth["client"]}`,
      seniorInsight: 'FastAPI dependencies can depend on other dependencies (hierarchical DI graphs). FastAPI resolves and caches dependencies within the scope of a single request.',
    },
  ],
  codeExamples: [
    {
      title: 'Simulating FastAPI Request Parameter Resolution',
      description: 'Understanding how FastAPI inspects type hints to parse inputs.',
      pythonCode: `from dataclasses import dataclass

@dataclass
class QueryParams:
    page: int = 1
    page_size: int = 20

def parse_simulated_request(path_val: str, query_dict: dict, body_dict: dict):
    # Simulated parameter mapping:
    entity_id = int(path_val)
    pagination = QueryParams(
        page=int(query_dict.get("page", 1)),
        page_size=int(query_dict.get("page_size", 20))
    )
    title = str(body_dict.get("title", ""))
    return {
        "entity_id": entity_id,
        "page": pagination.page,
        "page_size": pagination.page_size,
        "title": title
    }

parsed = parse_simulated_request("42", {"page": "2", "page_size": "50"}, {"title": "Update Item"})
print("Parsed API invocation:", parsed)`,
      runnable: true,
      expectedOutput: `Parsed API invocation: {'entity_id': 42, 'page': 2, 'page_size': 50, 'title': 'Update Item'}`,
    },
    {
      title: 'Pydantic Model Validation and Custom Error Interception',
      description: 'Demonstrating validation rules and structured error messages.',
      pythonCode: `from pydantic import BaseModel, Field, ValidationError

class TransferRequest(BaseModel):
    from_account: str
    to_account: str
    amount_cents: int = Field(gt=0, description="Amount must be positive")

# Test valid transfer:
valid_req = TransferRequest(from_account="acc_1", to_account="acc_2", amount_cents=5000)
print("Valid transfer:", valid_req.model_dump())

# Test invalid transfer:
try:
    TransferRequest(from_account="acc_1", to_account="acc_2", amount_cents=-100)
except ValidationError as e:
    print("Caught validation error:")
    for err in e.errors():
        print(f" - Field: {err['loc'][0]}, Message: {err['msg']}")`,
      runnable: true,
      expectedOutput: `Valid transfer: {'from_account': 'acc_1', 'to_account': 'acc_2', 'amount_cents': 5000}
Caught validation error:
 - Field: amount_cents, Message: Input should be greater than 0`,
    },
  ],
  quiz: [
    {
      id: 'd12-q1',
      question: 'In FastAPI, what determines whether a function parameter is treated as a Path parameter, Query parameter, or Request Body?',
      options: [
        'An explicit `@parameter` decorator must be placed above the function.',
        'If the parameter name is declared in the route path string, it is a Path param; if it is a Pydantic `BaseModel`, it is the Request Body; otherwise, primitive types default to Query params.',
        'FastAPI only reads query parameters; request bodies require Flask.',
        'Parameters must always be named `path`, `query`, and `body`.',
      ],
      correctIndex: 1,
      explanation: 'FastAPI uses type hints and path matching: if the parameter name appears in the path template (e.g. `"/users/{user_id}"`), it is a path parameter. If the type is a subclass of Pydantic\'s `BaseModel`, it is parsed from the JSON body. Primitive types (int, str, bool) not in the path are parsed as query string parameters.',
      seniorTrap: 'Newcomers often wonder how FastAPI knows where parameters come from without verbose annotations. It is convention over configuration based on type hints.',
    },
    {
      id: 'd12-q2',
      question: 'Why is defining a `response_model` on FastAPI routes considered a critical security and architecture practice?',
      options: [
        'Because FastAPI will not execute routes without a response model.',
        'It acts as an output filter, ensuring that internal or sensitive fields (such as password hashes, secret keys, or internal IDs) returned by the handler are filtered out before sending JSON to the client.',
        'It compresses the HTTP response using Gzip.',
        'It encrypts the response using SSL.',
      ],
      correctIndex: 1,
      explanation: 'Even if your handler returns a full database ORM model containing sensitive fields like `hashed_password` or `internal_notes`, FastAPI validates and serializes the return value using the `response_model`. Any fields not defined in the `response_model` are automatically excluded from the final response.',
      seniorTrap: 'Returning ORM entities directly without an output DTO / `response_model` is a classic vulnerability for accidental data leakage.',
    },
    {
      id: 'd12-q3',
      question: 'What is the purpose of FastAPI\'s `Depends()` function in route signatures?',
      options: [
        'It downloads npm packages required by the frontend.',
        'It declares a dependency that FastAPI resolves dynamically (Dependency Injection), allowing sharing of database sessions, authentication checks, permissions, and request context.',
        'It delays request execution until the server CPU drops below 50%.',
        'It forces routes to execute sequentially.',
      ],
      correctIndex: 1,
      explanation: '`Depends()` provides declarative Dependency Injection in FastAPI. It inspects the dependency callable, resolves its parameters (including nested dependencies), executes it, and passes the result to your route handler.',
      seniorTrap: 'C# engineers who use ASP.NET Core\'s Constructor Injection (`IServiceProvider`) will appreciate FastAPI\'s method-level parameter injection via `Depends()`.',
    },
    {
      id: 'd12-q4',
      question: 'How does FastAPI handle cleanup/teardown in a dependency that uses the `yield` statement (e.g. closing a database connection)?',
      options: [
        'It requires an external cron job to run cleanup.',
        'Code before `yield` runs before the route handler, and code after `yield` runs automatically after the HTTP response has been sent to the client.',
        'Code after `yield` is ignored and never runs.',
        'It raises a SyntaxError because dependencies cannot be generators.',
      ],
      correctIndex: 1,
      explanation: 'FastAPI supports generator dependencies. Code up to the `yield` runs before the endpoint handler is called. Once the endpoint finishes and the response is sent, FastAPI resumes the dependency to execute the cleanup code (inside `finally`), guaranteeing deterministic resource release.',
      seniorTrap: 'This provides the exact equivalent of scoped services with `IDisposable` in C# ASP.NET Core.',
    },
    {
      id: 'd12-q5',
      question: 'What HTTP status code does FastAPI automatically return when an incoming request fails Pydantic schema validation?',
      options: [
        '400 Bad Request',
        '422 Unprocessable Entity',
        '500 Internal Server Error',
        '403 Forbidden',
      ],
      correctIndex: 1,
      explanation: 'FastAPI automatically catches `pydantic.ValidationError` and transforms it into an HTTP `422 Unprocessable Entity` response containing detailed JSON describing which fields failed and why.',
      seniorTrap: 'Developers used to returning 400 for everything should note that FastAPI standardizes on RFC 4918 status 422 for structured semantic validation failures.',
    },
    {
      id: 'd12-q6',
      question: 'How do you raise a standard HTTP error in a FastAPI route handler (e.g. when an item is not found)?',
      options: [
        '`return {"error": 404, "message": "Not found"}`',
        '`raise HTTPException(status_code=404, detail="Item not found")`',
        '`sys.exit(404)`',
        '`raise NotFoundError()` without status codes',
      ],
      correctIndex: 1,
      explanation: 'In FastAPI, `raise HTTPException(status_code=404, detail="...")` halts execution and sends a properly formatted HTTP response with the specified status code and error details.',
      seniorTrap: 'Returning an error dictionary with status code 200 is an anti-pattern. Always raise `HTTPException` with appropriate status codes.',
    },
    {
      id: 'd12-q7',
      question: 'In Pydantic v2, which method converts a model instance into a standard Python dictionary?',
      options: [
        '`.dict()` (deprecated from v1)',
        '`.model_dump()`',
        '`.to_dict()`',
        '`.as_dictionary()`',
      ],
      correctIndex: 1,
      explanation: 'Pydantic v2 modernized its API: `.dict()` was replaced by `.model_dump()`, and `.json()` was replaced by `.model_dump_json()`.',
      seniorTrap: 'Older tutorials and AI tools trained on Pydantic v1 will use `.dict()`. Modern Pydantic v2 code uses `.model_dump()`.',
    },
    {
      id: 'd12-q8',
      question: 'What is Uvicorn in the FastAPI ecosystem?',
      options: [
        'A database migration tool.',
        'A lightning-fast ASGI web server implementation (powered by uvloop and httptools) that hosts and runs FastAPI applications.',
        'A CSS framework for OpenAPI documentation.',
        'A Python packaging tool.',
      ],
      correctIndex: 1,
      explanation: 'FastAPI is an application framework; Uvicorn is the ASGI web server that listens on network ports, accepts TCP sockets, and forwards HTTP/WebSocket events to FastAPI.',
      seniorTrap: 'In production, FastAPI apps are typically run with Uvicorn workers behind a reverse proxy (like Nginx, Traefik, or AWS ALB) using Gunicorn or Docker.',
    },
  ],
};
