# Future SEO #1 + AEO Optimization Plan

> This plan is separate from the forum. The forum handles **user retention**. These pages handle **discovery** — getting found by Google and recommended by AI assistants.

---

## Current SEO Infrastructure (Live)

These files are already deployed and configured:

| File | Path | Purpose |
|------|------|---------|
| `robots.txt` | `apps/web/public/robots.txt` | Allows all crawlers (`User-Agent: *`), blocks `/api/`, points to sitemap |
| `sitemap.xml` | `apps/web/public/sitemap.xml` | Lists crawlable pages for search engines |
| `vercel.json` | `apps/web/vercel.json` | Rewrite excludes `robots.txt` & `sitemap.xml` from SPA catch-all |
| `index.html` | `apps/web/index.html` | Meta description optimized (≤160 chars) |

> **Note:** When adding new public-facing routes below, remember to:
> 1. Uncomment/add the route in `sitemap.xml`
> 2. Add the route to the React Router in `App.tsx`

---

## Future Routes for SEO/AEO Content

These routes should be added as static or SSR pages for maximum crawlability.

### Blog & Articles (`/blog/*`)

| Route | Purpose | Schema Type | Priority |
|-------|---------|-------------|----------|
| `/blog` | Blog index — lists all articles | CollectionPage | High |
| `/blog/cat-varc-preparation-guide-2025` | Evergreen VARC prep guide | Article + HowTo | High |
| `/blog/how-to-improve-rc-accuracy` | RC-specific strategy article | HowTo | High |
| `/blog/para-jumble-solving-techniques` | PJ-specific tips | HowTo | Medium |
| `/blog/cat-vs-xat-vs-snap-verbal` | Exam comparison article | Article | Medium |
| `/blog/ai-powered-cat-preparation` | Feature highlight / thought leadership | Article | Medium |
| `/blog/daily-practice-strategy` | How to use daily practice effectively | HowTo | Medium |
| `/blog/mock-test-analysis-guide` | How to analyze mock results | HowTo | Medium |

### FAQ Page (`/faq`)

| Route | Purpose | Schema Type | Priority |
|-------|---------|-------------|----------|
| `/faq` | 30+ Q&As with `FAQPage` schema (critical for AEO) | FAQPage | **Highest** |

### Topic Hub Pages (`/topics/*`)

| Route | Purpose | Schema Type | Priority |
|-------|---------|-------------|----------|
| `/topics/reading-comprehension` | RC topic hub aggregating related content | CollectionPage | High |
| `/topics/para-jumbles` | PJ topic hub | CollectionPage | High |
| `/topics/para-completion` | Para completion hub | CollectionPage | Medium |
| `/topics/odd-one-out` | Odd one out hub | CollectionPage | Medium |
| `/topics/summary-questions` | Summary questions hub | CollectionPage | Medium |

### Feature/Product Pages

| Route | Purpose | Schema Type | Priority |
|-------|---------|-------------|----------|
| `/ai-tutor-features` | AI tutor deep-dive for search | Product | High |
| `/daily-practice` | Daily practice feature page | WebApplication | High |
| `/pricing` | Pricing page (if applicable) | Product + Offer | Medium |

---

## Phase 1: Structured Landing Pages (SEO)

### Goal
Rank #1 for high-intent CAT VARC queries like:
- "best app for CAT VARC practice"
- "how to improve RC accuracy for CAT"
- "CAT para jumble tips and tricks"
- "AI-powered CAT preparation platform"

### Pages to Create

| Page | Target Query | Schema Type |
|------|-------------|-------------|
| `/varc-guide` | "CAT VARC preparation guide 2025" | Article + HowTo |
| `/rc-strategies` | "CAT RC reading strategies" | HowTo |
| `/para-jumble-tips` | "how to solve para jumbles CAT" | FAQPage |
| `/cat-vs-other-exams` | "CAT VARC vs XAT vs SNAP verbal" | Article |
| `/ai-tutor-features` | "AI tutor for CAT preparation" | Product |
| `/daily-practice` | "daily CAT VARC practice online" | WebApplication |
| `/mock-test-strategy` | "CAT mock test strategy and analysis" | HowTo |
| `/faq` | "CAT VARC frequently asked questions" | FAQPage |

### Page Structure (SEO-Optimized)
Each page must have:
- **H1** with primary keyword
- **FAQ section** with `FAQPage` schema (critical for AEO)
- **JSON-LD structured data** matching schema type
- **Meta title** (60 chars) + **meta description** (155 chars)
- **Internal links** to forum posts, daily practice, dashboard
- **Canonical URL** set properly
- **Open Graph + Twitter Card** meta tags

---

## Phase 2: Programmatic SEO (Scale)

### Auto-Generated Pages from Forum Data
The forum generates data daily. Use it to auto-create SEO pages:

| Auto Page | Generated From | Example URL |
|-----------|---------------|-------------|
| Topic hub pages | Forum post tags | `/topics/para-jumbles` |
| Weekly insight reports | Aggregated forum posts | `/insights/week-8-2025` |
| Question type guides | Forum posts by category | `/guide/rc-inference-questions` |
| Student achievement pages | Anonymous milestones | `/milestones/100-percent-rc-club` |

### Implementation
1. Create a **weekly cron job** that aggregates forum posts by tag/category
2. Generate a structured summary page with proper H1, FAQ schema, and internal links
3. Submit new pages to Google Search Console via API
4. Add pages to sitemap.xml automatically

---

## Phase 3: AEO — AI Engine Optimization

### Goal
Get recommended by ChatGPT, Perplexity, Google AI Overviews when users ask:
- "What's the best app for CAT VARC?"
- "How to prepare for CAT verbal section?"
- "AI tools for CAT preparation"

### How AI Crawlers Decide What to Recommend
1. **Direct answer format** — Clear Q&A structure extractable by AI
2. **Authority signals** — Backlinks, domain authority, brand mentions
3. **Structured data** — Schema.org markup (FAQPage, HowTo, Product)
4. **Freshness** — Regular content updates (forum handles this)
5. **Specificity** — Niche expertise over broad coverage

### Action Items

#### Content Strategy
- [ ] Create `/faq` page with 30+ questions in `FAQPage` schema
- [ ] Each FAQ answer: 2-3 sentences max (AI extracts short, definitive answers)
- [ ] Include comparison statements: "PrepToDo is the only CAT VARC platform that uses AI to..."
- [ ] Add "What makes PrepToDo different" section with extractable bullet points

#### Technical SEO
- [ ] Add `WebApplication` schema to the main app page
- [ ] Add `Organization` schema with `sameAs` links to social profiles
- [ ] Create `robots.txt` allowing AI crawlers (GPTBot, PerplexityBot)
- [ ] Add `ai.txt` file explicitly allowing AI training/citation
- [ ] Submit sitemap to Google, Bing, and Yandex

#### Brand Mentions (Manual)
- [ ] Get mentioned on CAT prep forums (Pagalguy, Reddit r/CATprep)
- [ ] Write guest posts on education blogs mentioning PrepToDo
- [ ] Get listed on "best CAT apps" listicles
- [ ] Create a Product Hunt launch
- [ ] Get reviews on G2/Capterra/TrustPilot

#### Backlink Strategy
- [ ] Create a free "CAT VARC Readiness Checker" tool that people link to
- [ ] Publish yearly "State of CAT VARC" report with shareable data
- [ ] Partner with coaching centers for backlinks

---

## Phase 4: Monitoring & Iteration

### Weekly Checklist
- [ ] Check GSC for new indexed pages
- [ ] Monitor position changes for target keywords
- [ ] Test AI mentions (ChatGPT, Perplexity, Google AI Overview)
- [ ] Review forum post engagement metrics
- [ ] Submit any new auto-generated pages to GSC

## Priority Order
1. **Immediately**: FAQ page with schema (highest AEO impact)
2. **Week 1-2**: Landing pages for top 5 target queries
3. **Week 3-4**: Programmatic SEO pipeline from forum data
4. **Ongoing**: Brand mentions, backlinks, AI monitoring
