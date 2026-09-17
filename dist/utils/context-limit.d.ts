/** UTF-8 byte length of a string. */
export declare function utf8ByteLength(text: string): number;
/** Decode a UTF-8 byte slice without splitting multi-byte characters. */
export declare function sliceUtf8Bytes(text: string, start: number, end?: number): string;
/**
 * Truncate text to at most `maxBytes` UTF-8 bytes.
 * Prefers keeping the start and end (head + tail) when space allows,
 * so summaries retain both opening context and closing conclusions.
 */
export declare function truncateToMaxBytes(text: string, maxBytes: number, marker?: string): string;
//# sourceMappingURL=context-limit.d.ts.map