# Vercel Deployment Documentation

## Issue: `ERR_MODULE_NOT_FOUND` in Serverless Functions

When deploying an Express backend as serverless functions on Vercel using `vite-plugin-vercel` or a custom `api/index.ts` entry point, you might encounter an error like this in the Vercel connection logs:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/server' imported from /var/task/api/index.js
```

### Cause

This error occurs due to how Node.js resolves ES Modules (ESM) in the compiled Vercel serverless environment. When TypeScript is compiled to ESM (which is often the default behavior or enforced by `package.json` with `"type": "module"`), relative module imports must be fully specified with their file extensions to be correctly resolved by the Node.js ESM loader.

In the case of `api/index.ts`, if it contains:
`import app from '../server';`

Vercel's build process might compile it to `api/index.js`, but leaves the import path as `../server`. The Node.js ESM loader fails to find a file exactly named `server` (without an extension) and throws the `ERR_MODULE_NOT_FOUND` error.

### Solution

To fix this, you must explicitly include the `.js` extension in your relative imports within the serverless function entry files, even if the source file is a `.ts` file. 

The TypeScript compiler (and build tools like `esbuild` or Vercel's internal bundler) will correctly map the `.js` import to the compiled `.js` output.

**Example Fix in `api/index.ts`:**

Change:
```typescript
import app from '../server'; // ❌ Without extension will fail in Vercel ESM
```

To:
```typescript
import app from '../server.js'; // ✅ With .js extension will work
```

By adding `.js`, Node.js knows exactly which compiled file to look for when the function executes in the Vercel environment.
