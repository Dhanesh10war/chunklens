# Deployment Guide: ChunkLens

ChunkLens is a 100% client-side Single Page Application (SPA). Because all document processing, tokenization, and vector computations run in-browser (including dedicated Web Workers), it requires no server runtime or database.

---

## Target 1: Cloudflare Pages (Recommended Default)

Cloudflare Pages provides global edge hosting with native support for Vite single-page applications and custom security headers via `_headers`.

### Build Configuration

- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node.js version**: `22` (specified in `.nvmrc`)

### Cloudflare Dashboard Setup (as of November 2026, verify in the dashboard)

1. Sign in to the Cloudflare dashboard.
2. Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository (`chunklens`).
4. In the project setup screen:
   - Select **Vite** under Framework preset.
   - Set Build command to `npm run build`.
   - Set Build output directory to `dist`.
   - Under Environment variables, ensure `NODE_VERSION` is set to `22` (or let Cloudflare auto-detect `.nvmrc`).
5. Select **Save and Deploy**.

### Routing & Headers

- Cloudflare Pages automatically serves `index.html` for client-side SPA route navigation.
- The repository automatically synchronizes `public/_headers` into `dist/_headers` during build, applying strict Content Security Policy (`connect-src 'none'`), `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and immutable asset caching for `/assets/*` and `/fonts/*`.

---

## Target 2: Vercel

Vercel provides edge deployment configured via `vercel.json`.

### Build Configuration

- **Framework**: Vite
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Node.js version**: `22.x`

### Vercel Dashboard Setup (as of November 2026, verify in the dashboard)

1. Sign in to the Vercel dashboard.
2. Select **Add New...** > **Project**.
3. Import the `chunklens` repository.
4. Under **Build and Output Settings**, Vercel detects Vite automatically:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Select **Deploy**.

### Headers & Configuration

- `vercel.json` in the root repository defines the security headers for all routes, matching `public/_headers`.
- `index.html` receives `Cache-Control: no-cache` to ensure instant updates upon new deployments.
- Static bundles in `/assets/*` and self-hosted fonts in `/fonts/*` receive `Cache-Control: public, max-age=31536000, immutable`.

---

## Post-Deployment Verification

### 1. Zero Network Egress Audit

Verify that the production deployment never leaks document data over the network:

1. Open the deployed application in Google Chrome or Microsoft Edge.
2. Open Developer Tools (`F12` or `Ctrl+Shift+I` / `Cmd+Option+I`).
3. Select the **Network** tab and check **Disable cache**.
4. In the filter box, select **Fetch/XHR** and **WS** (WebSockets).
5. Load a document (e.g., upload a local PDF or paste confidential text).
6. Change chunking strategies and tokenizers.
7. Confirm that **zero** requests appear in the Network tab.
8. Select the initial HTML document request in the Doc filter and inspect **Response Headers** to verify:
   - `Content-Security-Policy`: includes `connect-src 'none'` and `frame-ancestors 'none'`
   - `X-Content-Type-Options`: `nosniff`
   - `X-Frame-Options`: `DENY`
   - `Permissions-Policy`: `camera=(), microphone=(), geolocation=()`

### 2. CSP Synchronization

To re-generate `vercel.json` and `public/_headers` from `src/config/csp.ts` at any time:

```bash
npm run sync:csp
# or directly:
node scripts/sync-csp.cjs
```
