/**
 * A fetch result that cannot be misread. The previous shape kept data and an
 * `isLoading` flag side by side, which let a failed request fall through to the
 * same empty array as a genuinely empty response — so "the server is down" and
 * "you have no executions yet" rendered identically. Encoding the three states
 * as a union makes that collapse unrepresentable.
 */
export type Async<T> =
  | { kind: 'loading' }
  | { kind: 'ready'; data: T }
  | { kind: 'error'; message: string };
