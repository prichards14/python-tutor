import type { Lesson } from '../../types';

export const day7: Lesson = {
  day: 7,
  title: 'Metaprogramming: Decorators & Context Managers',
  subtitle: 'The @ Syntactic Sugar, @functools.wraps, Context Protocol (__enter__/__exit__), and contextlib',
  estimatedMinutes: 45,
  category: 'core',
  seniorBridge: {
    csharp: 'Decorators are like C# Attributes or Aspect-Oriented Programming (AOP), but with a critical difference: C# attributes are passive metadata inspected via reflection; Python decorators are active higher-order functions that wrap and replace the original callable at definition time. Context managers directly match C# `IDisposable` and the `using` statement.',
    c_modula2: 'In C, wrapping functions requires manual function pointer tables or macro wrappers. In Python, decorators and context managers provide structured, dynamic lifecycle wrappers without macros.',
    javascript: 'Decorators match the ECMAScript stage 3 decorator proposal. Context managers have no direct JS equivalent (aside from explicit `try...finally` blocks or modern `using` declarations in TypeScript 5.2+).',
    c64_basic: 'No more jumping to cleanup subroutines after errors. Python\'s `with` statement guarantees deterministic resource cleanup regardless of unhandled exceptions.',
  },
  overview: `Decorators and Context Managers are the two pillars of elegant Python metaprogramming. Decorators allow you to cleanly inject cross-cutting concerns (logging, metrics, authentication, rate-limiting, retries) without polluting business logic. Context managers guarantee deterministic resource acquisition and release (files, database connections, locks) through the ` + '`with`' + ` statement.`,
  keyTakeaways: [
    'A decorator `@dec` is syntactic sugar for `func = dec(func)`. It executes ONCE when the module is loaded and the function is defined, NOT when the function is called.',
    'Always use `@functools.wraps(func)` inside your decorator wrapper. Without it, your wrapper overwrites `__name__`, `__doc__`, and breaks `inspect.signature` introspection.',
    'Decorators that accept arguments require THREE levels of nested functions: the outer factory function, the decorator function, and the wrapper function.',
    'The context manager protocol requires `__enter__()` and `__exit__(exc_type, exc_val, exc_tb)`.',
    'In `__exit__`, returning `True` suppresses the raised exception; returning `False` (or `None`) allows the exception to propagate naturally up the call stack.',
    '`@contextlib.contextmanager` allows you to create context managers from simple generator functions using `yield` and `try...finally`.',
  ],
  sections: [
    {
      id: 'decorator-mechanics',
      title: '1. How Decorators Work Under the Hood',
      content: `A decorator is simply a callable that takes a function as an argument and returns a replacement callable:

\`\`\`python
@my_decorator
def calculate(x):
    return x * 2

# Is 100% equivalent to:
def calculate(x):
    return x * 2
calculate = my_decorator(calculate)
\`\`\`

**The Critical Mistake: Omitting @functools.wraps**
If you write a decorator without \`@wraps\`, the decorated function\'s identity is lost—its \`__name__\` becomes \`"wrapper"\`, its docstring is erased, and tools like FastAPI, Sphinx, or pytest will fail to inspect it.`,
      codeSnippet: `import functools
import time

def timing_decorator(func):
    @functools.wraps(func)  # Preserves name, docstring, annotations!
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        duration = time.perf_counter() - start
        print(f"[METRIC] {func.__name__} completed in {duration * 1000:.3f}ms")
        return result
    return wrapper

@timing_decorator
def fetch_user_data(user_id: int):
    """Fetches user record from database."""
    time.sleep(0.01)
    return {"id": user_id, "name": "Pat"}

fetch_user_data(42)
print("Name:", fetch_user_data.__name__)  # 'fetch_user_data' (preserved!)
print("Doc:", fetch_user_data.__doc__)    # 'Fetches user record from database.'`,
      seniorInsight: 'Because decorators execute at module load time, any code outside the inner wrapper runs immediately upon import. Only code inside `wrapper` runs when the function is called.',
    },
    {
      id: 'decorators-with-arguments',
      title: '2. Decorators That Accept Arguments',
      content: `When a decorator accepts parameters (e.g. \`@retry(max_attempts=3, backoff=1.5)\`), it is NOT a decorator itself. It is a **decorator factory**: a function that returns a decorator.

Structure:
1. **Outer Factory**: Receives the configuration arguments (\`max_attempts\`).
2. **Middle Decorator**: Receives the function to be decorated (\`func\`).
3. **Inner Wrapper**: Receives the runtime call arguments (\`*args, **kwargs\`).`,
      codeSnippet: `import functools

def retry(max_attempts: int = 3):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_err = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_err = e
                    print(f"Attempt {attempt} failed: {e}. Retrying...")
            raise RuntimeError(f"All {max_attempts} attempts failed") from last_err
        return wrapper
    return decorator

@retry(max_attempts=2)
def unstable_api_call():
    raise ConnectionResetError("Connection dropped by peer")

# Calling unstable_api_call() will retry twice before failing!`,
      seniorInsight: 'In C#, creating parameterized aspects requires external IL-weaving frameworks (like PostSharp). In Python, it is standard language-level closure composition.',
    },
    {
      id: 'context-managers-protocol',
      title: '3. Context Managers: __enter__ and __exit__',
      content: `The \`with\` statement is Python\'s resource management powerhouse (like C# \`using (var res = ...)\`).

When Python executes \`with Resource() as res:\`:
1. It calls \`res.__enter__()\`. The return value is bound to the \`as\` target.
2. The block executes.
3. If an exception occurs, \`res.__exit__(exc_type, exc_val, exc_tb)\` is invoked.
4. **Exception Handling**:
   - If \`__exit__\` returns \`True\`, Python **suppresses** the exception and continues normally.
   - If \`__exit__\` returns \`False\` or \`None\`, Python re-raises the exception.`,
      codeSnippet: `class DatabaseTransaction:
    def __init__(self, name: str):
        self.name = name

    def __enter__(self):
        print(f"BEGIN TRANSACTION [{self.name}]")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            print(f"ROLLBACK TRANSACTION [{self.name}] due to: {exc_val}")
            return False  # Let exception propagate!
        print(f"COMMIT TRANSACTION [{self.name}]")
        return True

# Safe usage:
with DatabaseTransaction("tx_user_signup") as tx:
    print("Writing records to DB...")
# Automatically commits!`,
      seniorInsight: 'Be careful never to return `True` in `__exit__` unintentionally! If you accidentally return a truthy value, all runtime bugs and crashes inside that `with` block will be silently swallowed!',
    },
    {
      id: 'contextlib-sugar',
      title: '4. Simplifying with @contextlib.contextmanager',
      content: `Writing classes with \`__enter__\` and \`__exit__\` for simple resource scopes is tedious. 

The \`contextlib.contextmanager\` decorator lets you turn any generator with a single \`yield\` into a fully compliant context manager:
- Everything before \`yield\` runs during \`__enter__\`.
- The value passed to \`yield\` becomes the \`as\` target.
- Everything after \`yield\` (inside \`finally\`) runs during \`__exit__\`.`,
      codeSnippet: `import contextlib
import os

@contextlib.contextmanager
def temporary_env_var(key: str, value: str):
    old_value = os.environ.get(key)
    os.environ[key] = value
    try:
        yield value  # Control hands over to the 'with' block
    finally:
        # Guaranteed cleanup:
        if old_value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = old_value

with temporary_env_var("API_ENV", "testing") as current:
    print("Inside with block:", os.environ.get("API_ENV"))  # 'testing'

print("Outside with block:", os.environ.get("API_ENV"))     # Restored!`,
      seniorInsight: 'Always place code after `yield` inside a `try...finally` block. If an exception is thrown inside the `with` block, it is re-raised at the point of `yield`; without `finally`, your cleanup code will never run!',
    },
  ],
  codeExamples: [
    {
      title: 'Class Decorator for Automatic Method Logging',
      description: 'Applying behavior across all methods of a class automatically.',
      pythonCode: `import functools

def log_all_methods(cls):
    for attr_name, attr_val in list(cls.__dict__.items()):
        if callable(attr_val) and not attr_name.startswith("__"):
            @functools.wraps(attr_val)
            def logged(self, *args, method=attr_val, name=attr_name, **kwargs):
                print(f"[AUDIT] Calling method {cls.__name__}.{name}")
                return method(self, *args, **kwargs)
            setattr(cls, attr_name, logged)
    return cls

@log_all_methods
class PaymentGateway:
    def charge(self, amount: float):
        return f"Charged \${amount:.2f}"
    def refund(self, tx_id: str):
        return f"Refunded {tx_id}"

pg = PaymentGateway()
print(pg.charge(50.0))`,
      runnable: true,
      expectedOutput: `[AUDIT] Calling method PaymentGateway.charge
Charged $50.00`,
    },
    {
      title: 'Suppressing Specific Exceptions with contextlib.suppress',
      description: 'Senior Python idiom for cleanly ignoring expected non-fatal errors.',
      pythonCode: `import contextlib
import os

# Instead of verbose try/except pass:
with contextlib.suppress(FileNotFoundError):
    os.remove("/tmp/non_existent_cache.json")
    print("Deleted successfully")

print("Continued execution without crashing!")`,
      runnable: true,
      expectedOutput: `Continued execution without crashing!`,
    },
  ],
  quiz: [
    {
      id: 'd7-q1',
      question: 'When is a decorator function executed in Python?',
      options: [
        'Every time the decorated function is invoked.',
        'At module import/definition time when the `def` statement is evaluated.',
        'Only when the first exception is raised.',
        'During the interpreter\'s garbage collection cycle.',
      ],
      correctIndex: 1,
      explanation: 'The decorator expression `@decorator` is evaluated immediately when the module is imported and the function is parsed, transforming `func = decorator(func)`. The outer decorator runs once at load time; only the inner wrapper function runs when `func()` is invoked.',
      seniorTrap: 'Developers often place expensive runtime setup logic inside the outer decorator function expecting it to run per-request. Any per-request logic belongs inside the inner `wrapper()`.',
    },
    {
      id: 'd7-q2',
      question: 'Why should you always apply `@functools.wraps(func)` to your wrapper function inside a custom decorator?',
      options: [
        'It speeds up execution by compiling Python bytecode to C.',
        'It copies metadata (like `__name__`, `__doc__`, and `__annotations__`) from the original function onto the wrapper so debugging, logging, and signature introspection work properly.',
        'It prevents the function from being decorated a second time.',
        'It ensures the function runs in a background thread.',
      ],
      correctIndex: 1,
      explanation: 'Without `@functools.wraps(func)`, the decorated function\'s `__name__` becomes `"wrapper"` and its docstring is replaced with the wrapper\'s docstring. Frameworks that introspect functions (FastAPI, pytest, Sphinx) will break or misbehave.',
      seniorTrap: 'Senior engineers writing decorators without `@wraps` often spend hours debugging why FastAPI routes fail to generate OpenAPI docs.',
    },
    {
      id: 'd7-q3',
      question: 'What happens if a context manager\'s `__exit__` method returns `True` after an exception occurs inside the `with` block?',
      options: [
        'The exception is printed to stderr and the program halts.',
        'The exception is suppressed, and execution continues normally immediately after the `with` block.',
        'The exception is wrapped into a `RuntimeError`.',
        'Python retries the entire `with` block from the beginning.',
      ],
      correctIndex: 1,
      explanation: 'In Python\'s context manager protocol, returning a truthy value (`True`) from `__exit__` tells Python to suppress the active exception. If it returns `False` or `None`, the exception continues propagating up the call stack.',
      seniorTrap: 'Returning `True` unintentionally can swallow bugs, making syntax errors or assertion failures disappear without trace.',
    },
    {
      id: 'd7-q4',
      question: 'How many layers of nested functions are required to build a decorator that accepts configuration arguments (e.g. `@rate_limit(max_per_minute=60)`)?',
      options: [
        '1 layer',
        '2 layers',
        '3 layers (outer factory function, decorator function, wrapper function)',
        '4 layers',
      ],
      correctIndex: 2,
      explanation: 'When a decorator accepts parameters, the outer function accepts those parameters and returns a decorator. That decorator accepts the target function and returns the wrapper. That wrapper accepts `*args, **kwargs` at runtime. Hence: 3 layers.',
      seniorTrap: 'Trying to pass decorator arguments directly to a 2-layer decorator is a very common syntactic confusion.',
    },
    {
      id: 'd7-q5',
      question: 'When implementing a context manager with `@contextlib.contextmanager`, why must the code following the `yield` statement be wrapped in a `finally` block?',
      options: [
        'Because generators cannot yield values without `finally`.',
        'To guarantee that cleanup code runs even if an exception is raised inside the caller\'s `with` block.',
        'To prevent memory leaks in the CPython garbage collector.',
        'To convert synchronous code into asynchronous coroutines.',
      ],
      correctIndex: 1,
      explanation: 'If an exception is thrown inside the caller\'s `with` block, Python re-raises that exception at the `yield` statement inside your generator. If there is no `try...finally` surrounding the `yield`, execution aborts immediately and the post-yield cleanup code will never run!',
      seniorTrap: 'Without `finally`, resource leaks (unclosed sockets, unreleased locks) occur whenever an exception happens inside the `with` block.',
    },
    {
      id: 'd7-q6',
      question: 'What are the arguments passed to a context manager\'s `__exit__` method when an exception occurs inside the `with` block?',
      options: [
        '`self` and `error_code`',
        '`self, exc_type, exc_val, exc_tb` (the exception class, the instance value, and the traceback object)',
        '`self, exception_message`',
        '`self, status_code, trace`',
      ],
      correctIndex: 1,
      explanation: 'The `__exit__` method signature is `__exit__(self, exc_type, exc_val, exc_tb)`. If no exception occurred, all three exception arguments are passed as `None`.',
      seniorTrap: 'This three-tuple mirrors `sys.exc_info()`, providing the exact type, exception instance, and stack traceback.',
    },
    {
      id: 'd7-q7',
      question: 'What is the built-in context manager in the `contextlib` module used to cleanly ignore specified exceptions without a verbose `try...except Pass` block?',
      options: [
        '`contextlib.ignore()`',
        '`contextlib.suppress()`',
        '`contextlib.catch()`',
        '`contextlib.bypass()`',
      ],
      correctIndex: 1,
      explanation: '`contextlib.suppress(*exceptions)` cleanly suppresses the specified exceptions. For example, `with contextlib.suppress(FileNotFoundError): os.remove("file.txt")` is clean, self-documenting, and thread-safe.',
      seniorTrap: 'Writing `try: ... except FileNotFoundError: pass` is verbose and less readable than `with contextlib.suppress(FileNotFoundError):`.',
    },
    {
      id: 'd7-q8',
      question: 'Can decorators be applied to entire classes (Class Decorators)?',
      options: [
        'No, Python decorators can only be applied to functions and methods.',
        'Yes, a class decorator takes a class object as its argument, can inspect or mutate its attributes/methods, and returns the modified class or a replacement.',
        'Yes, but only if the class inherits from `object` explicitly.',
        'Yes, but only in Python 3.12 and newer.',
      ],
      correctIndex: 1,
      explanation: 'Class decorators (`@decorator class MyClass:`) take the class object itself as an argument. They are widely used in Python to add logging, register routes, inject attributes, or generate boilerplate (e.g. `@dataclass` itself is a class decorator!).',
      seniorTrap: 'Understanding that `@dataclass` is simply a built-in class decorator makes its mechanics completely demystified.',
    },
  ],
};
