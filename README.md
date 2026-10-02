# Log Analyzer

Fullstack application for uploading and analysing server logs: create an analysis, paste a log or upload a `.txt` file (drag-and-drop supported), then browse the results with search, level filters, date sorting and error statistics. Previous analyses are kept in the history and can be opened or deleted.

## Quick start

Requirements: Docker with Docker Compose.

```bash
docker compose up -d --build
```

Open <http://localhost:8080>. The port can be changed with `APP_PORT=3001 docker compose up -d --build`.

Data is stored in the `db-data` Docker volume and survives container restarts. `docker compose down -v` removes it.

### Local development (without Docker)

Requirements: Node.js 22+. The repository is an npm workspace, so install once from the root:

```bash
npm install
npm run dev -w log-analyzer-backend     # API on http://localhost:3000
npm run dev -w log-analyzer-frontend    # UI on http://localhost:5173 (proxies /api to :3000)
```

Tests (domain package, backend API, frontend local querying):

```bash
npm test
```

> **HTTPS-intercepting antivirus or proxy?** If `npm ci` fails inside Docker with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, copy `docker-compose.override.example.yml` to `docker-compose.override.yml` and set `EXTRA_CA_CERT` to the interceptor's root certificate. The certificate is only mounted during the build and never ends up in the image.

## Log format

```
YYYY-MM-DD HH:mm:ss LEVEL message
2026-09-30 12:41:02 INFO User connected
2026-09-30 12:41:05 WARN Slow request: 1250ms
2026-09-30 12:41:08 ERROR Database connection failed
```

Supported levels: `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL` (case-insensitive). Blank lines are ignored. Lines that don't match the format, have an impossible date (e.g. `2026-02-30`) or an unknown level are **reported as invalid with their line number and reason** and don't break the rest of the analysis.

## Tech stack

| Part | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Material UI, SCSS modules, Zustand (`persist` → localStorage / IndexedDB), React Router, Zod, Day.js, vite-plugin-pwa (Workbox) |
| Backend | Node.js 22, Express 5, TypeScript, better-sqlite3, Zod, Day.js |
| Shared | npm workspaces, `@log-analyzer/domain` package (parser, analyzer, schemas) |
| Tests | Vitest, Supertest |
| Infrastructure | Docker (multi-stage builds), Docker Compose, nginx |

## Architecture

```
packages/log-domain   shared by both apps: parser, analyzer, LogLevel/SortOrder, Zod schemas, limits
backend               Express REST API → SQLite (volume db-data)
frontend              React SPA, served by nginx, which proxies /api → backend
```

### Shared domain package (`packages/log-domain`)

The parser, analyzer, enums, Zod schemas and limits (5 MB, name length, UTF-8 byte counting) live in one package. The backend uses the compiled build. The frontend uses the TypeScript source through a Vite alias, so the bundle contains a single copy of zod. Because the browser and the server run **the same code**, an analysis made offline gives the same result as the server's.

### Backend (`backend/src`)

```
config/environment.ts      PORT / DB_PATH validated with Zod (fails fast on bad values)
constants/patterns.ts      LIKE wildcard escaping pattern
database/
  database.ts              open the connection, pragmas
  schema.ts                tables and indexes
  transaction.ts           runInTransaction(), so the service never touches SQLite
modules/analyses/
  analyses.router.ts       routes only: path → controller handler
  analyses.controller.ts   HTTP mapping: validate input → call service → status + JSON
  analyses.schemas.ts      Zod validation of body / params / query
  analyses.service.ts      use cases: parse + analyse + save, get, list, delete
  analyses.repository.ts   `analyses` table only
  entries.repository.ts    `entries` table only (insert, paged query)
  entries.filter.ts        builds the SQL WHERE clause from filters
  analyses.mappers.ts      DB rows → domain objects, validated with Zod
http/
  app-error.ts             AppError + ErrorCode enum
  error-handler.ts         error middleware, 404 handler
  logger.ts                startup and 5xx error logs
app.ts                     composition root (dependency injection by hand)
```

- **Parsing and analysis are pure functions** in the shared domain package. They are independent of HTTP and storage, so they are easy to test.
- **Each module has one job.** The service depends on the `AnalysesRepository`, `EntriesRepository` and `RunInTransaction` interfaces, not on SQLite, so storage can be swapped without touching business logic.
- **There are no type casts.** Everything that crosses a boundary is validated at runtime with Zod: request bodies and query strings, rows read from SQLite, and the JSON summary stored in the DB.
- **The history list reads only what it shows.** `GET /api/analyses` selects the totals and level counts with `json_extract` instead of parsing every stored summary.
- **Storage is split in two.** `analyses` holds metadata plus the pre-computed summary as JSON. `entries` holds one row per log line, indexed by `(analysis_id, timestamp)` and `(analysis_id, level)`, with `ON DELETE CASCADE`. The summary is computed once on upload. **Search, level filtering, date sorting and pagination run in SQL** (`LIKE` with escaped wildcards), so large logs aren't sent to the browser at once. Search is case-insensitive for **every alphabet**: SQLite `LIKE` only folds ASCII, so a registered `unicode_lower` SQL function (JavaScript `toLowerCase`) is applied to both sides. Prepared statements are cached per query shape.
- **Errors use one format:** `{ error: { code, message, details? } }`. The frontend ignores `details`, because the form validates the same fields on the client. Covered cases: validation (400), not found (404), payload too large (413), unsupported body encoding (415), no valid lines (422), unexpected errors (500, logged).

### REST API

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/analyses` | `{ name, content, clientId?, createdAt? }` → parses, analyses, saves, returns the analysis (`201`); a repeated `clientId` returns the existing one (`200`) |
| `GET` | `/api/analyses` | history (newest first) |
| `GET` | `/api/analyses/:id` | summary: counts by level, error statistics, invalid lines sample |
| `GET` | `/api/analyses/:id/entries` | `?level=ERROR,WARN&q=text&sort=asc\|desc&page=1&pageSize=50` |
| `DELETE` | `/api/analyses/:id` | deletes the analysis and its entries |
| `GET` | `/api/health` | health check (used by Docker) |

### Frontend (`frontend/src`), MVVM

```
api/                        Model
  BaseApiClient.ts          abstract base: get / post / delete, error mapping, response validation with Zod
  AnalysesApi.ts            class AnalysesApi extends BaseApiClient
  ApiError.ts               error type returned by every request
  types.ts                  response schemas and types (LogLevel / SortOrder re-exported from the domain package)
features/analyses/
  hooks/                    ViewModels: useAnalysesList, useAnalysis, useLocalAnalysis, useEntries, useCreateAnalysis, useLogFileLoader, useDeleteAnalysis, useOutboxSync
  store/analyses.store.ts   Zustand + IndexedDB: history list, per-id analysis cache, load/create/delete actions
  store/entries.store.ts    Zustand + IndexedDB: cache of viewed entry pages (newest 200)
  store/outbox.store.ts     Zustand + IndexedDB: analyses made offline, upload queue and sync statuses
  store/draft.store.ts      Zustand + persist (debounced writes); the saved draft is validated with Zod when restored
  local/                    queryEntries (local search/filter/sort/paging), local id helpers
  pages/                    Views: history, new analysis, analysis details
  components/
    filters/                SearchField, LevelSelect, SortToggle, EntriesFilters
    entries/                EntriesTableView (desktop), EntriesCardList (mobile), EntriesPagination, EntriesTable, EntriesPanel
    details/                AnalysisHeader, AnalysisTabs, SummaryStats, ErrorStatsTable, InvalidLinesList
    form/                   AnalysisNameField, LogContentField, FormActions
    history/                AnalysesGrid, AnalysisCard, LevelCountList, NewAnalysisButton
    local/                  PendingAnalysesSection, PendingAnalysisCard, SyncStatusChip, SyncStatusBanner
    skeletons/              AnalysesGridSkeleton, AnalysisDetailsSkeleton, StatCardsSkeleton
shared/components/          reusable UI: PageStates (error/empty), TableSkeleton, StatCard, LevelChip, ConfirmDialog, FileDropZone, PageHeader
shared/notifications/       Zustand notifications store + NotificationsHost (global snackbar)
shared/connectivity/        Zustand online/offline store + OfflineBanner
shared/storage/             IndexedDB and safe localStorage adapters for Zustand persist
app/layout/                 AppLayout, Brand, DesktopNav, MobileNavDrawer
```

- **Views only render.** State, requests and validation live in ViewModel hooks. Each component does one thing.
- **Zustand is the Model's state:**
  - Opening an analysis from the history shows its name and counters **instantly** from the cached list item, while the full summary loads in the background behind a skeleton.
  - Deleting or creating an analysis updates the history in place, with no reload.
  - Notifications such as "created" and "deleted" go through one global store.
- **Loading uses skeletons that match the final layout:** history cards, the details page, and tables. The page does not jump when data arrives.

### Offline mode and fewer requests

An analysis never changes after it is created, so cached data never goes stale. Only the history list (add and delete) needs refreshing.

- **Data cache (Zustand + IndexedDB via `idb-keyval`):**
  - The history list is persisted. Every opened analysis is stored under its own IndexedDB key, so state changes never rewrite the full set of summaries. Restored data is validated with Zod.
  - Every viewed page of entries is cached by its full query (filters, search, sort, page, page size). Revisiting a page makes no request. The cache keeps the newest 200 pages.
  - When the history is refreshed, analyses deleted elsewhere are pruned from both caches.
- **HTTP:** `GET /api/analyses` is sent with `Cache-Control: no-cache` plus an `ETag`, so an unchanged history comes back as `304 Not Modified` with no body.
- **PWA (`vite-plugin-pwa`):**
  - The service worker precaches the app shell, so the app opens with no network.
  - The app is installable (manifest and icons).
  - API data is cached only by the store, never by the service worker, so there is one source of truth.
- **When offline:**
  - A banner says the app is offline.
  - History, opened analyses and viewed entry pages keep working.
  - Deleting an uploaded analysis is disabled with a hint, because it needs the server.
  - When the connection returns, the history refreshes automatically.

> Service workers only run on **HTTPS** or `localhost`. On a server reached over plain `http://`, the app still works, including the IndexedDB cache and ETag, but without offline start or install. A domain with TLS (for example Caddy with Let's Encrypt) is needed for full PWA support.

### Offline-first analyses (outbox)

A log can be analysed **with no network** and is uploaded automatically later.

1. **Analyse on the device.** This path is used when the browser is offline. It is also used when the browser has a connection but the server can't take the request: a captive portal, a VPN, an API that is down, or nginx answering `502`/`503` while the backend restarts. In all these cases "Run analysis" runs the shared parser and analyzer in the browser. The raw log is stored in IndexedDB under its own key. A small outbox entry (local id `local-…`, name, summary, status) is persisted in a Zustand store.
2. **View it right away.** The local analysis page shows the same statistics, error groups and invalid lines. The entries table works locally: search, level filter, date sort and pagination are a pure function (`queryEntries`) with the same semantics as the SQL query, and it is covered by unit tests. Entries are parsed from the stored log when the page is opened, and never duplicated in storage.
3. **Upload when back online.** Sync runs on the `online` event, on app start and right after a local create. Items upload one at a time. Each step takes the next pending item from the current state, so a Retry clicked during another upload is not lost: if sync is asked for while a pass is running, another pass runs right after it. Every pending item is tried in each pass, so one item that keeps failing never blocks the others. An item deleted while its upload is being prepared is skipped. The original `createdAt` is sent along, so an analysis made offline on Monday still shows Monday after it syncs on Wednesday (a time ahead of the server clock is clamped to the server's "now", so a device with a fast clock never gets stuck). History inserts the synced analysis by `createdAt`, the same order the server uses. When the server answers `503` and the form falls back to the device, the upload waits for the backoff instead of re-sending the same 5 MB straight away:
   - network errors, `408`, `429` and `5xx` keep the item queued and schedule another attempt with exponential backoff (15 s, 30 s, … up to 5 min);
   - every upload carries the local id as `clientId`. The server records it in `client_requests`, and a repeated upload (for example after the tab closed right after a `201`) returns the existing analysis with `200` instead of creating a duplicate;
   - `4xx` marks it **"Upload failed"** with the server's reason and a **Retry** button;
   - on success the local copy is replaced by the server analysis, and an open `/analyses/local-…` page redirects to the real id.
4. **History** lists not-yet-uploaded analyses on top, with their status ("Waiting for network", "Uploading…", "Upload failed"). A local analysis can be deleted even offline.

Design choices:
- **With a connection, analyses are still created on the server directly.** The local path is only for offline use, which keeps one source of truth.
- **Sync runs inside the app, not through the Background Sync API.** Background Sync exists only in Chromium and needs HTTPS. App-level sync works in every browser.
- **History list vs uploads:** a list response that started before an upload or delete is discarded and re-fetched, so a just-uploaded analysis never disappears from the history.
- **One id per attempt.** The id is created before the first request, and the same value is used for the server request and for a local fallback copy. If the server stores an analysis but the response is lost, the later sync is still recognised as a repeat.
- **Old links keep working.** The mapping from local id to server id is persisted (last 100 uploads), so an old `/analyses/local-…` link redirects to the uploaded analysis even after a reload.
- **Search gives the same results before and after upload.** Local search and server search are both case-insensitive for every alphabet.

### Scope note

The task was planned for about 3 hours. The core requirements were done within that time. The extra work was taken on deliberately: the shared domain package, the Zustand caches, the PWA and the offline-first outbox. A log analyser is often used where connectivity is poor (servers, VPNs, travel), so the app should let you inspect a log immediately and sync later.
- **API responses are validated at runtime.** Every response is checked against a Zod schema before it reaches the UI, and a mismatch becomes a clear `ApiError`. Values coming from MUI events (tabs, sort, level select) are validated the same way instead of being cast.
- **Unfinished input survives a page reload.** The form state (name, content, file name) is stored in localStorage via Zustand `persist`, and cleared after a successful analysis. Logs larger than the localStorage quota are kept in memory and don't crash the app.
- **Validation runs on both sides.** The client checks the name, empty content, the 5 MB limit (UTF-8 bytes) and the file type. The server repeats the same checks with Zod, using the same limits from the shared package. The JSON body limit is 32 MB, so even a 5 MB log made of control characters (each escaped to 6 bytes) is accepted.
- **Responsive layout:**
  - below `md` (900px), navigation collapses into a drawer and the filters stack vertically;
  - below `sm` (600px), the entries table becomes a list of cards;
  - stat cards reflow from 7 columns to 3 and then 2.
- **Every data view has explicit loading, error (with retry) and empty states.**
