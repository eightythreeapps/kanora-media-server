// Mock import.meta.env for Vite compatibility in Jest
globalThis.importMeta = { env: { VITE_API_URL: 'http://localhost:3333' } };
Object.defineProperty(globalThis, 'import', {
  value: { meta: globalThis.importMeta },
  configurable: true,
});
