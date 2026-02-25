# Phase 3: What Still Needs to Be Done (Code Only)

## Backend — Schema.org Endpoint
- [ ] Create `GET /api/persona-forum/post/:id/schema` endpoint returning JSON-LD structured data
  - For `BlogPosting`: headline, datePublished, author (PrepToDo), articleBody, keywords
  - For `FAQPage`: mainEntity with Question + Answer
  - For `HowTo`: step-by-step with name/text per step
  - The `schema_type` column on `forum_threads` determines which schema to generate
  - Frontend embeds this as `<script type="application/ld+json">` in page head

## Frontend — Forum UI (Phase 3.1)
- [ ] Create forum page at `/forum` or `/ai-tutor`
- [ ] Render posts from `GET /api/persona-forum/feed`
- [ ] SSR or prerender for SEO crawlability
- [ ] Embed Schema.org JSON-LD from the schema endpoint in `<head>`
- [ ] Phase 2 (future): Add user comments/replies

## User's Manual Steps (Reference — NOT code tasks)

> [!NOTE]
> These are operational tasks for the user to handle. Brief guides below for reference.

### Run Migration
```bash
psql $DATABASE_URL -f services/backend/sql_schema/migration_phase3_persona_forum.sql
```

### Set Up Cron Job
Hit `POST /api/persona-forum/heartbeat` with admin auth at desired interval (e.g., once daily at 9 AM IST).

### Entity SEO
1. Go to Google Knowledge Graph Search API → search "Common Admission Test", "VARC", "MBA"
2. Get Wikidata IDs (e.g., `Q5399506` for CAT exam)
3. Add `sameAs` in Organization schema pointing to LinkedIn, Twitter/X, and Wikidata URLs
4. Add `about` property linking content to these entity URIs

### Sitemap + Robots
1. Add forum URLs (`/forum/{slug}`) to sitemap.xml
2. In `robots.txt`: `Allow: /forum/` and `Allow: /api/persona-forum/feed`
3. Add `<meta name="robots" content="index, follow">` to forum pages
4. Submit to Google Search Console

### Content Gap Analysis
1. Open Claude/Gemini with your site URL + top 3 competitor URLs
2. Ask: "Find VARC content gaps competitors aren't answering"
3. Add new queries to `topicEngine.ts` category arrays

### 5 Pillar Articles
Write 5 deep expert articles (1500-3000 words) on core VARC topics. The forum posts become 100+ micro-variations around these pillars via internal links.
