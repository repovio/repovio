/** Serialize related reads while retaining each caller's completion and rejection. */
export function createReadQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  /** Run one operation after preceding reads settle, including failures. */
  function run<T>(operation: () => Promise<T>): Promise<T> {
    const result = tail.then(operation);
    tail = result.catch(/** Keep later operations usable after a failed read. */ () => undefined);
    return result;
  }
  return run;
}
