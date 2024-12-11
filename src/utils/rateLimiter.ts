interface RateLimiterConfig {
  requestsPerMinute: number;
  concurrentRequests: number;
}

export class RateLimiter {
  private requestsPerMinute: number;
  private concurrentRequests: number;
  private requestQueue: Array<() => void> = [];
  private activeRequests: number = 0;
  private requestTimestamps: number[] = [];

  constructor(config: RateLimiterConfig) {
    this.requestsPerMinute = config.requestsPerMinute;
    this.concurrentRequests = config.concurrentRequests;
  }

  private cleanupOldTimestamps() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => timestamp > oneMinuteAgo
    );
  }

  private processQueue() {
    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.concurrentRequests &&
      this.requestTimestamps.length < this.requestsPerMinute
    ) {
      const resolve = this.requestQueue.shift();
      if (resolve) {
        this.activeRequests++;
        this.requestTimestamps.push(Date.now());
        resolve();
      }
    }
  }

  async acquire(): Promise<void> {
    this.cleanupOldTimestamps();

    if (
      this.activeRequests < this.concurrentRequests &&
      this.requestTimestamps.length < this.requestsPerMinute
    ) {
      this.activeRequests++;
      this.requestTimestamps.push(Date.now());
      return;
    }

    return new Promise<void>(resolve => {
      this.requestQueue.push(resolve);
      setTimeout(() => this.processQueue(), 1000);
    });
  }

  release(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.processQueue();
  }
}
