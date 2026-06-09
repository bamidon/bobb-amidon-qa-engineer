/**
 * Custom Playwright reporter that emits one JSON line per event to stdout.
 * The test runner server reads these lines and forwards them as SSE to the dashboard.
 */
export default class StreamingReporter {
  constructor() {
    this._passed = 0;
    this._failed = 0;
    this._skipped = 0;
  }

  onBegin(_config, suite) {
    this._emit({ event: 'begin', total: suite.allTests().length });
  }

  onTestEnd(test, result) {
    if (result.status === 'passed') this._passed++;
    else if (result.status === 'failed') this._failed++;
    else this._skipped++;

    this._emit({
      event: 'testEnd',
      title: test.title,
      suite: test.titlePath().filter(Boolean).slice(1, -1).join(' › '),
      status: result.status,
      duration: result.duration,
      error: result.error?.message?.split('\n')[0] ?? null,
    });
  }

  onEnd(result) {
    this._emit({
      event: 'end',
      status: result.status,
      passed: this._passed,
      failed: this._failed,
      skipped: this._skipped,
    });
  }

  _emit(data) {
    process.stdout.write(JSON.stringify(data) + '\n');
  }
}
