/**
 * System Metrics & Telemetry Collector
 */
class MetricsRegistry {
  constructor() {
    this.counters = {
      pdfExports: 0,
      atsAnalyses: 0,
      translations: 0,
      totalRequests: 0,
      failedRequests: 0
    };

    this.latencies = {
      pdfExportMs: [],
      aiInferenceMs: [],
      httpRequestsMs: []
    };

    this.startTime = Date.now();
  }

  increment(metricName, value = 1) {
    if (this.counters[metricName] !== undefined) {
      this.counters[metricName] += value;
    }
  }

  recordLatency(metricName, durationMs) {
    if (!this.latencies[metricName]) {
      this.latencies[metricName] = [];
    }
    this.latencies[metricName].push(durationMs);
    // Keep last 100 samples
    if (this.latencies[metricName].length > 100) {
      this.latencies[metricName].shift();
    }
  }

  getAverageLatency(metricName) {
    const list = this.latencies[metricName] || [];
    if (list.length === 0) return 0;
    const sum = list.reduce((a, b) => a + b, 0);
    return Math.round(sum / list.length);
  }

  getSnapshot() {
    const mem = process.memoryUsage();
    return {
      uptimeSeconds: Math.round((Date.now() - this.startTime) / 1000),
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100
      },
      counters: { ...this.counters },
      latencies: {
        avgPdfExportMs: this.getAverageLatency('pdfExportMs'),
        avgAiInferenceMs: this.getAverageLatency('aiInferenceMs'),
        avgHttpRequestMs: this.getAverageLatency('httpRequestsMs')
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new MetricsRegistry();
