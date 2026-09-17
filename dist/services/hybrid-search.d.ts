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
/**
 * MMR (Maximal Marginal Relevance) selection for diversity.
 * Greedily picks the candidate that maximizes λ * relevance − (1−λ) * max_sim_to_selected.
 */
export declare function mmrSelect(scored: Array<{
    candidate: HybridCandidate;
    score: number;
}>, limit: number, lambda?: number): HybridCandidate[];
/**
 * Rank candidates and select within a token budget.
 * Returns the final list of memories to inject.
 */
export declare function rankAndSelect(candidates: HybridCandidate[], config: HybridConfig, now?: number): HybridCandidate[];
/**
 * Gate check for compaction restore — always passes.
 * Compaction restore must never be blocked by the gate.
 */
export declare function isCompactionRestore(): boolean;
//# sourceMappingURL=hybrid-search.d.ts.map