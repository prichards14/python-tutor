import type { Lesson } from '../../types';

export const day2: Lesson = {
  day: 2,
  title: 'Data Structures & Memory Under the Hood',
  subtitle: 'Lists, Tuples, Hash Tables (Dict/Set), Collections, and Copy Semantics',
  estimatedMinutes: 40,
  category: 'core',
  seniorBridge: {
    csharp: 'A Python `list` is equivalent to C# `List<object>`—a dynamic array of pointers, NOT a linked list. Python `dict` is `Dictionary<TKey, TValue>` with guaranteed insertion order (like `OrderedDictionary`). `collections.deque` matches `LinkedList<T>` / double-ended queue.',
    c_modula2: 'In C, an array `int arr[10]` is 40 contiguous bytes of raw ints. In Python, `arr = [1, 2, ...]` is a contiguous array of `PyObject*` pointers pointing to heap-allocated objects scattered across memory. Inserting at index 0 requires `memmove` of all pointers.',
    javascript: 'Python lists resemble JS arrays, but Python distinguishes strictly between indexable lists and key-value dicts (no mixing array indices with object properties). Python sets have true mathematical set operations (`union`, `intersection`, `difference`) with operators `|`, `&`, `-`.',
    c64_basic: 'No more 1-dimensional fixed arrays `DIM A(100)` or manual string slicing with `MID$()` / `LEFT$()`. Python provides high-dimensional dynamic slicing (`arr[1:10:2]`), negative indexing, and associative hash maps.',
  },
  overview: `Data processing in Python begins with mastering its core data structures and understanding their memory layout in CPython. A senior engineer needs to know why inserting at index 0 of a list is O(N) while appending is amortized O(1), why dictionaries preserve insertion order, what makes an object hashable, and how shallow copies cause production data bugs.`,
  keyTakeaways: [
    'A Python `list` is a dynamic array of pointers (`PyObject**`), over-allocated to provide amortized O(1) appends.',
    'Inserting or popping from the beginning of a `list` is O(N). Use `collections.deque` for O(1) FIFO queues or sliding windows.',
    'Tuples are immutable, have less memory overhead than lists, and are hashable (provided all elements inside are hashable).',
    'Dictionaries in Python 3.7+ maintain insertion order as an official language guarantee via separate dense and sparse hash tables.',
    'Only immutable and hashable objects (implementing `__hash__` and `__eq__`) can be keys in a `dict` or elements of a `set`. A list cannot be a dict key, but a tuple of immutables can.',
    'Slice operations `a[:]` and `list.copy()` create SHALLOW copies. Modifying nested mutable objects will mutate both copies. Use `copy.deepcopy` for recursive copying.',
    '`collections.defaultdict` and `Counter` eliminate boilerplate and edge cases in data aggregation pipelines.',
  ],
  sections: [
    {
      id: 'list-memory',
      title: '1. Lists: Dynamic Arrays of Pointers',
      content: `CPython implements \`list\` as a variable-length array of pointers (\`PyObject** ob_item\`). 
When you append to a list, CPython over-allocates memory using a growth formula (~12% overhead: 0, 4, 8, 16, 25, 35, 46, 58, 72...). This gives \`list.append()\` an amortized time complexity of O(1).

However:
- Inserting at index 0 (\`list.insert(0, item)\`) or deleting from index 0 (\`list.pop(0)\`) shifts all remaining pointers in memory: **O(N)**.
- If you need a FIFO queue, use \`collections.deque\` (a doubly-linked list of fixed-size blocks) which guarantees **O(1)** appends and pops on both ends.`,
      codeSnippet: `from collections import deque
import time

# BAD FOR QUEUES:
queue_list = []
# queue_list.insert(0, item)  # O(N) copy on every item!

# SENIOR IDIOM FOR QUEUES:
d = deque(maxlen=1000)  # O(1) push and pop, optional ring-buffer maxlen
d.append("new_request")
item = d.popleft()  # O(1) pop from front`,
      seniorInsight: 'Because Python lists store pointers, a list of 1,000,000 integers has substantial memory overhead compared to a C `int[]` or a NumPy array. For dense numeric data, always use NumPy or the `array` standard library module.',
    },
    {
      id: 'dict-and-set-internals',
      title: '2. Dictionaries & Sets: Compact Hash Tables & Hashability',
      content: `Since Python 3.6/3.7, dictionaries use Raymond Hettinger's compact hash table architecture:
1. An \`indices\` sparse array containing hash table bucket indices.
2. An \`entries\` dense array storing \`[hash, key_ptr, value_ptr]\` in insertion order.

This cut dictionary memory usage by ~30% and guaranteed insertion order preservation.

**The Hashability Rule**:
For an object to be a dictionary key or in a set:
1. It must implement \`__hash__()\` returning an integer that never changes during its lifetime.
2. It must implement \`__eq__()\` to check for hash collisions.
3. If two objects compare equal (\`a == b\`), their hashes MUST be identical (\`hash(a) == hash(b)\`).

Mutable types (\`list\`, \`dict\`, \`set\`) are NOT hashable and will raise \`TypeError: unhashable type\`.`,
      codeSnippet: `# Tuples of immutables CAN be dict keys:
coords = {(40.7128, -74.0060): "New York", (34.0522, -118.2437): "Los Angeles"}
print(coords[(40.7128, -74.0060)])  # 'New York'

# But a tuple containing a list cannot:
try:
    bad_key = (1, [2, 3])
    d = {bad_key: "fail"}
except TypeError as e:
    print(e)  # unhashable type: 'list'`,
      seniorInsight: 'In C#, `Dictionary<TKey, TValue>` uses `GetHashCode()` and `Equals()`. In Python, you can define your own hashable classes by defining `__hash__` and `__eq__`. If a class implements `__eq__` without `__hash__`, Python automatically sets `__hash__ = None` making it unhashable.',
    },
    {
      id: 'advanced-collections',
      title: '3. Advanced Collections: defaultdict, Counter & NamedTuple',
      content: `Don't write manual checks to initialize dictionary values:
- \`defaultdict(factory)\`: Automatically calls a factory function (like \`list\`, \`int\`, or \`set\`) when a missing key is accessed.
- \`Counter\`: A dict subclass specialized for multiset frequency counting, ranking, and multiset arithmetic.
- \`typing.NamedTuple\`: An immutable, memory-efficient tuple with named fields and static typing.`,
      codeSnippet: `from collections import defaultdict, Counter
from typing import NamedTuple

# 1. Grouping with defaultdict:
orders_by_customer = defaultdict(list)
orders_by_customer["cust_101"].append({"id": 1, "amount": 50})
# No need to check "if cust_101 not in orders_by_customer"

# 2. Aggregating with Counter:
events = ["click", "view", "click", "purchase", "view", "click"]
counts = Counter(events)
print(counts.most_common(2))  # [('click', 3), ('view', 2)]

# 3. Memory-efficient immutable records:
class Point3D(NamedTuple):
    x: float
    y: float
    z: float

pt = Point3D(1.5, 2.0, -3.5)
print(pt.x, pt[0])  # Access via name or index; unpackable like tuple!`,
      seniorInsight: '`NamedTuple` provides the memory efficiency of a C struct/tuple (no per-instance `__dict__` overhead) while giving you named dot-access like a C# class.',
    },
    {
      id: 'slicing-and-copying',
      title: '4. Slicing Semantics & Shallow vs Deep Copies',
      content: `Python slicing syntax is \`seq[start:stop:step]\`:
- \`start\` is inclusive, \`stop\` is exclusive.
- Negative indices count backwards from the end (\`-1\` is the last item).
- Slicing a list or tuple always returns a **shallow copy** of that slice.

**The Shallow Copy Danger**:
A shallow copy duplicates the container array of pointers, but the pointers STILL reference the exact same underlying child objects!`,
      codeSnippet: `import copy

original = [[1, 2], [3, 4]]
shallow = original[:]  # or list(original), original.copy()
deep = copy.deepcopy(original)

shallow[0].append(99)
print(original)  # [[1, 2, 99], [3, 4]] -> Mutated original!

deep[1].append(88)
print(original)  # [[1, 2, 99], [3, 4]] -> Original is safe!`,
      seniorInsight: 'Avoid the classic multiplication matrix gotcha: `matrix = [[0] * 3] * 3`. This creates 3 references to the EXACT SAME inner row list! Modifying `matrix[0][0] = 1` mutates all 3 rows. Use a list comprehension instead: `[[0] * 3 for _ in range(3)]`.',
    },
  ],
  codeExamples: [
    {
      title: 'Hash Collisions & Set Operations',
      description: 'Demonstrating mathematical set operations and dictionary operations.',
      pythonCode: `admins = {"alice@co.com", "bob@co.com", "carol@co.com"}
engineers = {"bob@co.com", "carol@co.com", "david@co.com"}

# Set operations:
print("Both admin & engineer:", admins & engineers)       # Intersection
print("Admin but not engineer:", admins - engineers)       # Difference
print("All distinct members:", admins | engineers)         # Union
print("In either but not both:", admins ^ engineers)       # Symmetric difference`,
      runnable: true,
      expectedOutput: `Both admin & engineer: {'carol@co.com', 'bob@co.com'}
Admin but not engineer: {'alice@co.com'}
All distinct members: {'david@co.com', 'bob@co.com', 'alice@co.com', 'carol@co.com'}
In either but not both: {'david@co.com', 'alice@co.com'}`,
    },
    {
      title: 'Defaultdict and Counter in Data Processing',
      description: 'Using Counter and defaultdict to process a stream of logs.',
      pythonCode: `from collections import Counter, defaultdict

logs = [
    {"service": "auth", "status": 200},
    {"service": "billing", "status": 500},
    {"service": "auth", "status": 401},
    {"service": "billing", "status": 500},
    {"service": "auth", "status": 200},
]

status_counts = Counter(log["status"] for log in logs)
print("Status frequencies:", status_counts)

service_errors = defaultdict(int)
for log in logs:
    if log["status"] >= 400:
        service_errors[log["service"]] += 1

print("Errors per service:", dict(service_errors))`,
      runnable: true,
      expectedOutput: `Status frequencies: Counter({200: 2, 500: 2, 401: 1})
Errors per service: {'billing': 2, 'auth': 1}`,
    },
  ],
  quiz: [
    {
      id: 'd2-q1',
      question: 'What is the time complexity of removing an item from the front of a standard Python `list` using `lst.pop(0)` versus a `collections.deque` using `deq.popleft()`?',
      options: [
        'Both are O(1) operations',
        '`lst.pop(0)` is O(N) because all remaining pointers must shift in memory, while `deq.popleft()` is O(1)',
        '`lst.pop(0)` is O(log N), while `deq.popleft()` is O(1)',
        '`lst.pop(0)` is O(1), while `deq.popleft()` is O(N)',
      ],
      correctIndex: 1,
      explanation: 'CPython implements `list` as a contiguous dynamic array of pointers. Deleting the first pointer requires moving all remaining pointers to the left (O(N) operation). A `collections.deque` is a doubly linked list of fixed-size memory blocks, allowing O(1) appends and pops on both ends.',
      seniorTrap: 'Engineers used to high-level collections often assume `pop(0)` is constant time like a queue. In Python, `list` is an array-backed list, not a queue.',
    },
    {
      id: 'd2-q2',
      question: 'Why will executing `d = {(1, [2, 3]): "data"}` raise a `TypeError: unhashable type: \'list\'`?',
      options: [
        'Tuples can never be used as dictionary keys in Python.',
        'Dictionary keys must be strings or integers only.',
        'While the outer tuple is immutable, it contains a mutable `list`, meaning the tuple\'s hash value cannot be guaranteed constant over time.',
        'Tuples must have fewer than 2 elements to be hashable.',
      ],
      correctIndex: 2,
      explanation: 'An object is hashable only if its hash value remains unchanged during its lifetime. Because the tuple contains a mutable `list`, the contents of the tuple could be modified in-place, which would violate the hash table invariant. Therefore, a tuple containing mutable objects is unhashable.',
      seniorTrap: 'Many assume all tuples are unconditionally hashable because the tuple container itself is immutable. A container is only hashable if all its nested elements are hashable.',
    },
    {
      id: 'd2-q3',
      question: 'What is the result of evaluating this matrix creation statement?',
      codeSnippet: `matrix = [[0] * 3] * 3
matrix[0][0] = 7
print(matrix)`,
      options: [
        '[[7, 0, 0], [0, 0, 0], [0, 0, 0]]',
        '[[7, 0, 0], [7, 0, 0], [7, 0, 0]]',
        '[[7, 7, 7], [0, 0, 0], [0, 0, 0]]',
        'TypeError: cannot multiply list by integer',
      ],
      correctIndex: 1,
      explanation: 'The outer multiplication `[[0] * 3] * 3` creates a list containing three references to the EXACT SAME inner list object `[0, 0, 0]`. When you modify `matrix[0][0]`, you mutate the shared list, reflecting the change across all three rows! The correct pattern is `[[0] * 3 for _ in range(3)]`.',
      seniorTrap: 'This is one of the most famous pitfalls in Python. Coming from languages with value arrays or pointer arrays, engineers assume the multiplication operator clones the inner list.',
    },
    {
      id: 'd2-q4',
      question: 'Since Python 3.7, what guarantee does the standard Python dictionary provide regarding key ordering?',
      options: [
        'Keys are always sorted alphabetically or numerically.',
        'Keys are stored in random order according to hash bucket assignment.',
        'Keys strictly maintain insertion order as part of the language specification.',
        'Keys maintain insertion order only if all keys are strings.',
      ],
      correctIndex: 2,
      explanation: 'Starting as an implementation detail in CPython 3.6 and codified into the official Python 3.7 language specification, dictionaries preserve insertion order. Iterating over keys, values, or items yields them in the order they were inserted.',
      seniorTrap: 'Senior engineers who learned Python 2.x or early 3.x remember non-deterministic dictionary ordering and used `collections.OrderedDict`. In modern Python, standard `dict` is ordered by default.',
    },
    {
      id: 'd2-q5',
      question: 'What is the output of the slice operation `data[::-2]` on `data = [10, 20, 30, 40, 50]`?',
      options: [
        '[50, 30, 10]',
        '[10, 30, 50]',
        '[40, 20]',
        '[50, 40, 30, 20, 10]',
      ],
      correctIndex: 0,
      explanation: 'The slice format is `[start:stop:step]`. When `step` is negative (`-2`), it strides backwards through the sequence starting from the last element. Starting at index 4 (50), taking every 2nd element backwards gives 50, then 30, then 10.',
      seniorTrap: 'Negative slicing strides are unique to Python compared to standard C#/JS loops. Understanding step polarity is critical for clean sequence manipulations.',
    },
    {
      id: 'd2-q6',
      question: 'When using `collections.defaultdict(list)`, what happens when you access a key that does not exist?',
      options: [
        'It raises a `KeyError`.',
        'It returns `None` without modifying the dictionary.',
        'It calls the factory function `list()`, inserts the resulting empty list `[]` under that key, and returns it.',
        'It returns an immutable empty tuple.',
      ],
      correctIndex: 2,
      explanation: 'When a missing key is accessed via `__getitem__` on a `defaultdict`, it automatically invokes `default_factory` (`list()`), stores the result under the missing key, and returns the newly created list.',
      seniorTrap: 'In C# or JS, accessing a missing key or index returns default or throws without modifying the map. `defaultdict` actually mutates and populates the map on read.',
    },
    {
      id: 'd2-q7',
      question: 'What is the fundamental difference between `copy.copy(obj)` and `copy.deepcopy(obj)`?',
      options: [
        '`copy.copy` creates a new container but inserts references to the original child objects; `copy.deepcopy` recursively duplicates all nested objects.',
        '`copy.copy` works on classes; `copy.deepcopy` works only on primitives.',
        '`copy.deepcopy` freezes all objects to make them immutable.',
        '`copy.copy` is thread-safe; `copy.deepcopy` is not thread-safe.',
      ],
      correctIndex: 0,
      explanation: 'A shallow copy (`copy.copy` or `list[:]`) constructs a new collection and populates it with references to the child objects found in the original. If those child objects are mutable, changes to them will affect both copies. `copy.deepcopy` recursively copies all objects and handles cyclic references.',
      seniorTrap: 'Many senior developers assume `list(original)` or slice `original[:]` creates an independent deep copy of nested JSON data or nested lists.',
    },
    {
      id: 'd2-q8',
      question: 'Given two sets `s1 = {1, 2, 3}` and `s2 = {3, 4, 5}`, which operator expression computes elements present in `s1` but NOT in `s2`?',
      options: [
        '`s1 ^ s2`',
        '`s1 & s2`',
        '`s1 - s2`',
        '`s1 | s2`',
      ],
      correctIndex: 2,
      explanation: 'The difference operator `-` (`s1 - s2`) returns elements present in `s1` that are not in `s2` ({1, 2}). `&` is intersection, `|` is union, and `^` is symmetric difference (elements in either set but not both).',
      seniorTrap: 'Coming from languages that don\'t have native set operators (using `.Except()` in LINQ or `new Set([...a].filter(x => !b.has(x)))` in JS), Python provides concise mathematical set operators.',
    },
  ],
};
