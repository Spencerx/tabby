import { Univariate } from "stats-logscale";

export type CompletionTriggerEntry = {
  triggerMode: "auto" | "manual";
};

export type CompletionStatisticsEntry = {
  latency?: number; // ms, undefined means no data, timeout or canceled
  canceled?: boolean;
  timeout?: boolean;
};

export class CompletionStatisticsTracker {
  private autoCompletionCount = 0;
  private manualCompletionCount = 0;

  private eventMap = new Map<string, number>();

  private completionRequestLatencyStats = new Univariate();
  private completionRequestCanceledCount = 0;
  private completionRequestTimeoutCount = 0;

  addTriggerEntry(value: CompletionTriggerEntry): void {
    const { triggerMode } = value;
    if (triggerMode === "auto") {
      this.autoCompletionCount += 1;
    } else {
      this.manualCompletionCount += 1;
    }
  }

  addStatisticsEntry(value: CompletionStatisticsEntry): void {
    const { canceled, timeout, latency } = value;
    if (canceled) {
      this.completionRequestCanceledCount += 1;
    } else if (timeout) {
      this.completionRequestTimeoutCount += 1;
    } else if (latency !== undefined) {
      this.completionRequestLatencyStats.add(latency);
    }
  }

  addEvent(event: string): void {
    const count = this.eventMap.get(event) || 0;
    this.eventMap.set(event, count + 1);
  }

  reset(): void {
    this.autoCompletionCount = 0;
    this.manualCompletionCount = 0;

    this.eventMap = new Map<string, number>();

    this.completionRequestLatencyStats = new Univariate();
    this.completionRequestCanceledCount = 0;
    this.completionRequestTimeoutCount = 0;
  }

  // stats for anonymous usage report
  report(): Record<string, any> {
    const eventCount = Object.fromEntries(
      Array.from(this.eventMap.entries()).map(([key, value]) => ["count_" + key, value]),
    );
    return {
      completion: {
        count_auto: this.autoCompletionCount,
        count_manual: this.manualCompletionCount,
        ...eventCount,
      },
      completion_request: {
        count: this.completionRequestLatencyStats.count(),
        latency_avg: this.completionRequestLatencyStats.mean(),
        latency_p50: this.completionRequestLatencyStats.percentile(50),
        latency_p95: this.completionRequestLatencyStats.percentile(95),
        latency_p99: this.completionRequestLatencyStats.percentile(99),
      },
      completion_request_canceled: {
        count: this.completionRequestCanceledCount,
      },
      completion_request_timeout: {
        count: this.completionRequestTimeoutCount,
      },
    };
  }
}
