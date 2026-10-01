/**
 * Loaded by `npm test` (node --import) before the unit tests.
 * Library sources import each other without an extension ('../tokens/tokens'), as Vite and tsc
 * expect. Node needs the file name, so when a relative import is not found, try it with '.ts'.
 */
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (error?.code !== 'ERR_MODULE_NOT_FOUND' || !/^\.\.?\//.test(specifier)) throw error;
      return nextResolve(`${specifier}.ts`, context);
    }
  },
});
