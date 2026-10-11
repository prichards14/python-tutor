import type { Lesson } from '../../types';

export const day11: Lesson = {
  day: 11,
  title: 'Consuming Web APIs: HTTPX, Requests & Resilience',
  subtitle: 'Synchronous vs Async HTTP, Connection Pooling, Timeouts, Retries, and Pagination',
  estimatedMinutes: 45,
  category: 'api',
  seniorBridge: {
    csharp: 'In C#, `HttpClient` must be reused as a singleton/injected service to avoid TCP socket exhaustion. In Python, creating fresh `requests.get()` calls in a loop has the exact same problem: you must use `requests.Session()` or `httpx.Client()`/`AsyncClient()` with a context manager for connection pooling.',
    c_modula2: 'In C, communicating over HTTP requires low-level socket programming or `libcurl`. Python\'s `httpx` abstracts TLS, HTTP/1.1 and HTTP/2, DNS resolution, and streaming with high-level context managers.',
    javascript: 'Python\'s `httpx.AsyncClient()` is like browser `fetch()` combined with an `AbortController` and connection pool. `response.json()` parses payloads directly, and `response.raise_for_status()` throws on 4xx/5xx responses like Axios.',
    c64_basic: 'No RS-232 modem Hayes AT commands. Python provides modern SSL-encrypted HTTP client libraries.',
  },
  overview: `Consuming web APIs in enterprise systems requires more than simple ` + '`requests.get()`' + ` calls. Senior engineers know that un-pooled HTTP requests exhaust socket file descriptors, requests without explicit timeouts can hang worker processes indefinitely, and unhandled transient 503 errors cause avoidable service downtime. This lesson covers modern ` + '`httpx`' + `, connection pooling, exponential backoff retries, and clean paginated stream generators.`,
  keyTakeaways: [
    'Never call `requests.get()` or `httpx.get()` in a loop. Always use a Session (`requests.Session()` or `httpx.Client()`) to reuse TCP connections and TLS handshakes.',
    'THE CARDINAL RULE: NEVER make an HTTP request without an explicit `timeout`. Python\'s `requests` library defaults to NO TIMEOUT (`timeout=None`), meaning a dropped packet can freeze your application thread forever!',
    'Modern standard: `httpx` provides the same API as `requests`, but adds full `async`/`await` support (`httpx.AsyncClient`) and HTTP/2.',
    'Always call `response.raise_for_status()` to turn 4xx and 5xx HTTP error responses into catchable exceptions.',
    'Implement exponential backoff with jitter for transient errors (429 Rate Limited, 502 Bad Gateway, 503 Service Unavailable). The `tenacity` library is the Python production standard.',
    'Use generator functions to encapsulate cursor or page-based pagination so consumers can stream records seamlessly.',
  ],
  sections: [
    {
      id: 'requests-vs-httpx',
      title: '1. Synchronous vs Asynchronous HTTP: requests vs httpx',
      content: `For a decade, the \`requests\` library was Python\'s undisputed standard. However, \`requests\` is strictly synchronous and blocking.

**Enter \`httpx\`**:
\`httpx\` is the next-generation HTTP client for Python:
- Features 100% API parity with \`requests\` for synchronous calls: \`httpx.get(url)\`.
- First-class \`asyncio\` support: \`await client.get(url)\`.
- HTTP/2 support out of the box.
- Strict default timeouts (unlike \`requests\`, \`httpx\` defaults to a 5-second timeout rather than hanging indefinitely).`,
      codeSnippet: `import httpx

# Synchronous with Client:
with httpx.Client(timeout=10.0) as client:
    resp = client.get("https://httpbin.org/json")
    resp.raise_for_status()
    data = resp.json()
    print("Sync response keys:", list(data.keys()))

# Asynchronous with AsyncClient:
# async with httpx.AsyncClient(timeout=10.0) as client:
#     resp = await client.get("https://httpbin.org/json")
#     data = resp.json()`,
      seniorInsight: 'If you are building an async service (like FastAPI), never use `requests` inside your async routes! `requests` blocks the entire asyncio event loop thread. Always use `httpx.AsyncClient`.',
    },
    {
      id: 'connection-pooling-and-timeouts',
      title: '2. Connection Pooling & The Timeout Imperative',
      content: `Calling \`httpx.get(url)\` directly opens a new TCP connection, negotiates TLS, performs the request, and closes the connection. In high-throughput workflows, this wastes CPU and leads to socket port exhaustion (TIME_WAIT socket buildup).

**The Session / Client Pattern**:
Always reuse an \`httpx.Client()\` or \`requests.Session()\`:
- Maintains an underlying connection pool (via \`urllib3\` / \`httpcore\`).
- Reuses TLS sessions.
- Persists headers, cookies, and authentication.

**The Timeout Discipline**:
Always pass a timeout tuple or float:
\`timeout=httpx.Timeout(10.0, connect=3.0)\` (10s overall, 3s to connect).`,
      codeSnippet: `import httpx

# Senior Production Configuration:
client = httpx.Client(
    base_url="https://api.github.com",
    headers={"Accept": "application/vnd.github.v3+json", "User-Agent": "MyDataApp/1.0"},
    timeout=httpx.Timeout(timeout=10.0, connect=3.0),
    limits=httpx.Limits(max_keepalive_connections=20, max_connections=100),
)

try:
    response = client.get("/zen")
    response.raise_for_status()
    print("GitHub Zen:", response.text)
finally:
    client.close()`,
      seniorInsight: 'In microservices, setting aggressive connect timeouts (e.g. 1-2 seconds) prevents cascading failures when downstream dependencies are unreachable.',
    },
    {
      id: 'resilience-and-retries',
      title: '3. Resilience: Retries & Exponential Backoff',
      content: `Network calls fail. Transient network blips, TCP resets, rate limits (HTTP 429), and gateway errors (HTTP 502/503/504) should be retried automatically with **Exponential Backoff and Jitter**.

In Python, the industry standard for retry logic is the \`tenacity\` library. It uses clean decorators that preserve function signatures and handle specific exception types.`,
      codeSnippet: `# Conceptual retry with exponential backoff:
import time
import random

def call_with_retry(api_func, max_retries=3, base_delay=1.0):
    for attempt in range(1, max_retries + 1):
        try:
            return api_func()
        except (httpx.ConnectError, httpx.HTTPStatusError) as e:
            if attempt == max_retries:
                raise
            # Exponential backoff + full jitter:
            sleep_time = (base_delay * (2 ** (attempt - 1))) + random.uniform(0, 0.5)
            print(f"Call failed ({e}). Retrying in {sleep_time:.2f}s...")
            time.sleep(sleep_time)

# With tenacity library in production:
# from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
# @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
# def fetch_data(): ...`,
      seniorInsight: 'Never retry HTTP 4xx client errors (400 Bad Request, 401 Unauthorized, 404 Not Found)—those indicate bugs or invalid credentials that retries will never fix.',
    },
    {
      id: 'pagination-generators',
      title: '4. Encapsulating Pagination with Generators',
      content: `Web APIs rarely return all data at once. They paginate using page numbers, offset/limit, or cursors.

Senior design pattern: **Encapsulate pagination logic in a generator function**. The caller simply iterates over the generator as if it were a local stream of objects; the generator fetches pages behind the scenes only when needed!`,
      codeSnippet: `def paginate_api_records(client, endpoint: str):
    """Yields individual records across paginated endpoints transparently."""
    page = 1
    while True:
        resp = client.get(f"{endpoint}?page={page}")
        resp.raise_for_status()
        payload = resp.json()
        
        records = payload.get("data", [])
        if not records:
            break
            
        for item in records:
            yield item
            
        if not payload.get("has_next_page"):
            break
        page += 1

# Caller code stays clean and decoupled from HTTP details:
# for user in paginate_api_records(client, "/api/v1/users"):
#     process_user(user)`,
      seniorInsight: 'This pattern enables streaming memory usage: even if the API contains 500,000 records across 5,000 pages, the caller processes one record at a time with low RAM overhead.',
    },
  ],
  codeExamples: [
    {
      title: 'Streaming Large Downloads with Chunked Transfer',
      description: 'Streaming a response directly without buffering the entire body into memory.',
      pythonCode: `import io

mock_response_chunks = [b'{"chunk": 1}\\n', b'{"chunk": 2}\\n', b'{"chunk": 3}\\n']

def stream_mock_download():
    # Simulates httpx.Client.stream("GET", url)
    for chunk in mock_response_chunks:
        yield chunk

downloaded_bytes = 0
for data_chunk in stream_mock_download():
    downloaded_bytes += len(data_chunk)
    print(f"Received {len(data_chunk)} bytes: {data_chunk.decode('utf-8').strip()}")

print(f"Total downloaded: {downloaded_bytes} bytes")`,
      runnable: true,
      expectedOutput: `Received 13 bytes: {"chunk": 1}
Received 13 bytes: {"chunk": 2}
Received 13 bytes: {"chunk": 3}
Total downloaded: 39 bytes`,
    },
    {
      title: 'Robust API Error Handling with Custom Exceptions',
      description: 'Translating raw HTTP status codes into domain-specific exceptions.',
      pythonCode: `class APIError(Exception): pass
class ResourceNotFoundError(APIError): pass
class RateLimitExceededError(APIError): pass

def handle_http_status(status_code: int, url: str):
    if status_code == 200:
        return {"status": "ok"}
    elif status_code == 404:
        raise ResourceNotFoundError(f"Endpoint not found: {url}")
    elif status_code == 429:
        raise RateLimitExceededError(f"Rate limited by {url}")
    else:
        raise APIError(f"HTTP error {status_code} on {url}")

try:
    handle_http_status(429, "https://api.co/v1/metrics")
except RateLimitExceededError as e:
    print("Caught rate limit alert:", e)`,
      runnable: true,
      expectedOutput: `Caught rate limit alert: Rate limited by https://api.co/v1/metrics`,
    },
  ],
  quiz: [
    {
      id: 'd11-q1',
      question: 'What is the dangerous default behavior regarding timeouts in Python\'s `requests` library if you omit the `timeout` parameter?',
      options: [
        'It defaults to a safe 30-second timeout.',
        'It defaults to `timeout=None`, meaning the request will wait indefinitely for a connection or response, potentially freezing application threads forever.',
        'It raises a `ValueError` requiring a timeout.',
        'It defaults to the operating system\'s socket timeout of 60 seconds.',
      ],
      correctIndex: 1,
      explanation: 'In the `requests` library, the default timeout is `None`. If the remote server stops responding or a network firewall drops the connection silently without a TCP FIN/RST packet, the Python thread hangs forever. Always pass explicit `timeout` values in production.',
      seniorTrap: 'This is one of the most common causes of worker pool starvation in production Python backends.',
    },
    {
      id: 'd11-q2',
      question: 'Why should you reuse a `requests.Session()` or `httpx.Client()` instance across multiple requests rather than calling `requests.get()` repeatedly in a loop?',
      options: [
        'Because `requests.get()` requires superuser permissions.',
        'A Session/Client reuses the underlying TCP connection and TLS handshake via connection pooling, avoiding socket exhaustion (TIME_WAIT) and cutting network latency.',
        'Because `requests.get()` only works once per program run.',
        'Because Sessions automatically encrypt the Python code.',
      ],
      correctIndex: 1,
      explanation: 'Reusing a Session/Client keeps TCP connections open in a pool. Consecutive requests to the same host reuse existing sockets, skipping the 3-way TCP handshake and expensive TLS negotiation, cutting latency by 70%+ and avoiding port exhaustion.',
      seniorTrap: 'C# developers familiar with `IHttpClientFactory` will recognize this exact socket-exhaustion anti-pattern.',
    },
    {
      id: 'd11-q3',
      question: 'Why should you NOT use the standard `requests` library inside an async route handler in a FastAPI or Starlette application?',
      options: [
        '`requests` does not support JSON.',
        '`requests` is synchronous and blocking; executing it in an async function blocks the entire single-threaded `asyncio` event loop, freezing all concurrent requests handled by that worker process.',
        'FastAPI will reject the route at compile time.',
        '`requests` only runs on Windows.',
      ],
      correctIndex: 1,
      explanation: 'In an async event loop (like FastAPI or Node.js), blocking I/O halts the entire event loop thread while waiting for network responses. All other concurrent clients are stalled. In async code, use `httpx.AsyncClient` or offload synchronous calls to a thread pool via `asyncio.to_thread()`.',
      seniorTrap: 'Engineers switching between sync and async in Python frequently mix `requests` into `async def` routes, causing catastrophic concurrency bottlenecks.',
    },
    {
      id: 'd11-q4',
      question: 'What does calling `response.raise_for_status()` do on an `httpx.Response` or `requests.Response` object?',
      options: [
        'It returns the HTTP status code as an integer.',
        'It raises an HTTP error exception (`HTTPStatusError` or `HTTPError`) if the response status code is a 4xx (client error) or 5xx (server error), doing nothing if 2xx.',
        'It logs the status code to stdout.',
        'It retries the request automatically.',
      ],
      correctIndex: 1,
      explanation: 'By default, HTTP client libraries do NOT throw exceptions on 404 or 500 error responses—they simply return the response object. Calling `response.raise_for_status()` guarantees that failed HTTP responses trigger an exception.',
      seniorTrap: 'Forgetting `raise_for_status()` leads to bugs where code attempts to parse error HTML pages as JSON (`resp.json()`), raising confusing JSONDecodeErrors.',
    },
    {
      id: 'd11-q5',
      question: 'Which HTTP status codes should generally be candidates for automatic exponential backoff retries?',
      options: [
        '400 Bad Request and 404 Not Found',
        '401 Unauthorized and 403 Forbidden',
        'Transient errors such as 429 Too Many Requests, 502 Bad Gateway, 503 Service Unavailable, and 504 Gateway Timeout',
        'All status codes including 200 OK',
      ],
      correctIndex: 2,
      explanation: 'Retrying client errors like 400 or 401 is useless because the payload or credentials are fundamentally invalid. Transient server errors (502, 503, 504) or rate-limit throttle errors (429) represent temporary conditions where a retry with backoff is appropriate.',
      seniorTrap: 'Retrying 400 or 404 errors is a classic anti-pattern that hammers upstream servers without any chance of success.',
    },
    {
      id: 'd11-q6',
      question: 'What is the purpose of adding "jitter" (randomized delay variation) to exponential backoff algorithms?',
      options: [
        'To bypass Web Application Firewalls (WAF).',
        'To prevent the "thundering herd" problem where multiple failing clients all retry at the exact same synchronized intervals, overwhelming the recovering server.',
        'To speed up network packet delivery.',
        'To reduce local CPU utilization.',
      ],
      correctIndex: 1,
      explanation: 'Without jitter, when an upstream server recovers from an outage, all waiting clients retry simultaneously at identical exponential intervals ($2s, 4s, 8s$), repeatedly re-crashing the server. Adding random jitter desynchronizes the retries.',
      seniorTrap: 'A well-known reliability engineering principle across AWS, Microsoft, and Google distributed systems.',
    },
    {
      id: 'd11-q7',
      question: 'How does `client.stream("GET", url)` in `httpx` help when downloading large multi-gigabyte files?',
      options: [
        'It splits the download across multiple torrent peers.',
        'It downloads the response body incrementally in chunks via an iterator without loading the entire file into RAM at once.',
        'It compresses the file on the remote server.',
        'It caches the file permanently in local browser storage.',
      ],
      correctIndex: 1,
      explanation: '`client.stream()` returns a streaming response context manager. Using `for chunk in response.aiter_bytes():` (or `.iter_bytes()`), you stream chunks directly to disk or downstream consumers with minimal memory usage.',
      seniorTrap: 'Calling `client.get()` on a 5GB file will read all 5GB into Python heap memory before returning, causing an immediate OOM crash.',
    },
    {
      id: 'd11-q8',
      question: 'What pattern allows you to cleanly hide complex cursor-based pagination details from callers consuming an API?',
      options: [
        'Store all pages in a global variable.',
        'Wrap the API calls in a generator function that yields individual items one by one, fetching subsequent pages automatically when needed.',
        'Ask the user to manually pass the page number in every function call.',
        'Use recursion until Python raises RecursionError.',
      ],
      correctIndex: 1,
      explanation: 'A generator function that queries the next page and yields items one-by-one encapsulates HTTP pagination completely. The calling code simply runs `for item in stream_items():`, completely unaware of whether the items arrived in 1 page or 100 pages.',
      seniorTrap: 'This decouples business logic from HTTP transport and pagination mechanics.',
    },
  ],
};
