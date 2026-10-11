import type { Lesson } from '../../types';

export const day1: Lesson = {
  day: 1,
  title: 'The Python Mental Model & Tooling for Senior Devs',
  subtitle: 'Name binding, PyObject memory model, LEGB scope, and modern Python tooling',
  estimatedMinutes: 35,
  category: 'core',
  seniorBridge: {
    csharp: 'Unlike C# where variables are typed memory locations (value types on stack, references on heap), Python variables are untyped name tags bound to heap-allocated PyObject instances. There is no `ref` or `out` keyword; everything is passed by object reference.',
    c_modula2: 'Coming from C pointers and Modula-2 modules: variables in Python are essentially pointers to reference-counted structs (`PyObject`). But you never dereference with `*` or `->`; assignment `a = b` merely increments `b`\'s reference count and binds the name `a` to the same struct.',
    javascript: 'Similar to JS primitives vs objects, but Python strings, integers, and tuples are strictly immutable. Python has no `undefined` vs `null` split—only `None` (a singleton instance of `NoneType`). Scope resolution uses the LEGB rule, not lexical block scoping.',
    c64_basic: 'Forget `POKE`, `PEEK`, line numbers, and global mutable variable tables. Python code is organized into modules, functions, and classes with garbage collection, automated memory tracking, and isolated namespaces.',
  },
  overview: `As an experienced engineer who has worked in C, Modula-2, C#, and JavaScript, the biggest trap in learning Python is treating it like "pseudocode with loose types". Python has a strict, elegant runtime model. Understanding how names bind to objects, how memory is managed, how scopes resolve (LEGB), and how to manage modern virtual environments (` + '`uv`' + ` and ` + '`pyproject.toml`' + `) will make you productive immediately without carrying over bad habits.`,
  keyTakeaways: [
    'Variables are not storage boxes: they are name labels bound to PyObject instances on the heap.',
    'Python types are bound to the object, not to the variable name.',
    'Assignment (`=`) binds a name; it never copies data.',
    'Mutability matters: `int`, `float`, `str`, `tuple`, `frozenset` are immutable; `list`, `dict`, `set` are mutable.',
    'Function arguments are passed by "object reference" (or "assignment"): mutating a mutable parameter affects the caller; reassigning the parameter name does not.',
    'Scope is resolved via LEGB: Local -> Enclosing -> Global -> Built-in. Python does NOT have block scope (e.g., variables declared inside `if` or `for` leak into the enclosing function!).',
    'Modern Python project management uses `pyproject.toml` and modern tools like `uv` or `poetry`, not unpinned `requirements.txt` or global system python.',
  ],
  sections: [
    {
      id: 'name-binding',
      title: '1. Variables as Names, Objects in Heap',
      content: `In C and C#, declaring \`int x = 10;\` allocates 4 bytes of memory (often on the stack). In Python, \`x = 10\` creates an integer object on the heap (\`PyLongObject\`) containing value 10, type metadata, and a reference count, then binds the identifier \`x\` to that object.

When you do \`y = x\`, Python does NOT copy the integer 10. It simply points the name \`y\` to the exact same object. You can inspect an object's memory address using \`id(obj)\` and identity using the \`is\` operator (\`x is y\`).`,
      codeSnippet: `x = [1, 2, 3]
y = x          # y and x point to the SAME list object
y.append(4)
print(x)       # [1, 2, 3, 4] -> x is mutated!

# Compare with immutables:
a = 1000
b = a
b += 1         # Creates a NEW integer object 1001, rebinds 'b'
print(a)       # 1000 (unchanged)
print(b)       # 1001
print(a is b)  # False`,
      seniorInsight: 'In C#, `==` checks value equality unless overridden, and `ReferenceEquals` checks identity. In Python, `==` invokes `__eq__()` for value equality, while `is` compares memory identity (equivalent to `id(a) == id(b)` or `ReferenceEquals`). Always use `x is None`, never `x == None`.',
    },
    {
      id: 'mutability-and-functions',
      title: '2. Pass-by-Object-Reference & The Mutable Default Gotcha',
      content: `Python is neither purely pass-by-value nor pass-by-reference: it is "pass by assignment" (or pass-by-object-reference). When you call a function, the parameter names receive references to the passed objects.

If you pass a mutable object (\`list\`, \`dict\`), the function can mutate it in place. However, if you reassign the parameter inside the function (\`param = ...\`), you merely rebind that local name without affecting the caller's object.

The most infamous senior gotcha in Python is default function arguments. Default arguments are evaluated ONCE when the \`def\` statement is executed at module load time, NOT each time the function is called!`,
      codeSnippet: `# THE GOTCHA:
def append_to_cache(item, cache=[]):  # BAD! The same list is shared across all calls!
    cache.append(item)
    return cache

print(append_to_cache('a'))  # ['a']
print(append_to_cache('b'))  # ['a', 'b'] -> Surprise!

# THE PYTHONIC IDIOM:
def append_to_cache_safe(item, cache=None):
    if cache is None:
        cache = []
    cache.append(item)
    return cache`,
      seniorInsight: 'In C# or JavaScript, default arguments like `void Foo(List<int> x = null)` or `function foo(x = [])` evaluate fresh expressions per invocation. In Python, the function is an object (`PyFunctionObject`), and its default arguments are stored in its `__defaults__` tuple at definition time.',
    },
    {
      id: 'legb-scope',
      title: '3. Scoping & The LEGB Rule (No Block Scope!)',
      content: `Python resolves variable names using the LEGB hierarchy:
1. **L**ocal: Inside the current function or lambda.
2. **E**nclosing: In any outer enclosing functions (closures).
3. **G**lobal: At the top level of the current module file.
4. **B**uilt-in: Preloaded namespace (\`len\`, \`range\`, \`print\`, \`ValueError\`).

CRITICAL FOR C#/C/JS DEVS: Python has **NO block scope** for \`if\`, \`for\`, \`while\`, or \`with\` blocks! A variable assigned inside a \`for\` loop or an \`if\` branch exists in the entire enclosing function!`,
      codeSnippet: `def process_records(records):
    for i, rec in enumerate(records):
        status = rec.get("status")
    
    # In C# or modern JS (let/const), 'status' and 'i' are out of scope here.
    # In Python, they are STILL IN SCOPE:
    print(f"Last loop index: {i}, last status: {status}")

# Modifying outer scopes:
counter = 0

def increment():
    # If we assign to 'counter' directly, Python treats it as a LOCAL variable!
    # counter += 1 -> UnboundLocalError: local variable 'counter' referenced before assignment
    global counter
    counter += 1`,
      seniorInsight: 'If you want to modify a variable in an enclosing function closure (not global), use the `nonlocal` keyword. This is the explicit Python equivalent of closing over outer lexical variables in JS or C# lambdas.',
    },
    {
      id: 'eafp-vs-lbyl',
      title: '4. EAFP vs LBYL ("Pythonic" Error Handling)',
      content: `In C and C#, the prevailing idiom is often **LBYL** ("Look Before You Leap"): check preconditions before acting (e.g., \`if (dict.ContainsKey(key)) return dict[key];\` or null checks).

In Python, the prevailing idiom is **EAFP** ("Easier to Ask for Forgiveness than Permission"): try the operation directly, and handle the specific exception if it fails.

Why?
1. EAFP avoids race conditions (TOCTOU: Time of Check to Time of Use) in multithreaded or filesystem operations.
2. Python exceptions are highly optimized in modern CPython (Python 3.11+ uses "zero-cost" exception handling where \`try\` blocks incur zero runtime overhead when no exception is thrown).`,
      codeSnippet: `# LBYL (Less Pythonic, double lookup):
def get_user_lbyl(data, user_id):
    if user_id in data:
        return data[user_id]["email"]
    return "unknown"

# EAFP (Pythonic, atomic):
def get_user_eafp(data, user_id):
    try:
        return data[user_id]["email"]
    except KeyError:
        return "unknown"`,
      seniorInsight: 'Never use bare `except:` without an exception class! Always catch specific exceptions (`except (KeyError, TypeError):`). Catching bare `except:` traps `KeyboardInterrupt`, `SystemExit`, and hides bugs.',
    },
    {
      id: 'modern-tooling',
      title: '5. Modern Python Environment (uv, pyproject.toml, venv)',
      content: `Forget outdated tutorials telling you to run \`pip install -r requirements.txt\` globally.

Modern Python in production uses:
1. **Virtual Environments (\`venv\`)**: Isolated directories containing python binaries and installed site-packages, preventing dependency clashes.
2. **\`pyproject.toml\` (PEP 517 / 518 / 621)**: The single declarative standard for project metadata, dependencies, build systems, and tool configs (replacing \`setup.py\`, \`setup.cfg\`, \`requirements.txt\`, \`flake8\`, etc.).
3. **\`uv\`**: The ultra-fast Rust-based package installer and resolver from Astral (10x-100x faster than pip). Think of it like \`npm\` / \`pnpm\` or \`cargo\` for Python.`,
      codeSnippet: `# Typical modern workflow with uv:
# 1. Initialize project with pyproject.toml:
#    uv init my-project
#
# 2. Add dependencies (updates pyproject.toml & creates uv.lock):
#    uv add fastapi pydantic httpx
#
# 3. Run script in isolated virtualenv automatically:
#    uv run main.py`,
      seniorInsight: 'Always configure your linter/formatter with `ruff` inside `pyproject.toml`. It replaces Flake8, Black, isort, and Bandit, running in milliseconds.',
    },
  ],
  codeExamples: [
    {
      title: 'Object Identity vs Equality & Mutability',
      description: 'Demonstrating how references, mutability, and memory identity interact.',
      pythonCode: `a = [10, 20, 30]
b = [10, 20, 30]

print("a == b:", a == b)    # True: identical content
print("a is b:", a is b)    # False: distinct heap objects

c = a
print("a is c:", a is c)    # True: same object reference

c.append(40)
print("a after mutating c:", a)  # [10, 20, 30, 40]`,
      runnable: true,
      expectedOutput: `a == b: True
a is b: False
a is c: True
a after mutating c: [10, 20, 30, 40]`,
    },
    {
      title: 'LEGB Scope and Nonlocal in Closures',
      description: 'Comparing local variable resolution, enclosing closures, and global bindings.',
      pythonCode: `def make_counter(start=0):
    count = start  # Enclosing scope variable
    
    def increment():
        nonlocal count  # Rebinds 'count' in enclosing scope
        count += 1
        return count
        
    return increment

c1 = make_counter(10)
print(c1())  # 11
print(c1())  # 12`,
      runnable: true,
      expectedOutput: `11
12`,
    },
  ],
  quiz: [
    {
      id: 'd1-q1',
      question: 'In Python, what is the output of the following code snippet?',
      codeSnippet: `x = [1, 2]
y = x
x = x + [3]
print(y)`,
      options: [
        '[1, 2]',
        '[1, 2, 3]',
        '[3]',
        'AttributeError: immutable operation',
      ],
      correctIndex: 0,
      explanation: 'The expression `x + [3]` creates a brand new list `[1, 2, 3]` and rebinds the identifier `x` to this new object. The identifier `y` is still bound to the original list `[1, 2]`. Contrast this with `x += [3]` or `x.append(3)`, which mutates the list in place!',
      seniorTrap: 'C# and JS developers often assume `+` with reassignment mutates the underlying collection, or confuse it with `x += [3]`. In Python, binary `+` produces a new object.',
    },
    {
      id: 'd1-q2',
      question: 'Consider this function definition:\n\ndef register_worker(name, active_workers=[]):\n    active_workers.append(name)\n    return active_workers\n\nWhat happens after running:\nregister_worker("Alice")\nprint(register_worker("Bob"))',
      codeSnippet: `def register_worker(name, active_workers=[]):
    active_workers.append(name)
    return active_workers

register_worker("Alice")
print(register_worker("Bob"))`,
      options: [
        "['Bob']",
        "['Alice', 'Bob']",
        "TypeError: default arguments cannot be lists",
        "['Alice']",
      ],
      correctIndex: 1,
      explanation: 'Default arguments in Python are evaluated once at function definition time (when the module is loaded), not at invocation time. The list `[]` was created once and attached to `register_worker.__defaults__`. Both calls share and mutate the same list object!',
      seniorTrap: 'In C# (`Foo(List<int> x = null)`) or JS (`function foo(x = [])`), default arguments re-evaluate per call. In Python, mutable default arguments persist state across invocations.',
    },
    {
      id: 'd1-q3',
      question: 'What is the fundamental difference between `a == b` and `a is b` in Python?',
      options: [
        '`==` checks reference equality, while `is` checks value equality',
        '`==` invokes `__eq__()` for value equality, while `is` checks object memory identity (`id(a) == id(b)`)',
        '`==` is for primitive types (`int`, `str`), while `is` is strictly for class instances',
        '`is` performs deep structural equality recursion while `==` performs shallow comparison',
      ],
      correctIndex: 1,
      explanation: 'In Python, `==` evaluates value equality via `__eq__()` (similar to `.Equals()` in C# or `===` with deep comparison). The keyword `is` tests identity—whether both names point to the exact same object in memory (like C# `Object.ReferenceEquals(a, b)`).',
      seniorTrap: 'Coming from JavaScript where `===` tests identity/strict type equality, JS devs often think `==` and `is` are like `==` and `===`. In Python, always use `is None`, but use `==` for values.',
    },
    {
      id: 'd1-q4',
      question: 'What will happen when executing this code?',
      codeSnippet: `total = 100

def add_tax():
    total += 15
    return total

add_tax()`,
      options: [
        'It returns 115',
        'It raises UnboundLocalError',
        'It creates a local variable total=15 and returns 15',
        'It compiles with a warning and returns 115',
      ],
      correctIndex: 1,
      explanation: 'Because Python parses `total += 15` as an assignment (`total = total + 15`), the compiler marks `total` as a LOCAL variable inside `add_tax`. When it evaluates the right-hand side (`total + 15`), the local `total` has not been assigned yet, raising `UnboundLocalError`. To modify the outer global, `global total` is required.',
      seniorTrap: 'In JS, reading an outer variable and assigning works due to lexical scoping. In C#, assigning to a variable in an outer scope works unless shadowed. Python requires explicit `global` or `nonlocal`.',
    },
    {
      id: 'd1-q5',
      question: 'Which of the following describes Python\'s scoping rules regarding blocks (such as `if`, `for`, `while`)?',
      options: [
        'Python creates a new lexical scope for every curly brace `{}` or indented block.',
        'Python has block scope for `for` loops, but not for `if` statements.',
        'Python does NOT have block scope; variables assigned inside loops or conditionals belong to the enclosing function or module.',
        'Python variables declared in loops are automatically garbage collected at loop exit.',
      ],
      correctIndex: 2,
      explanation: 'Python only introduces new scopes via modules, classes, and functions/lambdas/comprehensions. Block constructs like `if`, `for`, `while`, and `with` do not create a scope. A variable assigned inside a `for` loop continues to exist in the enclosing function after the loop completes.',
      seniorTrap: 'C, C++, C# and modern JS (`let`/`const`) all have block scope. Senior engineers frequently expect loop variables to be invisible outside the loop block.',
    },
    {
      id: 'd1-q6',
      question: 'Why is the EAFP idiom ("Easier to Ask for Forgiveness than Permission") preferred over LBYL in modern Python?',
      options: [
        'Because Python doesn\'t support conditional statements like `if` inside data pipelines.',
        'Because checking before acting (LBYL) can introduce race conditions (TOCTOU) and Python 3.11+ has zero-cost exception handling for unraised try blocks.',
        'Because exceptions in Python are faster than simple boolean checks even when they are thrown repeatedly.',
        'Because EAFP automatically suppresses all runtime errors without requiring `except` clauses.',
      ],
      correctIndex: 1,
      explanation: 'EAFP avoids Time-of-Check to Time-of-Use (TOCTOU) bugs (e.g., checking if a file exists before opening it—another process could delete it in between). Furthermore, in Python 3.11+, unthrown `try` blocks have zero overhead (zero-cost exceptions), making EAFP both cleaner and performant.',
      seniorTrap: 'In C# or Java, throwing exceptions incurs stack-walk penalties and is considered an anti-pattern for regular control flow. In Python, idiomatic code uses specific exceptions naturally (e.g., `KeyError`, `StopIteration`).',
    },
    {
      id: 'd1-q7',
      question: 'Which set of Python built-in types are ALL strictly immutable?',
      options: [
        '`list`, `dict`, `set`',
        '`int`, `str`, `tuple`, `frozenset`',
        '`int`, `tuple`, `bytearray`, `list`',
        '`str`, `dict`, `float`, `tuple`',
      ],
      correctIndex: 1,
      explanation: '`int`, `float`, `str`, `tuple`, `bytes`, and `frozenset` are strictly immutable. Once created, their internal values cannot change. `list`, `dict`, `set`, and `bytearray` are mutable.',
      seniorTrap: 'Coming from JS where strings are immutable but arrays/objects are mutable, note that Python tuples and frozensets are immutable collections that can serve as dictionary keys.',
    },
    {
      id: 'd1-q8',
      question: 'What is the purpose of `pyproject.toml` in modern Python project architectures (PEP 518/621)?',
      options: [
        'It is a compiled binary configuration file read only by the CPython interpreter.',
        'It is the unified, declarative standard replacing legacy fragmented configuration files (`setup.py`, `requirements.txt`, tool configs).',
        'It is an environment variable file identical to `.env`.',
        'It is an internal cache file generated automatically by `pip` that should be committed to `.gitignore`.',
      ],
      correctIndex: 1,
      explanation: '`pyproject.toml` is the official modern standard for Python projects. It defines build requirements, project metadata, dependencies, and configuration for tools like `ruff`, `pytest`, `mypy`, and build backends (Hatch, Flit, uv, Poetry).',
      seniorTrap: 'Senior engineers returning to Python often rely on `requirements.txt` or old `setup.py` scripts. Modern Python production systems standardize entirely on `pyproject.toml`.',
    },
  ],
};
