# Supabase Edge Functions - Error Resolution and Deployment Guide

## 🔴 The Error You Encountered

When running `node scripts/bundle-edge-function.js`, you received **57 errors** like these:

```
X [ERROR] Could not resolve "path"
X [ERROR] Could not resolve "fs"
X [ERROR] Could not resolve "vm"
X [ERROR] Could not resolve "http"
X [ERROR] Could not resolve "https"
X [ERROR] Could not resolve "crypto"
X [ERROR] Could not resolve "stream"
... (57 total errors)
```

---

## 💡 Why This Happened

### Root Cause
Your code imported **JSDOM** from the `jsdom` package:

```typescript
import { JSDOM } from "jsdom";
```

**The Problem:**
1. **JSDOM is Node.js-only**: It's designed to run in Node.js environments, not Deno
2. **JSDOM requires Node.js built-ins**: Under the hood, it uses `fs`, `vm`, `path`, `http`, `https`, `crypto`, `stream`, etc.
3. **Supabase Edge Functions run on Deno**: Deno has a completely different architecture and doesn't support Node.js built-in modules
4. **esbuild platform: "neutral"**: Your bundler was correctly set to target Deno, which doesn't include Node.js built-ins

### The Mismatch

```
Node.js Environment          Deno Edge Runtime
━━━━━━━━━━━━━━━━━━━━━━━━    ━━━━━━━━━━━━━━━━━━━━━━━━
✅ fs, vm, path, crypto     ❌ These don't exist
✅ JSDOM works              ❌ JSDOM fails
✅ Node.js packages         ❌ Only Deno-compatible code
```

---

## ✅ What I Fixed

### 1. Replaced JSDOM with Deno-Compatible HTML Parsing

**File**: `services/workers/daily-content/retrieval/articleHandling/fetchArticleText.ts`

**Before** (Node.js-only):
```typescript
import { JSDOM } from "jsdom";

const dom = new JSDOM(html);
const document = dom.window.document;
const text = document.querySelector("article")?.textContent;
```

**After** (Deno-compatible):
```typescript
// No external imports needed!

// Remove script/style tags with regex
let cleanedHtml = html.replace(/<script[\s\S]*?<\/script>/gi, "");

// Extract content from <article> tag
const match = cleanedHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
const extractedContent = match?.[1] || "";

// Remove all HTML tags
let text = extractedContent.replace(/<[^>]+>/g, " ");

// Decode HTML entities and normalize
text = text.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
```

**What this does:**
- ✅ Removes noisy tags (script, style, nav, footer, etc.)
- ✅ Extracts content from semantic HTML tags (article, main, etc.)
- ✅ Decodes HTML entities (&nbsp;, &amp;, etc.)
- ✅ Normalizes whitespace
- ✅ Same safety checks as before
- ✅ **NO Node.js built-in modules**

### 2. Removed JSDOM Dependency

**File**: `services/package.json`

```diff
"dependencies": {
  "@supabase/supabase-js": "^2.89.0",
  "dotenv": "^17.2.3",
- "jsdom": "^27.4.0",
  "openai": "^6.15.0",
  "supabase": "^2.70.5",
  "zod": "^4.3.4"
}
```

### 3. Updated Bundle Script and Configuration

**Updated**:
- ✅ Bundle script targets `daily-content` function
- ✅ Output directory: `supabase/functions/daily-content/bundled.ts`
- ✅ Deploy command updated accordingly

### 4. Created Edge Function Entry Point

**File**: `supabase/functions/daily-content/index.ts`

**Features**:
- ✅ CORS headers configured
- ✅ OPTIONS request handling
- ✅ Error handling
- ✅ Imports from bundled file
- ✅ POST request validation

---

## 🧪 Verification

### Bundle Test - SUCCESS! ✅

```bash
$ cd services && npm run bundle:edge

🔨 Bundling daily-content function...
📂 Services dir: /home/engine/project/services
📂 Root dir: /home/engine/project
📍 Entry point: /home/engine/project/services/workers/daily-content/runDailyContent.ts
📦 Running esbuild...
🔄 Converting imports to Deno-compatible format...
✅ Bundle created: /home/engine/project/supabase/functions/daily-content/bundled.ts
📦 Size: 1422.18 KB
📚 External dependencies: 1

Deploy with:
  cd .. && supabase functions deploy daily-content
```

**Result**:
- ✅ **0 errors** (down from 57!)
- ✅ Bundle size: 1.4 MB (reasonable)
- ✅ Ready for deployment

---

## 🚀 Deployment Workflow

### Step-by-Step Commands

```bash
# 1. Navigate to services directory
cd services

# 2. Install dependencies (if not done already)
npm install

# 3. Bundle the edge function
npm run bundle:edge

# 4. Set environment variables (if not already set)
supabase secrets set OPENAI_API_KEY=your-openai-api-key
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 5. Deploy to Supabase
supabase functions deploy daily-content

# 6. Test the function
curl -X POST https://your-project.supabase.co/functions/v1/daily-content \
  -H "Authorization: Bearer your-service-role-key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### One-Command Deployment

```bash
cd services && npm run deploy:edge
```

---

## 📋 Configuration Details

### Why Deno Configuration Matters

**File**: `supabase/functions/daily-content/deno.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "lib": ["deno.window", "deno.unstable"]
  },
  "tasks": {
    "dev": "deno run --allow-net --allow-env --watch index.ts"
  }
}
```

**Key Settings Explained**:

| Setting | Purpose |
|---------|---------|
| `strict: true` | TypeScript strict mode for type safety |
| `lib: ["deno.window", "deno.unstable"]` | Includes Deno type definitions |
| `--allow-net` | Allows network access (for API calls) |
| `--allow-env` | Allows environment variable access |

**Why This Matters**:
- Deno has a security model that requires explicit permissions
- Unlike Node.js, Deno doesn't allow network or env access by default
- These permissions must be specified when running or deploying functions

### Why esbuild Uses platform: "neutral"

**File**: `services/scripts/bundle-edge-function.js`

```javascript
const result = await build({
  platform: "neutral",  // ← Important!
  format: "esm",
  target: "es2020",
  // ...
});
```

**Platform Options**:

| Platform | Includes | Use Case |
|----------|----------|----------|
| `"node"` | Node.js built-ins (fs, vm, path, etc.) | Node.js applications |
| `"browser"` | Browser APIs (window, document, etc.) | Frontend code |
| `"neutral"` | Standard JS only | Deno, Cloudflare Workers, etc. |

**Why "neutral" for Deno**:
- Deno is not Node.js → can't use `"node"`
- Deno is not a browser → can't use `"browser"`
- `"neutral"` targets platform-agnostic JavaScript → perfect for Deno

---

## 🔍 Understanding Deno Edge Runtime

### Deno vs Node.js

| Feature | Node.js | Deno |
|---------|---------|------|
| Built-in modules | fs, vm, path, http, https, etc. | Different set (no Node.js built-ins) |
| Package manager | npm | Deno.land/x, JSR, or CDNs (esm.sh) |
| Security model | Permissive by default | Explicit permissions required |
| Runtime | Node.js | V8 (different architecture) |
| Type support | TypeScript via compilation | Native TypeScript support |

### What Works in Deno Edge Functions

✅ **Works**:
- Standard JavaScript/TypeScript
- Web APIs (fetch, URL, Text, crypto)
- Deno APIs (Deno.env, Deno.readFile, etc.)
- Pure npm packages (no Node.js built-ins)

❌ **Doesn't Work**:
- Node.js built-in modules (fs, vm, path, http, https, crypto, stream, etc.)
- Node.js-specific packages (JSDOM, express, etc.)
- Any package that requires Node.js built-ins

### Importing External Packages in Deno

**In Node.js**:
```typescript
import { createClient } from "@supabase/supabase-js";
```

**In Deno (via CDN)**:
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
```

**How esbuild Handles This**:
The bundle script automatically converts npm imports to CDN URLs:

```javascript
// In bundle-edge-function.js
const PACKAGE_MAP = {
  "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2",
  openai: "https://esm.sh/openai@4",
};
```

---

## 📚 Documentation Files

I've created three comprehensive guides:

### 1. **DEPLOYMENT_GUIDE.md** (Comprehensive)
- Detailed error analysis
- Step-by-step deployment workflow
- Configuration explanations
- Testing procedures
- Troubleshooting guide
- Best practices

### 2. **QUICKSTART.md** (Quick Reference)
- One-command deployment
- Quick step-by-step guide
- Common issues and solutions

### 3. **SOLUTION_SUMMARY.md** (Technical Summary)
- Complete list of changes made
- Before/after comparison
- Verification results
- Technical deep dive

---

## 🎯 Key Takeaways

### For Deno Edge Functions

1. **Avoid Node.js-only packages**
   - Check if packages use Node.js built-ins
   - Look for Deno-compatible alternatives

2. **Use platform-agnostic code**
   - Prefer standard Web APIs (fetch, URL, crypto)
   - Avoid Node.js-specific APIs (fs, vm, path, etc.)

3. **Use esbuild with platform: "neutral"**
   - Targets Deno edge runtime
   - Excludes Node.js and browser-specific code

4. **Test bundling before deployment**
   - Always run `npm run bundle:edge` first
   - Check for errors before deploying

5. **Set environment variables**
   - Use Supabase secrets or --env-file
   - Never hardcode API keys

### For Your Project

1. **HTML Parsing**: Use regex-based parsing instead of JSDOM
2. **No Node.js Built-ins**: All code is now Deno-compatible
3. **Bundle Size**: 1.4 MB (reasonable for the workflow)
4. **External Dependencies**: Only 1 (OpenAI via esm.sh)
5. **Deployment Ready**: Function is ready to deploy to Supabase

---

## 🐛 Troubleshooting

### Issue: "Could not resolve path/fs/vm" During Bundle
**Cause**: JSDOM or Node.js-only package is being imported
**Solution**:
- Remove the Node.js-only package from `package.json`
- Replace with Deno-compatible alternative
- Ensure no imports use Node.js built-ins

### Issue: "process.env is undefined"
**Cause**: Environment variables not set for the function
**Solution**:
```bash
supabase secrets set VAR_NAME=value
supabase functions deploy daily-content --env-file .env
```

### Issue: "Fetch failed" or Network Errors
**Cause**: Network permissions not granted in Deno
**Solution**: Ensure `deno.json` has:
```json
"tasks": {
  "dev": "deno run --allow-net --allow-env index.ts"
}
```

### Issue: Function Timeout (Maximum 15 minutes)
**Cause**: The workflow takes too long
**Solution**:
- Split into multiple functions
- Use Supabase Jobs (for long-running tasks)
- Optimize LLM calls (batch, parallel, cache)

### Issue: "Module not found" for External Packages
**Cause**: Package not available via esm.sh
**Solution**:
- Check if package is available at https://esm.sh/package-name
- Update `PACKAGE_MAP` in `scripts/bundle-edge-function.js`
- Use version pinning: `@supabase/supabase-js@2`

---

## ✅ Summary

### What Was Fixed
- ✅ Removed JSDOM dependency
- ✅ Replaced with Deno-compatible regex-based HTML parsing
- ✅ Resolved 57 esbuild errors (Node.js built-in modules)
- ✅ Bundle now compiles successfully
- ✅ Function is ready for deployment

### How to Deploy
```bash
cd services
npm install
npm run bundle:edge
supabase secrets set VAR_NAME=value
supabase functions deploy daily-content
```

### Files Modified
1. `services/workers/daily-content/retrieval/articleHandling/fetchArticleText.ts` - Replaced JSDOM
2. `services/package.json` - Removed jsdom dependency
3. `services/scripts/bundle-edge-function.js` - Updated for daily-content
4. `supabase/functions/daily-content/index.ts` - Created edge function entry point

### Files Created
1. `DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
2. `QUICKSTART.md` - Quick start guide
3. `SOLUTION_SUMMARY.md` - Technical summary

---

**Status**: ✅ All errors resolved, deployment ready
**Bundle Size**: 1.4 MB
**Errors Before**: 57
**Errors After**: 0
**Deployment Ready**: Yes
