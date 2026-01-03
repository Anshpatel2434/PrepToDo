# Supabase Edge Function Deployment Guide
## For Daily Content Generation Worker

---

## 📋 Table of Contents
1. [Error Analysis](#error-analysis)
2. [Solution Overview](#solution-overview)
3. [Prerequisites](#prerequisites)
4. [Deployment Workflow](#deployment-workflow)
5. [Configuration Details](#configuration-details)
6. [Testing the Deployment](#testing-the-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🔴 Error Analysis

### The Original Error
When running `node scripts/bundle-edge-function.js`, you encountered errors like:

```
X [ERROR] Could not resolve "path"
X [ERROR] Could not resolve "fs"
X [ERROR] Could not resolve "vm"
X [ERROR] Could not resolve "http"
X [ERROR] Could not resolve "https"
X [ERROR] Could not resolve "crypto"
X [ERROR] Could not resolve "stream"
```

### Root Cause
1. **JSDOM is Node.js-only**: The code imported `JSDOM` from the `jsdom` package, which is designed for Node.js environments
2. **JSDOM depends on Node.js built-ins**: Under the hood, JSDOM requires Node.js built-in modules (`fs`, `vm`, `path`, `http`, `https`, `crypto`, `stream`, etc.)
3. **Deno Edge Runtime != Node.js**: Supabase Edge Functions run on Deno, not Node.js. Deno has a completely different architecture and doesn't support Node.js built-in modules
4. **esbuild platform: "neutral"**: The bundler was correctly set to target a neutral platform (for Deno), which doesn't include Node.js built-ins, exposing the incompatibility

### Why This Matters
- Supabase Edge Functions run in a **Deno-based edge runtime**
- Deno uses V8 but has its own standard library and security model
- Node.js-specific packages like JSDOM, fs, vm, etc. **cannot run** in Deno edge functions
- All dependencies must be either:
  - Pure JavaScript/TypeScript (no Node.js built-ins)
  - Deno-compatible
  - Available via CDN (esm.sh, deno.land/x, etc.)

---

## ✅ Solution Overview

### What Was Changed
1. **Removed JSDOM dependency** from `package.json`
2. **Replaced JSDOM with regex-based HTML parsing** in `fetchArticleText.ts`
   - This is Deno-compatible and has no external dependencies
   - Extracts text from HTML using regex patterns
   - Removes noisy tags (script, style, nav, etc.)
   - Decodes HTML entities
   - Performs the same text extraction logic as the original JSDOM version

### Key Benefits
- ✅ No Node.js built-in module dependencies
- ✅ Works in Deno edge runtime
- ✅ Maintains the same functionality (text extraction from article URLs)
- ✅ Smaller bundle size (no JSDOM and its dependencies)
- ✅ Faster deployment (fewer dependencies to bundle)

---

## 📦 Prerequisites

### Required Tools
Ensure you have the following installed:

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

3. **Supabase CLI** (latest version)
   ```bash
   supabase --version
   ```
   If not installed:
   ```bash
   npm install -g supabase
   ```

4. **Deno** (for local testing, optional)
   ```bash
   deno --version
   ```
   If not installed:
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

### Required Environment Variables
Create a `.env` file in your project root with:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
```

### Required Supabase Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and service role key from:
   - Project Settings → API
3. Ensure your database has the required tables:
   - `exams`
   - `passages`
   - `questions`
   - `graph_nodes`
   - `graph_edges`

---

## 🚀 Deployment Workflow

### Step 1: Navigate to Services Directory
```bash
cd services
```

### Step 2: Install Dependencies
```bash
npm install
```

**Note**: We removed `jsdom` from dependencies, so you may need to clean your `node_modules`:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Step 3: Bundle the Edge Function
```bash
npm run bundle:edge
```

**What this does:**
- Runs `scripts/bundle-edge-function.js`
- Uses esbuild to bundle all TypeScript files in `workers/daily-content/`
- Converts npm imports to Deno-compatible CDN URLs (esm.sh)
- Creates `supabase/functions/daily-content/bundled.ts`

**Expected output:**
```
🔨 Bundling teach-concept function...
📂 Services dir: /path/to/services
📂 Root dir: /path/to/project
📍 Entry point: /path/to/services/workers/daily-content/runDailyContent.ts
📦 Running esbuild...
🔄 Converting imports to Deno-compatible format...
✅ Bundle created: /path/to/supabase/functions/daily-content/bundled.ts
📦 Size: XXX.XX KB
📚 External dependencies: X
```

### Step 4: Set Supabase Environment Variables (for deployment)
You need to set environment variables for the deployed function:

```bash
# Option 1: Using Supabase CLI
supabase functions deploy daily-content --env-file ../.env

# Option 2: Set individual variables
supabase secrets set OPENAI_API_KEY=your-openai-api-key
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 5: Deploy to Supabase
```bash
supabase functions deploy daily-content
```

**What this does:**
- Bundles the function using Deno
- Uploads it to Supabase Cloud
- Makes it available at: `https://your-project.supabase.co/functions/v1/daily-content`

**Expected output:**
```
Bundling daily-content with Deno...
Deploying daily-content...
Deployed Function daily-content
https://your-project.supabase.co/functions/v1/daily-content
```

### Step 6: Deploy with Environment Variables (All-in-One Command)
You can also pass environment variables during deployment:

```bash
supabase functions deploy daily-content \
  --env-file ../.env
```

**Or use secrets:**
```bash
supabase functions deploy daily-content \
  --project-ref your-project-ref
```

---

## ⚙️ Configuration Details

### Deno Configuration (`supabase/functions/daily-content/deno.json`)

```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "lib": ["deno.window", "deno.unstable"]
  },
  "imports": {
    "@supabase/functions-js/edge-runtime.d.ts": "jsr:@supabase/functions-js/edge-runtime.d.ts"
  },
  "tasks": {
    "dev": "deno run --allow-net --allow-env --watch index.ts"
  },
  "fmt": {
    "useTabs": false,
    "indentWidth": 2,
    "semiColons": false,
    "singleQuote": false
  },
  "lint": {
    "rules": {
      "tags": ["recommended"]
    }
  }
}
```

### What Each Setting Does

| Setting | Purpose |
|---------|---------|
| `strict: true` | Enables TypeScript strict mode |
| `lib: ["deno.window", "deno.unstable"]` | Includes Deno type definitions |
| `imports` | Maps npm-like imports to Deno-compatible URLs (JSR) |
| `allow-net` | Allows network access (for API calls, fetch, etc.) |
| `allow-env` | Allows environment variable access |
| `allow-read` | Allows file system reading (not used, but may be needed) |

### Why Deno Configuration Matters

1. **Type Safety**: Ensures type definitions are available for Deno APIs
2. **Security Model**: Deno requires explicit permissions for network, env, file access
3. **Import Maps**: Maps npm packages to Deno-compatible CDN URLs
4. **Code Quality**: Linting and formatting rules for consistency

### esbuild Bundle Configuration (`services/scripts/bundle-edge-function.js`)

```javascript
{
  entryPoints: [entryPoint],
  bundle: true,              // Bundle all dependencies
  platform: "neutral",       // Target neutral platform (for Deno)
  format: "esm",              // ES modules format
  target: "es2020",           // ES2020 target
  write: false,               // Return output instead of writing
  minify: false,              // Keep readable for debugging
  sourcemap: false,           // No source maps for now
  mainFields: ["module", "main"],
  resolveExtensions: [".ts", ".js", ".json"],
}
```

### Why `platform: "neutral"`?

- **`"neutral"`**: Targets a platform-agnostic environment (Deno)
  - Excludes Node.js built-ins (fs, path, vm, etc.)
  - Excludes browser-specific APIs
  - Only includes standard JavaScript/TypeScript features

- **Why not `"node"`?** Would include Node.js built-ins, which don't work in Deno

- **Why not `"browser"`?** Would exclude server-side features needed by the function

---

## 🧪 Testing the Deployment

### Option 1: Test Locally (Supabase Local Development)

#### Start Local Supabase
```bash
# From project root
supabase start
```

This starts:
- Local Postgres database
- Local Supabase API
- Local Edge Functions runtime

#### Set Local Environment Variables
```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key
supabase secrets set SUPABASE_URL=http://localhost:54321
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-anon-key
```

#### Serve the Function Locally
```bash
supabase functions serve daily-content
```

#### Test with curl
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/daily-content' \
  --header 'Authorization: Bearer your-anon-key' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

### Option 2: Test on Supabase Cloud

#### Invoke the Deployed Function
```bash
curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/daily-content' \
  --header 'Authorization: Bearer your-anon-key-or-service-role-key' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

#### Check Logs
```bash
supabase functions logs daily-content
```

### Expected Response Structure

**Success:**
```json
{
  "success": true,
  "data": {
    "exam": { /* exam data */ },
    "passage": { /* passage data */ },
    "questions": [ /* array of questions */ ]
  }
}
```

**Error:**
```json
{
  "error": "Daily content generation failed",
  "details": "Error message here"
}
```

---

## 📊 Monitoring and Logs

### View Real-Time Logs
```bash
supabase functions logs daily-content --tail
```

### View All Logs
```bash
supabase functions logs daily-content
```

### View Logs with Filters
```bash
supabase functions logs daily-content --since 1h
```

---

## 🐛 Troubleshooting

### Issue 1: "Could not resolve 'path/fs/vm'" During Bundle
**Cause**: JSDOM or another Node.js-only package is being imported

**Solution**:
- Remove the Node.js-only package from `package.json`
- Replace with Deno-compatible alternative
- Ensure no imports use Node.js built-ins

### Issue 2: "process.env is undefined"
**Cause**: Environment variables not set for the function

**Solution**:
```bash
supabase secrets set VAR_NAME=value
supabase functions deploy daily-content --env-file .env
```

### Issue 3: "Fetch failed" or Network Errors
**Cause**: Network permissions not granted in Deno

**Solution**: Ensure `deno.json` has:
```json
"tasks": {
  "dev": "deno run --allow-net --allow-env index.ts"
}
```

### Issue 4: "Module not found" for External Packages
**Cause**: Package not available via esm.sh or import map issue

**Solution**:
- Check if package is available at https://esm.sh/package-name
- Update `PACKAGE_MAP` in `scripts/bundle-edge-function.js`
- Use `@supabase/supabase-js@2` format with version pinning

### Issue 5: Function Timeout (Maximum 15 minutes for Edge Functions)
**Cause**: The workflow takes too long

**Solution**:
- Split into multiple functions
- Use Supabase Jobs (for long-running tasks)
- Optimize LLM calls (batch, parallel, cache)

### Issue 6: "Too many imports" or Bundle Size Too Large
**Cause**: Including unnecessary dependencies

**Solution**:
- Use tree-shaking in esbuild
- Remove unused imports
- Consider splitting into smaller functions

### Issue 7: CORS Errors When Calling from Frontend
**Cause**: CORS headers not properly configured

**Solution**: Ensure `index.ts` has:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-frontend-domain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

---

## 📚 Additional Resources

### Official Documentation
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Deno Documentation](https://deno.land/manual)
- [esm.sh CDN](https://esm.sh/)

### Best Practices
1. **Keep functions small**: Split large workflows into smaller, focused functions
2. **Use environment variables**: Never hardcode API keys
3. **Set appropriate timeouts**: Consider the complexity of your workflow
4. **Monitor logs**: Regularly check function logs for errors
5. **Version control**: Keep your code in git for rollback capability
6. **Test locally**: Always test locally before deploying to production

---

## 🔄 Quick Reference Commands

```bash
# Install dependencies
npm install

# Bundle function
npm run bundle:edge

# Set secrets
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set SUPABASE_URL=your-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key

# Deploy function
supabase functions deploy daily-content

# Deploy with env file
supabase functions deploy daily-content --env-file ../.env

# View logs
supabase functions logs daily-content --tail

# Test locally
supabase start
supabase functions serve daily-content
curl -X POST http://127.0.0.1:54321/functions/v1/daily-content \
  -H "Authorization: Bearer your-key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## ✨ Summary

### What Was Fixed
- ✅ Removed JSDOM dependency (Node.js-only)
- ✅ Replaced with Deno-compatible regex-based HTML parsing
- ✅ No more Node.js built-in module errors
- ✅ Bundle now compiles successfully for Deno

### How to Deploy
1. `cd services`
2. `npm install`
3. `npm run bundle:edge`
4. `supabase secrets set VAR_NAME=value`
5. `supabase functions deploy daily-content`

### Key Takeaways
- **Deno ≠ Node.js**: Don't assume Node.js packages work in Deno
- **Use Deno-compatible alternatives**: Replace Node.js-only packages
- **Platform: "neutral"**: Essential for Deno edge function bundles
- **Test locally**: Use `supabase start` and `supabase functions serve` for testing
- **Monitor logs**: Always check logs after deployment

---

**Last Updated**: 2025-01-03
**Version**: 1.0.0
