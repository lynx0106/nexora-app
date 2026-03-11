/**
 * Lightweight in-memory circuit breaker for external API calls.
 * Prevents cascading failures when OpenAI, MercadoPago, etc. are unavailable.
 *
 * States: CLOSED (normal) -> OPEN (fail fast) -> HALF_OPEN (probe)
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /** Failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Ms to wait before half-open probe (default: 30000) */
  resetTimeout?: number;
  /** Sliding window size for failure rate (default: 10) */
  windowSize?: number;
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeout: 30000,
  windowSize: 10,
};

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: number[] = [];
  private lastFailureTime = 0;
  private readonly opts: Required<CircuitBreakerOptions>;
  private readonly name: string;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.opts = { ...DEFAULT_OPTIONS, ...options };
  }

  getState(): CircuitState {
    this.maybeTransition();
    return this.state;
  }

  /** Execute fn with circuit protection. Throws when OPEN. */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.maybeTransition();

    if (this.state === 'OPEN') {
      throw new Error(
        `Circuit breaker [${this.name}] is OPEN. External service temporarily unavailable.`,
      );
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = [];
      }
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    const now = Date.now();
    this.failures.push(now);
    this.lastFailureTime = now;

    // Keep sliding window
    const cutoff = now - this.opts.resetTimeout * 2;
    this.failures = this.failures.filter((t) => t > cutoff);

    if (this.failures.length >= this.opts.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  private maybeTransition(): void {
    if (this.state !== 'OPEN') return;

    const elapsed = Date.now() - this.lastFailureTime;
    if (elapsed >= this.opts.resetTimeout) {
      this.state = 'HALF_OPEN';
    }
  }
}

/** Shared breakers by service name (singleton per service) */
const breakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(
  name: string,
  options?: CircuitBreakerOptions,
): CircuitBreaker {
  let b = breakers.get(name);
  if (!b) {
    b = new CircuitBreaker(name, options);
    breakers.set(name, b);
  }
  return b;
}
