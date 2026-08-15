// __wrapper__.ts - Fixed wrapper entrypoint
// Defines Node.js polyfill before importing the compiled app

// Define minimal Node.js polyfill
const process = {
  version: '3.3.0',
  platform: 'browser',
  env: {},
  versions: { node: '20.11.0' },
  nextTick: (cb, ...args) => setImmediate(cb, ...args),
  getBuiltinModule: function(name: string) {
    return undefined;
  },
  emitWarning: (msg: string) => console.warn('[PROCESS WARNING]', msg),
  cwd: () => '/',
  activeHandles: [] as any[],
  activeRequests: [] as any[]
};

if (!self.process) {
  self.process = process;
}

if (!self.global) {
  self.global = self;
}

// Import the compiled app
// Note: Ensure index.js exists in the same directory
import './index.js';

// Expose default export
export { default };
