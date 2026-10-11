import type { Lesson } from '../../types';

export const day13: Lesson = {
  day: 13,
  title: 'Concurrency, Parallelism & Asynchronous Programming',
  subtitle: 'The GIL, ThreadPool vs ProcessPool, asyncio.TaskGroup, and Event Loop Discipline',
  estimatedMinutes: 50,
  category: 'architecture',
  seniorBridge: {
    csharp: 'In C#, `async/await` uses the thread pool; threads execute across multiple CPU cores simultaneously. In CPython, the GIL (Global Interpreter Lock) restricts bytecode execution to one core at a time. Threads only provide concurrency for I/O-bound operations. For CPU parallelism, Python uses `multiprocessing`. Python 3.11+ `asyncio.TaskGroup` matches structured concurrency patterns.',
    c_modula2: 'In C, POSIX threads (`pthreads`) achieve true parallel CPU execution. In standard CPython, multiple threads share the same process but take turns acquiring the GIL mutex. C extensions (like NumPy) explicitly release the GIL via `Py_BEGIN_ALLOW_THREADS` to achieve true multicore C execution.',
    javascript: 'Python\'s `asyncio` is conceptually identical to Node.js\'s single-threaded event loop! But unlike JS where all I/O is asynchronous by default, Python standard library functions (`time.sleep`, `requests.get`, `open`) are synchronous and blocking. If you call blocking sync code in an async function, you freeze the entire event loop!',
    c64_basic: 'Forget hardware interrupt service routines (ISRs) on the 6502 processor. Python provides cooperative multitasking, thread pools, and process clustering.',
  },
  overview: `Concurrency is the area where experienced engineers moving from C# or Java face the greatest disorientation. The presence of the Global Interpreter Lock (GIL) fundamentally divides Python concurrency into three distinct tools: asyncio (for high-volume I/O concurrency), ThreadPoolExecutor (for blocking I/O calls), and ProcessPoolExecutor (for CPU-bound parallel processing). Understanding these distinctions is critical for writing performant backends.`,
  keyTakeaways: [
    'The Global Interpreter Lock (GIL) ensures that only one operating system thread executes Python bytecode at any instant. Python threads CANNOT execute CPU-bound Python calculations in parallel across multiple cores.',
    'Python threads ARE useful for I/O-bound operations (database queries, network calls, filesystem operations), because CPython releases the GIL while waiting on operating system I/O.',
    'For CPU-bound tasks (image processing, data crunching, cryptography), use `multiprocessing` or `concurrent.futures.ProcessPoolExecutor` to spawn separate OS processes with independent GILs.',
    'In `asyncio`, cooperative multitasking runs on a SINGLE thread. If an async task executes CPU-intensive code or calls a blocking library (like `requests` or `time.sleep`), it freezes the ENTIRE application.',
    'Offload blocking synchronous functions in async apps using `await asyncio.to_thread(blocking_func, *args)`.',
    'Modern Python (3.11+) mandates Structured Concurrency with `asyncio.TaskGroup`. If any child task fails, the group cancels remaining sibling tasks and bundles errors into an `ExceptionGroup`.',
  ],
  sections: [
    {
      id: 'the-gil-demystified',
      title: '1. The GIL: What It Does and What It Doesn\'t',
      content: `CPython\'s memory manager relies on reference counting. To prevent race conditions when two threads simultaneously increment or decrement an object\'s reference count, CPython uses a global mutual exclusion lock: the **GIL**.

**Implications for Senior Engineers**:
1. **CPU-bound code on multiple threads runs SLOWER than on a single thread**, because threads waste CPU cycles fighting for GIL ownership!
2. **I/O-bound operations benefit from threads**, because when a thread calls \`socket.recv()\` or \`file.read()\`, CPython drops the GIL, allowing other threads to run while the OS waits for data.
3. **C/Rust extensions (NumPy, Polars, PyTorch)** can release the GIL entirely during heavy math operations, achieving full multi-core parallel performance!
4. *Note*: Python 3.13 introduced experimental free-threaded builds (PEP 703) to disable the GIL, but standard production distributions still run with the GIL.`,
      codeSnippet: `import time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

def cpu_heavy_task(n=20_000_000):
    count = 0
    for i in range(n):
        count += (i % 2)
    return count

# THREADS (CPU-bound: Bound by GIL -> No speedup across cores):
# with ThreadPoolExecutor(max_workers=2) as executor:
#     results = list(executor.map(cpu_heavy_task, [20_000_000, 20_000_000]))

# PROCESSES (CPU-bound: True Parallelism across separate CPU cores):
# with ProcessPoolExecutor(max_workers=2) as executor:
#     results = list(executor.map(cpu_heavy_task, [20_000_000, 20_000_000]))`,
      seniorInsight: 'Summary decision tree: CPU-bound? -> Use `ProcessPoolExecutor`. I/O-bound with blocking legacy SDKs? -> Use `ThreadPoolExecutor`. High-concurrency network I/O? -> Use `asyncio`.',
    },
    {
      id: 'asyncio-mental-model',
      title: '2. Asyncio & The Single-Threaded Event Loop',
      content: `\`asyncio\` uses cooperative multitasking. Coroutines yield control voluntarily at \`await\` expressions.

**The Golden Rule of Asyncio**:
Never block the event loop!
If you write:
\`\`\`python
async def bad_route():
    time.sleep(5)  # DISASTER: Freezes the entire server for 5 seconds!
\`\`\`
Instead:
- For async sleep: \`await asyncio.sleep(5)\`
- For unavoidable blocking third-party calls: \`await asyncio.to_thread(legacy_blocking_call)\``,
      codeSnippet: `import asyncio
import time

def slow_sync_database_call(query_id: int):
    time.sleep(0.5)  # Simulates legacy blocking driver
    return f"Result for {query_id}"

async def handle_request(req_id: int):
    print(f"Request {req_id} started")
    # Offloads slow synchronous code to worker thread pool without freezing event loop:
    data = await asyncio.to_thread(slow_sync_database_call, req_id)
    print(f"Request {req_id} finished: {data}")
    return data

async def main():
    # Run multiple concurrent handlers:
    results = await asyncio.gather(handle_request(1), handle_request(2), handle_request(3))
    print("All done:", len(results))

# asyncio.run(main())`,
      seniorInsight: '`asyncio.to_thread()` (introduced in Python 3.9) is the cleanest way to integrate synchronous libraries into an async codebase.',
    },
    {
      id: 'structured-concurrency-taskgroup',
      title: '3. Structured Concurrency: asyncio.TaskGroup (Python 3.11+)',
      content: `In early Python versions, concurrent async tasks were spawned using \`asyncio.gather()\` or \`asyncio.create_task()\`. 

The problem? **Orphaned Tasks and Leaked Exceptions**. If task A failed in \`gather()\`, task B continued running in the background, leaking memory and resources.

Python 3.11 introduced **Structured Concurrency** via \`asyncio.TaskGroup\`:
- Context manager: \`async with asyncio.TaskGroup() as tg:\`
- If ANY child task raises an exception, the remaining tasks are automatically **cancelled**.
- The \`async with\` block guarantees that all tasks are finished or cancelled before exiting.
- Exceptions from all tasks are collected and raised as an \`ExceptionGroup\`.`,
      codeSnippet: `import asyncio

async def fetch_pricing(sku: str):
    await asyncio.sleep(0.1)
    return {"sku": sku, "price": 49.99}

async def fetch_inventory(sku: str):
    await asyncio.sleep(0.1)
    return {"sku": sku, "in_stock": 12}

async def load_product_data(sku: str):
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(fetch_pricing(sku))
        t2 = tg.create_task(fetch_inventory(sku))
    
    # Both tasks are guaranteed complete here:
    return {**t1.result(), **t2.result()}

# asyncio.run(load_product_data("SKU-99"))`,
      seniorInsight: 'Never use `asyncio.gather` for newly written code. `TaskGroup` is safer, cleaner, and prevents leaked tasks in production.',
    },
    {
      id: 'concurrency-throttling-semaphore',
      title: '4. Throttling Concurrency with asyncio.Semaphore',
      content: `Spawning 5,000 async requests concurrently will crush upstream APIs or exhaust local file descriptors, causing \`OSError: [Errno 24] Too many open files\`.

Use \`asyncio.Semaphore(N)\` to bound the maximum number of concurrent tasks.`,
      codeSnippet: `import asyncio

async def bounded_worker(semaphore, item_id):
    async with semaphore:
        # At most 5 workers can enter this block concurrently:
        print(f"Processing item {item_id}...")
        await asyncio.sleep(0.2)
        return f"Done {item_id}"

async def process_batch(items):
    sem = asyncio.Semaphore(5)  # Limit concurrency to 5
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(bounded_worker(sem, i)) for i in items]
    return [t.result() for t in tasks]`,
      seniorInsight: 'Always wrap external API scraping or webhook dispatch in a Semaphore to prevent self-inflicted Denial of Service.',
    },
  ],
  codeExamples: [
    {
      title: 'Simulating Event Loop Execution & Yielding',
      description: 'Understanding how async coroutines interleave cooperatively.',
      pythonCode: `import asyncio

async def worker(name: str, delay: float):
    print(f"[{name}] Starting...")
    await asyncio.sleep(delay)
    print(f"[{name}] Done after {delay}s!")
    return name

async def run_simulation():
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(worker("Fast Task", 0.05))
        t2 = tg.create_task(worker("Medium Task", 0.10))
    print("Tasks completed:", [t1.result(), t2.result()])

asyncio.run(run_simulation())`,
      runnable: true,
      expectedOutput: `[Fast Task] Starting...
[Medium Task] Starting...
[Fast Task] Done after 0.05s!
[Medium Task] Done after 0.1s!
Tasks completed: ['Fast Task', 'Medium Task']`,
    },
    {
      title: 'Multiprocessing vs Threading Decision Matrix',
      description: 'Practical decision guide for Python concurrency models.',
      pythonCode: `def get_concurrency_recommendation(task_type: str, count: int) -> str:
    match task_type:
        case "cpu_intensive":
            return f"Use ProcessPoolExecutor (CPUs) with {min(count, 8)} processes to bypass the GIL."
        case "network_io" if count > 500:
            return f"Use asyncio (TaskGroup) for {count} high-concurrency lightweight I/O sockets."
        case "network_io" | "disk_io":
            return f"Use ThreadPoolExecutor with {min(count, 32)} threads (GIL is dropped during OS I/O)."
        case _:
            return "Profile before optimizing!"

print(get_concurrency_recommendation("cpu_intensive", 16))
print(get_concurrency_recommendation("network_io", 2000))
print(get_concurrency_recommendation("disk_io", 20))`,
      runnable: true,
      expectedOutput: `Use ProcessPoolExecutor (CPUs) with 8 processes to bypass the GIL.
Use asyncio (TaskGroup) for 2000 high-concurrency lightweight I/O sockets.
Use ThreadPoolExecutor with 20 threads (GIL is dropped during OS I/O).`,
    },
  ],
  quiz: [
    {
      id: 'd13-q1',
      question: 'What is the Global Interpreter Lock (GIL) in CPython?',
      options: [
        'A database lock that protects SQLite databases from deadlocks.',
        'A mutex that ensures only one operating system thread can execute Python bytecode at any given moment, preventing race conditions in CPython\'s reference counting memory manager.',
        'A hardware instruction on Intel and ARM CPUs.',
        'A security lock that encrypts Python scripts at rest.',
      ],
      correctIndex: 1,
      explanation: 'The GIL is a mutex in CPython that prevents multiple native threads from executing Python bytecode at the same time. While this makes single-threaded code fast and C-extension memory management simple, it means multi-threaded CPU-bound code cannot utilize multiple CPU cores in parallel.',
      seniorTrap: 'Coming from C# or Java where threads run across all available CPU cores, senior engineers are frequently surprised that Python threads cannot parallelize pure Python CPU algorithms.',
    },
    {
      id: 'd13-q2',
      question: 'Under which scenario DO Python threads (`threading.Thread` or `ThreadPoolExecutor`) provide effective concurrency?',
      options: [
        'Calculating millions of prime numbers in pure Python.',
        'I/O-bound tasks (network HTTP calls, database reads, file I/O) where CPython releases the GIL while waiting on the operating system kernel.',
        'Compiling regular expressions in a tight loop.',
        'Sorting large Python lists of integers.',
      ],
      correctIndex: 1,
      explanation: 'When a Python thread executes system I/O (like reading from a socket or waiting on disk), CPython drops the GIL before making the system call and reacquires it when data arrives. This allows other Python threads to execute concurrently while the first thread is waiting.',
      seniorTrap: 'Threads are not useless in Python—they are great for I/O-bound concurrency when working with synchronous legacy libraries.',
    },
    {
      id: 'd13-q3',
      question: 'What mechanism should you use in Python to achieve true multi-core parallel computation for CPU-intensive calculations?',
      options: [
        '`asyncio.gather()`',
        '`concurrent.futures.ProcessPoolExecutor` or the `multiprocessing` module, which spawn separate OS processes with independent GILs.',
        '`threading.Thread` with `daemon=True`',
        '`collections.deque`',
      ],
      correctIndex: 1,
      explanation: 'Because each Python process has its own private memory space and its own independent GIL, spawning multiple processes via `ProcessPoolExecutor` allows you to utilize 100% of all CPU cores simultaneously.',
      seniorTrap: 'Process communication involves IPC and serialization (pickling) overhead, so pass large batches of work rather than millions of tiny function calls.',
    },
    {
      id: 'd13-q4',
      question: 'What happens if you execute a blocking synchronous function like `time.sleep(10)` or a slow `requests.get()` inside an `async def` function in an asyncio application?',
      options: [
        'Asyncio moves it to a background thread automatically.',
        'It freezes the entire single-threaded event loop for 10 seconds, stopping ALL concurrent requests and tasks across the whole application process.',
        'It raises an `AsyncBlockedException`.',
        'It terminates the program immediately.',
      ],
      correctIndex: 1,
      explanation: '`asyncio` is single-threaded cooperative multitasking. The event loop cannot switch tasks unless an `await` on an async primitive yields control. Calling a blocking function halts the thread, freezing all other concurrent coroutines.',
      seniorTrap: 'This is the #1 performance bug in FastAPI and asyncio servers: accidental blocking I/O calls freezing the event loop.',
    },
    {
      id: 'd13-q5',
      question: 'How should you execute a legacy blocking synchronous function from within an `async def` function without freezing the asyncio event loop?',
      options: [
        '`result = sync_function()`',
        '`result = await asyncio.to_thread(sync_function, *args)`',
        '`result = yield sync_function()`',
        '`result = async sync_function()`',
      ],
      correctIndex: 1,
      explanation: '`asyncio.to_thread()` (available since Python 3.9) offloads the synchronous function call to a separate worker thread from an internal thread pool and awaits the result asynchronously, leaving the event loop thread free to handle other traffic.',
      seniorTrap: 'This is the clean, idiomatic bridge between synchronous and asynchronous code in modern Python.',
    },
    {
      id: 'd13-q6',
      question: 'What is the key advantage of `asyncio.TaskGroup` (Python 3.11+) over `asyncio.gather()` for structured concurrency?',
      options: [
        '`TaskGroup` requires less memory than `gather`.',
        'If any task inside a `TaskGroup` raises an exception, the remaining sibling tasks are automatically cancelled immediately, preventing orphaned background tasks from leaking.',
        '`TaskGroup` disables the GIL.',
        '`TaskGroup` runs tasks on the GPU.',
      ],
      correctIndex: 1,
      explanation: '`asyncio.TaskGroup` implements Structured Concurrency. It guarantees that when the `async with` block exits, all tasks are either finished or cancelled. If any task crashes, it cancels siblings and wraps all raised exceptions into an `ExceptionGroup`.',
      seniorTrap: 'With legacy `asyncio.gather()`, if one task failed, the remaining tasks continued running as unmanaged zombies.',
    },
    {
      id: 'd13-q7',
      question: 'What is the purpose of `asyncio.Semaphore(10)` in an async scraper or API client?',
      options: [
        'It limits memory consumption to 10 MB.',
        'It limits the maximum number of concurrent tasks entering the critical section to 10 at any one time, preventing socket exhaustion or triggering rate limits.',
        'It retries failing tasks up to 10 times.',
        'It sets the timeout to 10 seconds.',
      ],
      correctIndex: 1,
      explanation: 'A Semaphore maintains an internal counter. If set to 10, up to 10 tasks can acquire it simultaneously. The 11th task will wait until an earlier task releases the semaphore. This provides clean rate-limiting and connection bounding.',
      seniorTrap: 'Firing thousands of async tasks without a semaphore can trigger OS socket limits (`Errno 24: Too many open files`) or get your IP banned by remote servers.',
    },
    {
      id: 'd13-q8',
      question: 'In Python 3.11+, how are multiple concurrent exceptions raised within a `TaskGroup` represented?',
      options: [
        'Only the first exception is raised; the rest are discarded.',
        'They are bundled into an `ExceptionGroup` (or `BaseExceptionGroup`), which can be inspected or caught using the `except*` syntax.',
        'They are converted into a list of strings.',
        'The process terminates with a segmentation fault.',
      ],
      correctIndex: 1,
      explanation: 'Python 3.11 introduced `ExceptionGroup` (PEP 654) and the `except*` pattern to catch and handle multiple simultaneous exceptions that occur during concurrent execution.',
      seniorTrap: 'Notice the asterisk in `except* KeyError:`—this syntax specifically matches and unpacks exception groups.',
    },
  ],
};
