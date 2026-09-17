/**
 * P2 Hybrid Search — pure functions for ranking memory candidates.
 * Combines relevance, recency, authority, frequency, and diversity (MMR)
 * with a token budget for injection.
 */

export interface HybridCandidate {
  id: string;
  memory: string;
  similarity: number;
  createdAt: number;
  tags: string[];
  metadata?: Record<string, unknown>;
  injectCount?: number;
  lastInjectedAt?: number;
  authority?: string;
}

export interface HybridConfig {
  gateEnabled: boolean;
  candidates: number;
  minScore: number;
  injectionTokenBudget: number;
  injectProfileTokenBudget: number;
}

const AUTHORITY_WEIGHTS: Record<string, number> = {
  "user-stated": 1.0,
  verified: 0.8,
  "agent-inferred": 0.6,
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function recencyScore(createdAt: number, now: number): number {
  const ageDays = (now - createdAt) / 86400000;
  // Exponential decay with 30-day half-life
  return Math.exp(-ageDays / 30);
}

function frequencyScore(injectCount: number | undefined): number {
  // Saturating: 0 at 0 injections, approaching 1.0 asymptotically
  const count = injectCount ?? 0;
  return 1 - Math.exp(-count / 5);
}

function authorityScore(authority: string | undefined): number {
  if (!authority) return 0.5;
  return AUTHORITY_WEIGHTS[authority] ?? 0.5;
}

function compositeScore(
  candidate: HybridCandidate,
  now: number,
  weights: { relevance: number; recency: number; authority: number; frequency: number }
): number {
  return (
    weights.relevance * candidate.similarity +
    weights.recency * recencyScore(candidate.createdAt, now) +
    weights.authority * authorityScore(candidate.authority) +
    weights.frequency * frequencyScore(candidate.injectCount)
  );
}

/**
 * MMR (Maximal Marginal Relevance) selection for diversity.
 * Greedily picks the candidate that maximizes λ * relevance − (1−λ) * max_sim_to_selected.
 */
export function mmrSelect(
  scored: Array<{ candidate: HybridCandidate; score: number }>,
  limit: number,
  lambda = 0.7
): HybridCandidate[] {
  if (scored.length <= limit) return scored.map((s) => s.candidate);

  const selected: HybridCandidate[] = [];
  const remaining = [...scored];

  while (selected.length < limit && remaining.length > 0) {
    let bestIdx = 0;
    let bestMMR = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i];
      if (!item) continue;
      const relevance = item.score;
      let maxSimToSelected = 0;
      for (const sel of selected) {
        const overlap = item.candidate.tags.filter((t) => sel.tags.includes(t)).length;
        const sim = overlap / Math.max(item.candidate.tags.length, sel.tags.length, 1);
        if (sim > maxSimToSelected) maxSimToSelected = sim;
      }
      const mmr = lambda * relevance - (1 - lambda) * maxSimToSelected;
      if (mmr > bestMMR) {
        bestMMR = mmr;
        bestIdx = i;
      }
    }

    const picked = remaining[bestIdx];
    if (picked) selected.push(picked.candidate);
    remaining.splice(bestIdx, 1);
  }

  return selected;
}

/**
 * Rank candidates and select within a token budget.
 * Returns the final list of memories to inject.
 */
export function rankAndSelect(
  candidates: HybridCandidate[],
  config: HybridConfig,
  now = Date.now()
): HybridCandidate[] {
  if (candidates.length === 0) return [];

  // Gate: filter by minimum similarity
  const gated = config.gateEnabled
    ? candidates.filter((c) => c.similarity >= config.minScore)
    : candidates;

  if (gated.length === 0) return [];

  // Composite scoring
  const weights = { relevance: 0.4, recency: 0.2, authority: 0.2, frequency: 0.2 };
  const scored = gated.map((c) => ({
    candidate: c,
    score: compositeScore(c, now, weights),
  }));

  // Sort by composite score descending
  scored.sort((a, b) => b.score - a.score);

  // MMR diversity selection
  const selected = mmrSelect(scored, config.candidates);

  // Token budget truncation
  let tokenBudget = config.injectionTokenBudget;
  const result: HybridCandidate[] = [];
  for (const candidate of selected) {
    const tokens = estimateTokens(candidate.memory);
    if (tokens > tokenBudget) break;
    tokenBudget -= tokens;
    result.push(candidate);
  }

  return result;
}

/**
 * Gate check for compaction restore — always passes.
 * Compaction restore must never be blocked by the gate.
 */
export function isCompactionRestore(): boolean {
  return false; // Placeholder; callers should bypass gate for compaction
}
