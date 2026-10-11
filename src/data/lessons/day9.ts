import type { Lesson } from '../../types';

export const day9: Lesson = {
  day: 9,
  title: 'Data Processing Part 1: Files, JSON, CSV & Serialization',
  subtitle: 'pathlib.Path, csv.DictReader, Custom JSON Encoders, Pickle Security, and Big File Streaming',
  estimatedMinutes: 45,
  category: 'data',
  seniorBridge: {
    csharp: '`pathlib.Path` replaces C# `System.IO.Path` and `FileInfo`. `csv.DictReader` provides streaming mapping like CsvHelper. `json.dumps` matches `System.Text.Json.JsonSerializer.Serialize`. Crucially, Python\'s `pickle` is like the deprecated .NET `BinaryFormatter`—both are catastrophic security vulnerabilities if used with untrusted input.',
    c_modula2: 'In C, file I/O uses raw `FILE*` pointers, `fopen`, `fread`, and buffer allocations. In Python, `Path.open()` combined with context managers guarantees deterministic closing and automatic UTF-8 decoding.',
    javascript: 'Python\'s `json.loads()` is `JSON.parse()`, and `json.dumps()` is `JSON.stringify()`. But Python handles streaming JSON files directly via `json.load(fp)` and supports custom type encoders via the `default` serializer callback.',
    c64_basic: 'No more `OPEN 1,8,2,"DATA,S,R"` or reading with `INPUT#1`. Python offers structured CSV, JSON, and Path abstractions.',
  },
  overview: `Data processing in Python begins at the I/O layer. Senior engineers avoid outdated idioms like string concatenation with \`os.path.join\` and understand why default file encodings cause silent cross-platform production corruption. This lesson covers modern object-oriented filesystem manipulation with ` + '`pathlib`' + `, resilient CSV/JSON parsing, serialization safety, and streaming multi-gigabyte files with flat memory consumption.`,
  keyTakeaways: [
    'Always use `pathlib.Path` instead of legacy `os.path`. The slash operator `/` joins path segments cleanly (`Path("/var/log") / "app.log"`).',
    'CRITICAL: Always specify `encoding="utf-8"` when opening text files. On Windows, Python defaults to legacy code pages (CP1252), causing silent encoding crashes in production.',
    '`csv.DictReader` streams rows as dictionaries, eliminating fragile positional column index lookups.',
    'Python `json` does not natively serialize `datetime`, `UUID`, or `Decimal`. Pass a custom `default=str` or custom serializer function to `json.dumps()`.',
    'SECURITY WARNING: `pickle` is inherently unsafe. Deserializing pickled data executes arbitrary bytecode (`__reduce__`). NEVER use pickle for network communication or untrusted data.',
    'Never do `file.read()` or `file.readlines()` on large files. Iterate over the file object directly (`for line in f:`), which buffers in C with O(1) memory overhead.',
  ],
  sections: [
    {
      id: 'modern-pathlib',
      title: '1. Modern Filesystem Operations: pathlib.Path',
      content: `The modern standard for file paths in Python is \`pathlib.Path\` (introduced in PEP 428). 

Why \`pathlib\` is superior to \`os.path\`:
1. **Object-Oriented**: Paths are objects with methods like \`.exists()\`, \`.mkdir()\`, \`.stat()\`, \`.glob()\`, not raw strings.
2. **Cross-Platform Operator**: The \`/\` operator handles forward and backward slashes automatically.
3. **High-Level Helpers**: \`.read_text()\`, \`.write_text()\`, and \`.read_bytes()\` open, read/write, and close files automatically with a context manager under the hood!`,
      codeSnippet: `from pathlib import Path

# Constructing paths with / operator:
data_dir = Path("./data") / "exports"
data_dir.mkdir(parents=True, exist_ok=True)

target_file = data_dir / "report_2026.json"

# Quick write & read:
target_file.write_text('{"status": "ready"}', encoding="utf-8")
print("Exists?", target_file.exists())
print("File content:", target_file.read_text(encoding="utf-8"))

# Finding files matching a glob:
for json_file in Path(".").glob("**/*.json"):
    print("Found JSON:", json_file.name)`,
      seniorInsight: 'Always pass `encoding="utf-8"` explicitly, even when using `.read_text()`. Never rely on the system default.',
    },
    {
      id: 'csv-processing',
      title: '2. Structured CSV Processing: csv.DictReader',
      content: `The standard library \`csv\` module handles escaping, commas inside quotes, and multi-line fields.

Instead of \`csv.reader\` (which yields raw lists of strings requiring index lookups like \`row[3]\`), use \`csv.DictReader\`. It reads the first line as field names and yields each subsequent line as a dictionary.`,
      codeSnippet: `import csv
from io import StringIO

csv_data = """id,product,price,in_stock
101,Mechanical Keyboard,129.99,true
102,USB-C Hub,39.50,false
103,4K Monitor,349.00,true
"""

reader = csv.DictReader(StringIO(csv_data))
parsed_inventory = [
    {
        "id": int(row["id"]),
        "product": row["product"],
        "price": float(row["price"]),
        "in_stock": row["in_stock"].lower() == "true",
    }
    for row in reader
]
print("First item:", parsed_inventory[0])`,
      seniorInsight: 'When writing CSVs with `open(..., "w", newline="")`, always pass `newline=""`! On Windows, without `newline=""`, Python inserts an extra blank line between rows.',
    },
    {
      id: 'json-and-custom-encoders',
      title: '3. JSON Parsing & Custom Type Serialization',
      content: `Standard \`json.dumps()\` fails on common Python enterprise data types like \`datetime\`, \`UUID\`, \`Decimal\`, and custom dataclasses.

To handle these without converting your data structures beforehand, supply a \`default\` serializer function or subclass \`json.JSONEncoder\`.`,
      codeSnippet: `import json
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID, uuid4

payload = {
    "transaction_id": uuid4(),
    "amount": Decimal("149.95"),
    "timestamp": datetime.now(timezone.utc),
    "status": "APPROVED",
}

def custom_serializer(obj):
    if isinstance(obj, (datetime,)):
        return obj.isoformat()
    if isinstance(obj, (UUID, Decimal)):
        return str(obj)
    raise TypeError(f"Type {type(obj)} not serializable")

json_output = json.dumps(payload, default=custom_serializer, indent=2)
print("Serialized JSON:\\n", json_output)`,
      seniorInsight: 'Remember the difference between `json.dumps()` (dumps to a string) and `json.dump()` (dumps into a writable file stream).',
    },
    {
      id: 'streaming-big-files-and-pickle',
      title: '4. Streaming Gigabyte Files & The Pickle Danger',
      content: `### Streaming Multi-Gigabyte Files
If you have a 50GB log file, never call \`file.read()\` or \`file.readlines()\` (which loads all lines into a giant list).
Python file objects are native iterators. Looping directly over the file object streams lines using C-level internal buffers.

### The Pickle Security Hazard
Python\'s built-in \`pickle\` module serializes arbitrary Python objects to binary.
**CRITICAL SECURITY RULE**: Never unpickle data received over a network or from untrusted storage! During unpickling, Python executes code defined in the object\'s \`__reduce__\` method. An attacker can execute arbitrary shell commands inside your server process. Use JSON, MsgPack, or Protocol Buffers instead.`,
      codeSnippet: `# STREAMING PATTERN FOR GIGABYTE LOGS:
def stream_error_logs(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        # File object iterates line-by-line lazily:
        for line in f:
            if "ERROR" in line:
                yield line.strip()

# Memory stays flat at ~8MB regardless of file size!`,
      seniorInsight: 'For fast, compact binary serialization that is completely safe against arbitrary code execution, use `msgpack` (`pip install msgpack`).',
    },
  ],
  codeExamples: [
    {
      title: 'Memory-Efficient Chunked File Ingestion',
      description: 'Processing a simulated continuous data stream in batches.',
      pythonCode: `from io import StringIO
from itertools import islice

mock_stream = StringIO("\\n".join(f"ROW-{i:06d},VALUE-{i*2}" for i in range(20)))

def chunked_stream(file_obj, chunk_size=5):
    while True:
        chunk = list(islice(file_obj, chunk_size))
        if not chunk:
            break
        yield [line.strip() for line in chunk]

for batch_idx, batch in enumerate(chunked_stream(mock_stream, chunk_size=6), 1):
    print(f"Batch {batch_idx} ({len(batch)} items): {batch[0]} ... {batch[-1]}")`,
      runnable: true,
      expectedOutput: `Batch 1 (6 items): ROW-000000,VALUE-0 ... ROW-000005,VALUE-10
Batch 2 (6 items): ROW-000006,VALUE-12 ... ROW-000011,VALUE-22
Batch 3 (6 items): ROW-000012,VALUE-24 ... ROW-000017,VALUE-34
Batch 4 (2 items): ROW-000018,VALUE-36 ... ROW-000019,VALUE-38`,
    },
    {
      title: 'Writing CSV with csv.DictWriter',
      description: 'Generating formatted CSV data with headers programmatically.',
      pythonCode: `import csv
from io import StringIO

output_buffer = StringIO()
fieldnames = ["user_id", "email", "tier"]

writer = csv.DictWriter(output_buffer, fieldnames=fieldnames)
writer.writeheader()
writer.writerow({"user_id": 1, "email": "pat@company.com", "tier": "gold"})
writer.writerow({"user_id": 2, "email": "sam@company.com", "tier": "silver"})

print(output_buffer.getvalue())`,
      runnable: true,
      expectedOutput: `user_id,email,tier
1,pat@company.com,gold
2,sam@company.com,silver`,
    },
  ],
  quiz: [
    {
      id: 'd9-q1',
      question: 'Why should you always specify `encoding="utf-8"` explicitly when opening text files in Python?',
      options: [
        'Because Python text files cannot be read without specifying an encoding.',
        'Because without an explicit encoding, Python defaults to the OS platform encoding (e.g. CP1252 on Windows, UTF-8 on Linux), causing silent data corruption or UnicodeDecodeError in cross-platform deployments.',
        'Because UTF-8 makes file reading 10x faster than UTF-16.',
        'Because UTF-8 is required by the POSIX standard.',
      ],
      correctIndex: 1,
      explanation: 'On Windows, CPython defaults to the local ANSI code page (like Windows-1252), while Linux and macOS default to UTF-8. Code that works on a Mac developer laptop will crash with `UnicodeDecodeError` in Windows production environments unless `encoding="utf-8"` is explicitly specified.',
      seniorTrap: 'Senior developers frequently encounter this bug when running Docker containers or Windows servers: code passes tests locally on macOS/Linux but crashes on Windows hosts.',
    },
    {
      id: 'd9-q2',
      question: 'Which of the following is the modern, idiomatic way to join filesystem path segments in Python?',
      options: [
        '`os.path.join("var", "logs", "app.log")`',
        '`Path("var") / "logs" / "app.log"`',
        '`"var" + "\\" + "logs" + "\\" + "app.log"`',
        '`os.concat("var", "logs", "app.log")`',
      ],
      correctIndex: 1,
      explanation: '`pathlib.Path` overloads the division operator `/` to join paths cleanly across operating systems. It is object-oriented, readable, and standard in modern Python.',
      seniorTrap: 'Using string concatenation or `os.path.join` is legacy Python 2/early 3 style.',
    },
    {
      id: 'd9-q3',
      question: 'Why is using the built-in `pickle` module considered a severe security vulnerability when handling untrusted data?',
      options: [
        'Because `pickle` sends data unencrypted across the network.',
        'Because the unpickling process can construct arbitrary Python objects and execute arbitrary code via the `__reduce__` protocol, allowing remote code execution (RCE).',
        'Because pickled files are prone to memory buffer overflows.',
        'Because `pickle` does not support passwords.',
      ],
      correctIndex: 1,
      explanation: 'The Python documentation explicitly warns: "The pickle module is not secure. Only unpickle data you trust." During deserialization, `pickle` executes bytecode instructions that can call any callable, such as `os.system("rm -rf /")`. Never use pickle for public APIs or caching untrusted user data.',
      seniorTrap: 'Engineers from C# who remember the vulnerability of `.NET BinaryFormatter` will recognize this exact security threat. Use JSON, MsgPack, or Protobuf.',
    },
    {
      id: 'd9-q4',
      question: 'What happens when `json.dumps()` encounters a Python `datetime` or `Decimal` object by default?',
      options: [
        'It converts it to an ISO-8601 string automatically.',
        'It raises a `TypeError: Object of type ... is not JSON serializable`.',
        'It serializes it as `null`.',
        'It converts it into a floating-point number.',
      ],
      correctIndex: 1,
      explanation: 'Python\'s standard `json` encoder only knows how to serialize primitives (`dict`, `list`, `str`, `int`, `float`, `bool`, `None`). Encounting `datetime`, `UUID`, or `Decimal` raises a `TypeError`. You must pass `default=str` or a custom serializer.',
      seniorTrap: 'JavaScript\'s `JSON.stringify` automatically calls `.toJSON()`. Python\'s `json` does not call magic methods automatically; you must supply a `default` handler.',
    },
    {
      id: 'd9-q5',
      question: 'How should you process a 20 GB CSV file in Python to prevent running out of memory (OOM)?',
      options: [
        'Use `f.readlines()` to load all lines into a list.',
        'Read the whole file into a string with `f.read()` and split on `\\n`.',
        'Iterate directly over the file object using `for line in f:` or pass the file object to `csv.DictReader(f)`.',
        'Increase the system swap space to 50 GB.',
      ],
      correctIndex: 2,
      explanation: 'Python file objects are iterators that buffer lines lazily using C-level internal buffers. Looping over the open file with `for line in f:` or streaming through `csv.DictReader(f)` processes one line at a time with tiny, constant O(1) memory usage.',
      seniorTrap: 'Calling `f.readlines()` forces all 20 GB into RAM as Python string objects, instantly triggering an Out-Of-Memory crash.',
    },
    {
      id: 'd9-q6',
      question: 'What is the crucial parameter that must be passed to `open()` when writing CSV files with `csv.writer` or `csv.DictWriter` on Windows to avoid unwanted blank lines?',
      options: [
        '`mode="wb"`',
        '`newline=""`',
        '`buffering=0`',
        '`encoding="ascii"`',
      ],
      correctIndex: 1,
      explanation: 'The `csv` module handles its own newline terminating conventions (`\\r\\n`). Without `newline=""`, Python\'s universal newline translation on Windows converts `\\r\\n` into `\\r\\r\\n`, producing an extra blank line between every row.',
      seniorTrap: 'This is the most common Windows-specific CSV bug in Python. The documentation explicitly mandates `open("out.csv", "w", newline="")`.',
    },
    {
      id: 'd9-q7',
      question: 'What is the difference between `json.load()` and `json.loads()`?',
      options: [
        '`json.load` is for legacy Python; `json.loads` is for Python 3.',
        '`json.load` reads from a file-like stream object (`.read()`), while `json.loads` parses a string in memory (`s` stands for string).',
        '`json.loads` loads data asynchronously.',
        '`json.load` validates types using Pydantic.',
      ],
      correctIndex: 1,
      explanation: '`json.load(file_object)` parses JSON directly from a readable file/stream buffer, while `json.loads(string_data)` parses JSON from an in-memory string. The `s` suffix stands for "string".',
      seniorTrap: 'Passing a file object to `json.loads()` raises `TypeError: the JSON object must be str, bytes or bytearray, not TextIOWrapper`. Use `json.load()` for files.',
    },
    {
      id: 'd9-q8',
      question: 'How do you recursively find all `.py` files inside a directory using `pathlib.Path`?',
      options: [
        '`path.find("*.py")`',
        '`path.glob("**/*.py")` (or `path.rglob("*.py")`)',
        '`path.search_all(".py")`',
        '`path.walk_filter("py")`',
      ],
      correctIndex: 1,
      explanation: '`pathlib.Path.glob("**/*.py")` or `path.rglob("*.py")` searches the directory and all subdirectories recursively, yielding `Path` objects matching the pattern.',
      seniorTrap: 'This replaces `os.walk()` loops with a clean, generator-based iterator.',
    },
  ],
};
