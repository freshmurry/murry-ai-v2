// Export a default fetch handler that safely initializes the app
export default {
  fetch(request: Request): Response {
    try {
      // Suppress the getBuiltinModule error by ensuring process.polyfills exist
      if (!(self as any).process) {
        (self as any).process = (globalThis as any).process || {};
      }
      if (!(self as any).process as any).getBuiltinModule {
        (self as any).process as any).getBuiltinModule = function() {
          return undefined;
        };
      }
      
      // Now load your compiled app
      return import('../index.js').then((mod) => {
        return mod.default?.apply({ request }) || mod.handle?.(request) || new Response('App loaded');
      });
    } catch (e) {
      console.error('Initialization error:', e);
      return new Response('Application error: ' + e.message, { status: 500 });
    }
  }
};
