// Pyodide loader and runner for in-browser Python execution

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched?: (text: string) => void }) => void;
  setStderr: (options: { batched?: (text: string) => void }) => void;
  loadPackage: (packages: string | string[]) => Promise<void>;
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInterface>;
    pyodideInstance?: PyodideInterface;
  }
}

let pyodidePromise: Promise<PyodideInterface> | null = null;

export async function getPyodide(): Promise<PyodideInterface> {
  if (window.pyodideInstance) {
    return window.pyodideInstance;
  }

  if (pyodidePromise) {
    return pyodidePromise;
  }

  pyodidePromise = new Promise((resolve, reject) => {
    // Check if script is already present
    const existingScript = document.querySelector('script[src*="pyodide"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
      script.async = true;
      script.onload = async () => {
        try {
          if (!window.loadPyodide) {
            throw new Error('Pyodide script loaded but window.loadPyodide is not defined');
          }
          const pyodide = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
          });
          window.pyodideInstance = pyodide;
          resolve(pyodide);
        } catch (err) {
          pyodidePromise = null;
          reject(err);
        }
      };
      script.onerror = () => {
        pyodidePromise = null;
        reject(new Error('Failed to load Pyodide from CDN (check internet connection).'));
      };
      document.body.appendChild(script);
    } else {
      // Script tag exists, wait for window.loadPyodide
      const checkInterval = setInterval(async () => {
        if (window.loadPyodide) {
          clearInterval(checkInterval);
          try {
            const pyodide = await window.loadPyodide({
              indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
            });
            window.pyodideInstance = pyodide;
            resolve(pyodide);
          } catch (e) {
            pyodidePromise = null;
            reject(e);
          }
        }
      }, 100);
    }
  });

  return pyodidePromise;
}

export async function runPythonCode(
  code: string,
  onOutput: (text: string) => void
): Promise<{ success: boolean; result?: string; executionTimeMs: number }> {
  const startTime = performance.now();
  let capturedOutput = '';

  try {
    const pyodide = await getPyodide();

    // Setup stdout and stderr redirection
    const redirectCode = `
import sys
import io

class OutputCapture:
    def __init__(self):
        self.buffer = io.StringIO()
    def write(self, s):
        self.buffer.write(s)
    def flush(self):
        pass
    def getvalue(self):
        return self.buffer.getvalue()

__sys_stdout_orig = sys.stdout
__sys_stderr_orig = sys.stderr
__captured_out = OutputCapture()
sys.stdout = __captured_out
sys.stderr = __captured_out
`;
    await pyodide.runPythonAsync(redirectCode);

    let evalResult: unknown;
    try {
      evalResult = await pyodide.runPythonAsync(code);
    } finally {
      // Restore stdout and get output
      const restoreCode = `
sys.stdout = __sys_stdout_orig
sys.stderr = __sys_stderr_orig
__captured_out.getvalue()
`;
      const outputText = (await pyodide.runPythonAsync(restoreCode)) as string;
      capturedOutput = outputText || '';
    }

    const duration = Math.round(performance.now() - startTime);

    if (capturedOutput) {
      onOutput(capturedOutput);
    } else if (evalResult !== undefined && evalResult !== null) {
      onOutput(String(evalResult));
    } else {
      onOutput('(Code executed successfully with no output)');
    }

    return {
      success: true,
      result: capturedOutput,
      executionTimeMs: duration,
    };
  } catch (error: unknown) {
    const duration = Math.round(performance.now() - startTime);
    const errMessage = error instanceof Error ? error.message : String(error);
    onOutput(`Error:\n${errMessage}`);
    return {
      success: false,
      result: errMessage,
      executionTimeMs: duration,
    };
  }
}
