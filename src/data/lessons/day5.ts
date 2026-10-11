import type { Lesson } from '../../types';

export const day5: Lesson = {
  day: 5,
  title: 'Iteration Protocol, Generators & Streaming Pipelines',
  subtitle: 'The __iter__/__next__ contract, yield streaming, itertools mastery, and pipeline design',
  estimatedMinutes: 45,
  category: 'data',
  seniorBridge: {
    csharp: 'Python generators with `yield` are conceptually identical to C# `IEnumerable<T>` and `yield return`. The difference: in C#, the compiler generates an internal state-machine class. In Python, CPython suspends the execution frame (`PyFrameObject`) directly on the heap.',
    c_modula2: 'Instead of loading millions of records into a giant heap buffer with `malloc`, generators stream items one at a time with O(1) memory footprint. Iteration termination is signaled cleanly by raising `StopIteration`.',
    javascript: 'Python\'s iteration protocol matches JS `Symbol.iterator` and `next()`. Generator functions in Python use `yield` (without an asterisk `*`), and `yield from subgen` mirrors JS `yield* subgen`.',
    c64_basic: 'Forget reading tape or floppy disks line by line with manual EOF checks. Python iterators provide infinite or finite streaming pipelines with automatic loop termination.',
  },
  overview: `Data processing in Python is built on the iteration protocol. If you load 10 million rows into a Python list, your process will exhaust gigabytes of RAM. If you stream them through a generator pipeline, memory consumption remains virtually flat (O(1)). This section covers the iteration contract, generator mechanics, the generator exhaustion trap, and essential standard library ` + '`itertools`' + `.`,
  keyTakeaways: [
    'The iteration protocol requires two methods: `__iter__()` returning an iterator, and `__next__()` returning the next item or raising `StopIteration`.',
    'A function containing the `yield` keyword is a generator function. Calling it does NOT execute the function body; it returns a generator object.',
    'Generators evaluate lazily: computation only occurs when `next()` is called (by a `for` loop, comprehension, or explicit call).',
    'A generator expression `(x * 2 for x in data)` uses parentheses and evaluates lazily with O(1) memory, unlike a list comprehension `[...]` which eagerly allocates.',
    'GENERATOR EXHAUSTION: Once a generator yields its final item, it is exhausted! Attempting to iterate over it a second time yields zero items without throwing an error.',
    '`yield from sub_iterable` delegates iteration directly to another generator or iterable, transparently passing values.',
    '`itertools.groupby()` groups CONSECUTIVE identical keys; data MUST be sorted by that key first, or non-consecutive duplicates will create multiple groups.',
  ],
  sections: [
    {
      id: 'iteration-protocol',
      title: '1. The Iteration Protocol: __iter__ and __next__',
      content: `In Python, any object can be looped over if it implements the iteration protocol:
1. **Iterable**: An object implementing \`__iter__()\` which returns an Iterator.
2. **Iterator**: An object implementing \`__next__()\` which returns items one-by-one and raises \`StopIteration\` when finished, plus an \`__iter__()\` returning \`self\`.

When you write \`for item in collection:\`, Python executes:
\`\`\`python
_iter = iter(collection)  # calls collection.__iter__()
while True:
    try:
        item = next(_iter)  # calls _iter.__next__()
    except StopIteration:
        break
    # loop body
\`\`\``,
      codeSnippet: `class FibonacciSequence:
    def __init__(self, limit: int):
        self.limit = limit

    def __iter__(self):
        self.a, self.b = 0, 1
        self.count = 0
        return self

    def __next__(self):
        if self.count >= self.limit:
            raise StopIteration
        val = self.a
        self.a, self.b = self.b, self.a + self.b
        self.count += 1
        return val

for num in FibonacciSequence(6):
    print(num, end=" ")  # 0 1 1 2 3 5`,
      seniorInsight: 'Notice that raising `StopIteration` is standard control flow in Python, not an exceptional crash condition.',
    },
    {
      id: 'generators-and-yield',
      title: '2. Generators & Lazy Evaluation with yield',
      content: `Writing manual iterator classes with \`__iter__\` and \`__next__\` is verbose. A generator function achieves the same result using \`yield\`.

When a generator encounters \`yield\`, it produces the value, suspends its local variables and instruction pointer, and yields control back to the caller. When resumed, it picks up immediately on the next line.

**Generator Expressions**:
\`(transform(x) for x in large_stream if filter(x))\`
This allocates almost no memory, regardless of whether the source stream has 10 items or 10 billion items.`,
      codeSnippet: `import sys

# List comprehension: EAGER allocation in RAM
numbers_list = [x ** 2 for x in range(1000000)]
print("List RAM:", sys.getsizeof(numbers_list), "bytes")  # ~8.4 MB

# Generator expression: LAZY evaluation on demand
numbers_gen = (x ** 2 for x in range(1000000))
print("Gen RAM:", sys.getsizeof(numbers_gen), "bytes")   # ~104 bytes!

# Reading first 3 items:
print(next(numbers_gen))  # 0
print(next(numbers_gen))  # 1
print(next(numbers_gen))  # 4`,
      seniorInsight: 'Use generator expressions when piping data into reducers like `sum()`, `max()`, `min()`, or database bulk inserts. Passing `sum(x for x in ...)` doesn\'t even require double parentheses!',
    },
    {
      id: 'streaming-pipeline-and-exhaustion',
      title: '3. Streaming Pipelines & The Exhaustion Trap',
      content: `By chaining generator functions, you can build streaming Unix-pipe-style processing architectures in pure Python:
\`data_source -> clean_records -> filter_invalid -> calculate_metrics\`

**THE GENERATOR EXHAUSTION TRAP**:
Unlike lists or sets, generators are single-use streams. Once traversed, they are empty. If you do \`len(gen)\`, it fails (\`TypeError: object of type 'generator' has no len()\`). If you iterate over it once to check values, you cannot iterate over it again!`,
      codeSnippet: `def stream_readings():
    yield 10.5
    yield 12.0
    yield 14.8

readings = stream_readings()

# First pass:
print("First pass sum:", sum(readings))  # 37.3

# Second pass: TRAP!
print("Second pass sum:", sum(readings))  # 0! (Stream was already exhausted)

# If you need multiple passes, convert to list or use itertools.tee:
from itertools import tee
r1, r2 = tee(stream_readings(), 2)  # Creates two independent iterator clones`,
      seniorInsight: 'Never pass a raw generator into a function that needs to iterate over the data multiple times (e.g. calculating average = sum(data) / len(data)).',
    },
    {
      id: 'itertools-mastery',
      title: '4. itertools: The Functional Powerhouse',
      content: `The \`itertools\` module is implemented in optimized C.
Key tools for data processing:
- \`itertools.chain(*iterables)\`: Flattens multiple iterables without allocating intermediate lists.
- \`itertools.islice(iter, start, stop, step)\`: Slices an iterator lazily without consuming everything into memory.
- \`itertools.groupby(iterable, key)\`: Groups consecutive items sharing a key. **CRITICAL: The data MUST be sorted by the key first!**
- \`itertools.accumulate(iter, func)\`: Running prefix totals or reductions.`,
      codeSnippet: `from itertools import chain, islice, groupby

# 1. Flattening streams with chain:
batch1 = [1, 2, 3]
batch2 = [4, 5, 6]
combined = list(chain(batch1, batch2))  # [1, 2, 3, 4, 5, 6]

# 2. Windowing with islice:
infinite_nums = (x for x in range(10**9))
first_ten = list(islice(infinite_nums, 5, 10))  # [5, 6, 7, 8, 9]

# 3. GroupBy (MUST SORT FIRST):
transactions = [
    {"cust": "A", "val": 10},
    {"cust": "A", "val": 25},
    {"cust": "B", "val": 50},
    {"cust": "B", "val": 15},
]
# Grouping by customer:
for cust_id, group in groupby(transactions, key=lambda x: x["cust"]):
    total = sum(item["val"] for item in group)
    print(f"Customer {cust_id} total: {total}")`,
      seniorInsight: 'If transactions were ordered [A, B, A], `groupby` would produce TWO separate groups for customer A! Always sort by key first if global grouping is required.',
    },
  ],
  codeExamples: [
    {
      title: 'Generator Delegation with yield from',
      description: 'Using yield from to transparently compose sub-generators.',
      pythonCode: `def read_eu_records():
    yield {"region": "EU", "id": "E1"}
    yield {"region": "EU", "id": "E2"}

def read_us_records():
    yield {"region": "US", "id": "U1"}
    yield {"region": "US", "id": "U2"}

def read_all_regions():
    yield from read_eu_records()
    yield from read_us_records()

for record in read_all_regions():
    print(record)`,
      runnable: true,
      expectedOutput: `{'region': 'EU', 'id': 'E1'}
{'region': 'EU', 'id': 'E2'}
{'region': 'US', 'id': 'U1'}
{'region': 'US', 'id': 'U2'}`,
    },
    {
      title: 'Zero-Copy Streaming Filter Pipeline',
      description: 'Chaining generator expressions to process a stream with constant memory.',
      pythonCode: `raw_events = [
    "INFO: User logged in",
    "ERROR: DB connection lost",
    "DEBUG: Payload received",
    "ERROR: Payment gateway timeout",
    "WARN: Disk usage high",
]

# Step 1: Filter errors lazily
error_lines = (line for line in raw_events if line.startswith("ERROR:"))

# Step 2: Strip prefix lazily
error_messages = (line.split(": ", 1)[1] for line in error_lines)

# Step 3: Uppercase lazily
formatted_alerts = (f"[ALERT] {msg.upper()}" for msg in error_messages)

# Nothing executed until consumed here:
for alert in formatted_alerts:
    print(alert)`,
      runnable: true,
      expectedOutput: `[ALERT] DB CONNECTION LOST
[ALERT] PAYMENT GATEWAY TIMEOUT`,
    },
  ],
  quiz: [
    {
      id: 'd5-q1',
      question: 'What happens when you call a generator function containing the `yield` keyword, such as `def get_data(): yield 1`?',
      options: [
        'The function executes immediately up to the first `yield` and returns the first value.',
        'The function returns a generator object without executing any of the function body code until `next()` is called.',
        'It compiles into an async Task running on a background worker thread.',
        'It raises a SyntaxError unless decorated with `@generator`.',
      ],
      correctIndex: 1,
      explanation: 'Calling a generator function does not run the code immediately. Instead, Python instantiates and returns a generator iterator object. The function body only begins executing when `next()` is first invoked on that generator.',
      seniorTrap: 'C# developers familiar with `IEnumerable` know this as lazy evaluation, but newcomers often expect calling `get_data()` to immediately print or execute initial setup lines.',
    },
    {
      id: 'd5-q2',
      question: 'What is the output of the following code snippet?',
      codeSnippet: `gen = (x * 2 for x in [1, 2, 3])
print(list(gen))
print(list(gen))`,
      options: [
        '[[2, 4, 6], [2, 4, 6]]',
        '[2, 4, 6] followed by []',
        '[2, 4, 6] followed by [2, 4, 6]',
        'Throws RuntimeError: generator already consumed',
      ],
      correctIndex: 1,
      explanation: 'Generators in Python are single-pass streams. The first `list(gen)` exhausts the generator by calling `next()` until `StopIteration` is raised. When `list(gen)` is called a second time, the generator is already exhausted, so it immediately returns an empty list `[]`.',
      seniorTrap: 'In C#, an `IEnumerable<T>` method can often be re-enumerated if it is an iterator method. In Python, once a generator instance is exhausted, it cannot be restarted.',
    },
    {
      id: 'd5-q3',
      question: 'What critical prerequisite must be met before calling `itertools.groupby(data, key=...)` to ensure all items with the same key are grouped together?',
      options: [
        '`data` must be an immutable tuple.',
        '`data` must be sorted by the grouping key.',
        '`data` must contain only primitive types.',
        'The grouping key function must return an integer.',
      ],
      correctIndex: 1,
      explanation: '`itertools.groupby` only groups CONSECUTIVE items that share the same key (like the Unix `uniq` command). If identical keys appear separated by different keys, `groupby` will yield separate groups for each run. Therefore, you must sort the sequence by the grouping key first.',
      seniorTrap: 'LINQ\'s `.GroupBy()` or SQL\'s `GROUP BY` collects all matching items globally regardless of ordering. Python\'s `itertools.groupby` operates strictly in streaming consecutive chunks!',
    },
    {
      id: 'd5-q4',
      question: 'What exception signals the termination of iteration in Python\'s iterator protocol?',
      options: [
        '`EOFError`',
        '`IndexError`',
        '`StopIteration`',
        '`IterationCompletedError`',
      ],
      correctIndex: 2,
      explanation: 'When an iterator has no more elements, its `__next__()` method must raise `StopIteration`. For-loops and comprehensions catch this exception automatically to cleanly exit the loop.',
      seniorTrap: 'Coming from languages that return a boolean `bool MoveNext()` or `null`, Python uses an explicit exception `StopIteration` as normal control flow.',
    },
    {
      id: 'd5-q5',
      question: 'What is the primary syntactical and operational difference between `yield item` and `yield from sub_iterable`?',
      options: [
        '`yield from` runs the sub-iterable in a separate background thread.',
        '`yield from` delegates iteration directly to the sub-iterable, transparently yielding every item from it without writing an explicit nested `for` loop.',
        '`yield from` yields items in reverse order.',
        '`yield from` converts the sub-iterable into a dictionary.',
      ],
      correctIndex: 1,
      explanation: '`yield from iterable` delegates iteration to an inner iterable or sub-generator. It is equivalent to `for item in iterable: yield item`, but additionally establishes a transparent two-way communication channel for `.send()` and exceptions.',
      seniorTrap: 'In JS, this is `yield*`. In Python, `yield from` provides both cleaner syntax and performance optimization in CPython bytecode.',
    },
    {
      id: 'd5-q6',
      question: 'Why would a senior engineer choose a generator expression `(x for x in data)` over a list comprehension `[x for x in data]` when passing data to `sum()`?',
      options: [
        'Because generator expressions run faster on single CPU cores.',
        'Because the generator expression evaluates items on the fly with O(1) memory overhead, whereas the list comprehension allocates a full list in memory before passing it to `sum()`.',
        'Because `sum()` only accepts generator expressions as arguments.',
        'Because generator expressions automatically parallelize the addition.',
      ],
      correctIndex: 1,
      explanation: 'A list comprehension creates and populates the entire list in memory before `sum()` starts consuming it. A generator expression generates each number lazily one at a time, requiring only constant O(1) memory.',
      seniorTrap: 'Writing `sum([x for x in data])` wastes memory by allocating an intermediate list. Idiomatic Python is `sum(x for x in data)`.',
    },
    {
      id: 'd5-q7',
      question: 'What does `itertools.islice(iterable, 10, 20)` do?',
      options: [
        'It converts the iterator into a list and takes a slice `[10:20]`.',
        'It returns an iterator that lazily yields items from index 10 up to index 20 (exclusive) without loading the entire stream into memory.',
        'It splits the iterable into chunks of size 10.',
        'It checks whether indices 10 through 20 are valid.',
      ],
      correctIndex: 1,
      explanation: 'Regular slicing `seq[10:20]` requires sequence indexing (like lists or strings) and fails on streams/generators. `itertools.islice` works on ANY iterable, advancing through the items lazily until the stop index is reached.',
      seniorTrap: 'Trying to do `my_generator[0:5]` throws a `TypeError: \'generator\' object is not subscriptable`. You must use `itertools.islice(my_generator, 5)`.',
    },
    {
      id: 'd5-q8',
      question: 'What does `itertools.chain([1, 2], [3, 4], [5])` produce?',
      options: [
        'A list `[1, 2, 3, 4, 5]`.',
        'An iterator that sequentially yields 1, 2, 3, 4, 5 without concatenating lists in memory.',
        'A dictionary mapping keys to values.',
        'A Cartesian product of the lists.',
      ],
      correctIndex: 1,
      explanation: '`itertools.chain` links multiple iterables into a single continuous iterator. It yields each element from the first iterable until exhausted, then proceeds to the next, with zero intermediate memory allocations.',
      seniorTrap: 'Using `list1 + list2 + list3` creates multiple temporary lists in memory. For streaming data or large datasets, `chain` is the professional choice.',
    },
  ],
};
