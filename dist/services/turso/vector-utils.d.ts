export declare function vectorToJson(vector: Float32Array): string;
export declare function blobToFloat32Array(value: unknown): Float32Array | null;
/** Parse libSQL `vector_extract()` JSON output (preferred over raw F32_BLOB bytes). */
export declare function parseExtractedVector(value: unknown): Float32Array | null;
export declare function distanceToSimilarity(distance: number): number;
/** Canonical text used for tag-vector embeddings (must stay consistent across write paths). */
export declare function formatTagsForEmbedding(tags: string[]): string;
//# sourceMappingURL=vector-utils.d.ts.map