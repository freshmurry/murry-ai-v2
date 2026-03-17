var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// .wrangler/tmp/bundle-9MF9Rn/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
var init_strip_cf_connecting_ip_header = __esm({
  ".wrangler/tmp/bundle-9MF9Rn/strip-cf-connecting-ip-header.js"() {
    "use strict";
    __name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        return Reflect.apply(target, thisArg, [
          stripCfConnectingIPHeader.apply(null, argArray)
        ]);
      }
    });
  }
});

// node_modules/unenv/dist/runtime/_internal/utils.mjs
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
var init_utils = __esm({
  "node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name(notImplementedClass, "notImplementedClass");
  }
});

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance;
var init_performance = __esm({
  "node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry = class {
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    __name(PerformanceEntry, "PerformanceEntry");
    PerformanceMark = /* @__PURE__ */ __name(class PerformanceMark2 extends PerformanceEntry {
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    }, "PerformanceMark");
    PerformanceMeasure = class extends PerformanceEntry {
      entryType = "measure";
    };
    __name(PerformanceMeasure, "PerformanceMeasure");
    PerformanceResourceTiming = class extends PerformanceEntry {
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    __name(PerformanceResourceTiming, "PerformanceResourceTiming");
    PerformanceObserverEntryList = class {
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    };
    __name(PerformanceObserverEntryList, "PerformanceObserverEntryList");
    Performance = class {
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw createNotImplementedError("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin) {
          return _performanceNow();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
      }
      getEntriesByType(type) {
        return this._entries.filter((e) => e.entryType === type);
      }
      mark(name, options) {
        const entry = new PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw createNotImplementedError("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    };
    __name(Performance, "Performance");
    PerformanceObserver = class {
      __unenv__ = true;
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw createNotImplementedError("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    };
    __name(PerformanceObserver, "PerformanceObserver");
    __publicField(PerformanceObserver, "supportedEntryTypes", []);
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default;
var init_noop = __esm({
  "node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";
var _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console, _times, _stdoutErrorHandler, _stderrErrorHandler;
var init_console = __esm({
  "node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole, assert, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, console_default;
var init_console2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
      debug: debug2,
      dir: dir2,
      dirxml: dirxml2,
      error: error2,
      group: group2,
      groupCollapsed: groupCollapsed2,
      groupEnd: groupEnd2,
      info: info2,
      log: log2,
      profile: profile2,
      profileEnd: profileEnd2,
      table: table2,
      time: time2,
      timeEnd: timeEnd2,
      timeLog: timeLog2,
      timeStamp: timeStamp2,
      trace: trace2,
      warn: warn2
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
      const now2 = Date.now();
      const seconds = Math.trunc(now2 / 1e3);
      const nanos = now2 % 1e3 * 1e6;
      if (startTime) {
        let diffSeconds = seconds - startTime[0];
        let diffNanos = nanos - startTime[0];
        if (diffNanos < 0) {
          diffSeconds = diffSeconds - 1;
          diffNanos = 1e9 + diffNanos;
        }
        return [diffSeconds, diffNanos];
      }
      return [seconds, nanos];
    }, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint") });
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
import { Socket } from "node:net";
var ReadStream;
var init_read_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class extends Socket {
      fd;
      constructor(fd) {
        super();
        this.fd = fd;
      }
      isRaw = false;
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
      isTTY = false;
    };
    __name(ReadStream, "ReadStream");
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
import { Socket as Socket2 } from "node:net";
var WriteStream;
var init_write_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class extends Socket2 {
      fd;
      constructor(fd) {
        super();
        this.fd = fd;
      }
      clearLine(dir3, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env2) {
        return 1;
      }
      hasColors(count3, env2) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      columns = 80;
      rows = 24;
      isTTY = false;
    };
    __name(WriteStream, "WriteStream");
  }
});

// node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    Process = class extends EventEmitter {
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      emitWarning(warning, type, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      #stdin;
      #stdout;
      #stderr;
      get stdin() {
        return this.#stdin ??= new ReadStream(0);
      }
      get stdout() {
        return this.#stdout ??= new WriteStream(1);
      }
      get stderr() {
        return this.#stderr ??= new WriteStream(2);
      }
      #cwd = "/";
      chdir(cwd2) {
        this.#cwd = cwd2;
      }
      cwd() {
        return this.#cwd;
      }
      arch = "";
      platform = "";
      argv = [];
      argv0 = "";
      execArgv = [];
      execPath = "";
      title = "";
      pid = 200;
      ppid = 100;
      get version() {
        return "";
      }
      get versions() {
        return {};
      }
      get allowedNodeEnvironmentFlags() {
        return /* @__PURE__ */ new Set();
      }
      get sourceMapsEnabled() {
        return false;
      }
      get debugPort() {
        return 0;
      }
      get throwDeprecation() {
        return false;
      }
      get traceDeprecation() {
        return false;
      }
      get features() {
        return {};
      }
      get release() {
        return {};
      }
      get connected() {
        return false;
      }
      get config() {
        return {};
      }
      get moduleLoadList() {
        return [];
      }
      constrainedMemory() {
        return 0;
      }
      availableMemory() {
        return 0;
      }
      uptime() {
        return 0;
      }
      resourceUsage() {
        return {};
      }
      ref() {
      }
      unref() {
      }
      umask() {
        throw createNotImplementedError("process.umask");
      }
      getBuiltinModule() {
        return void 0;
      }
      getActiveResourcesInfo() {
        throw createNotImplementedError("process.getActiveResourcesInfo");
      }
      exit() {
        throw createNotImplementedError("process.exit");
      }
      reallyExit() {
        throw createNotImplementedError("process.reallyExit");
      }
      kill() {
        throw createNotImplementedError("process.kill");
      }
      abort() {
        throw createNotImplementedError("process.abort");
      }
      dlopen() {
        throw createNotImplementedError("process.dlopen");
      }
      setSourceMapsEnabled() {
        throw createNotImplementedError("process.setSourceMapsEnabled");
      }
      loadEnvFile() {
        throw createNotImplementedError("process.loadEnvFile");
      }
      disconnect() {
        throw createNotImplementedError("process.disconnect");
      }
      cpuUsage() {
        throw createNotImplementedError("process.cpuUsage");
      }
      setUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
      }
      hasUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
      }
      initgroups() {
        throw createNotImplementedError("process.initgroups");
      }
      openStdin() {
        throw createNotImplementedError("process.openStdin");
      }
      assert() {
        throw createNotImplementedError("process.assert");
      }
      binding() {
        throw createNotImplementedError("process.binding");
      }
      permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
      report = {
        directory: "",
        filename: "",
        signal: "SIGUSR2",
        compact: false,
        reportOnFatalError: false,
        reportOnSignal: false,
        reportOnUncaughtException: false,
        getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
        writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
      };
      finalization = {
        register: /* @__PURE__ */ notImplemented("process.finalization.register"),
        unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
        registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
      };
      memoryUsage = Object.assign(() => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }), { rss: () => 0 });
      mainModule = void 0;
      domain = void 0;
      send = void 0;
      exitCode = void 0;
      channel = void 0;
      getegid = void 0;
      geteuid = void 0;
      getgid = void 0;
      getgroups = void 0;
      getuid = void 0;
      setegid = void 0;
      seteuid = void 0;
      setgid = void 0;
      setgroups = void 0;
      setuid = void 0;
      _events = void 0;
      _eventsCount = void 0;
      _exiting = void 0;
      _maxListeners = void 0;
      _debugEnd = void 0;
      _debugProcess = void 0;
      _fatalException = void 0;
      _getActiveHandles = void 0;
      _getActiveRequests = void 0;
      _kill = void 0;
      _preload_modules = void 0;
      _rawDebug = void 0;
      _startProfilerIdleNotifier = void 0;
      _stopProfilerIdleNotifier = void 0;
      _tickCallback = void 0;
      _disconnect = void 0;
      _handleQueue = void 0;
      _pendingMessage = void 0;
      _channel = void 0;
      _send = void 0;
      _linkedBinding = void 0;
    };
    __name(Process, "Process");
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, exit, platform, nextTick, unenvProcess, abort, addListener, allowedNodeEnvironmentFlags, hasUncaughtExceptionCaptureCallback, setUncaughtExceptionCaptureCallback, loadEnvFile, sourceMapsEnabled, arch, argv, argv0, chdir, config, connected, constrainedMemory, availableMemory, cpuUsage, cwd, debugPort, dlopen, disconnect, emit, emitWarning, env, eventNames, execArgv, execPath, finalization, features, getActiveResourcesInfo, getMaxListeners, hrtime3, kill, listeners, listenerCount, memoryUsage, on, off, once, pid, ppid, prependListener, prependOnceListener, rawListeners, release, removeAllListeners, removeListener, report, resourceUsage, setMaxListeners, setSourceMapsEnabled, stderr, stdin, stdout, title, throwDeprecation, traceDeprecation, umask, uptime, version, versions, domain, initgroups, moduleLoadList, reallyExit, openStdin, assert2, binding, send, exitCode, channel, getegid, geteuid, getgid, getgroups, getuid, setegid, seteuid, setgid, setgroups, setuid, permission, mainModule, _events, _eventsCount, _exiting, _maxListeners, _debugEnd, _debugProcess, _fatalException, _getActiveHandles, _getActiveRequests, _kill, _preload_modules, _rawDebug, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, _disconnect, _handleQueue, _pendingMessage, _channel, _send, _linkedBinding, _process, process_default;
var init_process2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    ({ exit, platform, nextTick } = getBuiltinModule(
      "node:process"
    ));
    unenvProcess = new Process({
      env: globalProcess.env,
      hrtime,
      nextTick
    });
    ({
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      finalization,
      features,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      on,
      off,
      once,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    } = unenvProcess);
    _process = {
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exit,
      finalization,
      features,
      getBuiltinModule,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      nextTick,
      on,
      off,
      once,
      pid,
      platform,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      // @ts-expect-error old API
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    };
    process_default = _process;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// src/lib/anthropic.ts
var DEFAULT_MODEL, API_BASE, AnthropicClient;
var init_anthropic = __esm({
  "src/lib/anthropic.ts"() {
    "use strict";
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    DEFAULT_MODEL = "claude-sonnet-4-20250514";
    API_BASE = "https://api.anthropic.com/v1";
    AnthropicClient = class {
      apiKey;
      constructor(apiKey) {
        this.apiKey = apiKey;
      }
      /** Non-streaming completion */
      async complete(opts) {
        const response = await fetch(`${API_BASE}/messages`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({
            model: opts.model ?? DEFAULT_MODEL,
            max_tokens: opts.max_tokens ?? 4096,
            temperature: opts.temperature ?? 0.3,
            system: opts.system,
            messages: opts.messages,
            tools: opts.tools?.map(this.formatTool)
          })
        });
        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Anthropic API error ${response.status}: ${err}`);
        }
        return response.json();
      }
      /** Streaming completion — yields raw SSE events */
      async *stream(opts) {
        const response = await fetch(`${API_BASE}/messages`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({
            model: opts.model ?? DEFAULT_MODEL,
            max_tokens: opts.max_tokens ?? 4096,
            temperature: opts.temperature ?? 0.3,
            system: opts.system,
            messages: opts.messages,
            tools: opts.tools?.map(this.formatTool),
            stream: true
          })
        });
        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Anthropic stream error ${response.status}: ${err}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done)
            break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]")
                return;
              try {
                yield JSON.parse(data);
              } catch {
              }
            }
          }
        }
      }
      /** Simple one-shot text generation */
      async generateText(prompt, systemPrompt, maxTokens = 2048) {
        const result = await this.complete({
          messages: [{ role: "user", content: prompt }],
          system: systemPrompt,
          max_tokens: maxTokens
        });
        const textBlock = result.content.find((b) => b.type === "text");
        return textBlock && "text" in textBlock ? textBlock.text : "";
      }
      headers() {
        return {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01"
        };
      }
      formatTool(tool) {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.input_schema
        };
      }
    };
    __name(AnthropicClient, "AnthropicClient");
  }
});

// src/lib/rag.ts
var rag_exports = {};
__export(rag_exports, {
  SYSTEM_PROMPTS: () => SYSTEM_PROMPTS,
  deleteDocumentVectors: () => deleteDocumentVectors,
  executeRAG: () => executeRAG,
  generateEmbedding: () => generateEmbedding,
  generateEmbeddingsBatch: () => generateEmbeddingsBatch,
  indexChunk: () => indexChunk,
  rerankResults: () => rerankResults,
  semanticSearch: () => semanticSearch
});
async function generateEmbedding(text, env2) {
  const result = await env2.AI.run("@cf/baai/bge-base-en-v1.5", {
    text: [text.substring(0, 2048)]
    // Model has input limit
  });
  const raw = result.data ?? result.output;
  const embedding = Array.isArray(raw) ? Array.isArray(raw[0]) ? raw[0] : raw : void 0;
  if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Failed to generate embedding");
  }
  return embedding;
}
async function generateEmbeddingsBatch(texts, env2, batchSize = 10) {
  const results = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((text) => generateEmbedding(text, env2))
    );
    results.push(...batchResults);
  }
  return results;
}
async function indexChunk(vectorId, embedding, metadata, env2) {
  await env2.VECTORIZE.upsert([
    {
      id: vectorId,
      values: embedding,
      metadata
    }
  ]);
}
async function deleteDocumentVectors(chunkIds, env2) {
  if (chunkIds.length === 0)
    return;
  for (let i = 0; i < chunkIds.length; i += 100) {
    await env2.VECTORIZE.deleteByIds(chunkIds.slice(i, i + 100));
  }
}
async function semanticSearch(query, env2, options = {}) {
  const embedding = await generateEmbedding(query, env2);
  const filter = {};
  if (options.project_id)
    filter["project_id"] = options.project_id;
  const result = await env2.VECTORIZE.query(embedding, {
    topK: options.top_k ?? 20,
    filter: Object.keys(filter).length > 0 ? filter : void 0,
    returnMetadata: "all"
  });
  return (result.matches ?? []).filter((m) => m.score >= (options.score_threshold ?? 0.3)).map((m) => ({
    vector_id: m.id,
    score: m.score,
    metadata: m.metadata
  }));
}
async function rerankResults(query, candidates, client, topN = 5) {
  if (candidates.length <= topN)
    return candidates;
  const prompt = `You are a relevance ranking system. Given a query and a list of text chunks, 
rank them by how relevant they are to the query.

Query: "${query}"

Chunks (numbered 1 to ${candidates.length}):
${candidates.map((c, i) => `[${i + 1}] ${c.chunk.content.substring(0, 300)}`).join("\n\n")}

Return ONLY a JSON array of the chunk numbers in order from most to least relevant, 
selecting the top ${topN} most relevant chunks. Example: [3, 1, 5, 2, 4]`;
  try {
    const response = await client.generateText(prompt, void 0, 256);
    const match = response.match(/\[[\d,\s]+\]/);
    if (!match)
      return candidates.slice(0, topN);
    const ranking = JSON.parse(match[0]);
    return ranking.slice(0, topN).filter((i) => i >= 1 && i <= candidates.length).map((i) => candidates[i - 1]).filter(Boolean);
  } catch {
    return candidates.slice(0, topN);
  }
}
async function executeRAG(query, env2, options = {}) {
  const maxTokens = options.maxContextTokens ?? 6e3;
  const searchMatches = await semanticSearch(query, env2, {
    ...options,
    top_k: options.rerank ? 20 : 8
  });
  if (searchMatches.length === 0) {
    return { context_text: "", citations: [], total_chunks: 0, tokens_used: 0 };
  }
  const chunkIds = searchMatches.map((m) => m.metadata.chunk_id);
  const placeholders = chunkIds.map(() => "?").join(",");
  const chunksResult = await env2.DB.prepare(
    `SELECT dc.*, d.name as doc_name, d.original_filename
     FROM document_chunks dc
     JOIN documents d ON d.id = dc.document_id
     WHERE dc.id IN (${placeholders})`
  ).bind(...chunkIds).all();
  const chunkMap = new Map(chunksResult.results.map((c) => [c.id, c]));
  let results = searchMatches.map((m) => {
    const chunk = chunkMap.get(m.metadata.chunk_id);
    if (!chunk)
      return null;
    return {
      chunk,
      document: { id: m.metadata.document_id, name: chunk.doc_name },
      score: m.score
    };
  }).filter(Boolean);
  if (options.rerank && env2.ANTHROPIC_API_KEY) {
    const client = new AnthropicClient(env2.ANTHROPIC_API_KEY);
    results = await rerankResults(query, results, client, 6);
  } else {
    results = results.slice(0, 8);
  }
  let totalTokens = 0;
  const citations = [];
  const contextParts = [];
  for (const result of results) {
    const chunk = result.chunk;
    const tokenEstimate = Math.ceil(chunk.content.length / 4);
    if (totalTokens + tokenEstimate > maxTokens)
      break;
    totalTokens += tokenEstimate;
    const citation = {
      document_id: chunk.document_id,
      document_name: chunk.doc_name || "Unknown Document",
      chunk_id: chunk.id,
      content: chunk.content,
      relevance_score: result.score,
      page_number: chunk.page_number,
      section_path: chunk.section_path,
      project_id: chunk.project_id
    };
    citations.push(citation);
    contextParts.push(
      `[Source: "${citation.document_name}"${citation.section_path ? ` \u2014 ${citation.section_path}` : ""}]
${chunk.content}`
    );
  }
  return {
    context_text: contextParts.join("\n\n---\n\n"),
    citations,
    total_chunks: results.length,
    tokens_used: totalTokens
  };
}
var SYSTEM_PROMPTS;
var init_rag = __esm({
  "src/lib/rag.ts"() {
    "use strict";
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_anthropic();
    __name(generateEmbedding, "generateEmbedding");
    __name(generateEmbeddingsBatch, "generateEmbeddingsBatch");
    __name(indexChunk, "indexChunk");
    __name(deleteDocumentVectors, "deleteDocumentVectors");
    __name(semanticSearch, "semanticSearch");
    __name(rerankResults, "rerankResults");
    __name(executeRAG, "executeRAG");
    SYSTEM_PROMPTS = {
      general: `You are MurryAI, a highly capable personal AI assistant specializing in proposal development, 
document analysis, and knowledge management. You have access to a rich knowledge base of documents 
and can search through them to answer questions, generate content, and provide analysis.

When answering questions:
- Always cite your sources from the knowledge base
- Be specific and actionable in your responses
- Ask clarifying questions when the intent is ambiguous
- Offer to perform follow-up actions (save to brain, create drafts, etc.)

Your personality: professional, precise, proactive, and deeply knowledgeable about proposal work.`,
      proposal: `You are MurryAI in Proposal Mode \u2014 a specialized AI assistant for government and commercial 
proposal development. You are an expert in:
- FAR/DFARS compliance requirements
- Section L (instructions) and Section M (evaluation criteria) analysis
- Proposal writing best practices (Shipley method)
- Win themes, discriminators, and value propositions
- Compliance matrix development
- Technical volume, management volume, and past performance writing

Always structure your responses for proposal professionals. Use proper section references,
provide compliance-focused analysis, and highlight win themes in your suggestions.`,
      research: `You are MurryAI in Research Mode \u2014 a deep-analysis assistant focused on synthesizing
information from multiple documents to answer complex questions with comprehensive, well-cited responses.
Organize information clearly, identify patterns and contradictions across sources, and always trace
claims back to specific document sections.`,
      qa: `You are MurryAI in Q&A Response Mode \u2014 an expert proposal writer focused on crafting compelling
answers to proposal evaluation questions. For each question:
1. Identify what the evaluator is really looking for
2. Structure the response to maximize evaluation scores
3. Lead with your discriminating capabilities
4. Support with concrete evidence and past performance
5. Stay within any word/page limits specified
6. Use active voice and compliance language`
    };
  }
});

// .wrangler/tmp/bundle-9MF9Rn/middleware-loader.entry.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// .wrangler/tmp/bundle-9MF9Rn/middleware-insertion-facade.js
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/index.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/types.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function apiError(error3, code) {
  return new Response(JSON.stringify({ success: false, error: error3 }), {
    status: code ?? 500,
    headers: { "Content-Type": "application/json" }
  });
}
__name(apiError, "apiError");
function apiJson2(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(apiJson2, "apiJson");
function generateId2(prefix = "") {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}
__name(generateId2, "generateId");
function now() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(now, "now");
var SUPPORTED_FILE_TYPES = [
  "pdf",
  "docx",
  "doc",
  "pptx",
  "ppt",
  "xlsx",
  "xls",
  "md",
  "mdx",
  "txt",
  "html",
  "htm",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp"
];
var FILE_TYPE_MIME = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "text/markdown": "md",
  "text/plain": "txt",
  "text/html": "html",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp"
};

// src/api/handlers.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
async function handleProjects(request, env2) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const projectId = segments[2];
  if (request.method === "GET" && !projectId) {
    return listProjects(request, env2);
  }
  if (request.method === "POST" && !projectId) {
    return createProject(request, env2);
  }
  if (request.method === "GET" && projectId) {
    return getProject(projectId, env2);
  }
  if (request.method === "PUT" && projectId) {
    return updateProject(projectId, request, env2);
  }
  if (request.method === "DELETE" && projectId) {
    return deleteProject(projectId, env2);
  }
  return apiError("Method not allowed", 405);
}
__name(handleProjects, "handleProjects");
async function listProjects(request, env2) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  let sql = `SELECT p.*, COUNT(d.id) as document_count
             FROM projects p
             LEFT JOIN documents d ON d.project_id = p.id
             WHERE 1=1`;
  const params = [];
  if (status) {
    sql += " AND p.status = ?";
    params.push(status);
  }
  sql += " GROUP BY p.id ORDER BY p.updated_at DESC";
  const result = await env2.DB.prepare(sql).bind(...params).all();
  return apiJson2({ success: true, data: result.results });
}
__name(listProjects, "listProjects");
async function createProject(request, env2) {
  const body = await request.json();
  if (!body.name)
    return apiError("name is required", 400);
  const id = generateId2("proj");
  await env2.DB.prepare(`
    INSERT INTO projects (id, name, description, type, status, color, icon, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.name,
    body.description ?? null,
    body.type ?? "proposal",
    body.status ?? "active",
    body.color ?? "#3B82F6",
    body.icon ?? "folder",
    body.metadata ? JSON.stringify(body.metadata) : null
  ).run();
  const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first();
  return apiJson2({ success: true, data: project }, 201);
}
__name(createProject, "createProject");
async function getProject(projectId, env2) {
  const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projectId).first();
  if (!project)
    return apiError("Project not found", 404);
  return apiJson2({ success: true, data: project });
}
__name(getProject, "getProject");
async function updateProject(projectId, request, env2) {
  const body = await request.json();
  const fields = [];
  const values = [];
  if (body.name !== void 0) {
    fields.push("name = ?");
    values.push(body.name);
  }
  if (body.description !== void 0) {
    fields.push("description = ?");
    values.push(body.description);
  }
  if (body.status !== void 0) {
    fields.push("status = ?");
    values.push(body.status);
  }
  if (body.color !== void 0) {
    fields.push("color = ?");
    values.push(body.color);
  }
  if (body.metadata !== void 0) {
    fields.push("metadata = ?");
    values.push(JSON.stringify(body.metadata));
  }
  if (fields.length === 0)
    return apiError("No fields to update", 400);
  fields.push("updated_at = ?");
  values.push(now());
  values.push(projectId);
  await env2.DB.prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  const updated = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projectId).first();
  return apiJson2({ success: true, data: updated });
}
__name(updateProject, "updateProject");
async function deleteProject(projectId, env2) {
  await env2.DB.prepare("DELETE FROM projects WHERE id = ?").bind(projectId).run();
  return apiJson2({ success: true, data: { deleted: true, id: projectId } });
}
__name(deleteProject, "deleteProject");
async function handleDocuments(request, env2) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const docId = segments[2];
  if (request.method === "GET" && !docId)
    return listDocuments(request, env2);
  if (request.method === "POST" && !docId)
    return uploadDocument(request, env2);
  if (request.method === "GET" && docId)
    return getDocument(docId, env2);
  if (request.method === "GET" && docId && segments[3] === "content")
    return getDocumentContent(docId, env2);
  if (request.method === "DELETE" && docId)
    return deleteDocument(docId, env2);
  return apiError("Method not allowed", 405);
}
__name(handleDocuments, "handleDocuments");
async function listDocuments(request, env2) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("project_id");
  const status = url.searchParams.get("status");
  let sql = "SELECT * FROM documents WHERE 1=1";
  const params = [];
  if (projectId) {
    sql += " AND project_id = ?";
    params.push(projectId);
  }
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  sql += " ORDER BY created_at DESC";
  const result = await env2.DB.prepare(sql).bind(...params).all();
  return apiJson2({ success: true, data: result.results });
}
__name(listDocuments, "listDocuments");
async function uploadDocument(request, env2) {
  const formData = await request.formData();
  const file = formData.get("file");
  const projectId = formData.get("project_id");
  const documentName = formData.get("name");
  if (!file)
    return apiError("file is required", 400);
  if (!projectId)
    return apiError("project_id is required", 400);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = file.type;
  const fileType = FILE_TYPE_MIME[mimeType] ?? ext;
  if (!SUPPORTED_FILE_TYPES.includes(fileType)) {
    return apiError(`Unsupported file type: ${ext}. Supported: ${SUPPORTED_FILE_TYPES.join(", ")}`, 400);
  }
  const docId = generateId2("doc");
  const r2Key = `projects/${projectId}/documents/${docId}.${ext}`;
  const docName = documentName ?? file.name.replace(/\.[^/.]+$/, "");
  const bytes = await file.arrayBuffer();
  await env2.DOCUMENTS_BUCKET.put(r2Key, bytes, {
    httpMetadata: { contentType: mimeType },
    customMetadata: {
      project_id: projectId,
      document_name: docName,
      original_filename: file.name
    }
  });
  await env2.DB.prepare(`
    INSERT INTO documents (id, project_id, name, original_filename, file_type, r2_key, size_bytes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).bind(docId, projectId, docName, file.name, fileType, r2Key, file.size).run();
  const runId = generateId2("run");
  await env2.DB.prepare(`
    INSERT INTO workflow_runs (id, project_id, document_id, workflow_type, status, progress)
    VALUES (?, ?, ?, 'document_ingestion', 'running', 0)
  `).bind(runId, projectId, docId).run();
  try {
    const params = {
      document_id: docId,
      project_id: projectId,
      r2_key: r2Key,
      file_type: fileType,
      document_name: docName
    };
    await env2.DOCUMENT_INGESTION.create({ params });
  } catch (err) {
    await env2.DB.prepare("UPDATE documents SET status = 'error' WHERE id = ?").bind(docId).run();
    return apiError(`Failed to start ingestion workflow: ${String(err)}`, 500);
  }
  const doc = await env2.DB.prepare("SELECT * FROM documents WHERE id = ?").bind(docId).first();
  return apiJson2({ success: true, data: { document: doc, workflow_run_id: runId } }, 201);
}
__name(uploadDocument, "uploadDocument");
async function getDocument(docId, env2) {
  const doc = await env2.DB.prepare("SELECT * FROM documents WHERE id = ?").bind(docId).first();
  if (!doc)
    return apiError("Document not found", 404);
  const chunkCount = await env2.DB.prepare("SELECT COUNT(*) as count FROM document_chunks WHERE document_id = ?").bind(docId).first();
  const workflowRun = await env2.DB.prepare(
    "SELECT * FROM workflow_runs WHERE document_id = ? ORDER BY started_at DESC LIMIT 1"
  ).bind(docId).first();
  return apiJson2({ success: true, data: { ...doc, chunk_count: chunkCount?.count ?? 0, latest_run: workflowRun } });
}
__name(getDocument, "getDocument");
async function getDocumentContent(docId, env2) {
  const doc = await env2.DB.prepare("SELECT r2_key FROM documents WHERE id = ?").bind(docId).first();
  if (!doc)
    return apiError("Document not found", 404);
  const object = await env2.DOCUMENTS_BUCKET.get(doc.r2_key);
  if (!object)
    return apiError("File not found in storage", 404);
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600"
    }
  });
}
__name(getDocumentContent, "getDocumentContent");
async function deleteDocument(docId, env2) {
  const doc = await env2.DB.prepare("SELECT r2_key FROM documents WHERE id = ?").bind(docId).first();
  if (!doc)
    return apiError("Document not found", 404);
  await env2.DOCUMENTS_BUCKET.delete(doc.r2_key);
  const chunks = await env2.DB.prepare(
    "SELECT vector_id FROM document_chunks WHERE document_id = ? AND vector_id IS NOT NULL"
  ).bind(docId).all();
  if (chunks.results.length > 0) {
    await env2.VECTORIZE.deleteByIds(chunks.results.map((c) => c.vector_id));
  }
  await env2.DB.prepare("DELETE FROM documents WHERE id = ?").bind(docId).run();
  return apiJson2({ success: true, data: { deleted: true, id: docId } });
}
__name(deleteDocument, "deleteDocument");
async function handleQA(request, env2) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const qaId = segments[2];
  if (request.method === "GET" && !qaId) {
    const projectId = url.searchParams.get("project_id");
    const status = url.searchParams.get("status");
    let sql = "SELECT * FROM qa_pairs WHERE 1=1";
    const params = [];
    if (projectId) {
      sql += " AND project_id = ?";
      params.push(projectId);
    }
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    sql += " ORDER BY priority DESC, created_at ASC";
    const result = await env2.DB.prepare(sql).bind(...params).all();
    return apiJson2({ success: true, data: result.results });
  }
  if (request.method === "POST" && !qaId) {
    const body = await request.json();
    if (!body.project_id || !body.question)
      return apiError("project_id and question are required", 400);
    const id = generateId2("qa");
    await env2.DB.prepare(`INSERT INTO qa_pairs (id, project_id, document_id, question, answer, answer_draft, status, category, section_reference, page_reference, priority, assignee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, body.project_id, body.document_id ?? null, body.question, body.answer ?? null, body.answer_draft ?? null, body.status ?? "pending", body.category ?? null, body.section_reference ?? null, body.page_reference ?? null, body.priority ?? "medium", body.assignee ?? null).run();
    const pair = await env2.DB.prepare("SELECT * FROM qa_pairs WHERE id = ?").bind(id).first();
    return apiJson2({ success: true, data: pair }, 201);
  }
  if (request.method === "PUT" && qaId) {
    const body = await request.json();
    const fields = [];
    const values = [];
    const allowed = ["answer", "answer_draft", "status", "category", "priority", "section_reference", "assignee", "question"];
    for (const field of allowed) {
      if (field in body) {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    }
    if (fields.length === 0)
      return apiError("No fields to update", 400);
    fields.push("updated_at = ?");
    values.push(now());
    values.push(qaId);
    await env2.DB.prepare(`UPDATE qa_pairs SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
    const updated = await env2.DB.prepare("SELECT * FROM qa_pairs WHERE id = ?").bind(qaId).first();
    return apiJson2({ success: true, data: updated });
  }
  if (request.method === "DELETE" && qaId) {
    await env2.DB.prepare("DELETE FROM qa_pairs WHERE id = ?").bind(qaId).run();
    return apiJson2({ success: true, data: { deleted: true, id: qaId } });
  }
  return apiError("Method not allowed", 405);
}
__name(handleQA, "handleQA");
async function handleCompliance(request, env2) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const itemId = segments[2];
  if (request.method === "GET" && !itemId) {
    const projectId = url.searchParams.get("project_id");
    const status = url.searchParams.get("status");
    let sql = "SELECT * FROM compliance_matrix WHERE 1=1";
    const params = [];
    if (projectId) {
      sql += " AND project_id = ?";
      params.push(projectId);
    }
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    sql += " ORDER BY priority DESC, requirement_ref ASC";
    const result = await env2.DB.prepare(sql).bind(...params).all();
    return apiJson2({ success: true, data: result.results });
  }
  if (request.method === "PUT" && itemId) {
    const body = await request.json();
    const fields = [];
    const values = [];
    const allowed = ["status", "response_section", "evidence", "gap", "action_required", "priority"];
    for (const field of allowed) {
      if (field in body) {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    }
    if (fields.length === 0)
      return apiError("No fields to update", 400);
    fields.push("updated_at = ?");
    values.push(now());
    values.push(itemId);
    await env2.DB.prepare(`UPDATE compliance_matrix SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
    const updated = await env2.DB.prepare("SELECT * FROM compliance_matrix WHERE id = ?").bind(itemId).first();
    return apiJson2({ success: true, data: updated });
  }
  return apiError("Method not allowed", 405);
}
__name(handleCompliance, "handleCompliance");
async function handleConversations(request, env2) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const convId = segments[2];
  if (request.method === "GET" && !convId) {
    const projectId = url.searchParams.get("project_id");
    let sql = "SELECT * FROM conversations WHERE 1=1";
    const params = [];
    if (projectId) {
      sql += " AND project_id = ?";
      params.push(projectId);
    }
    sql += " ORDER BY updated_at DESC LIMIT 50";
    const result = await env2.DB.prepare(sql).bind(...params).all();
    return apiJson2({ success: true, data: result.results });
  }
  if (request.method === "POST" && !convId) {
    const body = await request.json();
    const id = generateId2("conv");
    await env2.DB.prepare(`
      INSERT INTO conversations (id, project_id, title, mode) VALUES (?, ?, ?, ?)
    `).bind(id, body.project_id ?? null, body.title ?? "New Conversation", body.mode ?? "general").run();
    const conv = await env2.DB.prepare("SELECT * FROM conversations WHERE id = ?").bind(id).first();
    return apiJson2({ success: true, data: conv }, 201);
  }
  if (request.method === "GET" && convId) {
    const conv = await env2.DB.prepare("SELECT * FROM conversations WHERE id = ?").bind(convId).first();
    if (!conv)
      return apiError("Conversation not found", 404);
    const messages = await env2.DB.prepare(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
    ).bind(convId).all();
    return apiJson2({ success: true, data: { ...conv, messages: messages.results } });
  }
  if (request.method === "DELETE" && convId) {
    await env2.DB.prepare("DELETE FROM conversations WHERE id = ?").bind(convId).run();
    return apiJson2({ success: true, data: { deleted: true, id: convId } });
  }
  return apiError("Method not allowed", 405);
}
__name(handleConversations, "handleConversations");
async function handleBrain(request, env2) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const entryId = segments[2];
  if (request.method === "GET" && !entryId) {
    const projectId = url.searchParams.get("project_id");
    const type = url.searchParams.get("type");
    let sql = "SELECT * FROM brain_entries WHERE 1=1";
    const params = [];
    if (projectId) {
      sql += " AND (project_id = ? OR project_id IS NULL)";
      params.push(projectId);
    }
    if (type) {
      sql += " AND type = ?";
      params.push(type);
    }
    sql += " ORDER BY updated_at DESC LIMIT 100";
    const result = await env2.DB.prepare(sql).bind(...params).all();
    return apiJson2({ success: true, data: result.results });
  }
  if (request.method === "POST" && !entryId) {
    const body = await request.json();
    if (!body.type || !body.title || !body.content)
      return apiError("type, title, content are required", 400);
    const id = generateId2("brain");
    await env2.DB.prepare(`
      INSERT INTO brain_entries (id, project_id, type, title, content, tags, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, body.project_id ?? null, body.type, body.title, body.content, JSON.stringify(body.tags ?? []), body.source ?? "manual").run();
    const entry = await env2.DB.prepare("SELECT * FROM brain_entries WHERE id = ?").bind(id).first();
    return apiJson2({ success: true, data: entry }, 201);
  }
  if (request.method === "DELETE" && entryId) {
    await env2.DB.prepare("DELETE FROM brain_entries WHERE id = ?").bind(entryId).run();
    return apiJson2({ success: true, data: { deleted: true, id: entryId } });
  }
  return apiError("Method not allowed", 405);
}
__name(handleBrain, "handleBrain");
async function handleWorkflows(request, env2) {
  const url = new URL(request.url);
  const documentId = url.searchParams.get("document_id");
  const projectId = url.searchParams.get("project_id");
  if (documentId) {
    const run = await env2.DB.prepare(
      "SELECT * FROM workflow_runs WHERE document_id = ? ORDER BY started_at DESC LIMIT 1"
    ).bind(documentId).first();
    return apiJson2({ success: true, data: run });
  }
  if (projectId) {
    const runs2 = await env2.DB.prepare(
      "SELECT * FROM workflow_runs WHERE project_id = ? ORDER BY started_at DESC LIMIT 20"
    ).bind(projectId).all();
    return apiJson2({ success: true, data: runs2.results });
  }
  const runs = await env2.DB.prepare(
    "SELECT * FROM workflow_runs ORDER BY started_at DESC LIMIT 50"
  ).all();
  return apiJson2({ success: true, data: runs.results });
}
__name(handleWorkflows, "handleWorkflows");

// src/durable-objects/ConversationDO.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/agents/ProposalAgent.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_anthropic();
init_rag();
var AGENT_TOOLS = [
  {
    name: "search_knowledge_base",
    description: "Search through all indexed documents in the knowledge base using semantic search. Use this to find relevant information, quotes, sections, or data from uploaded documents.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language search query" },
        project_id: { type: "string", description: "Optional: limit search to a specific project" },
        top_k: { type: "number", description: "Number of results to return (default: 5)" }
      },
      required: ["query"]
    }
  },
  {
    name: "list_documents",
    description: "List all documents in a project or all projects",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project ID to list documents for" }
      }
    }
  },
  {
    name: "get_document_content",
    description: "Retrieve the full text content of a specific document by ID",
    input_schema: {
      type: "object",
      properties: {
        document_id: { type: "string", description: "The document ID" },
        page: { type: "number", description: "Optional: get content from a specific page" }
      },
      required: ["document_id"]
    }
  },
  {
    name: "list_projects",
    description: "List all projects in the knowledge base",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status: active | archived | completed" }
      }
    }
  },
  {
    name: "extract_qa_pairs",
    description: "Analyze a document or set of documents to automatically extract all questions that need to be answered in a proposal (Section L items, evaluation factors, etc.)",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project to extract Q&A pairs for" },
        document_id: { type: "string", description: "Optional: specific document to extract from" },
        document_type: { type: "string", description: "Type of document: rfp | solicitation | amendment" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "answer_proposal_question",
    description: "Generate a proposal response for a specific Q&A question using the knowledge base",
    input_schema: {
      type: "object",
      properties: {
        qa_id: { type: "string", description: "The Q&A pair ID to answer" },
        project_id: { type: "string", description: "The project context" },
        word_limit: { type: "number", description: "Maximum word count for the response" },
        style: { type: "string", description: "Writing style: formal | conversational | technical" }
      },
      required: ["qa_id", "project_id"]
    }
  },
  {
    name: "create_compliance_matrix",
    description: "Generate a compliance matrix from RFP/solicitation documents identifying all requirements and their compliance status",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project to create compliance matrix for" },
        document_id: { type: "string", description: "Optional: specific RFP document to analyze" },
        sections: {
          type: "array",
          items: { type: "string" },
          description: 'Specific sections to analyze (e.g., ["Section L", "Section M", "PWS"])'
        }
      },
      required: ["project_id"]
    }
  },
  {
    name: "generate_proposal_outline",
    description: "Generate a detailed proposal outline based on the RFP requirements and organizational capabilities",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project ID" },
        volume: { type: "string", description: "Which volume: technical | management | past_performance | price | all" },
        page_limit: { type: "number", description: "Total page limit for this volume" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "generate_executive_summary",
    description: "Generate a compelling executive summary for the proposal",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project ID" },
        word_limit: { type: "number", description: "Word limit (default: 500)" },
        focus: { type: "string", description: "Key focus areas to emphasize" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "save_to_brain",
    description: "Save important information, facts, preferences, or insights to the AI brain/knowledge store for future reference",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", description: "Type: fact | preference | process | contact | insight" },
        title: { type: "string", description: "Short title for this brain entry" },
        content: { type: "string", description: "The content to save" },
        tags: { type: "array", items: { type: "string" }, description: "Tags for organization" },
        project_id: { type: "string", description: "Optional: associate with a project" }
      },
      required: ["type", "title", "content"]
    }
  },
  {
    name: "get_brain_knowledge",
    description: "Retrieve knowledge from the brain/memory store",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to look for" },
        type: { type: "string", description: "Filter by type: fact | preference | process | contact | insight" },
        project_id: { type: "string", description: "Optional: filter by project" }
      },
      required: ["query"]
    }
  },
  {
    name: "update_qa_answer",
    description: "Update the answer for a specific Q&A pair",
    input_schema: {
      type: "object",
      properties: {
        qa_id: { type: "string", description: "Q&A pair ID" },
        answer: { type: "string", description: "The answer content" },
        status: { type: "string", description: "Status: draft | answered | reviewed" }
      },
      required: ["qa_id", "answer"]
    }
  },
  {
    name: "update_compliance_status",
    description: "Update the compliance status and response for a compliance matrix item",
    input_schema: {
      type: "object",
      properties: {
        compliance_id: { type: "string", description: "Compliance matrix item ID" },
        status: { type: "string", description: "Status: compliant | non_compliant | partial | na" },
        response_section: { type: "string", description: "Where in the proposal this is addressed" },
        evidence: { type: "string", description: "Evidence of compliance" },
        gap: { type: "string", description: "If partial/non-compliant: what is missing" }
      },
      required: ["compliance_id", "status"]
    }
  },
  {
    name: "create_document_draft",
    description: "Create a new document draft in the project (requires human approval for saving)",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project ID" },
        title: { type: "string", description: "Document title" },
        content: { type: "string", description: "Full document content in markdown" },
        document_type: { type: "string", description: "Type: proposal_section | outline | summary | matrix | template" }
      },
      required: ["project_id", "title", "content"]
    }
  }
];
async function executeTool(toolName, input, env2, conversationId, projectId) {
  switch (toolName) {
    case "search_knowledge_base": {
      const { query, project_id, top_k } = input;
      const ragContext = await executeRAG(query, env2, {
        project_id: project_id ?? projectId,
        top_k: top_k ?? 8,
        rerank: true
      });
      return {
        result: {
          results_count: ragContext.citations.length,
          citations: ragContext.citations,
          context: ragContext.context_text
        }
      };
    }
    case "list_documents": {
      const { project_id } = input;
      const stmt = project_id ? env2.DB.prepare("SELECT id, name, file_type, status, word_count, created_at FROM documents WHERE project_id = ? ORDER BY created_at DESC").bind(project_id) : env2.DB.prepare("SELECT id, name, file_type, status, word_count, created_at FROM documents ORDER BY created_at DESC");
      const docs = await stmt.all();
      return { result: { documents: docs.results, count: docs.results.length } };
    }
    case "get_document_content": {
      const { document_id } = input;
      const chunks = await env2.DB.prepare("SELECT content, chunk_index, chunk_type, page_number, section_path FROM document_chunks WHERE document_id = ? ORDER BY chunk_index").bind(document_id).all();
      return {
        result: {
          content: chunks.results.map((c) => c.content).join("\n\n"),
          chunks: chunks.results.length
        }
      };
    }
    case "list_projects": {
      const { status } = input;
      const stmt = status ? env2.DB.prepare("SELECT * FROM projects WHERE status = ? ORDER BY updated_at DESC").bind(status) : env2.DB.prepare("SELECT * FROM projects ORDER BY updated_at DESC");
      const projects = await stmt.all();
      return { result: { projects: projects.results } };
    }
    case "extract_qa_pairs": {
      const { project_id, document_id } = input;
      const stmt = document_id ? env2.DB.prepare("SELECT content FROM document_chunks WHERE document_id = ? ORDER BY chunk_index").bind(document_id) : env2.DB.prepare(`
            SELECT dc.content FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE dc.project_id = ? AND d.name ILIKE '%rfp%' OR d.name ILIKE '%solicitation%'
            ORDER BY dc.chunk_index LIMIT 50
          `).bind(project_id);
      const chunks = await stmt.all();
      const fullText = chunks.results.map((c) => c.content).join("\n\n");
      if (!fullText) {
        return { result: { error: "No document content found to analyze" } };
      }
      const client = new AnthropicClient(env2.ANTHROPIC_API_KEY);
      const prompt = `Analyze this RFP/solicitation document and extract ALL evaluation questions and requirements 
that need to be addressed in the proposal. For each item, identify:
- The exact question or requirement
- Section reference (Section L, M, C, PWS, etc.)
- Page reference if available  
- Category (Technical, Management, Past Performance, Price, etc.)
- Priority (critical if explicitly required, high for evaluation factors, medium otherwise)

Document content:
${fullText.substring(0, 8e3)}

Return a JSON array of objects with fields: question, section_reference, page_reference, category, priority`;
      const response = await client.generateText(prompt, void 0, 2048);
      let qaPairs = [];
      try {
        const match = response.match(/\[[\s\S]*\]/);
        if (match)
          qaPairs = JSON.parse(match[0]);
      } catch {
        qaPairs = [];
      }
      const saved = [];
      for (const pair of qaPairs) {
        const id = generateId2("qa");
        await env2.DB.prepare(`
          INSERT INTO qa_pairs (id, project_id, document_id, question, section_reference, page_reference, category, priority, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `).bind(id, project_id, document_id ?? null, pair.question ?? "", pair.section_reference ?? null, pair.page_reference ?? null, pair.category ?? null, pair.priority ?? "medium").run();
        saved.push({ id, ...pair });
      }
      return { result: { extracted: saved.length, qa_pairs: saved } };
    }
    case "answer_proposal_question": {
      const { qa_id, project_id, word_limit, style } = input;
      const qa = await env2.DB.prepare("SELECT * FROM qa_pairs WHERE id = ?").bind(qa_id).first();
      if (!qa)
        return { result: { error: `Q&A pair ${qa_id} not found` } };
      const ragCtx = await executeRAG(qa.question, env2, {
        project_id,
        top_k: 6,
        rerank: true
      });
      const client = new AnthropicClient(env2.ANTHROPIC_API_KEY);
      const systemPrompt = SYSTEM_PROMPTS.qa;
      const prompt = `Generate a compelling proposal response to this evaluation question:

QUESTION: ${qa.question}
${qa.section_reference ? `SECTION REFERENCE: ${qa.section_reference}` : ""}
${word_limit ? `WORD LIMIT: ${word_limit} words maximum` : ""}
${style ? `WRITING STYLE: ${style}` : ""}

RELEVANT KNOWLEDGE BASE CONTENT:
${ragCtx.context_text || "No specific documents found \u2014 draw on general proposal writing best practices"}

Write a complete, evaluation-score-maximizing response. Lead with your discriminator.
Use active voice. Be specific with metrics and examples where possible.
${word_limit ? `Stay under ${word_limit} words.` : ""}`;
      const answer = await client.generateText(prompt, systemPrompt, word_limit ? word_limit * 5 : 1500);
      await env2.DB.prepare(`
        UPDATE qa_pairs SET answer_draft = ?, status = 'draft', updated_at = ?
        WHERE id = ?
      `).bind(answer, now(), qa_id).run();
      return {
        result: {
          qa_id,
          answer,
          citations: ragCtx.citations,
          word_count: answer.split(/\s+/).length
        }
      };
    }
    case "create_compliance_matrix": {
      const { project_id, document_id } = input;
      const stmt = document_id ? env2.DB.prepare("SELECT content FROM document_chunks WHERE document_id = ? ORDER BY chunk_index").bind(document_id) : env2.DB.prepare("SELECT dc.content FROM document_chunks dc JOIN documents d ON d.id = dc.document_id WHERE dc.project_id = ? ORDER BY dc.chunk_index LIMIT 80").bind(project_id);
      const chunks = await stmt.all();
      const text = chunks.results.map((c) => c.content).join("\n\n");
      const client = new AnthropicClient(env2.ANTHROPIC_API_KEY);
      const prompt = `Analyze this RFP document and create a comprehensive compliance matrix. 
Extract every requirement, instruction (Section L), and evaluation factor (Section M).
For each item extract: requirement text, requirement_ref, section, instruction, evaluation_factor, priority.

Document:
${text.substring(0, 8e3)}

Return a JSON array of compliance matrix items.`;
      const response = await client.generateText(prompt, void 0, 2048);
      let items = [];
      try {
        const match = response.match(/\[[\s\S]*\]/);
        if (match)
          items = JSON.parse(match[0]);
      } catch {
        items = [];
      }
      const saved = [];
      for (const item of items) {
        const id = generateId2("cm");
        await env2.DB.prepare(`
          INSERT INTO compliance_matrix (id, project_id, requirement, requirement_ref, section, instruction, evaluation_factor, priority, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `).bind(id, project_id, item.requirement ?? "", item.requirement_ref ?? null, item.section ?? null, item.instruction ?? null, item.evaluation_factor ?? null, item.priority ?? "medium").run();
        saved.push({ id, ...item });
      }
      return { result: { created: saved.length, matrix: saved } };
    }
    case "generate_proposal_outline": {
      const { project_id, volume, page_limit } = input;
      const ragCtx = await executeRAG("proposal requirements evaluation criteria instructions", env2, {
        project_id,
        top_k: 10
      });
      const client = new AnthropicClient(env2.ANTHROPIC_API_KEY);
      const prompt = `Create a detailed ${volume || "full proposal"} outline for this project.
${page_limit ? `Total page limit: ${page_limit} pages` : ""}

Requirements from knowledge base:
${ragCtx.context_text || "No specific RFP found \u2014 generate a standard proposal outline"}

Create a detailed section-by-section outline with:
- Section number and title
- Page allocation
- Key content to include
- Win themes to highlight
- Evidence/proof points needed

Format as a structured markdown outline.`;
      const outline = await client.generateText(prompt, SYSTEM_PROMPTS.proposal, 3e3);
      return { result: { outline, citations: ragCtx.citations } };
    }
    case "generate_executive_summary": {
      const { project_id, word_limit = 500, focus } = input;
      const ragCtx = await executeRAG("company capabilities win themes discriminators value proposition", env2, {
        project_id,
        top_k: 8
      });
      const client = new AnthropicClient(env2.ANTHROPIC_API_KEY);
      const prompt = `Write a compelling executive summary for this proposal (${word_limit} words max).
${focus ? `Key focus: ${focus}` : ""}

Context from knowledge base:
${ragCtx.context_text || "Draw on general proposal best practices"}

The executive summary must:
1. Hook the evaluator in the first sentence
2. State our key discriminating capabilities
3. Address the customer's hot buttons
4. Preview our approach/solution
5. Close with a strong value proposition

Stay under ${word_limit} words. Write for proposal evaluators.`;
      const summary = await client.generateText(prompt, SYSTEM_PROMPTS.proposal, word_limit * 8);
      return {
        result: {
          executive_summary: summary,
          word_count: summary.split(/\s+/).length,
          citations: ragCtx.citations
        }
      };
    }
    case "save_to_brain": {
      const { type, title: title2, content, tags, project_id: pid2 } = input;
      const id = generateId2("brain");
      await env2.DB.prepare(`
        INSERT INTO brain_entries (id, project_id, type, title, content, tags, source)
        VALUES (?, ?, ?, ?, ?, ?, 'agent')
      `).bind(id, pid2 ?? projectId ?? null, type, title2, content, JSON.stringify(tags ?? [])).run();
      return { result: { saved: true, id, title: title2 } };
    }
    case "get_brain_knowledge": {
      const { query, type, project_id: pid2 } = input;
      let sql = "SELECT * FROM brain_entries WHERE 1=1";
      const params = [];
      if (type) {
        sql += " AND type = ?";
        params.push(type);
      }
      if (pid2) {
        sql += " AND project_id = ?";
        params.push(pid2);
      }
      sql += " ORDER BY updated_at DESC LIMIT 20";
      const entries = await env2.DB.prepare(sql).bind(...params).all();
      const filtered = entries.results.filter((e) => {
        const entry = e;
        const q = query.toLowerCase();
        return entry.title.toLowerCase().includes(q) || entry.content.toLowerCase().includes(q);
      });
      return { result: { entries: filtered, count: filtered.length } };
    }
    case "update_qa_answer": {
      const { qa_id, answer, status = "answered" } = input;
      await env2.DB.prepare("UPDATE qa_pairs SET answer = ?, status = ?, updated_at = ? WHERE id = ?").bind(answer, status, now(), qa_id).run();
      return { result: { updated: true, qa_id, status } };
    }
    case "update_compliance_status": {
      const { compliance_id, status, response_section, evidence, gap } = input;
      await env2.DB.prepare(`
        UPDATE compliance_matrix SET status = ?, response_section = ?, evidence = ?, gap = ?, updated_at = ?
        WHERE id = ?
      `).bind(status, response_section ?? null, evidence ?? null, gap ?? null, now(), compliance_id).run();
      return { result: { updated: true, compliance_id, status } };
    }
    case "create_document_draft": {
      const { project_id: pid2, title: title2, content, document_type } = input;
      const taskId = generateId2("task");
      const task = {
        id: taskId,
        conversation_id: conversationId,
        project_id: pid2,
        task_type: "create_document_draft",
        title: `Create document: ${title2}`,
        description: `Create a new ${document_type || "document"} draft titled "${title2}" with ${content.split(/\s+/).length} words`,
        status: "pending",
        requires_approval: true,
        input: { project_id: pid2, title: title2, content, document_type },
        created_at: now(),
        updated_at: now()
      };
      await env2.DB.prepare(`
        INSERT INTO agent_tasks (id, conversation_id, project_id, task_type, title, description, status, requires_approval, input)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', 1, ?)
      `).bind(taskId, conversationId, pid2, task.task_type, task.title, task.description, JSON.stringify(task.input)).run();
      return { result: { task_id: taskId, status: "awaiting_approval" }, requires_approval: true, task };
    }
    default:
      return { result: { error: `Unknown tool: ${toolName}` } };
  }
}
__name(executeTool, "executeTool");
async function runAgent(userMessage, conversationHistory, env2, conversationId, projectId, mode = "general", onStream) {
  const messageId = generateId2("msg");
  const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.general;
  if (!env2.ANTHROPIC_API_KEY) {
    const fallback = `I cannot process this request because the AI API key is not configured. Please set ANTHROPIC_API_KEY and retry.`;
    const finalMessage2 = {
      id: messageId,
      conversation_id: conversationId,
      role: "assistant",
      content: fallback,
      created_at: now()
    };
    await onStream({ type: "chunk", content: fallback, message_id: messageId });
    await onStream({ type: "message_complete", message: finalMessage2 });
    return finalMessage2;
  }
  const client = new AnthropicClient(env2.ANTHROPIC_API_KEY);
  const messages = [
    ...conversationHistory,
    { role: "user", content: userMessage }
  ];
  let fullResponse = "";
  const allCitations = [];
  const toolCalls = [];
  for (let iteration = 0; iteration < 10; iteration++) {
    let currentToolUseId = "";
    let currentToolName = "";
    let currentToolInput = "";
    let isInToolUse = false;
    const stream = client.stream({
      system: systemPrompt + (projectId ? `

Current project context: ${projectId}` : ""),
      messages,
      tools: AGENT_TOOLS,
      max_tokens: 4096
    });
    for await (const event of stream) {
      if (event.type === "content_block_start") {
        const block = event.content_block;
        if (block.type === "tool_use") {
          isInToolUse = true;
          currentToolUseId = block.id ?? "";
          currentToolName = block.name ?? "";
          currentToolInput = "";
          const tc = {
            id: currentToolUseId,
            name: currentToolName,
            input: {},
            status: "running"
          };
          toolCalls.push(tc);
          await onStream({ type: "tool_start", tool: tc });
        } else if (block.type === "text") {
          isInToolUse = false;
        }
      }
      if (event.type === "content_block_delta") {
        const delta = event.delta;
        if (!delta)
          continue;
        if (delta.type === "text_delta" && delta.text) {
          fullResponse += delta.text;
          await onStream({ type: "chunk", content: delta.text, message_id: messageId });
        } else if (delta.type === "input_json_delta" && delta.partial_json) {
          currentToolInput += delta.partial_json;
        }
      }
      if (event.type === "content_block_stop" && isInToolUse) {
        let toolInput = {};
        try {
          toolInput = JSON.parse(currentToolInput);
        } catch {
          toolInput = {};
        }
        const tc = toolCalls.find((t) => t.id === currentToolUseId);
        if (tc)
          tc.input = toolInput;
        const { result, requires_approval, task } = await executeTool(
          currentToolName,
          toolInput,
          env2,
          conversationId,
          projectId
        );
        if (tc) {
          tc.output = result;
          tc.status = requires_approval ? "awaiting_approval" : "completed";
        }
        if (requires_approval && task) {
          await onStream({ type: "approval_required", task });
          messages.push({
            role: "assistant",
            content: [{
              type: "tool_use",
              id: currentToolUseId,
              name: currentToolName,
              input: toolInput
            }]
          });
          messages.push({
            role: "user",
            content: [{
              type: "tool_result",
              tool_use_id: currentToolUseId,
              content: JSON.stringify({ status: "awaiting_approval", task_id: task.id })
            }]
          });
          fullResponse += `

\u23F3 **Awaiting your approval** to ${task.description}. Please approve or reject above.`;
          break;
        }
        if (currentToolName === "search_knowledge_base" || currentToolName === "answer_proposal_question") {
          const resultObj = result;
          if (resultObj.citations) {
            allCitations.push(...resultObj.citations);
            await onStream({ type: "citations", citations: resultObj.citations });
          }
        }
        await onStream({ type: "tool_complete", tool_id: currentToolUseId, result });
        messages.push({
          role: "assistant",
          content: [{
            type: "tool_use",
            id: currentToolUseId,
            name: currentToolName,
            input: toolInput
          }]
        });
        messages.push({
          role: "user",
          content: [{
            type: "tool_result",
            tool_use_id: currentToolUseId,
            content: JSON.stringify(result)
          }]
        });
        isInToolUse = false;
      }
      if (event.type === "message_delta") {
        const stopReason = event.delta?.type;
        if (event.message?.stop_reason === "end_turn") {
          break;
        }
      }
    }
    if (!isInToolUse && !toolCalls.some((t) => t.status === "running")) {
      break;
    }
  }
  const finalMessage = {
    id: messageId,
    conversation_id: conversationId,
    role: "assistant",
    content: fullResponse,
    tool_calls: toolCalls.length > 0 ? toolCalls : void 0,
    citations: allCitations.length > 0 ? allCitations : void 0,
    metadata: { model: "claude-sonnet-4-20250514" },
    created_at: now()
  };
  await onStream({ type: "message_complete", message: finalMessage });
  return finalMessage;
}
__name(runAgent, "runAgent");

// src/durable-objects/ConversationDO.ts
var ConversationDurableObject = class {
  state;
  env;
  sessions = /* @__PURE__ */ new Map();
  constructor(state, env2) {
    this.state = state;
    this.env = env2;
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }
    if (request.method === "GET" && url.pathname === "/history") {
      return this.getHistory();
    }
    if (request.method === "POST" && url.pathname === "/approve") {
      return this.handleApproval(request);
    }
    return new Response("Not Found", { status: 404 });
  }
  // ──────────────────────────────────────────
  // WebSocket Handler
  // ──────────────────────────────────────────
  async handleWebSocket(request) {
    const { 0: client, 1: server } = new WebSocketPair();
    server.accept();
    const sessionId = generateId2("ws");
    this.sessions.set(sessionId, server);
    server.addEventListener("message", async (event) => {
      try {
        const msg = JSON.parse(event.data);
        await this.handleMessage(msg, server, sessionId);
      } catch (err) {
        this.send(server, { type: "error", error: String(err) });
      }
    });
    server.addEventListener("close", () => {
      this.sessions.delete(sessionId);
    });
    server.addEventListener("error", () => {
      this.sessions.delete(sessionId);
    });
    return new Response(null, { status: 101, webSocket: client });
  }
  async handleMessage(msg, ws, sessionId) {
    switch (msg.type) {
      case "ping":
        this.send(ws, { type: "pong" });
        break;
      case "subscribe":
        break;
      case "chat":
        await this.handleChatMessage(msg, ws);
        break;
      case "approve_task":
        await this.handleTaskApproval(msg, ws);
        break;
    }
  }
  // ──────────────────────────────────────────
  // Chat Handler — runs the agentic loop
  // ──────────────────────────────────────────
  async handleChatMessage(msg, ws) {
    const { content, conversation_id, project_id, mode = "general" } = msg;
    await this.ensureConversation(conversation_id, project_id, mode);
    const userMessageId = generateId2("msg");
    await this.saveMessage({
      id: userMessageId,
      conversation_id,
      role: "user",
      content,
      created_at: now()
    });
    const history = await this.loadClaudeHistory(conversation_id);
    const onStream = /* @__PURE__ */ __name(async (event) => {
      if (ws.readyState === WebSocket.OPEN) {
        this.send(ws, event);
      }
    }, "onStream");
    try {
      const assistantMessage = await runAgent(
        content,
        history,
        this.env,
        conversation_id,
        project_id,
        mode,
        onStream
      );
      await this.saveMessage(assistantMessage);
      const msgCount = await this.state.storage.get(`conv:${conversation_id}:count`) ?? 0;
      if (msgCount === 0) {
        await this.generateAndSaveTitle(conversation_id, content);
      }
      await this.state.storage.put(`conv:${conversation_id}:count`, msgCount + 1);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.send(ws, { type: "error", error: `Agent error: ${errorMsg}` });
    }
  }
  // ──────────────────────────────────────────
  // Human-in-the-Loop: Task Approval
  // ──────────────────────────────────────────
  async handleTaskApproval(msg, ws) {
    const { task_id, approved, reason } = msg;
    const task = await this.env.DB.prepare("SELECT * FROM agent_tasks WHERE id = ?").bind(task_id).first();
    if (!task) {
      this.send(ws, { type: "error", error: `Task ${task_id} not found` });
      return;
    }
    if (!approved) {
      await this.env.DB.prepare("UPDATE agent_tasks SET status = ?, rejection_reason = ?, updated_at = ? WHERE id = ?").bind("rejected", reason ?? "User rejected", now(), task_id).run();
      this.send(ws, {
        type: "chunk",
        content: `

\u274C Task rejected. I won't proceed with that action.${reason ? ` Reason: ${reason}` : ""}`,
        message_id: generateId2("msg")
      });
      return;
    }
    const input = JSON.parse(task.input);
    await this.env.DB.prepare("UPDATE agent_tasks SET status = ?, updated_at = ? WHERE id = ?").bind("approved", now(), task_id).run();
    try {
      let result;
      if (task.task_type === "create_document_draft") {
        const { project_id, title: title2, content: docContent, document_type } = input;
        const docId = generateId2("doc");
        const r2Key = `projects/${project_id}/drafts/${docId}.md`;
        await this.env.DOCUMENTS_BUCKET.put(r2Key, docContent, {
          httpMetadata: { contentType: "text/markdown" },
          customMetadata: { title: title2, document_type: document_type ?? "draft" }
        });
        await this.env.DB.prepare(`
          INSERT INTO documents (id, project_id, name, original_filename, file_type, r2_key, size_bytes, status)
          VALUES (?, ?, ?, ?, 'md', ?, ?, 'indexed')
        `).bind(docId, project_id, title2, `${title2}.md`, r2Key, docContent.length).run();
        result = { document_id: docId, title: title2, saved: true };
      }
      await this.env.DB.prepare("UPDATE agent_tasks SET status = ?, output = ?, updated_at = ? WHERE id = ?").bind("completed", JSON.stringify(result), now(), task_id).run();
      this.send(ws, {
        type: "chunk",
        content: `

\u2705 Task completed successfully: ${JSON.stringify(result, null, 2)}`,
        message_id: generateId2("msg")
      });
    } catch (err) {
      this.send(ws, { type: "error", error: `Task execution failed: ${String(err)}` });
    }
  }
  // ──────────────────────────────────────────
  // Persistence Helpers
  // ──────────────────────────────────────────
  async ensureConversation(conversationId, projectId, mode) {
    const existing = await this.env.DB.prepare("SELECT id FROM conversations WHERE id = ?").bind(conversationId).first();
    if (!existing) {
      await this.env.DB.prepare(`
        INSERT INTO conversations (id, project_id, title, mode) VALUES (?, ?, ?, ?)
      `).bind(conversationId, projectId ?? null, "New Conversation", mode ?? "general").run();
    }
  }
  async saveMessage(message) {
    await this.env.DB.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, tool_calls, citations, agent_thoughts, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      message.id,
      message.conversation_id,
      message.role,
      message.content,
      message.tool_calls ? JSON.stringify(message.tool_calls) : null,
      message.citations ? JSON.stringify(message.citations) : null,
      message.agent_thoughts ?? null,
      message.metadata ? JSON.stringify(message.metadata) : null
    ).run();
  }
  async loadClaudeHistory(conversationId) {
    const msgs = await this.env.DB.prepare(`
      SELECT role, content FROM messages
      WHERE conversation_id = ? AND role IN ('user', 'assistant')
      ORDER BY created_at DESC LIMIT 40
    `).bind(conversationId).all();
    return msgs.results.reverse().slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
  }
  async generateAndSaveTitle(conversationId, firstMessage) {
    try {
      const title2 = firstMessage.length > 60 ? firstMessage.substring(0, 57) + "..." : firstMessage;
      await this.env.DB.prepare("UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?").bind(title2, now(), conversationId).run();
    } catch {
    }
  }
  // ──────────────────────────────────────────
  // REST Endpoints
  // ──────────────────────────────────────────
  async getHistory() {
    return new Response(JSON.stringify({ messages: [] }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  async handleApproval(request) {
    const body = await request.json();
    for (const [, ws] of this.sessions) {
      if (ws.readyState === WebSocket.OPEN) {
        await this.handleTaskApproval({ type: "approve_task", ...body }, ws);
        break;
      }
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  // ──────────────────────────────────────────
  // WebSocket Send Helper
  // ──────────────────────────────────────────
  send(ws, msg) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    } catch {
    }
  }
};
__name(ConversationDurableObject, "ConversationDurableObject");

// src/workflows/DocumentIngestionWorkflow.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/lib/chunker.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var MAX_CHUNK_TOKENS = 400;
var MIN_CHUNK_TOKENS = 50;
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}
__name(estimateTokens, "estimateTokens");
function chunkDocument(text, fileType, options = {}) {
  const maxTokens = options.maxTokens ?? MAX_CHUNK_TOKENS;
  const cleaned = preprocess(text, fileType);
  const sections = splitIntoSections(cleaned);
  const chunks = [];
  let chunkIndex = 0;
  let currentSection = "";
  for (const section of sections) {
    if (section.type === "table") {
      chunks.push({
        content: section.content.trim(),
        chunk_index: chunkIndex++,
        chunk_type: "table",
        token_count: estimateTokens(section.content),
        section_path: section.sectionPath
      });
      continue;
    }
    if (section.type === "code") {
      chunks.push({
        content: section.content.trim(),
        chunk_index: chunkIndex++,
        chunk_type: "code",
        token_count: estimateTokens(section.content),
        section_path: section.sectionPath
      });
      continue;
    }
    if (section.type === "header") {
      currentSection = section.content;
    }
    const sectionChunks = splitSectionIntoChunks(
      section.content,
      maxTokens,
      currentSection,
      chunkIndex
    );
    for (const c of sectionChunks) {
      chunks.push({
        ...c,
        chunk_index: chunkIndex++,
        chunk_type: section.type === "list" ? "list" : "text",
        section_path: section.sectionPath ?? currentSection
      });
    }
  }
  return postprocess(chunks, MIN_CHUNK_TOKENS);
}
__name(chunkDocument, "chunkDocument");
function preprocess(text, fileType) {
  let cleaned = text;
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  cleaned = cleaned.replace(/\n{4,}/g, "\n\n\n");
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");
  if (["html", "htm"].includes(fileType)) {
    cleaned = stripHtmlTags(cleaned);
  }
  if (["md", "mdx"].includes(fileType)) {
    cleaned = cleaned.replace(/^---[\s\S]*?---\n/, "");
  }
  return cleaned.trim();
}
__name(preprocess, "preprocess");
function stripHtmlTags(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<\/div>/gi, "\n").replace(/<\/h[1-6]>/gi, "\n\n").replace(/<li>/gi, "\u2022 ").replace(/<\/li>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&#\d+;/g, "");
}
__name(stripHtmlTags, "stripHtmlTags");
function splitIntoSections(text) {
  const sections = [];
  const lines = text.split("\n");
  let currentBuffer = [];
  let currentType = "text";
  let inTable = false;
  let inCode = false;
  let sectionPath = "";
  const flush = /* @__PURE__ */ __name(() => {
    const content = currentBuffer.join("\n").trim();
    if (content) {
      sections.push({ type: currentType, content, sectionPath });
    }
    currentBuffer = [];
  }, "flush");
  for (const line of lines) {
    if (line.startsWith("```") || line.startsWith("~~~")) {
      if (inCode) {
        currentBuffer.push(line);
        flush();
        inCode = false;
        currentType = "text";
      } else {
        flush();
        inCode = true;
        currentType = "code";
        currentBuffer.push(line);
      }
      continue;
    }
    if (inCode) {
      currentBuffer.push(line);
      continue;
    }
    if (line.includes("|") && line.trim().startsWith("|")) {
      if (!inTable) {
        flush();
        inTable = true;
        currentType = "table";
      }
      currentBuffer.push(line);
      continue;
    } else if (inTable) {
      flush();
      inTable = false;
      currentType = "text";
    }
    const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headerMatch) {
      flush();
      const level = headerMatch[1].length;
      const title2 = headerMatch[2];
      const pathParts = sectionPath ? sectionPath.split(" > ") : [];
      pathParts.splice(level - 1);
      pathParts.push(title2);
      sectionPath = pathParts.join(" > ");
      sections.push({ type: "header", content: title2, sectionPath });
      currentType = "text";
      continue;
    }
    if (line.match(/^[\s]*[-*+•]\s/) || line.match(/^[\s]*\d+[.)]\s/)) {
      if (currentType !== "list") {
        flush();
        currentType = "list";
      }
      currentBuffer.push(line);
      continue;
    } else if (currentType === "list" && line.trim() === "") {
      flush();
      currentType = "text";
      continue;
    }
    currentBuffer.push(line);
  }
  flush();
  return sections;
}
__name(splitIntoSections, "splitIntoSections");
function splitSectionIntoChunks(text, maxTokens, sectionPath, startIndex) {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/);
  let currentBuffer = "";
  for (const paragraph of paragraphs) {
    const combined = currentBuffer ? `${currentBuffer}

${paragraph}` : paragraph;
    const tokens = estimateTokens(combined);
    if (tokens > maxTokens && currentBuffer) {
      chunks.push({
        content: currentBuffer.trim(),
        token_count: estimateTokens(currentBuffer)
      });
      if (estimateTokens(paragraph) > maxTokens) {
        const subChunks = splitBysentences(paragraph, maxTokens);
        chunks.push(...subChunks);
        currentBuffer = "";
      } else {
        currentBuffer = paragraph;
      }
    } else if (estimateTokens(paragraph) > maxTokens) {
      if (currentBuffer) {
        chunks.push({ content: currentBuffer.trim(), token_count: estimateTokens(currentBuffer) });
        currentBuffer = "";
      }
      const subChunks = splitBysentences(paragraph, maxTokens);
      chunks.push(...subChunks);
    } else {
      currentBuffer = combined;
    }
  }
  if (currentBuffer.trim()) {
    chunks.push({
      content: currentBuffer.trim(),
      token_count: estimateTokens(currentBuffer)
    });
  }
  return chunks;
}
__name(splitSectionIntoChunks, "splitSectionIntoChunks");
function splitBysentences(text, maxTokens) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const chunks = [];
  let buffer = "";
  for (const sentence of sentences) {
    const combined = buffer ? `${buffer} ${sentence}` : sentence;
    if (estimateTokens(combined) > maxTokens && buffer) {
      chunks.push({ content: buffer.trim(), token_count: estimateTokens(buffer) });
      buffer = sentence;
    } else {
      buffer = combined;
    }
  }
  if (buffer.trim()) {
    chunks.push({ content: buffer.trim(), token_count: estimateTokens(buffer) });
  }
  return chunks;
}
__name(splitBysentences, "splitBysentences");
function postprocess(chunks, minTokens) {
  const result = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk.content.trim())
      continue;
    if (chunk.token_count < minTokens && i < chunks.length - 1) {
      const next = chunks[i + 1];
      const merged = `${chunk.content}

${next.content}`;
      chunks[i + 1] = {
        ...next,
        content: merged,
        token_count: estimateTokens(merged),
        section_path: chunk.section_path ?? next.section_path
      };
      continue;
    }
    result.push({ ...chunk, chunk_index: result.length });
  }
  return result;
}
__name(postprocess, "postprocess");
async function extractTextFromBuffer(buffer, fileType) {
  const bytes = new Uint8Array(buffer);
  switch (fileType) {
    case "txt":
    case "md":
    case "mdx":
    case "html":
    case "htm":
      return new TextDecoder("utf-8").decode(bytes);
    case "pdf":
      return extractTextFromPdf(bytes);
    case "docx":
    case "doc":
      return extractTextFromDocx(bytes);
    case "pptx":
    case "ppt":
      return extractTextFromPptx(bytes);
    case "xlsx":
    case "xls":
      return extractTextFromXlsx(bytes);
    default:
      return new TextDecoder("utf-8", { fatal: false, ignoreBOM: true }).decode(bytes);
  }
}
__name(extractTextFromBuffer, "extractTextFromBuffer");
function extractTextFromPdf(bytes) {
  const text = new TextDecoder("latin1").decode(bytes);
  const textParts = [];
  const streamRegex = /BT([\s\S]*?)ET/g;
  let match;
  while ((match = streamRegex.exec(text)) !== null) {
    const stream = match[1];
    const stringRegex = /\(([^)\\]*(\\.[^)\\]*)*)\)\s*(?:Tj|TJ|'|")/g;
    let strMatch;
    while ((strMatch = stringRegex.exec(stream)) !== null) {
      const decoded = strMatch[1].replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "	").replace(/\\\(/g, "(").replace(/\\\)/g, ")").replace(/\\\\/g, "\\");
      textParts.push(decoded);
    }
    const hexRegex = /<([0-9A-Fa-f\s]+)>\s*(?:Tj|TJ)/g;
    let hexMatch;
    while ((hexMatch = hexRegex.exec(stream)) !== null) {
      const hex = hexMatch[1].replace(/\s/g, "");
      let decoded = "";
      for (let i = 0; i < hex.length; i += 2) {
        const code = parseInt(hex.substr(i, 2), 16);
        if (code > 31 && code < 127)
          decoded += String.fromCharCode(code);
      }
      if (decoded)
        textParts.push(decoded);
    }
    textParts.push("\n");
  }
  return textParts.join(" ").replace(/\s+/g, " ").replace(/ \n /g, "\n").trim();
}
__name(extractTextFromPdf, "extractTextFromPdf");
async function extractTextFromDocx(bytes) {
  const zipText = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true }).decode(bytes);
  const wtRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  const parts = [];
  let match;
  while ((match = wtRegex.exec(zipText)) !== null) {
    parts.push(match[1]);
  }
  if (parts.length > 0) {
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }
  return zipText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
__name(extractTextFromDocx, "extractTextFromDocx");
async function extractTextFromPptx(bytes) {
  const zipText = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true }).decode(bytes);
  const atRegex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
  const parts = [];
  let match;
  while ((match = atRegex.exec(zipText)) !== null) {
    parts.push(match[1]);
  }
  return parts.join("\n").replace(/\s+/g, " ").trim();
}
__name(extractTextFromPptx, "extractTextFromPptx");
async function extractTextFromXlsx(bytes) {
  const zipText = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true }).decode(bytes);
  const cellRegex = /<(?:v|t)[^>]*>([\s\S]*?)<\/(?:v|t)>/g;
  const parts = [];
  let match;
  while ((match = cellRegex.exec(zipText)) !== null) {
    const val = match[1].trim();
    if (val)
      parts.push(val);
  }
  return parts.join("	").replace(/\t+/g, "	").trim();
}
__name(extractTextFromXlsx, "extractTextFromXlsx");

// src/workflows/DocumentIngestionWorkflow.ts
init_rag();
var DocumentIngestionWorkflow = class {
  env;
  constructor(env2) {
    this.env = env2;
  }
  async run(event, step) {
    const { document_id, project_id, r2_key, file_type, document_name } = event.payload;
    await step.do("mark-processing", async () => {
      await this.env.DB.prepare(`
        UPDATE documents SET status = 'processing', updated_at = ? WHERE id = ?
      `).bind(now(), document_id).run();
      await this.logStep(document_id, "processing", "Document marked as processing");
    });
    const rawBytes = await step.do("fetch-from-r2", async () => {
      const object = await this.env.DOCUMENTS_BUCKET.get(r2_key);
      if (!object)
        throw new Error(`Document not found in R2: ${r2_key}`);
      return await object.arrayBuffer();
    });
    const { text, method, pageCount } = await step.do("extract-text", async () => {
      let extractedText = "";
      let extractionMethod = "text";
      let pages = 1;
      const imageTypes = ["png", "jpg", "jpeg", "gif", "webp"];
      const ft = file_type;
      if (imageTypes.includes(ft)) {
        extractedText = await this.extractImageContent(rawBytes, ft);
        extractionMethod = "vision";
      } else {
        extractedText = await extractTextFromBuffer(rawBytes, ft);
        extractionMethod = "text";
        const wordCount = extractedText.split(/\s+/).length;
        pages = Math.max(1, Math.ceil(wordCount / 250));
      }
      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error(`Failed to extract meaningful text from ${document_name}. Extracted: "${extractedText.substring(0, 100)}"`);
      }
      await this.logStep(document_id, "extracted", `Extracted ${extractedText.length} chars via ${extractionMethod}`);
      return { text: extractedText, method: extractionMethod, pageCount: pages };
    });
    const chunks = await step.do("chunk-document", async () => {
      const chunkResults = chunkDocument(text, file_type, { maxTokens: 400 });
      await this.logStep(document_id, "chunked", `Created ${chunkResults.length} chunks`);
      return chunkResults;
    });
    await step.do("clear-old-chunks", async () => {
      const oldChunks = await this.env.DB.prepare(
        "SELECT vector_id FROM document_chunks WHERE document_id = ? AND vector_id IS NOT NULL"
      ).bind(document_id).all();
      if (oldChunks.results.length > 0) {
        const vectorIds = oldChunks.results.map((c) => c.vector_id);
        await this.env.VECTORIZE.deleteByIds(vectorIds);
      }
      await this.env.DB.prepare("DELETE FROM document_chunks WHERE document_id = ?").bind(document_id).run();
    });
    const BATCH_SIZE = 5;
    let processedChunks = 0;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      await step.do(`embed-batch-${Math.floor(i / BATCH_SIZE)}`, async () => {
        await Promise.all(
          batch.map(async (chunk) => {
            const chunkId = generateId2("chunk");
            const vectorId = `v_${chunkId}`;
            let embedding;
            try {
              embedding = await generateEmbedding(chunk.content, this.env);
            } catch {
              await this.env.DB.prepare(`
                INSERT INTO document_chunks (id, document_id, project_id, content, chunk_index, chunk_type, token_count, section_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(chunkId, document_id, project_id, chunk.content, chunk.chunk_index, chunk.chunk_type, chunk.token_count, chunk.section_path ?? null).run();
              return;
            }
            await indexChunk(vectorId, embedding, {
              chunk_id: chunkId,
              document_id,
              project_id,
              chunk_type: chunk.chunk_type,
              section_path: chunk.section_path,
              page_number: chunk.page_number ?? 1
            }, this.env);
            await this.env.DB.prepare(`
              INSERT INTO document_chunks (id, document_id, project_id, content, chunk_index, chunk_type, vector_id, token_count, page_number, section_path)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              chunkId,
              document_id,
              project_id,
              chunk.content,
              chunk.chunk_index,
              chunk.chunk_type,
              vectorId,
              chunk.token_count,
              chunk.page_number ?? null,
              chunk.section_path ?? null
            ).run();
            processedChunks++;
          })
        );
        const progress = Math.min(95, Math.round((i + batch.length) / chunks.length * 90));
        await this.env.DB.prepare("UPDATE workflow_runs SET progress = ? WHERE document_id = ?").bind(progress, document_id).run();
      });
    }
    await step.do("finalize", async () => {
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      await this.env.DB.prepare(`
        UPDATE documents
        SET status = 'indexed',
            extraction_method = ?,
            word_count = ?,
            page_count = ?,
            updated_at = ?
        WHERE id = ?
      `).bind(method, wordCount, pageCount, now(), document_id).run();
      await this.env.DB.prepare(`
        UPDATE workflow_runs
        SET status = 'completed', progress = 100,
            result = ?, completed_at = ?
        WHERE document_id = ?
      `).bind(
        JSON.stringify({
          chunks_created: processedChunks,
          word_count: wordCount,
          page_count: pageCount,
          extraction_method: method
        }),
        now(),
        document_id
      ).run();
      await this.logStep(document_id, "completed", `Indexed ${processedChunks} chunks, ${wordCount} words`);
    });
    return {
      success: true,
      document_id,
      chunks_created: processedChunks,
      message: `Successfully indexed "${document_name}"`
    };
  }
  // ──────────────────────────────────────────
  // Image/OCR via Workers AI Vision
  // ──────────────────────────────────────────
  async extractImageContent(buffer, fileType) {
    const uint8 = new Uint8Array(buffer);
    try {
      const result = await this.env.AI.run("@cf/llava-hf/llava-1.5-7b-hf", {
        image: Array.from(uint8),
        prompt: "Please carefully read and transcribe all text visible in this image. Include headings, body text, captions, labels, and any other textual content. Preserve the reading order. After transcription, briefly describe the visual content.",
        max_tokens: 2048
      });
      return result.description ?? result.response ?? "Image content could not be extracted";
    } catch {
      return `[Image file: ${fileType}] - Content extraction requires OCR processing`;
    }
  }
  async logStep(documentId, status, message) {
    try {
      const run = await this.env.DB.prepare(
        "SELECT steps_log FROM workflow_runs WHERE document_id = ?"
      ).bind(documentId).first();
      const existingLog = run?.steps_log ? JSON.parse(run.steps_log) : [];
      existingLog.push({ step: status, status: "completed", result: message, ts: now() });
      await this.env.DB.prepare(
        "UPDATE workflow_runs SET steps_log = ? WHERE document_id = ?"
      ).bind(JSON.stringify(existingLog), documentId).run();
    } catch {
    }
  }
};
__name(DocumentIngestionWorkflow, "DocumentIngestionWorkflow");

// src/index.ts
var ProjectDurableObject = class {
  state;
  env;
  constructor(state, env2) {
    this.state = state;
    this.env = env2;
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/state") {
      const stored = await this.state.storage.get("ps") ?? {};
      return Response.json(stored);
    }
    if (request.method === "PUT" && url.pathname === "/state") {
      const body = await request.json();
      const current = await this.state.storage.get("ps") ?? {};
      const merged = { ...current, ...body, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      await this.state.storage.put("ps", merged);
      return Response.json(merged);
    }
    if (request.method === "DELETE") {
      await this.state.storage.deleteAll();
      return Response.json({ deleted: true });
    }
    return new Response("Not Found", { status: 404 });
  }
};
__name(ProjectDurableObject, "ProjectDurableObject");
var ProposalAnalysisWorkflow = class {
  env;
  constructor(env2) {
    this.env = env2;
  }
  async run(event, step) {
    const { project_id, document_ids, analysis_types } = event.payload;
    const results = {};
    for (const t of analysis_types) {
      results[t] = await step.do(`analyse-${t}`, async () => {
        const id = `${t}_${Date.now()}`;
        await this.env.DB.prepare(
          "INSERT INTO workflow_runs (id, project_id, workflow_type, status, progress) VALUES (?,?,?,'running',0)"
        ).bind(id, project_id, `proposal_${t}`).run();
        return { run_id: id, status: "queued", doc_count: document_ids.length };
      });
    }
    return { success: true, project_id, results };
  }
};
__name(ProposalAnalysisWorkflow, "ProposalAnalysisWorkflow");
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Project-ID",
    "Access-Control-Max-Age": "86400"
  };
}
__name(corsHeaders, "corsHeaders");
function withCORS(response, origin) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, headers });
}
__name(withCORS, "withCORS");
var src_default = {
  async fetch(request, env2) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const origin = request.headers.get("Origin") ?? void 0;
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    try {
      let response;
      if (pathname.startsWith("/ws/") && request.headers.get("Upgrade") === "websocket") {
        response = await handleWebSocket(request, env2, pathname);
      } else if (pathname.startsWith("/api/")) {
        response = await routeAPI(request, env2, pathname);
      } else if (pathname === "/health") {
        response = new Response(
          JSON.stringify({ status: "ok", app: env2.APP_NAME, ts: (/* @__PURE__ */ new Date()).toISOString() }),
          { headers: { "Content-Type": "application/json" } }
        );
      } else {
        response = await serveStaticAssets(request, env2, pathname);
      }
      return withCORS(response, origin);
    } catch (err) {
      console.error("Unhandled error:", err);
      return withCORS(
        apiError(`Internal server error: ${err instanceof Error ? err.message : String(err)}`, 500),
        origin
      );
    }
  }
};
async function routeAPI(request, env2, pathname) {
  if (pathname.match(/^\/api\/projects(\/.*)?$/))
    return handleProjects(request, env2);
  if (pathname.match(/^\/api\/documents(\/.*)?$/))
    return handleDocuments(request, env2);
  if (pathname === "/api/upload" && request.method === "POST")
    return uploadDocument(request, env2);
  if (pathname.match(/^\/api\/qa(\/.*)?$/))
    return handleQA(request, env2);
  if (pathname.match(/^\/api\/compliance(\/.*)?$/))
    return handleCompliance(request, env2);
  if (pathname.match(/^\/api\/conversations(\/.*)?$/))
    return handleConversations(request, env2);
  if (pathname.match(/^\/api\/brain(\/.*)?$/))
    return handleBrain(request, env2);
  if (pathname === "/api/chat" && request.method === "POST")
    return handleChat(request, env2);
  if (pathname.startsWith("/api/workflows"))
    return handleWorkflows(request, env2);
  if (pathname === "/api/search" && request.method === "POST")
    return handleSearch(request, env2);
  if (pathname.match(/^\/api\/tasks(\/.*)?$/) && request.method === "POST")
    return handleTaskApproval(request, env2, pathname);
  return apiError(`API endpoint not found: ${pathname}`, 404);
}
__name(routeAPI, "routeAPI");
async function handleWebSocket(request, env2, pathname) {
  const match = pathname.match(/^\/ws\/(.+)$/);
  if (!match)
    return apiError("Invalid WebSocket path", 400);
  const conversationId = match[1];
  const id = env2.CONVERSATION_DO.idFromName(conversationId);
  const stub = env2.CONVERSATION_DO.get(id);
  return stub.fetch(new Request("https://internal/ws", {
    method: "GET",
    headers: request.headers
  }));
}
__name(handleWebSocket, "handleWebSocket");
async function handleSearch(request, env2) {
  const { executeRAG: executeRAG2 } = await Promise.resolve().then(() => (init_rag(), rag_exports));
  const body = await request.json();
  if (!body.query)
    return apiError("query is required", 400);
  const ctx = await executeRAG2(body.query, env2, {
    project_id: body.project_id,
    top_k: body.top_k ?? 8,
    rerank: true
  });
  return new Response(JSON.stringify({
    success: true,
    data: {
      citations: ctx.citations,
      total_chunks: ctx.total_chunks,
      tokens_used: ctx.tokens_used
    }
  }), { headers: { "Content-Type": "application/json" } });
}
__name(handleSearch, "handleSearch");
async function handleChat(request, env2) {
  const body = await request.json();
  if (!body.content?.trim())
    return apiError("content is required", 400);
  const conversationId = body.conversation_id || generateId("conv");
  const existing = await env2.DB.prepare("SELECT id FROM conversations WHERE id = ?").bind(conversationId).first();
  if (!existing) {
    await env2.DB.prepare("INSERT INTO conversations (id, project_id, title, mode) VALUES (?, ?, ?, ?)").bind(
      conversationId,
      body.project_id ?? null,
      "Chat conversation",
      "chat"
    ).run();
  }
  const userMessageId = generateId("msg");
  await env2.DB.prepare("INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)").bind(userMessageId, conversationId, "user", body.content).run();
  let responseText = `Got it. I heard: "${body.content.trim()}".`;
  if (body.project_id) {
    const docs = await env2.DB.prepare("SELECT name FROM documents WHERE project_id = ? LIMIT 2").bind(body.project_id).all();
    if (docs.results.length > 0) {
      responseText += ` I also found ${docs.results.length} knowledge documents in this project: ${docs.results.map((d) => d.name).join(", ")}.`;
    }
  }
  const assistantMessageId = generateId("msg");
  await env2.DB.prepare("INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)").bind(assistantMessageId, conversationId, "assistant", responseText).run();
  const messages = await env2.DB.prepare("SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC").bind(conversationId).all();
  return apiJson({ success: true, data: { conversation_id: conversationId, response: responseText, messages: messages.results } });
}
__name(handleChat, "handleChat");
async function handleTaskApproval(request, env2, pathname) {
  const match = pathname.match(/^\/api\/tasks\/([^/]+)\/approve$/);
  if (!match)
    return apiError("Invalid task approval path", 400);
  const taskId = match[1];
  const body = await request.json();
  const task = await env2.DB.prepare("SELECT conversation_id FROM agent_tasks WHERE id = ?").bind(taskId).first();
  if (!task)
    return apiError("Task not found", 404);
  const convId = body.conversation_id ?? task.conversation_id;
  const id = env2.CONVERSATION_DO.idFromName(convId);
  const stub = env2.CONVERSATION_DO.get(id);
  return stub.fetch(new Request("https://internal/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId, approved: body.approved, reason: body.reason })
  }));
}
__name(handleTaskApproval, "handleTaskApproval");
async function serveStaticAssets(request, env2, pathname) {
  try {
    const assetResponse = await env2.ASSETS.fetch(request);
    if (assetResponse.status !== 404)
      return assetResponse;
    const indexRequest = new Request(new URL("/index.html", request.url).toString(), request);
    return env2.ASSETS.fetch(indexRequest);
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
__name(serveStaticAssets, "serveStaticAssets");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-9MF9Rn/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-9MF9Rn/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  ConversationDurableObject,
  DocumentIngestionWorkflow,
  ProjectDurableObject,
  ProposalAnalysisWorkflow,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
