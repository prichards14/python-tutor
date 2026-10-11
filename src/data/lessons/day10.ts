import type { Lesson } from '../../types';

export const day10: Lesson = {
  day: 10,
  title: 'Data Processing Part 2: Tabular Data (Pandas & Polars)',
  subtitle: 'Vectorization, Boolean Masks, GroupBy Aggregations, Polars LazyFrames, and Parquet',
  estimatedMinutes: 50,
  category: 'data',
  seniorBridge: {
    csharp: 'Pandas/Polars DataFrames are like high-performance in-memory databases with LINQ capabilities, but backed by native C/C++ or Rust columnar engines (Apache Arrow). Writing a `for` loop over rows in Pandas is an anti-pattern (like calling a database query in a C# foreach loop); always express transformations as vectorized columnar operations.',
    c_modula2: 'In C, high-performance numeric processing uses contiguous structs and SIMD CPU vector extensions. Pandas and Polars provide contiguous numeric memory arrays backed by NumPy/Arrow so operations happen in compiled native loops without Python interpreter overhead.',
    javascript: 'Think of DataFrames as arrays of typed objects, but instead of mapping and reducing in JS runtime, transformations execute in compiled multithreaded Rust (Polars) or C (NumPy/Pandas).',
    c64_basic: 'No more nested `FOR/NEXT` loops processing 1,000 array elements. Modern columnar engines crunch 10 million rows in milliseconds using vectorized vector math.',
  },
  overview: `When processing structured business data, metrics, or financial records, standard Python collections are too slow. A senior engineer must understand the vectorization paradigm: pushing operations down into compiled C/Rust engines. In this lesson, we explore Pandas core operations, the boolean mask bitwise operator gotcha, the rising dominance of Polars with lazy evaluation, and why Parquet is the production standard for tabular storage.`,
  keyTakeaways: [
    'The #1 Golden Rule of DataFrames: NEVER iterate over rows with `for index, row in df.iterrows()` in production. Always write vectorized operations or use `.apply()` as a last resort.',
    'Boolean indexing in Pandas requires bitwise operators `&`, `|`, `~` with parentheses around each condition, NOT Python keywords `and`, `or`, `not`.',
    'GroupBy aggregations allow multi-column reductions in a single pass: `df.groupby("region")["revenue"].agg(["sum", "mean"])`.',
    'Polars is a modern DataFrame library written in Rust on top of Apache Arrow that is 10x-50x faster than Pandas, multithreaded by default, and supports lazy query plans (`LazyFrame`).',
    'Lazy execution (`pl.scan_parquet().filter().collect()`) allows the query engine to reorder filters, optimize projections, and push predicates directly to disk before reading data into RAM.',
    'Parquet is a columnar binary file format with built-in compression and schema definitions, outperforming CSV in speed, storage, and type preservation by orders of magnitude.',
  ],
  sections: [
    {
      id: 'the-vectorization-rule',
      title: '1. The Vectorization Rule: Why Python Loops Die',
      content: `In standard Python, looping over 1,000,000 items requires the bytecode interpreter to:
1. Unbox each \`PyObject\`
2. Check its type
3. Perform dynamic dispatch for the addition/operation
4. Box the result into a new \`PyObject\`

In a vectorized engine (like NumPy, Pandas, or Polars), memory is stored as **contiguous raw arrays of typed memory** (e.g. 64-bit floats). When you write \`df["total"] = df["price"] * df["quantity"]\`, the entire column calculation executes in compiled C/Rust using CPU SIMD vector registers in a single pass.`,
      codeSnippet: `# BAD (Anti-pattern - extremely slow):
# for i in range(len(df)):
#     df.loc[i, "total"] = df.loc[i, "price"] * df.loc[i, "qty"]

# GOOD (Vectorized - 100x faster):
# df["total"] = df["price"] * df["qty"]

# Simulating vectorization with pure Python vs compiled concept:
prices = [10.0, 25.5, 99.0, 4.5]
quantities = [2, 1, 3, 10]
# Vectorized mental model:
totals = [p * q for p, q in zip(prices, quantities)]
print("Totals:", totals)`,
      seniorInsight: 'If you ever find yourself reaching for `iterrows()` on a DataFrame in production code review, challenge the design: 99% of transformations can be expressed with native vectorized operations, masks, or lookup joins.',
    },
    {
      id: 'pandas-boolean-indexing-gotcha',
      title: '2. Boolean Indexing & The Bitwise Operator Gotcha',
      content: `To filter rows in Pandas, you construct a **boolean mask** (a Series of True/False values):

\`df[df["status"] == "ACTIVE"]\`

**THE TRAP**:
When combining multiple conditions in Pandas, you CANNOT use Python keywords \`and\`, \`or\`, \`not\`.
You MUST use bitwise operators:
- \`&\` for AND
- \`|\` for OR
- \`~\` for NOT
AND every condition **MUST be wrapped in parentheses** due to Python operator precedence!`,
      codeSnippet: `# THE GOTCHA:
# df[(df["age"] > 25) and (df["score"] > 80)]  # ValueError! Truth value of Series is ambiguous

# THE CORRECT PANDAS IDIOM:
# df[(df["age"] > 25) & (df["score"] > 80)]     # Works! Notice bitwise & and parentheses ()

# Example with mock data dictionary simulating DataFrame logic:
records = [
    {"user": "u1", "age": 28, "score": 92},
    {"user": "u2", "age": 22, "score": 85},
    {"user": "u3", "age": 35, "score": 70},
    {"user": "u4", "age": 40, "score": 95},
]
# Masking pattern:
filtered = [r for r in records if (r["age"] > 25 and r["score"] > 80)]
print("Filtered users:", [r["user"] for r in filtered])  # ['u1', 'u4']`,
      seniorInsight: 'Because Python\'s bitwise `&` has higher operator precedence than comparison operators like `>`, writing `df[df["age"] > 25 & df["score"] > 80]` will evaluate `25 & df["score"]` first! Parentheses `(df["age"] > 25) & (...)` are mandatory.',
    },
    {
      id: 'groupby-and-aggregations',
      title: '3. GroupBy Aggregations & Joins',
      content: `GroupBy splits a dataset into buckets by key, applies an aggregation function, and combines the results.

Senior patterns:
- Multi-metric aggregation: \`.agg({"col1": "sum", "col2": ["mean", "max"]})\`
- Merges / Joins: \`pd.merge(left_df, right_df, on="customer_id", how="left")\`
- Handling missing data explicitly: \`.fillna(value)\` or \`.dropna()\` rather than allowing \`NaN\` to propagate silently into calculations.`,
      codeSnippet: `# Conceptual GroupBy aggregation in Python:
transactions = [
    {"dept": "Eng", "amount": 1200},
    {"dept": "Sales", "amount": 850},
    {"dept": "Eng", "amount": 400},
    {"dept": "Sales", "amount": 1500},
]

from collections import defaultdict
grouped = defaultdict(list)
for t in transactions:
    grouped[t["dept"]].append(t["amount"])

summary = {dept: {"sum": sum(vals), "avg": sum(vals)/len(vals)} for dept, vals in grouped.items()}
print("Department summary:", summary)
# In Pandas, this is simply: df.groupby("dept")["amount"].agg(["sum", "mean"])`,
      seniorInsight: 'In Pandas, `NaN` is a floating-point IEEE 754 value. In integer columns, legacy Pandas converted the entire column to `float64` to represent missing data. Modern Pandas uses nullable integer types (`Int64` with capital I) to preserve integers.',
    },
    {
      id: 'polars-and-parquet',
      title: '4. The Modern Frontier: Polars & Parquet',
      content: `While Pandas remains ubiquitous, **Polars** has become the gold standard for high-performance data engineering:

1. **Rust Engine**: Written from scratch in Rust, with zero GIL contention and automatic multicore parallelism.
2. **Apache Arrow**: Columnar in-memory format enabling zero-copy sharing between systems.
3. **Lazy Execution (LazyFrame)**: Builds a query execution graph and optimizes it before touching data:
   \`pl.scan_parquet("data/*.parquet").filter(pl.col("age") > 30).collect()\`
   The engine only reads the columns and rows matching the filter directly off the disk!

4. **Parquet vs CSV**:
   - CSV is uncompressed text, requiring expensive string-to-number parsing on every read.
   - Parquet is binary, columnar, dictionary-encoded, compressed (Snappy/ZSTD), and embeds column data types. It is 5x-20x smaller and 10x-50x faster to load.`,
      codeSnippet: `# Polars Expression Syntax (Cleaner and more composable than Pandas):
# import polars as pl
# 
# df = (
#     pl.scan_parquet("orders.parquet")
#     .filter(pl.col("status") == "COMPLETED")
#     .group_by("customer_id")
#     .agg([
#         pl.col("amount").sum().alias("total_spent"),
#         pl.col("order_id").count().alias("order_count"),
#     ])
#     .sort("total_spent", descending=True)
#     .collect()  # Execute optimized plan!
# )`,
      seniorInsight: 'In modern data lakehouses (Databricks, Snowflake, BigQuery, AWS Athena), tabular datasets are stored as Parquet. Loading Parquet with Polars or DuckDB is the modern senior engineering baseline.',
    },
  ],
  codeExamples: [
    {
      title: 'Vectorized Column Operations vs Scalar Loops',
      description: 'Calculating tax and totals across records with vector logic.',
      pythonCode: `class MockDataFrame:
    def __init__(self, data):
        self.data = data
    def apply_vector(self, formula):
        return [formula(row) for row in self.data]

records = [
    {"item": "Laptop", "base_price": 1200.0, "tax_rate": 0.08},
    {"item": "Mouse", "base_price": 25.0, "tax_rate": 0.05},
    {"item": "Monitor", "base_price": 300.0, "tax_rate": 0.08},
]

df = MockDataFrame(records)
# Compute final price:
final_prices = df.apply_vector(lambda r: round(r["base_price"] * (1 + r["tax_rate"]), 2))
print("Computed final prices:", final_prices)`,
      runnable: true,
      expectedOutput: `Computed final prices: [1296.0, 26.25, 324.0]`,
    },
    {
      title: 'Tabular Data Cleaning & Null Handling',
      description: 'Pattern for imputing missing values and casting types cleanly.',
      pythonCode: `raw_dataset = [
    {"id": 1, "score": "95", "notes": "good"},
    {"id": 2, "score": None, "notes": "absent"},
    {"id": 3, "score": "82", "notes": None},
    {"id": 4, "score": "NA", "notes": "excused"},
]

def clean_row(row):
    # Impute missing notes
    notes = row["notes"] or "N/A"
    # Clean score
    score_val = row["score"]
    if score_val in (None, "NA", ""):
        clean_score = 0.0
    else:
        clean_score = float(score_val)
    return {"id": row["id"], "score": clean_score, "notes": notes}

cleaned = [clean_row(r) for r in raw_dataset]
for r in cleaned:
    print(r)`,
      runnable: true,
      expectedOutput: `{'id': 1, 'score': 95.0, 'notes': 'good'}
{'id': 2, 'score': 0.0, 'notes': 'absent'}
{'id': 3, 'score': 82.0, 'notes': 'N/A'}
{'id': 4, 'score': 0.0, 'notes': 'excused'}`,
    },
  ],
  quiz: [
    {
      id: 'd10-q1',
      question: 'Why is combining conditions like `df[df["age"] > 25 and df["score"] > 80]` invalid in Pandas?',
      options: [
        'Pandas does not allow filtering on more than one column at a time.',
        'The Python keyword `and` evaluates the boolean truth value of the entire left-hand Series using `bool()`, raising `ValueError: The truth value of a Series is ambiguous`. You must use bitwise `&` with parentheses.',
        'Pandas requires conditions to be written in SQL strings only.',
        'Boolean indexing was deprecated in Pandas 2.0.',
      ],
      correctIndex: 1,
      explanation: 'In Python, `and` calls `bool()` on its left operand. A Pandas Series contains multiple booleans, so Python cannot decide if the Series as a whole is True or False. You must use element-wise bitwise `&` with parentheses: `(df["age"] > 25) & (df["score"] > 80)`.',
      seniorTrap: 'Almost every senior engineer coming from C# or JS falls into this trap when writing their first compound Pandas filter.',
    },
    {
      id: 'd10-q2',
      question: 'Why should you avoid using `for index, row in df.iterrows():` to process data in Pandas production code?',
      options: [
        '`iterrows()` causes memory leaks in the operating system.',
        '`iterrows()` converts each row into a Pandas Series, incurs massive Python object creation overhead, and runs in slow interpreted Python rather than compiled C/vectorized memory buffers.',
        '`iterrows()` permanently mutates the DataFrame.',
        '`iterrows()` skips duplicate rows.',
      ],
      correctIndex: 1,
      explanation: '`iterrows()` is notoriously slow because it boxes every single row into an individual `pd.Series` object and iterates using the Python bytecode loop. Vectorized column expressions or Polars expressions run 50x-500x faster in compiled native code.',
      seniorTrap: 'Senior engineers writing Python like procedural C or C# often default to `for` loops. In data processing, vectorized columnar operations are mandatory.',
    },
    {
      id: 'd10-q3',
      question: 'What is the main architectural advantage of Polars over Pandas for large datasets?',
      options: [
        'Polars is written in C# and runs on the .NET CLR.',
        'Polars is written in Rust, leverages Apache Arrow columnar memory, is multithreaded across all CPU cores by default, and supports lazy query optimization (`LazyFrame`).',
        'Polars uses SQLite as its backend database.',
        'Polars only runs in the cloud.',
      ],
      correctIndex: 1,
      explanation: 'Polars bypasses CPython\'s GIL by running multi-threaded query execution in Rust on Apache Arrow data structures. Its query planner optimizes expressions, performs predicate pushdown, and scales efficiently across CPU cores.',
      seniorTrap: 'Pandas is largely single-threaded and struggles when datasets approach memory limits. Polars handles out-of-core streaming and parallel computation natively.',
    },
    {
      id: 'd10-q4',
      question: 'What does "Lazy Evaluation" in Polars (`LazyFrame`) mean?',
      options: [
        'The queries are scheduled to run overnight.',
        'The query does not execute immediately when functions are called; instead, it builds an execution graph, optimizes filters and projections, and only processes data when `.collect()` is called.',
        'Data is stored on tape storage.',
        'Calculations run with reduced CPU frequency to save power.',
      ],
      correctIndex: 1,
      explanation: 'In lazy mode, Polars constructs a Directed Acyclic Graph (DAG) of transformations. When you call `.collect()`, the optimizer eliminates unused columns, pushes filters directly to the Parquet scanner, and minimizes memory allocation before reading data.',
      seniorTrap: 'This mirrors LINQ `IQueryable<T>` in C# or Spark/SQL query planners, where queries are compiled into an optimized execution plan before execution.',
    },
    {
      id: 'd10-q5',
      question: 'Why is Apache Parquet heavily preferred over CSV for storing tabular datasets in production data systems?',
      options: [
        'Parquet files can be edited in Notepad.',
        'Parquet is a columnar binary format with built-in compression, embedded data types, and metadata that allows readers to skip irrelevant columns and row groups without reading the entire file.',
        'Parquet is uncompressed, making it simpler for web browsers to render.',
        'Parquet requires no disk space.',
      ],
      correctIndex: 1,
      explanation: 'CSV is row-oriented text requiring expensive character-by-character parsing and stores no type schema. Parquet is binary, compressed (e.g. Snappy/ZSTD), stores column-oriented statistics (min/max), and enables predicate pushdown to skip unneeded row groups.',
      seniorTrap: 'Never store multi-gigabyte analytical data in CSV in production. Parquet is the industry standard format across AWS S3, BigQuery, Databricks, and local data pipelines.',
    },
    {
      id: 'd10-q6',
      question: 'In Pandas, what is the effect of calling `df.dropna(subset=["email"])`?',
      options: [
        'It deletes the "email" column from the DataFrame.',
        'It removes all rows where the "email" column contains `NaN` or `None`.',
        'It sets the "email" column values to empty strings.',
        'It raises a KeyError if any email is missing.',
      ],
      correctIndex: 1,
      explanation: '`df.dropna(subset=["email"])` drops any row that has a missing value (`NaN` or `None`) specifically in the "email" column, leaving rows with missing values in other columns intact.',
      seniorTrap: 'Calling `df.dropna()` without `subset` drops any row with a missing value in ANY column, which can unintentionally wipe out most of your dataset!',
    },
    {
      id: 'd10-q7',
      question: 'What operator in Pandas represents the logical NOT when filtering with boolean masks?',
      options: [
        '`!`',
        '`not`',
        '`~` (tilde)',
        '`-`',
      ],
      correctIndex: 2,
      explanation: 'In Pandas boolean indexing, the bitwise inversion operator `~` (tilde) represents element-wise NOT. For example: `df[~df["is_cancelled"]]`.',
      seniorTrap: 'In C# and JS, logical NOT is `!`. In Python, bitwise NOT on boolean Series is `~`.',
    },
    {
      id: 'd10-q8',
      question: 'What is the purpose of `.agg()` when applied to a Pandas or Polars GroupBy object?',
      options: [
        'It sorts the grouped rows alphabetically.',
        'It applies one or more reduction functions (such as sum, mean, count, min, max) across specified columns in each group.',
        'It flattens the DataFrame into a JSON string.',
        'It deletes duplicate groups.',
      ],
      correctIndex: 1,
      explanation: '`.agg()` allows computing aggregate statistics per group. You can pass a list of functions `["mean", "std"]` or a dictionary mapping column names to specific aggregation functions.',
      seniorTrap: 'This provides the equivalent of SQL `SELECT category, SUM(amount), AVG(amount) GROUP BY category` in a single expressive call.',
    },
  ],
};
