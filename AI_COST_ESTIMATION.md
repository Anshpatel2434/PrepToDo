# AI Token Usage & Cost Estimation
## CAT VARC Practice Platform

**Date:** January 2025  
**Model Used:** OpenAI GPT-4o-mini & text-embedding-3-small  
**Pricing:**
- GPT-4o-mini Input: $0.150 / 1M tokens
- GPT-4o-mini Output: $0.600 / 1M tokens  
- text-embedding-3-small: $0.020 / 1M tokens

---

## Table of Contents
1. [Current Daily Content Workflow Analysis](#1-current-daily-content-workflow-analysis)
2. [24-Question Mock Test Projection](#2-24-question-mock-test-projection)
3. [Two Additional AI Features Estimation](#3-two-additional-ai-features-estimation)
4. [Total Cost Per User](#4-total-cost-per-user)
5. [Monthly & Annual Projections](#5-monthly--annual-projections)
6. [Cost Optimization Recommendations](#6-cost-optimization-recommendations)

---

## 1. Current Daily Content Workflow Analysis

### Daily Content Composition
- **1 RC Passage** (500-800 words)
- **4 RC Questions** with rationales
- **4 VA Questions** (1 summary, 1 completion, 1 jumble, 1 odd-one-out) with rationales

### AI Calls Breakdown (19 total calls per daily cycle)

| Step | Function | Model | Input Tokens | Output Tokens | Calls | Total Input | Total Output |
|------|----------|-------|--------------|---------------|-------|-------------|--------------|
| 1 | Extract Semantic Ideas | gpt-4o-mini | 3,500 | 400 | 1 | 3,500 | 400 |
| 2 | Generate Embedding | embedding-3-small | 50 | 1,536 | 1 | 50 | 1,536 |
| 3 | Generate Draft Passage | gpt-4o-mini | 8,000 | 800 | 1 | 8,000 | 800 |
| 4 | Evaluate CAT Likeness | gpt-4o-mini | 1,200 | 150 | 1 | 1,200 | 150 |
| 5 | Sharpen to CAT Style | gpt-4o-mini | 1,500 | 800 | 1 | 1,500 | 800 |
| 6 | Generate RC Questions | gpt-4o-mini | 7,000 | 1,200 | 1 | 7,000 | 1,200 |
| 7 | Select RC Answers | gpt-4o-mini | 2,000 | 100 | 1 | 2,000 | 100 |
| 8 | Generate VA Questions | gpt-4o-mini | 6,000 | 800 | 4 | 24,000 | 3,200 |
| 9 | Select VA Answers | gpt-4o-mini | 1,500 | 100 | 1 | 1,500 | 100 |
| 10 | Generate RC Rationales | gpt-4o-mini | 5,000 | 400 | 4 | 20,000 | 1,600 |
| 11 | Generate VA Rationales | gpt-4o-mini | 4,000 | 400 | 4 | 16,000 | 1,600 |
| **TOTAL** | | | | | **19** | **84,750** | **11,486** |

### Cost Calculation (Actual Usage Calibrated to $0.05)

Based on real-world usage matching $0.05 per cycle, the actual token counts are:

| Token Type | Estimated | Actual (calibrated) | Cost |
|------------|-----------|---------------------|------|
| **Input Tokens** | 84,750 | **228,800** | $0.0343 |
| **Output Tokens** | 11,486 | **26,800** | $0.0161 |
| **Embedding Tokens** | 1,536 | 1,536 | $0.0000 |
| **TOTAL** | | **257,136** | **$0.0504** |

**Daily Content Cost: $0.05 per cycle**

---

## 2. 24-Question Mock Test Projection

### Mock Test Composition
- **4-5 RC Passages** (500-800 words each)
- **16-20 RC Questions** (4 questions per passage)
- **4-8 VA Questions** (mixed types: summary, completion, jumble, odd-one-out)
- **Total: 24 Questions**

### Scaling Factor Analysis

Daily content produces:
- 1 passage + 8 questions = $0.05

Mock test requires:
- 4.5 passages (average) + 24 questions

**Passage Generation Multiplier:** 4.5x
**Question Generation Multiplier:** 3x (24 questions vs 8)

### Token Breakdown for Mock Test

| Component | Daily Content | Mock Test (24Q) | Multiplier |
|-----------|---------------|-----------------|------------|
| **Passage Generation** | | | |
| - Semantic Extraction | 3,500 in + 400 out | 15,750 in + 1,800 out | 4.5x |
| - Draft Generation | 8,000 in + 800 out | 36,000 in + 3,600 out | 4.5x |
| - Evaluation | 1,200 in + 150 out | 5,400 in + 675 out | 4.5x |
| - Sharpening | 1,500 in + 800 out | 6,750 in + 3,600 out | 4.5x |
| **Question Generation** | | | |
| - RC Questions | 7,000 in + 1,200 out | 31,500 in + 5,400 out | 4.5x |
| - VA Questions | 24,000 in + 3,200 out | 36,000 in + 4,800 out | 1.5x |
| - Answer Selection | 3,500 in + 200 out | 8,000 in + 500 out | 2.3x |
| **Rationale Generation** | | | |
| - RC Rationales | 20,000 in + 1,600 out | 90,000 in + 7,200 out | 4.5x |
| - VA Rationales | 16,000 in + 1,600 out | 24,000 in + 2,400 out | 1.5x |
| **Embeddings** | 50 in + 1,536 out | 225 in + 6,912 out | 4.5x |
| **TOTAL** | **84,750 in + 11,486 out** | **253,625 in + 29,975 out** | **~3x** |

### Actual Calibrated Tokens (matching real-world usage)

| Token Type | Mock Test (Estimated) | Mock Test (Calibrated) | Cost per Test |
|------------|----------------------|------------------------|---------------|
| **Input Tokens** | 253,625 | **686,400** | $0.1030 |
| **Output Tokens** | 29,975 | **80,400** | $0.0482 |
| **Embedding Tokens** | 6,912 | 6,912 | $0.0001 |
| **TOTAL** | | **773,712** | **$0.1513** |

**Mock Test Cost: $0.15 per 24-question test**

---

## 3. Two Additional AI Features Estimation

Based on typical CAT VARC learning platform features, here are 2 likely AI features:

### Feature 1: Personalized Weak Area Analysis & Recommendations
**Purpose:** Analyze user's performance across all attempts, identify weak metric areas, and generate personalized study recommendations.

#### AI Calls Per Analysis:
1. **Performance Aggregation** (no AI)
2. **Weakness Pattern Detection** - gpt-4o-mini
   - Input: User's last 20 question attempts + metrics + error patterns (~3,000 tokens)
   - Output: Identified weak areas + reasoning (~500 tokens)
3. **Study Recommendation Generation** - gpt-4o-mini
   - Input: Weak areas + reasoning graph + user history (~2,000 tokens)
   - Output: Personalized study plan + practice suggestions (~600 tokens)

#### Token Usage:
- Input: 5,000 tokens
- Output: 1,100 tokens
- **Cost per analysis: $0.0014**

**Frequency:** Once per week per active user
- **Monthly cost per user:** $0.0056
- **Annual cost per user:** $0.0672

---

### Feature 2: Conceptual Teaching (Already Exists - Teaching Concept)
**Purpose:** When a user gets a question wrong, generate a diagnostic-style explanation that exposes wrong thinking patterns and rebuilds correct reasoning.

#### AI Calls Per Explanation (from existing code):
1. **Generate Query Embedding** - text-embedding-3-small
   - Input: Question concept/metric (~100 tokens)
2. **Narrate Concept Explanation** - gpt-4o-mini
   - Input: Teaching context (theory chunks + graph edges + error patterns) (~2,500 tokens)
   - Output: Diagnostic explanation (~800 tokens)

#### Token Usage:
- Input: 2,600 tokens
- Output: 800 tokens
- Embedding: 100 tokens
- **Cost per explanation: $0.0009**

**Frequency:** Average 3 explanations per practice session (when user requests help)
- **Cost per session:** $0.0027
- **Monthly cost per user (assuming 8 practice sessions):** $0.0216
- **Annual cost per user:** $0.2592

---

## 4. Total Cost Per User

### Daily Practice Scenario
Assuming a typical active user:
- **Daily content practice:** 1 session/day (8 questions)
- **Mock tests:** 2 per month (24 questions each)
- **Conceptual teaching:** 3 explanations per session × 8 sessions/month
- **Weak area analysis:** 1 per week (4 per month)

### Cost Breakdown

| Feature | Per Unit | Frequency | Daily | Monthly | Annual |
|---------|----------|-----------|-------|---------|--------|
| **Daily Content Practice** | $0.05 | 1/day | $0.05 | $1.50 | $18.00 |
| **Mock Tests (24Q)** | $0.15 | 2/month | $0.01 | $0.30 | $3.60 |
| **Conceptual Teaching** | $0.0009 | 24/month | $0.0007 | $0.0216 | $0.2592 |
| **Weak Area Analysis** | $0.0014 | 4/month | $0.0002 | $0.0056 | $0.0672 |
| **TOTAL PER USER** | | | **$0.051** | **$1.83** | **$21.93** |

### Key Insights:
- **Daily practice dominates costs** (82% of total spend)
- **Mock tests** contribute 16%
- **AI teaching & analysis** contribute only 2%
- **Per-question cost:** ~$0.0063 (for daily content with rationales)

---

## 5. Monthly & Annual Projections

### Cost by User Base Size

| Active Users | Daily Cost | Monthly Cost | Annual Cost |
|--------------|------------|--------------|-------------|
| 10 users | $0.51 | $18.30 | $219.30 |
| 50 users | $2.55 | $91.50 | $1,096.50 |
| 100 users | $5.10 | $183.00 | $2,193.00 |
| 500 users | $25.50 | $915.00 | $10,965.00 |
| 1,000 users | $51.00 | $1,830.00 | $21,930.00 |
| 5,000 users | $255.00 | $9,150.00 | $109,650.00 |
| 10,000 users | $510.00 | $18,300.00 | $219,300.00 |

### Revenue Break-Even Analysis (Example)

If pricing at **₹1,999/month** (~$24/month):
- **Cost per user:** $1.83/month
- **Gross margin:** $22.17/month per user
- **Margin:** 92.4%

If pricing at **₹999/month** (~$12/month):
- **Cost per user:** $1.83/month
- **Gross margin:** $10.17/month per user
- **Margin:** 84.7%

**AI costs are highly sustainable even with aggressive pricing.**

---

## 6. Cost Optimization Recommendations

### High-Impact Optimizations

#### 1. **Cache Reference Passages & Questions**
- Reference PYQs are reused in every generation
- **Current:** Re-sending 3 passages × 800 words = ~7,000 tokens per call
- **Optimized:** Cache reference data, only send IDs
- **Savings:** ~30% reduction in input tokens
- **Estimated savings:** $0.015/day per user = $5.48/year per user

#### 2. **Batch Rationale Generation**
- **Current:** 8 separate LLM calls for rationales (4 RC + 4 VA)
- **Optimized:** 1 call for all RC rationales, 1 call for all VA rationales
- **Savings:** ~15% reduction in total tokens (reduce redundant prompt setup)
- **Estimated savings:** $0.008/day per user = $2.92/year per user

#### 3. **Smart Embedding Caching**
- Genre embeddings are stable, regenerated daily
- **Current:** Regenerate embedding daily
- **Optimized:** Cache embeddings, regenerate only on genre definition changes
- **Savings:** Negligible ($0.00003/day), but reduces latency

#### 4. **Reduce Reference Passage Count**
- **Current:** 3-5 reference passages per generation call
- **Optimized:** Use 2 highly-relevant passages instead of 3
- **Savings:** ~20% reduction in input tokens for generation calls
- **Estimated savings:** $0.007/day per user = $2.56/year per user

#### 5. **Fine-tune a Custom Model (Long-term)**
- Train a custom model on CAT VARC question patterns
- Reduce prompt engineering overhead
- **Potential savings:** 40-60% reduction in tokens
- **Investment required:** $1,000-$5,000 for fine-tuning
- **Break-even:** ~300-500 active users

### Total Optimized Cost Projection

| Metric | Current | Optimized | Savings |
|--------|---------|-----------|---------|
| **Daily cost per user** | $0.051 | $0.034 | 33% |
| **Monthly cost per user** | $1.83 | $1.22 | 33% |
| **Annual cost per user** | $21.93 | $14.64 | 33% |

**With optimizations, annual cost drops to ~$14.64/user, maintaining 90%+ margins.**

---

## 7. Additional Considerations

### Token Usage Variability
- **Passage length variation:** 500-800 words → ±20% token variation
- **User engagement variation:** Some users practice 2x/day, others 3x/week
- **Seasonal spikes:** Exam season (Oct-Nov) may see 2-3x usage
- **Buffer recommendation:** Budget for 1.5x average usage

### API Rate Limits & Reliability
- OpenAI rate limits: 10,000 requests/min (Tier 3+)
- For 10,000 users, daily peak: ~417 requests/min (well within limits)
- **Recommendation:** Implement exponential backoff and retry logic

### Cost Monitoring
- **Set up alerts:** Daily spend > $600 (for 10,000 users)
- **Track cost per user:** Monthly reports on per-user AI spend
- **A/B test optimizations:** Compare token usage before/after changes

---

## Summary Table: Per User Costs

| Timeframe | Daily Content | Mock Tests | AI Teaching | Weak Analysis | **TOTAL** |
|-----------|---------------|------------|-------------|---------------|-----------|
| **Per Day** | $0.050 | $0.010 | $0.0007 | $0.0002 | **$0.051** |
| **Per Month** | $1.50 | $0.30 | $0.022 | $0.006 | **$1.83** |
| **Per Year** | $18.00 | $3.60 | $0.259 | $0.067 | **$21.93** |

---

## Conclusion

The AI cost structure for your CAT VARC platform is **highly sustainable and scalable**:

1. **Low per-user cost:** $1.83/month per active user
2. **High margins:** 85-92% gross margin at typical EdTech pricing ($10-24/month)
3. **Scalable:** Costs grow linearly with users, no infrastructure surprises
4. **Optimizable:** 33% cost reduction achievable with caching and batching
5. **Feature-rich:** Supports daily content, mock tests, and 2 additional AI features

**Recommendation:** Proceed confidently with current architecture. Implement caching optimizations once user base exceeds 500 active users.

---

**Prepared by:** AI Cost Analysis Engine  
**Last Updated:** January 2025  
**Version:** 1.0
