# Python for Senior Engineers 🐍

> An intensive 14-day accelerated curriculum and interactive Single-Page Application (SPA) designed specifically for senior software engineers transitioning to Python from **C64 BASIC**, **C & Modula-2**, and **C# & JavaScript**.

[![Deploy to GitHub Pages](https://github.com/actions/deploy-pages/badge.svg)](https://pages.github.com/)

---

## 🎯 Target Audience & Purpose

If you started coding with line numbers and `POKE`/`PEEK` on a Commodore 64, learned manual memory allocation and pointers in C and Modula-2 in college, and spent the last decade building systems in C# (.NET) and modern JavaScript/TypeScript, you don't need another tutorial explaining what an `if` statement or `while` loop is.

You need:
1. **The Mental Model Bridges**: Translating C# LINQ, tasks, and memory models to Python's object model, dunder protocols, and the GIL.
2. **High-Performance Data Processing**: Mastering list/generator comprehensions, streaming pipelines, file/JSON/CSV I/O, and vectorization with Pandas & Polars.
3. **Consuming & Creating Web APIs**: Writing resilient HTTP clients with `httpx` and building production-grade asynchronous APIs with **FastAPI** and **Pydantic v2**.
4. **Senior Production Standards**: Typing (mypy/pyright), testing with `pytest`, fixtures, proper mocking, `src/` layout, logging, and Docker containerization.

---

## 📅 The 14-Day Curriculum

| Day | Topic | Category | Key Focus |
|:---:|:---|:---:|:---|
| **Day 1** | **The Python Mental Model & Tooling** | Core | Name binding, PyObject memory, LEGB scopes, EAFP vs LBYL, `uv`, `pyproject.toml` |
| **Day 2** | **Data Structures & Memory Under the Hood** | Core | Dynamic pointer arrays, Hash tables, insertion order, `defaultdict`, `Counter`, copy mechanics |
| **Day 3** | **Pythonic Expressions & Pattern Matching** | Core | Comprehensions vs LINQ/JS, Walrus `:=`, extended unpacking, `match/case` |
| **Day 4** | **Functions, Closures & Callable Objects** | Core | Positional-only `/` & keyword-only `*`, late-binding closure trap, `functools.partial`, `__call__` |
| **Day 5** | **Iterators, Generators & Streaming** | Data | `__iter__` / `__next__`, `yield` vs C# `IEnumerable`, exhaustion gotcha, `itertools` mastery |
| **Day 6** | **OOP the Python Way: Dunders & Protocols** | Core | `__new__` vs `__init__`, `@dataclass(frozen=True)`, properties, MRO, `typing.Protocol` |
| **Day 7** | **Metaprogramming: Decorators & Context** | Core | Decorator mechanics, `@functools.wraps`, parameterized factories, `with`, `contextlib` |
| **Day 8** | **Modern Typing & Static Analysis** | Core | PEP 604 `A \| B`, generic built-ins, `TypedDict`, `Literal`, `Annotated`, Mypy & Pyright |
| **Day 9** | **Data Processing I: Files, CSV & JSON** | Data | `pathlib.Path`, `csv.DictReader`, custom JSON encoders, Pickle safety, big file streaming |
| **Day 10** | **Data Processing II: Tabular Data** | Data | Vectorization imperative, Boolean masks `&`/`\|`, GroupBy, Polars LazyFrames, Parquet |
| **Day 11** | **Consuming Web APIs: HTTPX & Resilience** | APIs | Requests vs Async `httpx`, connection pooling, timeout discipline, retries with jitter |
| **Day 12** | **Creating Web APIs: FastAPI & Pydantic** | APIs | ASGI/Starlette, Pydantic v2 models, route parameters, response filtering, `Depends()` DI |
| **Day 13** | **Concurrency, Parallelism & The GIL** | Architecture | GIL explained, ThreadPool vs ProcessPool, `asyncio.TaskGroup`, event loop discipline |
| **Day 14** | **Senior Engineering: Testing & Docker** | Architecture | Pytest fixtures & parametrization, mocking patch gotcha, `src/` layout, JSON logging, Docker |

---

## ⚡ App Features

- **Self-Contained Units**: Each lesson contains comprehensive explanations, senior insights, comparative bridges (C#, C/Modula-2, JS, C64 BASIC), runnable code snippets, and expected outputs.
- **Mastery Assessment Quizzes**:
  - 8 multiple-choice questions (4 options each) at the end of each section (112 total questions).
  - Requires **≥ 80% score** to receive credit and unlock the next day.
  - Interactive scoring, immediate feedback, and **"Why Senior Engineers Get This Wrong"** explanations for common traps.
  - **Reset & Retake**: Reset any quiz at any time to re-evaluate your knowledge.
- **In-Browser Python 3.12 Playground**:
  - Powered by **Pyodide (WebAssembly)**.
  - Run pure Python code directly in your browser with stdout capture and execution timing without installing Python locally.
- **LocalStorage Persistence**:
  - All quiz attempts, scores, and completion progress are saved locally in the browser.
  - Includes **Export Progress (JSON)** and **Import Progress (JSON)** for backing up or transferring progress across devices.
- **Responsive Modern UI**:
  - Dark mode and Light mode with persistent preferences.
  - Search and filter lessons by title, subtitle, or category.
  - Keyboard shortcuts and smooth hash-based SPA routing (`#/day/1`, `#/day/2`).
  - Printable **Certificate of Achievement** upon completing all 14 sections.

---

## 🚀 Running Locally

1. Clone repository and install dependencies:
```bash
git clone https://github.com/your-username/python-tutor.git
cd python-tutor
npm install
```

2. Start the local development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`.

4. Build production static bundle:
```bash
npm run build
```

---

## 🌐 Deploying to GitHub Pages

This app is designed as a zero-backend Single-Page Application (SPA) with relative asset URLs (`base: './'`), making it 100% compatible with GitHub Pages out of the box.

### Automatic Deployment via GitHub Actions (Recommended)
1. Push this repository to GitHub on `main` or `master`.
2. Go to your repository **Settings** -> **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. The included `.github/workflows/deploy.yml` workflow will automatically trigger, build the project, and publish it live!

### Manual Deployment
If you prefer manual deployment:
1. Run `npm run build` to generate the `dist/` directory.
2. Push the contents of `dist/` to a `gh-pages` branch or serve from the `/docs` folder.

---

## 📄 License
MIT License. Free for personal learning and public distribution.
