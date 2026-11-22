# Code, JSON & Semistructured Payloads

<!-- claim: [STANDARD KNOWLEDGE] Code and structured data have significantly higher token density than natural language prose. -->
:::callout[note]{title="TL;DR"}
Source code (Python, TypeScript, Go), API payloads, and indented JSON data behave drastically differently from conversational prose. They exhibit extreme token density (often dropping to 2.2 characters per token) and require strict syntactic closure. Splitting a function mid-body or truncating a JSON object leaves dangling brackets and severs function signatures from docstrings. This lesson covers AST-aware chunking and token budget calibration for technical codebases.
:::

## The Token Density Anomaly

In standard English prose, four characters roughly equal one BPE token ($\sim 4.0\text{ chars/token}$). In code and structured JSON, this heuristic completely breaks down:

```python
# Sample 1: English Prose (32 chars)
"The database connection timed out"  --> 5 tokens (6.4 chars/token)

# Sample 2: Indented JSON (32 chars)
'{"db_timeout_ms": 250, "ssl": true}' --> 13 tokens (2.46 chars/token)
```

Because BPE tokenizers treat punctuation marks, indentation spaces, variable underscores, and brackets as discrete individual tokens, a 1,000-character code snippet can consume over 450 tokens.

<!-- claim: [STANDARD KNOWLEDGE] Configuring code chunking in raw characters risks severe token overflow during embedding generation. -->
If you configure a chunk size of 1,000 characters thinking you are staying within a safe 250-token window, code payloads will frequently blow past 450 tokens, causing silent truncation in downstream embedding models.

---

## AST-Aware Splitting vs. Line Slicing

Generic text splitters slice text by counting line breaks. In a software codebase, this creates broken syntax blocks:

:::compare{left="Line-Based Splitter" right="AST / Syntax-Aware Splitter"}
**Splits mid-function:**
```typescript
export async function authenticateUser(
  token: string,
  options: AuthOptions
): Promise<UserSession> {
  const decoded = await verifyJwt(token);
// [CHUNK 1 ENDS HERE]
// [CHUNK 2 STARTS HERE]
  if (!decoded.valid) {
    throw new UnauthorizedError();
  }
  return new UserSession(decoded.id);
}
```
===
**Splits by AST node:**
```typescript
// Chunk 1: Entire authenticateUser() function
// Chunk 2: Entire revokeUserSession() function
```
Keeps imports, decorators, function signatures, and docstrings attached to their complete implementation blocks.
:::

### Best Practices for Code Chunking:
1. **Preserve Docstring Proximity**: A function's docstring is what dense vector embeddings match against during natural language searches (e.g. *"How do I verify a user token?"*). If the docstring is severed from the function body, vector search finds the docstring but the LLM receives no code to answer with.
2. **Inject File & Module Paths**: Prepend the file path (`src/auth/session.ts > authenticateUser`) to each code chunk so the LLM understands module boundaries and imports.
3. **Respect Scope Hierarchy**: Split first on class boundaries, then top-level functions, then nested methods.

---

## Handling JSON and API Payloads

When indexing API documentation, OpenAPI specifications, or telemetry logs:
- **Avoid Fragmented Objects**: Slicing an array of 50 JSON items into chunks of 10 must yield valid, re-closed JSON arrays (`[...]`) rather than dangling commas and unclosed brackets.
- **Flatten Deep Hierarchies**: Deeply nested JSON structures (5+ levels) confuse vector similarity matching. Flatten nested properties into dot-notation paths (`auth.oauth2.client_id = "xyz"`) to improve lexical and semantic match accuracy.

:::tryit[python-backend]{strategy="recursive" chunkSize="450" chunkOverlap="45"}
:::

---

## Test Your Understanding

:::quiz[quiz-2-4]{}
:::

---

## Key Takeaways

- **Code has high token density**: Expect 2.0 to 2.8 characters per token; calibrate chunk sizes strictly in tokens rather than characters.
- **Docstrings must stay attached**: Ensure comments and docstrings remain unified with their function signatures.
- **Maintain syntactic validity**: Never leave open code blocks or dangling JSON brackets across partition boundaries.
- **Inject module breadcrumbs**: Include file paths and class names to provide the architectural scope needed for code synthesis.
