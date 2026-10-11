import type { Lesson } from '../../types';

export const day3: Lesson = {
  day: 3,
  title: 'Pythonic Expressions, Comprehensions & Pattern Matching',
  subtitle: 'List/Dict/Set Comprehensions, Walrus Operator (:=), Extended Unpacking, and match/case',
  estimatedMinutes: 40,
  category: 'core',
  seniorBridge: {
    csharp: 'Comprehensions are Python\'s equivalent of LINQ expressions: `[x.Id for x in users if x.IsActive]` directly mirrors `users.Where(x => x.IsActive).Select(x => x.Id).ToList()`. Python 3.10+ `match/case` mirrors C# pattern matching with type patterns, positional patterns, and `when` guards.',
    c_modula2: 'Instead of procedural for-loops accumulating items into allocated arrays with manual index counters, comprehensions compile down to optimized C-level bytecode (`LIST_APPEND`) running much faster than manual loop appends.',
    javascript: 'A list comprehension replaces `arr.filter(...).map(...)` in a single pass without allocating intermediate arrays. Structural pattern matching is like destructuring assignment on steroids with guard conditions.',
    c64_basic: 'Forget `FOR I = 1 TO 10: NEXT I` with manual accumulation variables. Python expressions can transform, filter, and restructure data in single declarative statements.',
  },
  overview: 'Senior developers from C# and JS often write Python that looks like C# or JS: lots of manual for-loops, .append() calls, and complex if-else cascades. Writing idiomatic Python means mastering comprehensions (which execute at C speed in bytecode), extended unpacking, the walrus operator (:=), and modern structural pattern matching (match/case).',
  keyTakeaways: [
    'Comprehensions are faster than manual `.append()` loops because the list allocation and append operations happen directly inside the CPython bytecode VM without per-iteration attribute lookups.',
    'List, Dict, and Set comprehensions syntax: `[expr for item in iterable if condition]`, `{k: v for item in iterable}`, and `{x for x in iterable}`.',
    'Placement of `if` matters: `[f(x) for x in seq if cond]` filters elements; `[f(x) if cond else g(x) for x in seq]` is a ternary transformation applied to every element.',
    'The walrus operator `:=` assigns values to variables as part of an expression, avoiding redundant computations in loops and comprehension filters.',
    'Extended unpacking (`head, *body, tail = items`) provides expressive sequence destructuring without slicing boilerplate.',
    'Structural pattern matching (`match/case`) introduced in Python 3.10 matches against data structures, shapes, values, types, and supports `if` guard clauses.',
  ],
  sections: [
    {
      id: 'comprehensions',
      title: '1. Comprehensions: The Pythonic Data Pipeline',
      content:
        'A list comprehension is not syntactic sugar for a for-loop: it is an optimized language construct. In CPython, a comprehension runs as a single specialized code object using the LIST_APPEND opcode, avoiding repeated Python-level method lookups on `.append`.\n\n' +
        '**Syntax Variations**:\n' +
        '- List: `[expr for item in iter if filter_cond]`\n' +
        '- Dict: `{key_expr: val_expr for item in iter if filter_cond}`\n' +
        '- Set: `{expr for item in iter if filter_cond}`',
      codeSnippet: `raw_users = [
    {"id": 1, "email": "ALICE@EXAMPLE.COM", "role": "admin"},
    {"id": 2, "email": "bob@example.com", "role": "user"},
    {"id": 3, "email": None, "role": "guest"},
]

# 1. Filter and transform (LINQ Select/Where):
clean_emails = [
    u["email"].lower()
    for u in raw_users
    if u["email"] is not None
]
# ['alice@example.com', 'bob@example.com']

# 2. Dict comprehension (building an indexed lookup table):
user_lookup = {
    u["id"]: u["role"]
    for u in raw_users
}
# {1: 'admin', 2: 'user', 3: 'guest'}`,
      seniorInsight: 'Avoid nested comprehensions deeper than 2 levels. If you need two `for` clauses in one comprehension, read it left to right like nested loops: `[cell for row in matrix for cell in row]`. Any deeper, write a normal generator function.',
    },
    {
      id: 'ternary-vs-filtering',
      title: '2. The "if" Trap: Filtering vs Ternary Expressions',
      content: `One of the most frequent syntax confusions for newcomers is where to place \`if\`:

1. **Filtering**: Put \`if\` at the END. Elements that evaluate to \`False\` are omitted.
   \`[x for x in data if x > 0]\`

2. **Conditional Value Selection (Ternary)**: Put \`if ... else\` at the BEGINNING. Every item is included, but transformed conditionally.
   \`[x if x > 0 else 0 for x in data]\`

Combining both:
\`[x * 2 if x > 0 else 0 for x in data if x is not None]\``,
      codeSnippet: `scores = [85, 42, 91, 58, 76]

# Ternary transformation for all items:
grades = ["PASS" if s >= 60 else "FAIL" for s in scores]
# ['PASS', 'FAIL', 'PASS', 'FAIL', 'PASS']

# Filter only passing scores, then format:
passing = [f"Score: {s}" for s in scores if s >= 60]
# ['Score: 85', 'Score: 91', 'Score: 76']`,
      seniorInsight: 'Remember that Python\'s ternary operator is `A if condition else B`, whereas in C/C#/JS it is `condition ? A : B`.',
    },
    {
      id: 'walrus-operator',
      title: '3. The Walrus Operator (:=) for Expression Assignment',
      content: `Introduced in PEP 572, the assignment expression operator \`:=\` allows assigning a variable while evaluating an expression.

Common senior use cases:
1. **Expensive computation in comprehension filters**: Calculate once, filter, and reuse in output.
2. **Reading data chunks in a while loop** (like \`while ((bytesRead = stream.Read(...)) > 0)\` in C#).
3. **Regex matching and extracting** without running the regex twice.`,
      codeSnippet: `import re

# Use Case 1: Reusing regex matches
text = "Contact sales@company.com or support@company.org"
pattern = re.compile(r'([\\w\\.-]+)@([\\w\\.-]+)')

# Without walrus: you have to run search/match or use full loop
# With walrus:
lines = ["Status: 200 OK", "Invalid line", "Status: 404 Not Found"]
statuses = [
    code
    for line in lines
    if (m := re.search(r'Status: (\\d+)', line))
    and (code := int(m.group(1)))
]
print("Parsed status codes:", statuses)  # [200, 404]`,
      seniorInsight: 'Use walrus to prevent calling slow database queries, JSON parsing, or API calculations twice inside a comprehension.',
    },
    {
      id: 'structural-pattern-matching',
      title: '4. Structural Pattern Matching (match / case)',
      content: `Python 3.10 introduced \`match / case\` (PEP 634/635/636). It is not just a C-style switch statement: it inspects the **structure and contents** of complex data structures and binds variables.

Key Capabilities:
- **Sequence Patterns**: Match lists or tuples of specific shapes.
- **Mapping Patterns**: Match dictionaries containing specific keys.
- **Class Patterns**: Match instances and unpack their attributes.
- **Guards**: Add conditional \`if\` clauses to cases.
- **Wildcard \`_\`**: Catch-all default branch.`,
      codeSnippet: `def handle_command(command):
    match command:
        case {"action": "query", "table": str(tbl), "limit": int(lim)} if lim > 0:
            return f"SELECT * FROM {tbl} LIMIT {lim}"
        case {"action": "query", "table": str(tbl)}:
            return f"SELECT * FROM {tbl} LIMIT 100"
        case ["deploy", ("prod" | "staging") as env, *flags]:
            return f"Deploying to {env} with flags: {flags}"
        case ["quit" | "exit"]:
            return "Terminating application"
        case _:
            return "Unknown command structure"

print(handle_command({"action": "query", "table": "users", "limit": 25}))
print(handle_command(["deploy", "staging", "--verbose", "--dry-run"]))`,
      seniorInsight: 'Notice that mapping patterns `{ "action": "query" }` match if the dict CONTAINS that key; the dict can have extra keys without failing the match, unless you restrict it.',
    },
  ],
  codeExamples: [
    {
      title: 'Extended Sequence & Dictionary Unpacking',
      description: 'Senior patterns for destructuring arrays and merging dictionary payloads.',
      pythonCode: `record = ["TX-1092", "2026-10-11", 450.0, 12.5, 99.0, "COMPLETED"]

tx_id, date, *amounts, status = record
print("ID:", tx_id)
print("Amounts list:", amounts)
print("Status:", status)

# Merging dictionaries (PEP 584 operator | vs unpacking):
base_config = {"env": "prod", "retries": 3, "timeout": 30}
override = {"timeout": 60, "debug": True}

# Modern Python 3.9+ union operator:
merged = base_config | override
print("Merged config:", merged)`,
      runnable: true,
      expectedOutput: `ID: TX-1092
Amounts list: [450.0, 12.5, 99.0]
Status: COMPLETED
Merged config: {'env': 'prod', 'retries': 3, 'timeout': 60, 'debug': True}`,
    },
    {
      title: 'Pattern Matching on Domain Models',
      description: 'Handling polymorphic event objects using dataclasses and match/case.',
      pythonCode: `from dataclasses import dataclass

@dataclass
class UserLogin:
    username: str
    ip_address: str

@dataclass
class PaymentReceived:
    account_id: str
    amount_cents: int

def audit_event(event):
    match event:
        case UserLogin(username=user, ip_address="127.0.0.1"):
            return f"Local developer login: {user}"
        case UserLogin(username=user):
            return f"Remote login for user {user}"
        case PaymentReceived(amount_cents=amt) if amt >= 100000:
            return f"LARGE PAYMENT ALERT: \${amt / 100:.2f}"
        case PaymentReceived():
            return "Standard payment processed"

print(audit_event(UserLogin("pat", "127.0.0.1")))
print(audit_event(PaymentReceived("acc_99", 250000)))`,
      runnable: true,
      expectedOutput: `Local developer login: pat
LARGE PAYMENT ALERT: $2500.00`,
    },
  ],
  quiz: [
    {
      id: 'd3-q1',
      question: 'What is the value of `result` after evaluating this comprehension?',
      codeSnippet: `data = [1, 2, 3, 4, 5]
result = [x * 2 if x % 2 == 0 else x for x in data if x > 2]`,
      options: [
        '[1, 4, 3, 8, 5]',
        '[3, 8, 5]',
        '[6, 8, 10]',
        '[3, 8]',
      ],
      correctIndex: 1,
      explanation: 'First, the filtering clause `if x > 2` discards 1 and 2, leaving `[3, 4, 5]`. Next, the ternary expression `x * 2 if x % 2 == 0 else x` runs on each remaining item: for 3 (odd) -> 3; for 4 (even) -> 8; for 5 (odd) -> 5. Result: `[3, 8, 5]`.',
      seniorTrap: 'Newcomers often mix up the execution order of the trailing filter `if` vs the leading ternary `if/else`. The filter runs first to select items.',
    },
    {
      id: 'd3-q2',
      question: 'Why are list comprehensions generally faster than an explicit `for` loop calling `.append()` in CPython?',
      options: [
        'Comprehensions automatically execute across multiple CPU threads simultaneously.',
        'Comprehensions compile down to a dedicated bytecode loop that uses the specialized `LIST_APPEND` C-level instruction without repeatedly resolving the `.append` attribute lookup on the list object in Python.',
        'CPython uses JIT compilation exclusively for list comprehensions.',
        'Comprehensions skip garbage collection checks.',
      ],
      correctIndex: 1,
      explanation: 'In a regular for-loop, each iteration must perform a dynamic attribute lookup for the `.append` method on the list object and invoke it via Python function call overhead. Comprehensions avoid this by pre-allocating list capacity and executing the C-level `LIST_APPEND` bytecode directly.',
      seniorTrap: 'Engineers from compiled languages (C, C#) might assume a compiler optimizes `for` and comprehensions identically. In CPython\'s bytecode interpreter, the distinction is significant.',
    },
    {
      id: 'd3-q3',
      question: 'Given `head, *middle, tail = [10, 20, 30, 40, 50]`, what are the values of `head`, `middle`, and `tail`?',
      options: [
        '`head = 10`, `middle = [20, 30, 40]`, `tail = 50`',
        '`head = [10]`, `middle = [20, 30, 40]`, `tail = [50]`',
        '`head = 10`, `middle = (20, 30, 40)`, `tail = 50`',
        '`head = 10`, `middle = 20`, `tail = [30, 40, 50]`',
      ],
      correctIndex: 0,
      explanation: 'Extended sequence unpacking assigns the first element to `head` (10), the last element to `tail` (50), and collects all intermediate elements into a list `middle = [20, 30, 40]`. If there are no intermediate elements, `middle` is an empty list `[]`.',
      seniorTrap: 'Notice that `middle` is always a `list`, even if the source sequence was a tuple or generator.',
    },
    {
      id: 'd3-q4',
      question: 'What is the primary benefit of the walrus operator (`:=`) in the following comprehension?',
      codeSnippet: `results = [
    cleaned
    for item in raw_records
    if (cleaned := sanitize_record(item)) is not None
]`,
      options: [
        'It makes the comprehension run asynchronously.',
        'It allows `sanitize_record(item)` to be executed only once, filtering on its result and capturing it into `cleaned` for the output list without a redundant second call.',
        'It makes `cleaned` an immutable global variable.',
        'It forces the comprehension to return a tuple instead of a list.',
      ],
      correctIndex: 1,
      explanation: 'Without the walrus operator, to filter out `None` values from an expensive function, you would either have to call `sanitize_record(item)` twice (once in `if` and once in the projection), or wrap it in a nested comprehension. `:=` computes and binds it once.',
      seniorTrap: 'Coming from languages with separate statement assignment, C# and JS devs often avoid assignment in expressions, but in Python comprehensions, `:=` is the idiomatic optimization pattern.',
    },
    {
      id: 'd3-q5',
      question: 'In Python 3.10+ `match / case`, how does a dictionary pattern match behave by default?',
      codeSnippet: `match payload:
    case {"status": 200, "user": str(name)}:
        print(f"Success for {name}")`,
      options: [
        'It matches only if `payload` contains EXACTLY those two keys and no other keys.',
        'It matches if `payload` contains the keys "status" with value 200 and "user" as a string, ignoring any extra keys in `payload`.',
        'It fails unless `payload` is an instance of `collections.OrderedDict`.',
        'It mutates `payload` by removing matched keys.',
      ],
      correctIndex: 1,
      explanation: 'In Python pattern matching, mapping patterns perform open matching by default: as long as the specified keys exist and match the pattern, additional keys in the dictionary are ignored. (Contrast with sequence patterns, which require exact length unless `*rest` is used).',
      seniorTrap: 'Sequence patterns (tuples/lists) check exact length by default, but dictionary mapping patterns do NOT check exact key count by default.',
    },
    {
      id: 'd3-q6',
      question: 'Which syntax correctly merges two dictionaries `d1` and `d2` in Python 3.9+, with values from `d2` taking precedence for common keys?',
      options: [
        '`d1 + d2`',
        '`d1 | d2`',
        '`d1.merge(d2)`',
        '`d1 && d2`',
      ],
      correctIndex: 1,
      explanation: 'PEP 584 introduced the union operators `|` and `|=` for dictionaries in Python 3.9. `d1 | d2` produces a new dictionary with keys and values from both, where keys in `d2` overwrite matching keys in `d1`.',
      seniorTrap: 'In older Python versions or JavaScript, developers used `{**d1, **d2}` or `Object.assign`. In modern Python 3.9+, the `|` operator is the standard clean idiom.',
    },
    {
      id: 'd3-q7',
      question: 'What is the output of the following dictionary comprehension?',
      codeSnippet: `words = ["apple", "banana", "avocado", "blueberry"]
result = {w[0]: w for w in words}
print(result)`,
      options: [
        "{'a': 'apple', 'b': 'banana'}",
        "{'a': 'avocado', 'b': 'blueberry'}",
        "{'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry']}",
        'SyntaxError: duplicate keys in comprehension',
      ],
      correctIndex: 1,
      explanation: 'In a dictionary comprehension, if duplicate keys are generated (here, \'a\' for apple and avocado, and \'b\' for banana and blueberry), subsequent keys overwrite earlier ones in insertion order. Hence, \'avocado\' overwrites \'apple\', and \'blueberry\' overwrites \'banana\'.',
      seniorTrap: 'If you want to group all values under common keys instead of overwriting, you must use `collections.defaultdict(list)` or `itertools.groupby`.',
    },
    {
      id: 'd3-q8',
      question: 'What does the `case _:` clause represent at the end of a `match / case` block?',
      options: [
        'A private internal method invocation.',
        'A wildcard catch-all branch that matches any value (analogous to `default:` in C/C# or `_ =>` in C# pattern matching).',
        'A syntax error because variable names must be alphanumeric.',
        'A check verifying the expression evaluates to `None`.',
      ],
      correctIndex: 1,
      explanation: 'In Python structural pattern matching, `_` is a special wildcard pattern that matches anything without binding the value to a variable name. It serves as the catch-all `default` branch.',
      seniorTrap: 'In normal Python code, `_` is a convention for an unused variable name. In `match / case`, `_` is a true language-level wildcard that cannot be referenced in subsequent code.',
    },
  ],
};
