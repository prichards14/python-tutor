import type { Lesson } from '../../types';

export const day4: Lesson = {
  day: 4,
  title: 'Advanced Functions, Closures & Callable Objects',
  subtitle: 'Signatures (/, *), Late-Binding Trap, Closures, functools.partial, and __call__',
  estimatedMinutes: 40,
  category: 'core',
  seniorBridge: {
    csharp: 'In C#, delegates and lambdas have strict static signatures and capturing loop variables was fixed in C# 5. In Python, closures capture variable names, not values, creating the classic "late binding" gotcha. Python functions can enforce positional-only (`/`) or keyword-only (`*`) parameters at the language level.',
    c_modula2: 'In C, functions are raw code pointers without enclosed state. In Python, a function is a first-class heap object with an associated `__closure__` cell tuple storing references to enclosed scope variables.',
    javascript: 'Python\'s late-binding loop variable trap in closures is identical to JavaScript\'s infamous `var i` inside `setTimeout` loops! The fix in Python is default parameter binding (`lambda x, i=i: ...`) or `functools.partial`.',
    c64_basic: 'No more `GOSUB 1000` and `RETURN` jumping through memory with shared global variables. Python functions are isolated, modular, higher-order callable abstractions.',
  },
  overview: `Senior engineers often treat Python functions as simple subroutines. In reality, Python functions are rich objects with introspectable signatures, closure cells, and strict parameter classification. Mastering positional-only and keyword-only markers, closing over variables properly, and building stateful callable classes with ` + '`__call__`' + ` will transform how you design clean APIs.`,
  keyTakeaways: [
    'Python functions are first-class objects with attributes like `__name__`, `__doc__`, `__annotations__`, and `__closure__`.',
    'Closures in Python exhibit late-binding: inner functions look up enclosed variables when CALLED, not when defined. Use default argument capture `lambda x, i=i: ...` to capture by value.',
    'Python supports 5 parameter kinds: positional-only (before `/`), positional-or-keyword, keyword-only (after `*`), var-positional (`*args`), and var-keyword (`**kwargs`).',
    'Keyword-only parameters enforce self-documenting call sites (e.g., `def create_user(name, *, is_admin=False)` forces `create_user("Alice", is_admin=True)`).',
    'Any class implementing `__call__(self, ...)` becomes a callable object, allowing you to encapsulate state and behavior without global variables.',
    '`functools.partial` freezes a subset of function arguments and keywords, producing a new callable with a reduced arity.',
  ],
  sections: [
    {
      id: 'parameter-kinds',
      title: '1. Advanced Signatures: Positional-Only (/) & Keyword-Only (*)',
      content: `Python allows authors to explicitly constrain how callers pass arguments:

\`def func(pos_only, /, standard, *, kw_only):\`
- Everything **before \`/\`** is **positional-only**: callers cannot pass these by name.
- Everything **between \`/\` and \`*\`** can be passed by position or by keyword.
- Everything **after \`*\`** is **keyword-only**: callers MUST pass these by name.

Why use this as a Senior Dev?
1. **API evolution**: Positional-only parameters allow you to rename internal parameter names without breaking callers.
2. **Preventing boolean blindness**: Keyword-only arguments prevent ambiguous calls like \`format_data(data, True, False, 10)\` -> forcing \`format_data(data, strip_whitespace=True, validate=False, timeout=10)\`.`,
      codeSnippet: `def create_session(host, port, /, *, timeout=30, ssl=True):
    return {"endpoint": f"{host}:{port}", "timeout": timeout, "ssl": ssl}

# Valid calls:
s1 = create_session("api.co", 443, timeout=10)
s2 = create_session("api.co", 443, ssl=False, timeout=60)

# Invalid calls:
# create_session(host="api.co", port=443)  # TypeError: host is positional-only
# create_session("api.co", 443, 10, True)   # TypeError: takes 2 positional args`,
      seniorInsight: 'Many CPython built-in functions written in C (like `len` or `math.sin`) are positional-only. PEP 570 introduced `/` so your Python libraries can match standard library semantics.',
    },
    {
      id: 'late-binding-closures',
      title: '2. Closures & The Late-Binding Trap',
      content: `When a function is nested inside another function and references an outer variable, Python creates a **closure**. The inner function holds a reference to a "cell" pointing to the outer variable.

**The Trap**:
The lookup happens when the inner function is **executed**, not when it is created. If the outer variable changes in a loop, all closures will see the final value!`,
      codeSnippet: `# THE GOTCHA (Late Binding):
funcs = [lambda x: x + i for i in range(4)]
print([f(10) for f in funcs])  # [13, 13, 13, 13] -> All used i=3!

# SOLUTION 1: Default argument capture (evaluated at definition time):
funcs_fixed = [lambda x, i=i: x + i for i in range(4)]
print([f(10) for f in funcs_fixed])  # [10, 11, 12, 13]

# SOLUTION 2: functools.partial:
from functools import partial

def add(x, i):
    return x + i

funcs_partial = [partial(add, i=i) for i in range(4)]`,
      seniorInsight: 'This is identical to JavaScript’s classic `for (var i = 0; i < 4; i++) { callbacks.push(function() { return i; }); }`. In Python, binding `i=i` in default arguments is the established idiom.',
    },
    {
      id: 'stateful-callables',
      title: '3. Stateful Callables via __call__',
      content: `Sometimes a function needs to maintain internal state across calls (e.g., rate limiting, token buckets, moving averages, or memoization).

Instead of using global variables or nested closures with \`nonlocal\`, create a class that implements \`__call__\`. Any instance of this class behaves like a function, with full encapsulation and testability.`,
      codeSnippet: `class RateLimiter:
    def __init__(self, max_calls: int):
        self.max_calls = max_calls
        self.calls = 0

    def __call__(self, *args, **kwargs):
        if self.calls >= self.max_calls:
            raise RuntimeError("Rate limit exceeded")
        self.calls += 1
        return f"Executed call #{self.calls}"

limiter = RateLimiter(max_calls=2)
print(limiter())  # Executed call #1
print(limiter())  # Executed call #2
print(callable(limiter))  # True
# limiter() -> RuntimeError`,
      seniorInsight: 'In C#, you would write a class implementing a `Func<...>` delegate or an interface. In Python, implementing `__call__` makes `callable(instance)` return `True` and allows passing the instance anywhere a function is expected.',
    },
    {
      id: 'partial-and-inspect',
      title: '4. Currying with functools.partial & Signature Introspection',
      content: `\`functools.partial\` creates a callable wrapper that locks in some arguments of a function. This is essential when adapting third-party API callbacks that expect a specific number of arguments.

Additionally, Python\'s \`inspect\` module allows dynamic signature analysis at runtime, which is how frameworks like FastAPI and pytest perform dependency injection.`,
      codeSnippet: `from functools import partial
import inspect

def send_alert(environment: str, channel: str, message: str):
    return f"[{environment.upper()} -> #{channel}] {message}"

# Create specialized production alert function:
prod_slack_alert = partial(send_alert, "prod", channel="ops-pager")
print(prod_slack_alert(message="Database CPU at 98%"))

# Introspecting function parameters:
sig = inspect.signature(send_alert)
for name, param in sig.parameters.items():
    print(f"Param: {name}, Kind: {param.kind.name}, Annotation: {param.annotation}")`,
      seniorInsight: 'FastAPI uses `inspect.signature` to inspect route function parameter names, types, and defaults to construct OpenAPI docs and validate HTTP requests automatically.',
    },
  ],
  codeExamples: [
    {
      title: 'Designing Clean APIs with Keyword-Only Constraints',
      description: 'Using keyword-only markers to enforce readable call sites.',
      pythonCode: `def execute_query(sql: str, *, timeout_sec: int = 30, dry_run: bool = False):
    return f"Running '{sql}' (timeout={timeout_sec}s, dry_run={dry_run})"

# Callers are forced to be explicit for flags:
result = execute_query("SELECT * FROM orders", timeout_sec=15, dry_run=True)
print(result)

# execute_query("SELECT 1", 15, True) 
# -> TypeError: execute_query() takes 1 positional argument but 3 were given`,
      runnable: true,
      expectedOutput: `Running 'SELECT * FROM orders' (timeout=15s, dry_run=True)`,
    },
    {
      title: 'Callable Pipeline Handlers with State',
      description: 'Building an extensible data transformation pipeline using callable objects.',
      pythonCode: `class ValueClipper:
    def __init__(self, min_val: float, max_val: float):
        self.min_val = min_val
        self.max_val = max_val

    def __call__(self, val: float) -> float:
        return max(self.min_val, min(val, self.max_val))

clipper = ValueClipper(0.0, 100.0)
raw_readings = [-15.0, 42.5, 120.0, 88.2]
normalized = list(map(clipper, raw_readings))
print("Normalized readings:", normalized)`,
      runnable: true,
      expectedOutput: `Normalized readings: [0.0, 42.5, 100.0, 88.2]`,
    },
  ],
  quiz: [
    {
      id: 'd4-q1',
      question: 'Consider the function signature: `def query(endpoint, /, retries=3, *, timeout=30):`\nWhich of the following calls is INVALID and will raise a TypeError?',
      options: [
        '`query("https://api.co", 5, timeout=60)`',
        '`query("https://api.co", retries=5, timeout=60)`',
        '`query(endpoint="https://api.co", retries=5, timeout=60)`',
        '`query("https://api.co", timeout=45)`',
      ],
      correctIndex: 2,
      explanation: 'The `/` symbol specifies that all parameters before it (`endpoint`) are POSITIONAL-ONLY. Passing `endpoint="https://api.co"` as a keyword argument is forbidden and raises `TypeError: query() got some positional-only arguments passed as keyword arguments`.',
      seniorTrap: 'Newcomers assume all parameters in Python can be passed by keyword. When `/` is used, keyword passing is disallowed for preceding parameters.',
    },
    {
      id: 'd4-q2',
      question: 'What is the output of the following code snippet?',
      codeSnippet: `multipliers = [lambda x: x * i for i in range(3)]
print([m(2) for m in multipliers])`,
      options: [
        '[0, 2, 4]',
        '[4, 4, 4]',
        '[0, 0, 0]',
        'NameError: name \'i\' is not defined',
      ],
      correctIndex: 1,
      explanation: 'Due to late binding in closures, the lambdas capture the variable `i`, not its value at creation. When the loop finishes, `i` has the value 2. When the lambdas are subsequently called with `x = 2`, every lambda evaluates `2 * 2 = 4`, yielding `[4, 4, 4]`.',
      seniorTrap: 'This is the classic late-binding gotcha that catches experienced engineers from C# and JS. The fix is `lambda x, i=i: x * i`.',
    },
    {
      id: 'd4-q3',
      question: 'How do you fix the late-binding issue in `multipliers = [lambda x: x * i for i in range(3)]` so that it outputs `[0, 2, 4]`?',
      options: [
        '`[lambda x, i=i: x * i for i in range(3)]`',
        '`[lambda x: x * (copy i) for i in range(3)]`',
        '`[lambda x: x * nonlocal i for i in range(3)]`',
        '`[frozen(lambda x: x * i) for i in range(3)]`',
      ],
      correctIndex: 0,
      explanation: 'Default arguments are evaluated when the function is defined. By writing `i=i`, each lambda receives a default parameter `i` whose default value is bound to the value of `i` in that specific iteration.',
      seniorTrap: 'This idiom looks strange initially, but it is the universal standard in Python for binding loop variables into closures.',
    },
    {
      id: 'd4-q4',
      question: 'What special method must a Python class implement so that instances of the class can be called like functions (`instance(arg)`)?',
      options: [
        '`__invoke__`',
        '`__run__`',
        '`__call__`',
        '`__exec__`',
      ],
      correctIndex: 2,
      explanation: 'Implementing `__call__(self, *args, **kwargs)` makes instances of the class callable objects. Built-in `callable(instance)` will return `True`.',
      seniorTrap: 'Developers from C# look for `Invoke` delegates; C++ devs look for `operator()`. In Python, the dunder method is `__call__`.',
    },
    {
      id: 'd4-q5',
      question: 'In the signature `def log_event(event_type, *tags, verbose=False):`, how must `verbose` be passed by callers?',
      options: [
        'It can be passed either positionally or by keyword.',
        'It MUST be passed as a keyword argument (e.g. `verbose=True`).',
        'It can only be passed as a tuple element.',
        'It cannot be overridden by callers.',
      ],
      correctIndex: 1,
      explanation: 'Any parameter appearing after `*args` (or after a standalone `*`) is a keyword-only parameter. If callers pass positional arguments, they are consumed by `*tags`. Thus, `verbose` can only be passed as a keyword.',
      seniorTrap: 'In C# or Java, optional parameters must appear at the end and can be passed positionally. In Python, placing parameters after `*` or `*args` enforces keyword-only access.',
    },
    {
      id: 'd4-q6',
      question: 'What does `functools.partial(func, arg1, kwarg1=val)` return?',
      options: [
        'The immediate return value of calling `func`.',
        'A new callable object that, when called, behaves like `func` called with the pre-supplied positional and keyword arguments.',
        'A generator yielding results sequentially.',
        'A thread executing `func` in the background.',
      ],
      correctIndex: 1,
      explanation: '`functools.partial` produces a partial application object. It pre-binds a subset of arguments and keyword arguments to an existing callable, creating a new callable with fewer required arguments.',
      seniorTrap: 'Unlike currying in functional languages which returns single-argument nested functions, Python\'s `partial` binds multiple positional and keyword arguments at once.',
    },
    {
      id: 'd4-q7',
      question: 'Where are a Python function\'s default argument objects stored in memory?',
      options: [
        'On the execution call stack created when the function is invoked.',
        'In the function object\'s `__defaults__` (and `__kwdefaults__`) attribute, created when the `def` statement executes.',
        'In the caller\'s local symbol table.',
        'In thread-local storage allocated dynamically.',
      ],
      correctIndex: 1,
      explanation: 'Default arguments are stored directly on the function object in `func.__defaults__` (for positional parameters) and `func.__kwdefaults__` (for keyword-only parameters). This explains why mutable defaults persist across invocations!',
      seniorTrap: 'Understanding that defaults live on the function object itself cements why `def f(x=[])` acts as a shared accumulator across calls.',
    },
    {
      id: 'd4-q8',
      question: 'What is the role of the `inspect` module in modern Python frameworks like FastAPI and pytest?',
      options: [
        'It compiles Python code into native x86 machine instructions.',
        'It introspects function parameter names, default values, and type annotations to perform automated dependency injection and request parsing.',
        'It monitors memory allocations and detects memory leaks.',
        'It is a security sandbox that verifies untrusted code.',
      ],
      correctIndex: 1,
      explanation: '`inspect.signature(fn)` returns parameter metadata, types, and defaults. Frameworks like FastAPI and pytest inspect callable parameters to resolve dependencies, inject fixtures, and validate incoming HTTP inputs.',
      seniorTrap: 'In C#, dependency injection often relies on reflection and constructor injection via IoC containers. In Python, reflection on function signatures via `inspect` is common and idiomatic.',
    },
  ],
};
