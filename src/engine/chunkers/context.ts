import { TokenizerEncoding } from '../types';

export interface TokenizerContext {
  countTokens: (text: string, encoding?: TokenizerEncoding) => number;
  getTokenizer?: (encoding?: TokenizerEncoding) => {
    encode: (text: string) => number[];
    decode: (tokens: number[]) => string;
  };
}

export interface ChunkerOptions {
  countTokens?: (text: string) => number;
  getTokenizer?: (encoding?: TokenizerEncoding) => {
    encode: (text: string) => number[];
    decode: (tokens: number[]) => string;
  };
}

let activeContext: TokenizerContext | null = null;

/**
 * Injects a global tokenizer context for worker execution and testing.
 */
export function setChunkerTokenizerContext(ctx: TokenizerContext | null): void {
  activeContext = ctx;
}

export function getChunkerTokenizerContext(): TokenizerContext | null {
  return activeContext;
}

/**
 * Resolves a token counter function via DI options, global context, or lightweight fallback.
 */
export function resolveCountTokens(
  encoding: TokenizerEncoding = 'o200k_base',
  options?: ChunkerOptions
): (text: string) => number {
  if (options?.countTokens) {
    return options.countTokens;
  }
  const ctx = getChunkerTokenizerContext();
  if (ctx?.countTokens) {
    return (text: string) => ctx.countTokens(text, encoding);
  }
  // Lightweight fallback: ~4 characters per token heuristic
  return (text: string) => (text ? Math.ceil(text.length / 4) : 0);
}

/**
 * Resolves tokenizer encoding operations (encode/decode) via DI options or global context.
 */
export function resolveTokenizer(
  encoding: TokenizerEncoding = 'o200k_base',
  options?: ChunkerOptions
) {
  if (options?.getTokenizer) {
    return options.getTokenizer(encoding);
  }
  const ctx = getChunkerTokenizerContext();
  if (ctx?.getTokenizer) {
    return ctx.getTokenizer(encoding);
  }
  return null;
}
