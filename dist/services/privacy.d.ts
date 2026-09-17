/**
 * Replace every `<private>…</private>` region with `[REDACTED]`.
 *
 * Scans tags with a depth counter rather than matching pairs with a single
 * regex, so that the two malformed shapes fail *closed*:
 *
 * - An **unclosed** `<private>` redacts to the end of the input. A non-greedy
 *   pair match found no closing tag and left the region untouched, so a typo or
 *   a truncated message stored the content verbatim.
 * - **Nested** tags close at the outer tag, not the first inner one. Pair
 *   matching ended the region at the inner `</private>`, releasing the rest of
 *   the outer region and leaving a stray `</private>` in the output.
 *
 * Erring toward redaction is the only safe direction here: the caller persists
 * this string, so a wrong guess in the other direction is an unrecoverable
 * disclosure, while over-redacting merely loses text the user can retype.
 *
 * A `</private>` with no opener is markup rather than content, so it is dropped
 * instead of being surfaced to the user as if it were part of their text.
 */
export declare function stripPrivateContent(content: string): string;
/**
 * True when nothing survives redaction — the caller refuses such a write rather
 * than storing a message that is private in its entirety.
 */
export declare function isFullyPrivate(content: string): boolean;
//# sourceMappingURL=privacy.d.ts.map