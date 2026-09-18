/**
 * P2 Hybrid Search — pure functions for ranking memory candidates.
 * Combines relevance, recency, authority, frequency, and diversity (MMR)
 * with a token budget for injection.
 */
const AUTHORITY_WEIGHTS = {
    "user-stated": 1.0,
    verified: 0.8,
    "agent-inferred": 0.6,
};
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}
function recencyScore(createdAt, now) {
    const ageDays = (now - createdAt) / 86400000;
    // Exponential decay with 30-day half-life
    return Math.exp(-ageDays / 30);
}
function frequencyScore(injectCount) {
    // Saturating: 0 at 0 injections, approaching 1.0 asymptotically
    const count = injectCount ?? 0;
    return 1 - Math.exp(-count / 5);
}
function authorityScore(authority) {
    if (!authority)
        return 0.5;
    return AUTHORITY_WEIGHTS[authority] ?? 0.5;
}
function compositeScore(candidate, now, weights) {
    return (weights.relevance * candidate.similarity +
        weights.recency * recencyScore(candidate.createdAt, now) +
        weights.authority * authorityScore(candidate.authority) +
        weights.frequency * frequencyScore(candidate.injectCount));
}
/**
 * MMR (Maximal Marginal Relevance) selection for diversity.
 * Greedily picks the candidate that maximizes λ * relevance − (1−λ) * max_sim_to_selected.
 */
export function mmrSelect(scored, limit, lambda = 0.7) {
    if (scored.length <= limit)
        return scored.map((s) => s.candidate);
    const selected = [];
    const remaining = [...scored];
    while (selected.length < limit && remaining.length > 0) {
        let bestIdx = 0;
        let bestMMR = -Infinity;
        for (let i = 0; i < remaining.length; i++) {
            const item = remaining[i];
            if (!item)
                continue;
            const relevance = item.score;
            let maxSimToSelected = 0;
            for (const sel of selected) {
                const overlap = item.candidate.tags.filter((t) => sel.tags.includes(t)).length;
                const sim = overlap / Math.max(item.candidate.tags.length, sel.tags.length, 1);
                if (sim > maxSimToSelected)
                    maxSimToSelected = sim;
            }
            const mmr = lambda * relevance - (1 - lambda) * maxSimToSelected;
            if (mmr > bestMMR) {
                bestMMR = mmr;
                bestIdx = i;
            }
        }
        const picked = remaining[bestIdx];
        if (picked)
            selected.push(picked.candidate);
        remaining.splice(bestIdx, 1);
    }
    return selected;
}
/**
 * Rank candidates and select within a token budget.
 * Returns the final list of memories to inject.
 */
export function rankAndSelect(candidates, config, now = Date.now()) {
    if (candidates.length === 0)
        return [];
    // Gate: filter by minimum similarity
    const gated = config.gateEnabled
        ? candidates.filter((c) => c.similarity >= config.minScore)
        : candidates;
    if (gated.length === 0)
        return [];
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
    // Token budget truncation — skip oversized candidates, continue with smaller ones
    let tokenBudget = config.injectionTokenBudget;
    const result = [];
    for (const candidate of selected) {
        const tokens = estimateTokens(candidate.memory);
        if (tokens > tokenBudget)
            continue;
        tokenBudget -= tokens;
        result.push(candidate);
    }
    return result;
}
/**
 * Gate check for compaction restore — always passes.
 * Compaction restore must never be blocked by the gate.
 */
export function isCompactionRestore() {
    return false; // Placeholder; callers should bypass gate for compaction
}
