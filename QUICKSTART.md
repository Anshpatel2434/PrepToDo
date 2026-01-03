# Quick Start: Deploy Daily Content Edge Function

## 🚀 One-Command Deployment

```bash
# From the project root
cd services && npm run deploy:edge
```

## 📋 Step-by-Step Guide

### 1. Install Dependencies
```bash
cd services
npm install
```

### 2. Set Environment Variables
Create a `.env` file in your project root:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

### 3. Bundle the Function
```bash
npm run bundle:edge
```

### 4. Deploy to Supabase
```bash
supabase functions deploy daily-content --env-file ../.env
```

### 5. Test the Function
```bash
curl -X POST https://your-project.supabase.co/functions/v1/daily-content \
  -H "Authorization: Bearer your-service-role-key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## ✅ What Was Fixed

### Problem
- JSDOM dependency caused esbuild errors with Node.js built-in modules
- JSDOM cannot run in Deno edge runtime

### Solution
- ✅ Removed JSDOM dependency
- ✅ Replaced with regex-based HTML parsing (Deno-compatible)
- ✅ No Node.js built-in module errors
- ✅ Bundle now compiles successfully

## 🔍 Testing Locally

```bash
# Start local Supabase
supabase start

# Set local secrets
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set SUPABASE_URL=http://localhost:54321
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-local-key

# Serve function locally
npm run dev:edge

# Test locally
curl -X POST http://127.0.0.1:54321/functions/v1/daily-content \
  -H "Authorization: Bearer your-local-key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 📚 Documentation

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for comprehensive documentation including:
- Detailed error analysis
- Configuration explanations
- Troubleshooting guide
- Best practices

## 🎯 Key Points

1. **No JSDOM**: Uses regex-based HTML parsing instead
2. **Deno-compatible**: All dependencies work in Deno edge runtime
3. **Platform neutral**: esbuild uses `platform: "neutral"` for Deno
4. **ESM imports**: Bundled code uses esm.sh CDN for external packages
5. **Environment variables**: Set via Supabase secrets or --env-file

## 🐛 Common Issues

### Bundle fails with "Could not resolve"
- Run `rm -rf node_modules package-lock.json && npm install`
- Ensure JSDOM was removed from package.json

### Function timeout
- The workflow can take 2-5 minutes depending on LLM calls
- Check logs: `supabase functions logs daily-content --tail`

### Environment variables undefined
- Set secrets: `supabase secrets set VAR_NAME=value`
- Or deploy with env file: `supabase functions deploy daily-content --env-file .env`
