# GOD_PostgreSQL.md

> This is not a syntax guide. This is how Postgres actually works — the internals, the failure modes, the production decisions, and the things nobody tells you until your database is on fire at 2am.

---

## 1. How Postgres Physically Stores Data

Understanding storage is what separates someone who writes queries from someone who tunes databases.

### Pages (Blocks)

Every table and index is stored as a collection of **8KB pages** on disk. A page is the smallest unit Postgres reads or writes — even if you want one row, Postgres reads the entire 8KB page it lives on.

```
Page structure (8192 bytes):
┌──────────────────────────────────────────┐
│ PageHeader (24 bytes)                    │  LSN, checksums, free space info
├──────────────────────────────────────────┤
│ ItemID array (4 bytes each)              │  Pointers to tuples: (offset, length, flags)
├──────────────────────────────────────────┤
│            Free Space                    │  Grows from both ends toward middle
├──────────────────────────────────────────┤
│ Tuples (rows) — stored from bottom up    │  Each tuple = HeapTupleHeader + data
├──────────────────────────────────────────┤
│ Special space (empty for heap pages)     │  Index AMs store per-page data here (e.g. B-tree sibling links)
└──────────────────────────────────────────┘
```

The page header's `pd_lower` / `pd_upper` mark where the ItemID array ends and the tuple area begins; the gap between them is the free space.

Key implications:
- Reading 1 row = reading the whole 8KB page (from `shared_buffers`, the OS cache, or disk). Row size matters for how many rows fit per page.
- A table with 1 million rows and avg row size 200 bytes (including the ~24-byte tuple header) + 4-byte ItemID ≈ 40 rows/page = ~25,000 pages = ~195MB.
- `pg_relation_size('table')` returns the main fork size in **bytes**; divide by `current_setting('block_size')::int` for pages (`pg_class.relpages` holds the estimate from the last VACUUM/ANALYZE).

### Tuple (Row) Structure — The HeapTupleHeader

Every row has a hidden header Postgres uses for MVCC. You never see these columns, but they govern everything:

| Hidden field   | Size    | Purpose                                                           |
| -------------- | ------- | ----------------------------------------------------------------- |
| `t_xmin`       | 4 bytes | Transaction ID that **inserted** this row                        |
| `t_xmax`       | 4 bytes | Transaction ID that **deleted/updated or row-locked** this row (0 if never touched) |
| `t_cid` / `t_xvac` | 4 bytes | Command ID within the inserting/deleting transaction (overlaid field) |
| `t_ctid`       | 6 bytes | TID: physical location `(page, offset)` of this row version. If updated, points to the newer version. |
| `t_infomask2`  | 2 bytes | Number of attributes + HOT flags                                 |
| `t_infomask`   | 2 bytes | Status flags: is xmin committed? is xmax committed? has nulls? frozen? |
| `t_hoff`       | 1 byte  | Offset to actual data (accounts for null bitmap size)            |

The fixed header is 23 bytes (padded to 24), so every row costs ~24 bytes + null bitmap + 4-byte ItemID before any column data.

A non-zero `xmax` does **not** always mean the row is dead: `SELECT ... FOR UPDATE` and aborted deleters also set it. Visibility is decided by xmin/xmax **plus** commit status (`t_infomask` hint bits / `pg_xact`) **plus** your snapshot.

```sql
-- You can actually query these hidden fields:
SELECT ctid, xmin, xmax, * FROM anomaly_routes LIMIT 5;

-- ctid = (page_number, tuple_offset_within_page)
-- e.g., (0,1) = page 0, first tuple
-- After an UPDATE, the old version stays on disk with xmax set, and its t_ctid points to the new version
-- ctid is not stable: UPDATE, VACUUM FULL, CLUSTER change it — never use it as a row identifier
```

### MVCC — What Really Happens on UPDATE

This is the single most important thing to understand about Postgres performance.

**Postgres never updates in place.** Every `UPDATE` is actually:
1. Mark the old row as deleted (`t_xmax = current_txid`)
2. Write a brand new row version with updated values (`t_xmin = current_txid`)
3. Point the old version's `t_ctid` at the new version's physical location
4. Insert new index entries pointing at the new version (skipped for HOT updates — see Fillfactor)

`DELETE` is step 1 only. Old versions stay until no running transaction's snapshot can see them, then VACUUM removes them.

```sql
-- Watch it happen:
SELECT ctid, xmin, xmax, status FROM anomaly_routes WHERE id = 1;
-- (0,1) | 100 | 0 | 'REPORTED'

UPDATE anomaly_routes SET status = 'PENDING_APPROVAL' WHERE id = 1;

SELECT ctid, xmin, xmax, status FROM anomaly_routes WHERE id = 1;
-- (0,2) | 101 | 0 | 'PENDING_APPROVAL'  ← new tuple at (0,2)
-- Old tuple (0,1) still exists on disk with xmax=101, invisible to new transactions
```

**Consequence:** Heavy UPDATE workloads produce **table bloat** — dead tuples accumulating on disk. This is why VACUUM exists.

### TOAST — Storing Large Values

Postgres pages are 8KB and a row cannot span pages. What happens when a single column value (like a JSON blob or polyline string) is bigger than that?

**TOAST** (The Oversized-Attribute Storage Technique) kicks in automatically when a row exceeds `TOAST_TUPLE_THRESHOLD` (~2KB, roughly 1/4 page). It only applies to variable-length types (`text`, `bytea`, `jsonb`, arrays, ...). Postgres works through the widest values until the row fits under ~2KB:

1. **Compression** — Postgres tries to compress the value (`pglz` by default; `lz4` available in v14+ via `default_toast_compression` or `ALTER TABLE ... ALTER COLUMN ... SET COMPRESSION lz4`)
2. **Out-of-line storage** — If still too large, the value is sliced into ~2KB chunks and stored in a separate `pg_toast.pg_toast_<table_oid>` table. The main table row holds an 18-byte pointer.

```sql
-- Find the TOAST table and its size
SELECT relname,
       reltoastrelid::regclass AS toast_table,
       pg_size_pretty(pg_relation_size(reltoastrelid)) AS toast_size
FROM pg_class
WHERE relname = 'anomaly_routes';

-- Per-column storage strategy:
SELECT attname, attstorage
FROM pg_attribute
WHERE attrelid = 'anomaly_routes'::regclass AND attnum > 0;
-- 'p' = plain (never compressed or moved; fixed-length types like int)
-- 'x' = extended: compress, then move out-of-line (default for text/jsonb)
-- 'e' = external: out-of-line, no compression (fast substring() on large text/bytea)
-- 'm' = main: compress; out-of-line only as a last resort
```

Your `estimated_polyline TEXT` and `actual_polyline TEXT` columns in `anomaly_routes` are almost certainly TOASTed. Reading those columns has hidden I/O cost — fetching from the TOAST table.

```sql
-- If you rarely need the polyline, exclude it to avoid TOAST fetches:
SELECT id, status, city_id FROM anomaly_routes WHERE status = 'PENDING_APPROVAL';
-- vs (forces TOAST fetch for every row):
SELECT * FROM anomaly_routes WHERE status = 'PENDING_APPROVAL';
```

### Fillfactor

By default, Postgres fills table pages 100% (B-tree indexes default to 90). For tables with frequent UPDATEs, a full page means the new tuple version must go on a different page — which rules out HOT updates and forces new entries in every index.

**HOT updates (Heap Only Tuple):** Postgres can update without touching any index — a massive write speedup — when **both** hold:
1. No column used by any index (including partial-index predicates and expression indexes) changed
2. The new tuple version fits on the **same page** as the old one

The old version then points to the new one via a HOT chain, and later page accesses can prune dead chain members without a full VACUUM.

```sql
-- Set fillfactor to 70%: leave 30% of each page free for updates
-- New tuple versions land on the same page → HOT update possible → no index churn
ALTER TABLE anomaly_routes SET (fillfactor = 70);
-- Only affects pages written from now on. Existing pages are NOT repacked by plain VACUUM;
-- rewrite the table (VACUUM FULL / pg_repack / CLUSTER) to apply it to existing data.

-- Check HOT update ratio (high n_tup_hot_upd = good)
SELECT relname, n_tup_upd, n_tup_hot_upd,
       ROUND(n_tup_hot_upd::NUMERIC / NULLIF(n_tup_upd, 0) * 100, 1) AS hot_pct
FROM pg_stat_user_tables
WHERE relname = 'anomaly_routes';
```

Use fillfactor 70-80 for tables with frequent updates of **non-indexed** columns. Keep 100 for append-only tables (logs, events). If the updated column is indexed, fillfactor won't make updates HOT — consider dropping that index if it's rarely used.

---

## 2. The Query Planner — How Postgres Chooses Execution Plans

The query planner is the intelligence behind every query. Understanding it lets you predict and fix bad plans.

### The Planning Pipeline

```
SQL Text
   ↓
Parser         → Parse tree (syntax check)
   ↓
Analyzer       → Semantic check (do tables/columns exist?)
   ↓
Rewriter       → Apply rules and views (expand view definitions)
   ↓
Planner        → Enumerate candidate plans, estimate costs, pick cheapest
   ↓
Executor       → Run the chosen plan
```

The planner does not literally try every plan. It searches join orders with dynamic programming, and once a query has `geqo_threshold` (default 12) or more FROM items it switches to the genetic optimizer (GEQO), which samples plans heuristically. `join_collapse_limit` / `from_collapse_limit` (default 8) also cap how far it reorders explicit JOINs and subqueries.

### Statistics — What the Planner Relies On

The planner cannot read your data to make decisions — it uses **statistics** stored in `pg_statistic` (exposed via `pg_stats`). These are collected by `ANALYZE`.

```sql
-- What statistics Postgres has about a column:
SELECT
    attname,
    n_distinct,          -- >0: distinct count; <0: fraction of rows (-1 = all unique, -0.5 = each value ~twice)
    correlation,         -- physical vs logical order, -1..1 (±1 = sorted, cheap range scans; ~0 = random)
    most_common_vals,    -- most frequent values
    most_common_freqs,   -- their frequencies
    histogram_bounds     -- bucket boundaries for range estimates
FROM pg_stats
WHERE tablename = 'anomaly_routes' AND attname = 'status';
```

**When statistics are wrong, plans are wrong.** If ANALYZE hasn't run recently on a fast-growing table:
- Row count estimates are stale → wrong join strategy
- Cardinality estimates are wrong → wrong index choice

```sql
-- Force fresh statistics on one table:
ANALYZE anomaly_routes;

-- Increase statistics target for a column with many distinct or skewed values
-- (default_statistics_target = 100: up to 100 MCVs + 100 histogram buckets, sampling 300 × target rows)
-- Max 10000. Higher = better estimates, but slower ANALYZE and planning.
ALTER TABLE anomaly_routes ALTER COLUMN city_id SET STATISTICS 500;
ANALYZE anomaly_routes;
```

### Cost Model

The planner assigns every plan a **cost** in abstract units. It picks the lowest-cost plan.

| Parameter                | Default | Meaning                                         |
| ------------------------ | ------- | ----------------------------------------------- |
| `seq_page_cost`          | 1.0     | Cost to read a page sequentially                |
| `random_page_cost`       | 4.0     | Cost to read a page randomly (seek + read)      |
| `cpu_tuple_cost`         | 0.01    | Cost to process one row                         |
| `cpu_index_tuple_cost`   | 0.005   | Cost to process one index entry                 |
| `cpu_operator_cost`      | 0.0025  | Cost to evaluate one operator/function          |
| `effective_cache_size`   | 4GB     | Planner's estimate of OS + Postgres cache size  |

**Critical insight:** On SSDs, random reads are much cheaper than HDDs. If `random_page_cost = 4.0` but you're on an SSD, the planner will avoid index scans more than it should.

```sql
-- For SSD storage (current session only — good for testing a plan change):
SET random_page_cost = 1.1;  -- random ≈ sequential on SSD

-- Permanently (written to postgresql.auto.conf; no restart needed):
ALTER SYSTEM SET random_page_cost = 1.1;
SELECT pg_reload_conf();
```

Costs are relative to `seq_page_cost = 1.0`, not milliseconds. A plan's cost is only comparable to other plans for the same query.

### Reading EXPLAIN ANALYZE Output

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
SELECT ar.*, c.name
FROM anomaly_routes ar
JOIN cities c ON ar.city_id = c.id
WHERE ar.status = 'PENDING_APPROVAL';
```

```
Hash Join  (cost=15.20..1823.50 rows=450 width=312)
           (actual time=2.341..45.231 rows=423 loops=1)
  Buffers: shared hit=892 read=34
  ->  Seq Scan on anomaly_routes ar
        (cost=0.00..1750.00 rows=450 width=280)
        (actual time=0.012..40.123 rows=423 loops=1)
        Filter: ((status)::text = 'PENDING_APPROVAL'::text)
        Rows Removed by Filter: 9577
        Buffers: shared hit=850 read=34
  ->  Hash  (cost=10.20..10.20 rows=400 width=32)
            (actual time=1.234..1.234 rows=400 loops=1)
        Buckets: 1024  Batches: 1  Memory Usage: 48kB
        ->  Seq Scan on cities c ...
```

**How to read it:**
- `cost=15.20..1823.50` — estimated startup cost (before first row) .. total cost (all rows)
- `rows=450` — planner estimated 450 rows; `actual rows=423` — reality was 423. Close = good statistics. Off by 10×+ = investigate.
- `actual time=2.341..45.231` — milliseconds to first row .. last row, **per loop**
- `loops=1` — this node ran once. In nested loops, it could run 1000 times: `actual time` and `rows` are per-loop averages, so multiply by loops for the total.
- `Buffers: shared hit=892 read=34` — 892 pages found in `shared_buffers`, 34 requested from the OS (may still come from the OS page cache, not physical disk). Parent node counts include their children. High `read` = likely I/O bottleneck.
- `Rows Removed by Filter: 9577` — scanned 10,000 rows, discarded 9,577 (~96%). An index on `status` (or a partial index on `WHERE status = 'PENDING_APPROVAL'`) would likely help.

`EXPLAIN ANALYZE` actually **executes** the query. Wrap data-modifying statements in `BEGIN; EXPLAIN ANALYZE ...; ROLLBACK;`.

**Node types and what they mean:**

| Node | Meaning | Worrying when |
|------|---------|---------------|
| `Seq Scan` | Full table scan | Table is large AND rows removed by filter is high |
| `Index Scan` | Used index, fetches heap rows | `read` buffers are high = heap pages not cached |
| `Index Only Scan` | All data from index, no heap fetch | Ideal. Watch `Heap Fetches` — should be 0 |
| `Bitmap Index Scan` + `Bitmap Heap Scan` | Index for pages, then fetch | Common for range queries, fine |
| `Nested Loop` | For each outer row, probe inner | Outer rows must be small, inner must be indexed |
| `Hash Join` | Build hash table of smaller side, probe with larger | Fine for medium sets, spills to disk if `work_mem` too low |
| `Merge Join` | Both inputs pre-sorted | Good when inputs are already ordered |
| `Sort` | Explicit sort | `Sort Method: external merge Disk: 4096kB` = spilled to disk → increase `work_mem` |

### Join Strategies — When Planner Chooses What

```sql
-- Force specific join strategies (for testing only, not production):
SET enable_hashjoin = off;
SET enable_mergejoin = off;
SET enable_nestloop = off;
```

| Strategy | Best when | Cost |
|----------|-----------|------|
| Nested Loop | Small outer, indexed inner; the only strategy for non-equality joins (`<`, `LIKE`, ...) | O(outer × log(inner)) with index, O(outer × inner) without |
| Hash Join | Large unsorted inputs, equality joins only | O(n+m), needs `work_mem × hash_mem_multiplier` for the hash table |
| Merge Join | Both sides already sorted or have sort-supporting indexes; equality joins only | O(n+m) if presorted, O(n log n + m log m) if it must sort |

### plan_cache_mode and Prepared Statements

For a **named** prepared statement (`PREPARE`, or a driver that prepares and reuses statements), Postgres plans the first 5 executions with the actual parameter values (custom plans). From the 6th execution it also builds a **generic plan** (no parameter values) and switches to it permanently if its estimated cost is not much worse than the average custom plan. The generic plan then ignores the actual parameter value.

```sql
-- Problem: a query for status='PENDING_APPROVAL' (10,000 rows) gets a plan
-- optimized for status='ADMIN_APPROVED' (2 rows). Seq Scan vs Index Scan mismatch.

-- Force custom (parameter-aware) plans:
SET plan_cache_mode = 'force_custom_plan';

-- Force generic plans (avoid per-execution planning overhead):
SET plan_cache_mode = 'force_generic_plan';

-- Default: auto (Postgres decides from the 6th execution)
SET plan_cache_mode = 'auto';

-- PG16+: see the generic plan for a parameterized query
EXPLAIN (GENERIC_PLAN) SELECT * FROM anomaly_routes WHERE status = $1;
```

In Node.js with `pg`, plain parameterized queries use the **unnamed** statement, which is re-planned on every execution — they are not affected. Passing a `name` in the query config creates a named prepared statement that is. Drivers that auto-prepare (JDBC after `prepareThreshold=5`, pgx's statement cache, Npgsql) are affected too. If a fast query suddenly gets slow after ~5 executions on the same connection, generic plan caching is a suspect.

---

## 3. Indexing — Deep Internals

### B-Tree Internals

Postgres B-trees (`nbtree`, a Lehman-Yao B+tree) are balanced: all leaf pages are at the same depth, and pages on each level are linked to their left and right siblings (enables range scans in either direction without going back to the root). Inner pages hold only separator keys and downlinks; leaf pages hold `(key, heap TID)` entries.

```
               [50]
              /    \
        [25,35]    [75,90]
        /  |  \    /  |   \
      [10][30][40][60][80][95,99]
       ↔   ↔   ↔   ↔   ↔   ↔     ← leaf pages linked for range scans
```

- **Lookup** (WHERE id = 42): O(log n) — descend from root to leaf
- **Range scan** (WHERE id BETWEEN 10 AND 50): descend to start, walk leaf chain
- **Index size**: ~20 bytes per entry for a single-column integer index (~22MB per million rows), so its share of table size depends on row width. PG13+ deduplication shrinks indexes with many repeated values.

### Index Selectivity

An index is only useful when it's **selective** — when the indexed value narrows down to a small fraction of the table.

```sql
-- Low selectivity: 'status' has 7 values across 100,000 rows = ~14,000 rows per value
-- Postgres may prefer Seq Scan because reading 14,000 rows via index = up to 14,000 random heap page reads
-- A full table scan reads pages sequentially — potentially faster
-- Bitmap Heap Scan is the middle ground: collect matching TIDs, sort by page, read each page once

-- High selectivity: 'id' is unique = 1 row per value = index almost always wins

-- Rough tipping point: a few % of rows, but it moves with random_page_cost, cache hit rate,
-- and the column's physical correlation (a well-correlated column stays index-friendly much longer)
```

**This is why an index on a low-cardinality column like `is_intercity` (boolean) is often useless.** Postgres will skip it. Exception: skewed data. If only 1% of rows are `true` and you query for them, a **partial index** is small and highly selective:

```sql
CREATE INDEX idx_intercity ON anomaly_routes (created_at) WHERE is_intercity;
-- Used by: WHERE is_intercity AND created_at > ...
```

Use `pg_stats.most_common_vals` / `most_common_freqs` to check skew before deciding.

### Multi-Column Index Column Order

```sql
-- Index on (city_id, status)
CREATE INDEX idx_city_status ON anomaly_routes(city_id, status);

-- Can serve:
WHERE city_id = 5                          -- yes (leftmost prefix)
WHERE city_id = 5 AND status = 'PENDING'   -- yes (both columns)
WHERE city_id = 5 AND status > 'P'         -- yes (range on last column fine)

-- Order inside WHERE doesn't matter — this is the same as the second query above:
WHERE status = 'PENDING' AND city_id = 5   -- yes (both columns)

-- Cannot efficiently serve (before PG18):
WHERE status = 'PENDING'                   -- no leading city_id: at best a full index scan
```

PG18 adds B-tree **skip scan**: for `WHERE status = 'PENDING'` it can probe the index once per distinct `city_id`. This only pays off when the skipped leading column has few distinct values — don't design indexes around it.

Rule: **put equality conditions before range conditions** in a composite index. After the first range column, later columns can't narrow the scan (they're only checked as index filters).

```sql
-- Optimal for: WHERE city_id = 5 AND created_at > '2026-01-01'
CREATE INDEX ON anomaly_routes(city_id, created_at);
-- city_id = equality first, created_at = range second
```

### Index-Only Scans and Visibility Map

An Index Only Scan reads data entirely from the index — no heap (table) access. Fastest possible read path.

But there's a catch: index entries carry no visibility info, so Postgres must still verify the row is visible to the current transaction (MVCC). It checks the **visibility map** — 2 bits per heap page (all-visible, all-frozen). If the page is marked all-visible, no heap access is needed. If not (e.g., recently modified), Postgres fetches the heap page to check visibility.

```sql
-- Assumes an index on (status)
EXPLAIN (ANALYZE, BUFFERS)
SELECT status FROM anomaly_routes WHERE status = 'PENDING_APPROVAL';

-- Look for:
-- Index Only Scan ... Heap Fetches: 0   ← ideal, all pages in visibility map
-- Index Only Scan ... Heap Fetches: 523 ← many pages not in visibility map, VACUUM needed
```

```sql
-- VACUUM updates the visibility map:
VACUUM anomaly_routes;
-- After this, Index Only Scans become truly index-only (until pages are modified again)
```

To make an index-only scan possible when you filter on one column but return another, add the extra column as a non-key payload with `INCLUDE` (PG11+, B-tree / GiST / SP-GiST):

```sql
CREATE INDEX idx_status_cover ON anomaly_routes (status) INCLUDE (city_id);
-- SELECT city_id FROM anomaly_routes WHERE status = '...' → Index Only Scan
```

### Bloat — Index Bloat

B-tree indexes bloat too. VACUUM removes dead index entries and can recycle **completely empty** index pages, but — like tables — it doesn't shrink the file. Half-empty pages stay half-empty because a B-tree page can only take keys from its own key range. PG13+ deduplication and PG14+ bottom-up deletion reduce bloat from update-heavy workloads.

```sql
-- Check index bloat (requires the pgstattuple contrib extension):
CREATE EXTENSION IF NOT EXISTS pgstattuple;

SELECT * FROM pgstatindex('idx_status');
-- avg_leaf_density: avg % of leaf page space used (fresh index ≈ 90; much lower = bloated)
-- leaf_fragmentation: % of leaf pages physically out of logical order (hurts range-scan I/O), not dead space

-- Rebuild a bloated index without blocking reads/writes (PG12+):
REINDEX INDEX CONCURRENTLY idx_status;
-- Takes longer and needs space for a second copy; cannot run inside a transaction block
```

---

## 4. Vacuuming — The Engine That Keeps Postgres Alive

### What VACUUM Does

1. Removes dead tuples and their index entries, marking the space as reusable (doesn't shrink the file — except truncating empty pages at the very end of the table)
2. Updates the **visibility map** (enables Index Only Scans)
3. Updates **free space map** (tells Postgres which pages have room for new tuples)
4. **Freezes** old tuples and advances `pg_class.relfrozenxid` — critical for transaction ID wraparound (see below)

It takes only a `SHARE UPDATE EXCLUSIVE` lock, so reads and writes continue.

**VACUUM can only remove tuples that no snapshot can still see.** Anything holding back the oldest snapshot (the "xmin horizon") blocks cleanup across the **whole database**, no matter how often VACUUM runs:
- Long-running transactions and `idle in transaction` sessions
- Abandoned prepared transactions (`pg_prepared_xacts`)
- Replication slots with an old `xmin` / `catalog_xmin`
- Standbys with `hot_standby_feedback = on` running long queries

```sql
-- What is holding back the xmin horizon?
SELECT pid, state, backend_xmin, now() - xact_start AS xact_age, LEFT(query, 60) AS query
FROM pg_stat_activity
WHERE backend_xmin IS NOT NULL
ORDER BY age(backend_xmin) DESC
LIMIT 5;

SELECT slot_name, xmin, catalog_xmin FROM pg_replication_slots;
SELECT gid, prepared, owner FROM pg_prepared_xacts;
-- VACUUM VERBOSE also reports "tuples: ... are dead but not yet removable" and the removable cutoff
```

### VACUUM FULL

Rewrites the entire table (and rebuilds all its indexes) into a new file, removing all dead space. Reclaims disk. **But it holds an `ACCESS EXCLUSIVE` lock** — the table is completely unavailable, even for reads, during the operation. It also needs free disk space for the full new copy.

```sql
VACUUM FULL anomaly_routes;  -- dangerous on large production tables
```

For online reclamation, use `pg_repack` instead (3rd-party extension, widely used):
```bash
# Requires CREATE EXTENSION pg_repack in the target DB, and a primary key or unique NOT NULL index.
# Rewrites the table online; takes a brief ACCESS EXCLUSIVE lock only at the start and end.
pg_repack -t anomaly_routes -d mydb
```

### Transaction ID Wraparound — The Most Dangerous Postgres Failure

Transaction IDs are 32-bit counters (~4 billion values) compared **circularly**: for any transaction, ~2 billion XIDs are "in the past" and ~2 billion are "in the future". If a row's `xmin` falls more than ~2 billion transactions behind the current XID, it would suddenly look like it was written "in the future" — and disappear from every query.

Postgres prevents this by **freezing**: VACUUM marks old committed tuples as frozen (an infomask flag), meaning "visible to everyone, ignore xmin". `relfrozenxid` is the oldest unfrozen XID that can remain in a table; its age is what you monitor.

```sql
-- Database-level age (the number that matters for shutdown):
SELECT datname, age(datfrozenxid) AS xid_age FROM pg_database ORDER BY 2 DESC;

-- Per-table (include TOAST tables and materialized views — they need freezing too):
SELECT c.oid::regclass AS table_name,
       age(c.relfrozenxid) AS xid_age,
       2147483648 - age(c.relfrozenxid) AS xids_remaining
FROM pg_class c
WHERE c.relkind IN ('r', 'm', 't')
ORDER BY xid_age DESC
LIMIT 20;
-- xid_age > autovacuum_freeze_max_age (default 200M): anti-wraparound autovacuum is forced,
--   even if autovacuum is disabled
-- ~40M XIDs remaining: WARNING "database must be vacuumed within N transactions"
-- ~3M XIDs remaining: Postgres refuses commands that assign new XIDs (writes fail) until VACUUM
--   catches up; reads keep working (exact margins vary by version)
```

```sql
-- Freeze all tuples now (heavier than a plain VACUUM — writes every page that isn't frozen):
VACUUM FREEZE anomaly_routes;
```

This is why you must never disable autovacuum on a production database, and why long-running transactions are dangerous: they block freezing. A database that can't freeze eventually stops accepting writes. The same mechanism applies to **MultiXact IDs** (used for shared row locks) — monitor `mxid_age(datminmxid)` too.

### Autovacuum Tuning

Autovacuum vacuums a table when: `n_dead_tup > autovacuum_vacuum_threshold + autovacuum_vacuum_scale_factor * reltuples` (`reltuples` = the estimated row count in `pg_class`)

Default: `50 + 0.2 * reltuples` — triggers when ~20% of the table is dead tuples. On a 100M-row table that's 20M dead rows before anything happens.

Related triggers:
- **ANALYZE**: `autovacuum_analyze_threshold + autovacuum_analyze_scale_factor * reltuples` (default `50 + 0.1 * reltuples`) rows changed
- **Inserts** (PG13+): `autovacuum_vacuum_insert_threshold + autovacuum_vacuum_insert_scale_factor * reltuples` (default `1000 + 0.2 * reltuples`) — lets append-only tables get their visibility map set and tuples frozen
- **Cap** (PG18+): `autovacuum_vacuum_max_threshold` (default 100M) caps the dead-tuple threshold for huge tables

For high-write tables (like `anomaly_routes` where status changes constantly), this default is too conservative:

```sql
-- Per-table autovacuum tuning (overrides global postgresql.conf settings):
ALTER TABLE anomaly_routes SET (
    autovacuum_vacuum_scale_factor = 0.01,   -- trigger at 1% dead tuples (not 20%)
    autovacuum_vacuum_threshold = 100,        -- or at 100 dead tuples minimum
    autovacuum_vacuum_cost_delay = 1,         -- sleep 1ms after each cost_limit worth of I/O (default 2ms since PG12)
    autovacuum_analyze_scale_factor = 0.005   -- re-analyze after 0.5% changes (better statistics)
);
-- Lower cost_delay / higher autovacuum_vacuum_cost_limit = faster vacuum, more I/O impact.
-- The cost limit is shared across all running autovacuum workers, so adding workers alone doesn't speed things up.
```

```sql
-- Monitor autovacuum activity live:
SELECT pid, datname, state, wait_event_type, wait_event, query
FROM pg_stat_activity
WHERE backend_type = 'autovacuum worker';

-- Progress of running vacuums (phase, blocks scanned):
SELECT * FROM pg_stat_progress_vacuum;

-- See last vacuum times and dead tuple counts:
SELECT relname, last_vacuum, last_autovacuum, last_analyze, last_autoanalyze,
       n_dead_tup, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

---

## 5. Memory & postgresql.conf Tuning

These settings are the difference between a database that crawls and one that flies.

### Critical Parameters

```ini
# postgresql.conf

# ─── MEMORY ──────────────────────────────────────────────────────────────────

# Shared buffer pool — Postgres's own page cache
# Rule of thumb: 25% of RAM. Beyond 8GB gains diminish (OS cache handles the rest).
shared_buffers = 4GB              # for a 16GB RAM server

# OS cache hint — NOT allocated memory, just a planner hint
# Set to: RAM - shared_buffers - OS overhead - other processes
effective_cache_size = 10GB

# Per sort/hash node memory (see below) — default 4MB
# Too low: sorts spill to disk. Too high: OOM if many concurrent queries.
# Rule: (RAM * 0.25) / max_connections — but monitor actual spills first.
work_mem = 64MB

# Used per operation by VACUUM, CREATE INDEX, ALTER TABLE ADD FOREIGN KEY
# Each autovacuum worker can use this much too (unless autovacuum_work_mem is set),
# so total ≈ value × (autovacuum_max_workers + manual maintenance sessions).
# Before PG17, VACUUM could use at most 1GB of it for dead-tuple tracking.
maintenance_work_mem = 1GB

# ─── CONNECTIONS ─────────────────────────────────────────────────────────────

# Each connection is a process: a few MB baseline, much more once it caches
# catalogs/plans or runs big sorts. Never set this to 1000.
# Use PgBouncer for connection pooling instead of raising this. Changing it requires a restart.
max_connections = 100

# ─── WAL (Write-Ahead Log) ───────────────────────────────────────────────────

# In-memory WAL buffer before write to disk
# Default -1 = 1/32 of shared_buffers, capped at 16MB (one WAL segment). Raising it helps
# only for heavy concurrent write bursts.
wal_buffers = 64MB

# When COMMIT returns to the client:
# 'on'           = after WAL is flushed locally (and on sync standbys, if configured) — no committed data lost on crash
# 'off'          = before WAL flush — a crash can lose the last ~3 × wal_writer_delay (~600ms) of commits,
#                  but never corrupts the database. Can be set per transaction for low-value writes.
# 'local'        = flush locally but don't wait for sync standbys
# 'remote_write' / 'remote_apply' = sync replication strength levels (see Replication)
synchronous_commit = on

# Checkpoints write all dirty pages to disk; they happen every checkpoint_timeout or
# when max_wal_size of WAL has accumulated, whichever comes first.
# Less frequent = less I/O (and fewer full-page writes) but longer crash recovery.
checkpoint_timeout = 15min           # default 5min
checkpoint_completion_target = 0.9   # spread checkpoint I/O over 90% of the interval (default since PG14)
max_wal_size = 2GB                   # default 1GB; soft limit, not a hard cap on pg_wal

# ─── QUERY PLANNER ───────────────────────────────────────────────────────────

# For SSD storage (hugely important for index usage):
random_page_cost = 1.1            # default 4.0 is calibrated for HDDs
effective_io_concurrency = 200    # concurrent prefetch I/Os (bitmap heap scans; PG18 async I/O). SSD: 100-200+; HDD: 1-2. Default 1 (16 in PG18+)

# Parallel query (uses multiple CPU cores for large scans)
max_parallel_workers_per_gather = 4   # default 2
max_parallel_workers = 8              # default 8; also limited by max_worker_processes

# ─── LOGGING ─────────────────────────────────────────────────────────────────

# Log slow queries (essential for production tuning)
log_min_duration_statement = 1000   # log queries taking > 1 second
log_checkpoints = on                 # log checkpoint start/end times
log_lock_waits = on                  # log when a query waits >deadlock_timeout for a lock
log_temp_files = 0                   # log every temp file (sort/hash spill to disk)
```

### work_mem — The Most Misunderstood Setting

`work_mem` is **per sort/hash operation per query**, not per query, not per connection. A single complex query with 5 sort nodes and 2 hash joins can use `7 × work_mem`. Two multipliers make it worse:
- Hash nodes may use `work_mem × hash_mem_multiplier` (default 2.0 since PG15)
- Each parallel worker gets its own allowance per node

So worst case ≈ `connections × nodes × (1 + workers) × work_mem`. Keep the global value moderate and raise it per session/role for reporting queries.

```sql
-- Check if sorts are spilling to disk (the main symptom of low work_mem).
-- Requires pg_stat_statements (see section 9):
SELECT query, total_exec_time, rows, temp_blks_written
FROM pg_stat_statements
WHERE temp_blks_written > 0
ORDER BY temp_blks_written DESC;

-- Or check log for: "temporary file: size 50MB" (with log_temp_files = 0)

-- Set higher work_mem for a specific session/query without changing globally:
SET work_mem = '256MB';
EXPLAIN ANALYZE SELECT ... ORDER BY ...;  -- see if "Sort Method: external merge" changes to "quicksort" or "top-N heapsort" (in-memory)
RESET work_mem;
```

### shared_buffers and Double Caching

Postgres has its own page cache (`shared_buffers`) AND the OS has a file system cache. A page can be in both simultaneously — "double buffering." This is why `effective_cache_size` exists: tell the planner about OS cache so it can account for pages likely already in memory even if not in `shared_buffers`.

```sql
-- Check shared buffer hit rate (OLTP target: > 99%; analytics workloads run lower).
-- A "read" here may still be served by the OS cache, so a low rate isn't always physical I/O.
SELECT
    sum(heap_blks_hit) AS buffer_hits,
    sum(heap_blks_read) AS disk_reads,
    ROUND(sum(heap_blks_hit)::NUMERIC /
          NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100, 2) AS hit_rate
FROM pg_statio_user_tables;

-- Per-table buffer hit rate:
SELECT relname,
       heap_blks_hit,
       heap_blks_read,
       ROUND(heap_blks_hit::NUMERIC / NULLIF(heap_blks_hit + heap_blks_read, 0) * 100, 2) AS hit_pct
FROM pg_statio_user_tables
ORDER BY heap_blks_read DESC;
```

---

## 6. Replication

### WAL — The Foundation of Everything

**WAL (Write-Ahead Log)** is Postgres's durability mechanism. Before any change is applied to the data files, it is written to the WAL (an append-only log). On crash, Postgres replays the WAL to recover.

```
Write path:
  1. Client sends UPDATE
  2. Postgres writes change to WAL buffer (in memory)
  3. Data page modified in shared_buffers (now "dirty")
  4. On COMMIT: WAL flushed to disk (fdatasync by default, per wal_sync_method)
  5. Client receives success
  6. Dirty data pages written to disk later (by background writer + checkpointer)
     — never before their WAL is flushed (the "write-ahead" rule)
```

Crash recovery: replay WAL from the last checkpoint's redo point forward. The first change to a page after each checkpoint writes the whole page into WAL (`full_page_writes`) to repair torn pages — which is why very frequent checkpoints inflate WAL volume.

This is also why streaming replication works — replicas receive and replay the WAL stream.

### Streaming Replication (Physical)

Sends the raw WAL byte stream to replicas. The replica is a byte-for-byte copy of the whole cluster (all databases), same major version and platform. Read-only (hot standby).

```sql
-- On PRIMARY: create a replication user
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'secret';
```

```ini
# postgresql.conf on primary (these are already the defaults since PG10, except wal_keep_size):
wal_level = replica          # or logical for logical replication
max_wal_senders = 10
wal_keep_size = 1GB          # PG13+ (was wal_keep_segments); extra WAL kept for replicas without a slot

# pg_hba.conf on primary:
# host replication replicator replica_ip/32 scram-sha-256
```

```bash
# Initialize replica (run on the replica host, empty data directory):
pg_basebackup -h primary_host -U replicator -D /var/lib/postgresql/data -P -R
# -R writes primary_conninfo to postgresql.auto.conf and creates standby.signal (PG12+)
# (PG11 and older: writes recovery.conf)
```

```sql
-- Monitor replication lag (run on primary):
SELECT
    client_addr,
    application_name,
    state,
    sync_state,
    pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_lag_bytes,
    write_lag, flush_lag, replay_lag     -- PG10+: time-based lag
FROM pg_stat_replication;

-- On replica: time since last replayed transaction
SELECT now() - pg_last_xact_replay_timestamp() AS replication_delay;
-- Misleading on an idle primary: grows even though the replica is fully caught up
```

### Synchronous vs Asynchronous Replication

- **Async (default):** primary commits without waiting for replica. Risk: if the primary dies before the replica catches up, those transactions are lost.
- **Sync:** COMMIT waits for the standby. What it waits for depends on `synchronous_commit`:
  - `remote_write` — standby received WAL and handed it to its OS
  - `on` (default) — standby flushed WAL to disk
  - `remote_apply` — standby replayed it (read-your-writes on the replica)

```ini
# postgresql.conf on primary — names match the standby's application_name:
synchronous_standby_names = 'replica1'
# or wait for any one of multiple replicas (quorum):
synchronous_standby_names = 'ANY 1 (replica1, replica2)'
```

**Danger:** If no listed sync standby is reachable, commits **hang** (they don't fail). Always list at least 2 candidates with `ANY 1`, or let an HA manager (Patroni) adjust the setting.

### Replication Slots — Preventing WAL Deletion

Without replication slots, Postgres can recycle WAL that a slow or disconnected replica hasn't consumed yet — the replica then needs a fresh `pg_basebackup`. A slot makes the primary keep WAL until the replica has consumed it.

```sql
-- Create a slot (then set primary_slot_name = 'replica1_slot' on the replica,
-- or pass -C -S replica1_slot to pg_basebackup):
SELECT pg_create_physical_replication_slot('replica1_slot');

-- Check slots:
SELECT slot_name, active, restart_lsn, wal_status,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS wal_retained
FROM pg_replication_slots;
```

**Danger:** An inactive replication slot will hold WAL forever, filling your disk. Cap it with `max_slot_wal_keep_size` (PG13+; the slot is invalidated instead of filling the disk) and drop unused slots:

```sql
SELECT pg_drop_replication_slot('unused_slot');
```

### Logical Replication

Replicates individual tables as row changes (INSERT/UPDATE/DELETE/TRUNCATE), not the whole cluster. The subscriber can run a different major version, have extra columns/indexes/tables, and accepts its own writes.

Limitations:
- **DDL is not replicated** — create and change the schema on the subscriber yourself (e.g. `pg_dump --schema-only`)
- **Sequences are not replicated** (through PG18) — set them on the subscriber before cutover
- UPDATE/DELETE on published tables need a **replica identity** (primary key by default, see CDC section); without one they error on the publisher
- Large objects are not replicated

```sql
-- On publisher:
ALTER SYSTEM SET wal_level = 'logical';
-- Restart required

CREATE PUBLICATION my_pub FOR TABLE anomaly_routes, cities;
-- or: FOR ALL TABLES

-- On subscriber (tables must already exist there).
-- Creates a logical replication slot on the publisher, copies existing rows, then streams changes:
CREATE SUBSCRIPTION my_sub
    CONNECTION 'host=primary_host dbname=mydb user=replicator password=secret'
    PUBLICATION my_pub;

-- Monitor:
SELECT * FROM pg_stat_subscription;
SELECT * FROM pg_publication_tables;
```

Use cases: zero-downtime major version upgrades, selective replication, data pipelines.

---

## 7. High Availability

### Connection Pooling — PgBouncer

Postgres has a **process-per-connection** model. Each connection forks a backend process (~5-10MB RAM in practice). At 500 connections, that's 2.5-5GB RAM just for connection overhead — plus CPU spent on snapshot building and lock contention that grows with connection count, even when most connections are idle.

**PgBouncer** sits between your app and Postgres. Your app holds thousands of connections to PgBouncer; PgBouncer holds a small pool to Postgres.

```ini
# pgbouncer.ini
[databases]
mydb = host=localhost port=5432 dbname=mydb

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
max_client_conn = 10000     # app connections to PgBouncer
default_pool_size = 25      # actual Postgres connections per (database, user) pair
pool_mode = transaction     # most efficient: connection returned to pool after each transaction
max_prepared_statements = 200  # PgBouncer 1.21+: protocol-level prepared statements work in transaction mode
```

**Pool modes:**

| Mode | Connection held | Works with | Limitations |
|------|----------------|------------|-------------|
| `session` | Entire session | Everything | Only helps when clients connect/disconnect often |
| `transaction` | One transaction | Most apps | Session state doesn't persist: `SET`, temp tables, session advisory locks, `LISTEN`, SQL-level `PREPARE` (protocol-level prepared statements need `max_prepared_statements`) |
| `statement` | One statement | Very simple queries | Multi-statement transactions are rejected |

`transaction` mode is the right default for web apps. Just ensure you don't rely on session-level state (`SET app.current_user_email` must be inside a transaction with `SET LOCAL`).

### Patroni — Automated Failover

Patroni is the standard for HA Postgres. It uses a distributed consensus store (DCS: etcd, ZooKeeper, Consul, or the Kubernetes API) to hold a **leader lock** with a TTL and manage failover.

```
                    ┌─────────────┐
                    │   etcd      │  consensus: who is primary?
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼───────┐
   │  node1      │  │  node2      │  │  node3      │
   │  PRIMARY    │  │  REPLICA    │  │  REPLICA    │
   │  patroni    │  │  patroni    │  │  patroni    │
   └─────────────┘  └─────────────┘  └─────────────┘
         │                │                │
         └───── WAL streaming ────────────►│
```

**Failover flow:**
1. node1 disappears (or loses contact with the DCS — then it demotes itself, preventing split-brain)
2. node1 stops renewing the leader key in etcd; the key expires after `ttl` (default 30s)
3. node2/node3 compare WAL positions; only healthy replicas within `maximum_lag_on_failover` are eligible
4. The most up-to-date replica (node2) acquires the leader key and promotes itself
5. node3 reconfigures to replicate from node2
6. HAProxy (via Patroni's REST health checks) or vip-manager moves the endpoint your app connects to

With async replication, failover can lose the last transactions not yet on node2. Set `synchronous_mode: true` in Patroni if that's unacceptable.

```bash
# Patronictl commands:
patronictl -c /etc/patroni/config.yml list                                       # cluster status
patronictl -c /etc/patroni/config.yml failover mydb --candidate node2            # manual failover (unhealthy primary)
patronictl -c /etc/patroni/config.yml switchover mydb --leader node1 --candidate node2  # planned, graceful
# (--leader replaced the deprecated --master flag in Patroni 3+)
```

---

## 8. Advanced Locking — Diagnosing Deadlocks and Lock Contention

### Lock Types

Postgres has multiple table-level lock modes. Every statement acquires them automatically, held until the transaction ends ("above" = later rows in this table):

| Lock Mode | Acquired by | Conflicts with |
|-----------|-------------|----------------|
| `ACCESS SHARE` | SELECT | ACCESS EXCLUSIVE only |
| `ROW SHARE` | SELECT FOR UPDATE / FOR SHARE | EXCLUSIVE, ACCESS EXCLUSIVE |
| `ROW EXCLUSIVE` | INSERT, UPDATE, DELETE, MERGE | SHARE and above |
| `SHARE UPDATE EXCLUSIVE` | VACUUM, ANALYZE, CREATE INDEX CONCURRENTLY, REINDEX CONCURRENTLY, VALIDATE CONSTRAINT | Itself and above |
| `SHARE` | CREATE INDEX | ROW EXCLUSIVE, SHARE UPDATE EXCLUSIVE, SHARE ROW EXCLUSIVE and above (not itself) |
| `SHARE ROW EXCLUSIVE` | CREATE TRIGGER, ADD FOREIGN KEY | ROW EXCLUSIVE and above (incl. itself) |
| `EXCLUSIVE` | REFRESH MATERIALIZED VIEW CONCURRENTLY | ROW SHARE and above |
| `ACCESS EXCLUSIVE` | most ALTER TABLE forms, DROP, TRUNCATE, VACUUM FULL, CLUSTER, REINDEX | Everything |

Row-level locks (`FOR UPDATE`, `FOR NO KEY UPDATE`, `FOR SHARE`, `FOR KEY SHARE`) are separate: they're stored in the tuple's `xmax`, not in `pg_locks`, so waiting on one shows up as waiting on the holder's **transaction ID** (`Lock: transactionid`).

**`ALTER TABLE` is the most dangerous lock.** Most forms acquire ACCESS EXCLUSIVE — blocks all reads and writes. Even an "instant" metadata-only ALTER needs it briefly. If a long-running `SELECT` holds ACCESS SHARE, your `ALTER TABLE` queues behind it — and every query that arrives after the ALTER queues behind the ALTER. A 1ms DDL can cause a multi-minute outage this way; always set `lock_timeout` (below).

```sql
-- Find blocking locks:
SELECT
    blocked.pid,
    blocked.query AS blocked_query,
    blocking.pid AS blocking_pid,
    blocking.query AS blocking_query,
    blocked.wait_event_type,
    blocked.wait_event
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
    ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE blocked.wait_event_type = 'Lock';
```

### Safe Schema Migrations on Live Tables

```sql
-- Instant (catalog-only) in every version: nullable column, no default
ALTER TABLE anomaly_routes ADD COLUMN notes TEXT;

-- Instant on Postgres 11+ for non-volatile defaults (stored in catalog, not rewritten),
-- even with NOT NULL:
ALTER TABLE anomaly_routes ADD COLUMN notes TEXT NOT NULL DEFAULT '';

-- REWRITES the whole table under ACCESS EXCLUSIVE: volatile defaults
ALTER TABLE anomaly_routes ADD COLUMN ref UUID DEFAULT gen_random_uuid();   -- BAD on big tables

-- For volatile/computed values (or Postgres < 11):
-- 1. Add nullable column (instant), then set the default for new rows (instant)
ALTER TABLE anomaly_routes ADD COLUMN ref UUID;
ALTER TABLE anomaly_routes ALTER COLUMN ref SET DEFAULT gen_random_uuid();
-- 2. Backfill existing rows in batches, committing each one (short row locks, VACUUM can keep up)
UPDATE anomaly_routes SET ref = gen_random_uuid() WHERE id BETWEEN 1 AND 10000 AND ref IS NULL;
-- ... repeat in batches
-- 3. Add NOT NULL via a CHECK constraint: NOT VALID skips the scan (brief ACCESS EXCLUSIVE)
ALTER TABLE anomaly_routes ADD CONSTRAINT ref_not_null CHECK (ref IS NOT NULL) NOT VALID;
ALTER TABLE anomaly_routes VALIDATE CONSTRAINT ref_not_null;  -- full scan, but only SHARE UPDATE EXCLUSIVE: reads/writes continue
-- 4. Convert to real NOT NULL: PG12+ uses the validated CHECK to skip the scan (brief ACCESS EXCLUSIVE)
ALTER TABLE anomaly_routes ALTER COLUMN ref SET NOT NULL;
ALTER TABLE anomaly_routes DROP CONSTRAINT ref_not_null;
-- PG18+: steps 3-4 can be done directly with a NOT VALID NOT NULL constraint:
--   ALTER TABLE anomaly_routes ADD CONSTRAINT ref_not_null NOT NULL ref NOT VALID;
--   ALTER TABLE anomaly_routes VALIDATE CONSTRAINT ref_not_null;
```

The same `NOT VALID` + `VALIDATE` pattern applies to foreign keys: `ADD CONSTRAINT ... FOREIGN KEY ... NOT VALID`, then `VALIDATE CONSTRAINT` without blocking writes.

### lock_timeout and statement_timeout

```sql
-- Abort if we can't get a lock within 2 seconds (prevents migration from blocking for hours)
SET lock_timeout = '2s';
ALTER TABLE anomaly_routes ADD COLUMN notes TEXT;
-- If blocked for 2 seconds: ERROR: canceling statement due to lock timeout

-- Abort if query takes longer than 30 seconds:
SET statement_timeout = '30s';

-- Per-role default (in postgresql.conf or ALTER ROLE; applies to new sessions):
ALTER ROLE app_user SET statement_timeout = '30s';
ALTER ROLE migrations_user SET lock_timeout = '5s';
```

A migration that hits `lock_timeout` should be **retried** (with backoff), not abandoned — the point is to fail fast instead of queuing everything behind you.

### Deadlocks

A deadlock is when two transactions each hold a lock the other needs.

```
Transaction A: locked row 1, waiting for row 2
Transaction B: locked row 2, waiting for row 1
→ Neither can proceed. After waiting deadlock_timeout (default 1s), Postgres checks
  for a cycle and aborts one transaction with an error; the other proceeds.
```

```sql
-- Deadlocks are always reported as an ERROR to the client and in the server log:
--   ERROR: deadlock detected
--   DETAIL: Process 123 waits for ShareLock on transaction 456; blocked by process 789.
-- log_lock_waits = on additionally logs any lock wait longer than deadlock_timeout
-- (useful for spotting contention that isn't a deadlock).
-- The application must retry the aborted transaction.

-- Prevention: always acquire locks in the same order across transactions
-- Instead of:
--   Tx A: UPDATE users SET ... WHERE id = 1; UPDATE users SET ... WHERE id = 2;
--   Tx B: UPDATE users SET ... WHERE id = 2; UPDATE users SET ... WHERE id = 1;
-- Do (UPDATE has no ORDER BY, so lock rows in a fixed order first):
BEGIN;
SELECT id FROM users WHERE id IN (1, 2) ORDER BY id FOR UPDATE;
UPDATE users SET ... WHERE id IN (1, 2);
COMMIT;
```

---

## 9. pg_stat_statements — The Production Monitoring Tool

`pg_stat_statements` tracks execution statistics for every distinct query. It's the most important extension for production tuning.

```sql
-- Enable (requires postgresql.conf change + restart):
-- shared_preload_libraries = 'pg_stat_statements'
-- pg_stat_statements.track = all   -- default 'top'; 'all' also tracks statements inside functions

CREATE EXTENSION pg_stat_statements;  -- per database, to create the view

-- Column names below are PG13+ (older: total_time, mean_time, ...).
-- Constants are normalized to $1, $2..., so one row = one query shape.
-- Stats are cumulative since the last reset — compare snapshots over time for rates.

-- Top 10 queries by total time:
SELECT
    LEFT(query, 100) AS query,
    calls,
    ROUND(total_exec_time::NUMERIC, 2) AS total_ms,
    ROUND(mean_exec_time::NUMERIC, 2) AS avg_ms,
    ROUND(stddev_exec_time::NUMERIC, 2) AS stddev_ms,
    rows,
    shared_blks_hit,
    shared_blks_read,
    temp_blks_written
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Swap the ORDER BY above for other views:
-- Top 10 by average time (slow individual queries):
ORDER BY mean_exec_time DESC

-- Queries causing most disk I/O:
ORDER BY shared_blks_read DESC

-- Queries spilling to disk (bad work_mem):
ORDER BY temp_blks_written DESC

-- Reset statistics:
SELECT pg_stat_statements_reset();
```

---

## 10. Parallel Query

Postgres can use multiple CPU cores for a single query on large tables.

```sql
-- Check if parallel is being used:
EXPLAIN ANALYZE SELECT COUNT(*) FROM anomaly_routes;
-- Finalize Aggregate
--   ->  Gather  (Workers Planned: 2, Workers Launched: 2)
--         ->  Partial Aggregate
--               ->  Parallel Seq Scan on anomaly_routes
-- (plain EXPLAIN shows only "Workers Planned"; fewer launched = worker pool exhausted)

-- Configure (values shown are defaults):
SET max_parallel_workers_per_gather = 2;  -- max workers per Gather / Gather Merge node
SET parallel_setup_cost = 1000;           -- planner cost of starting workers (lower = more parallel)
SET parallel_tuple_cost = 0.1;            -- planner cost per tuple passed from worker to leader
SET min_parallel_table_scan_size = '8MB'; -- tables smaller than this aren't scanned in parallel

-- Force a parallel plan for testing (PG16+; called force_parallel_mode before):
SET debug_parallel_query = on;

-- Disable for a specific query:
SET max_parallel_workers_per_gather = 0;
```

**Parallel doesn't always win.** The overhead of spawning workers and merging results costs time. For small tables or fast index scans, parallel is slower. The planner estimates the crossover point — which is why correct statistics matter. Queries that write data, use `FOR UPDATE`, or call `PARALLEL UNSAFE` functions (the default for user-defined functions) never run in parallel.

---

## 11. Partitioning — Production Patterns

### Declarative Partitioning with Automation

```sql
-- Time-series: partition by month
CREATE TABLE events (
    id         BIGINT GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ NOT NULL,
    payload    JSONB
) PARTITION BY RANGE (created_at);

-- Create partitions manually (or use pg_partman extension to automate):
CREATE TABLE events_2026_01 PARTITION OF events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE events_2026_02 PARTITION OF events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Default partition: catches inserts that don't match any range
CREATE TABLE events_default PARTITION OF events DEFAULT;
```

Constraints to know:
- A primary key / unique index on a partitioned table **must include the partition key**: `PRIMARY KEY (id, created_at)`.
- Inserting a row with no matching partition (and no default partition) fails.
- Default partition caveat: creating a new partition scans the default partition to make sure none of its rows belong in the new range, holding a lock while it does. Keep the default partition empty and monitor it.
- Indexes created on the parent are created on every partition automatically.

**Partition pruning — verify it's working:**

```sql
EXPLAIN SELECT * FROM events WHERE created_at >= '2026-01-01' AND created_at < '2026-02-01';
-- Should show: Append → Seq Scan on events_2026_01
-- Should NOT show scans on other partitions
-- Pruning with parameters/now() happens at execution time: look for "Subplans Removed: N"
-- Pruning fails if the WHERE clause wraps the key (e.g. date_trunc('month', created_at) = ...)
```

**Detach and archive old partitions:**

```sql
-- Detach: metadata-only, but takes ACCESS EXCLUSIVE on the parent (blocks all queries on events briefly)
ALTER TABLE events DETACH PARTITION events_2025_01;

-- PG14+: only SHARE UPDATE EXCLUSIVE on the parent — queries keep running.
-- Cannot run in a transaction block, and not allowed when a default partition exists.
ALTER TABLE events DETACH PARTITION events_2025_01 CONCURRENTLY;

-- Now events_2025_01 is a standalone table — archive to cold storage, drop, or compress.
-- Dropping a whole partition is far cheaper than DELETE (no dead tuples, no vacuum).
-- If you keep it read-only, freeze it once so it never needs anti-wraparound vacuum work again:
VACUUM FREEZE events_2025_01;
```

### Partition-wise Joins and Aggregates

When two partitioned tables are joined on their partition key, Postgres can join matching partitions directly — "partition-wise join." Partition-wise aggregate does the same for `GROUP BY` (fully when grouping by the partition key, otherwise partial aggregates per partition).

```sql
-- Both default to off because they increase planning time and memory:
SET enable_partitionwise_join = on;
SET enable_partitionwise_aggregate = on;
```

Partition-wise join requires both tables to be partitioned the same way (same key type and matching bounds).

---

## 12. Extensions — The Ecosystem

```sql
-- List installed extensions in the current database (psql: \dx):
SELECT extname, extversion FROM pg_extension;

-- Available on this server, with installed version if any:
SELECT name, default_version, installed_version, comment
FROM pg_available_extensions
ORDER BY installed_version IS NULL, name;
```

"External install" = OS/package install of the extension files first, then `CREATE EXTENSION`. `shared_preload_libraries` = also add to that setting and restart, then `CREATE EXTENSION`.

| Extension | Purpose | Install |
|-----------|---------|---------|
| `pg_stat_statements` | Query performance tracking | `shared_preload_libraries` + `CREATE EXTENSION pg_stat_statements` |
| `pgcrypto` | Hash passwords (`crypt`, `gen_salt`), random bytes, PGP column encryption (`pgp_sym_encrypt`) | `CREATE EXTENSION pgcrypto` |
| `uuid-ossp` | UUID generation (v1-v5). Usually unnecessary: `gen_random_uuid()` (v4) is built in since PG13, `uuidv7()` since PG18 | `CREATE EXTENSION "uuid-ossp"` |
| `pg_trgm` | Trigram similarity — fuzzy search (`%` operator, `similarity()`), indexed `LIKE '%x%'` | `CREATE EXTENSION pg_trgm` |
| `fuzzystrmatch` | `levenshtein`, `soundex`, `metaphone` distance functions | `CREATE EXTENSION fuzzystrmatch` |
| `tablefunc` | `crosstab()` for pivot tables | `CREATE EXTENSION tablefunc` |
| `hstore` | Key-value pairs in a column (predates JSONB) | `CREATE EXTENSION hstore` |
| `pgstattuple` | Exact table/index bloat measurement | `CREATE EXTENSION pgstattuple` |
| `postgis` | Geospatial | External install |
| `pg_partman` | Automatic partition management | External install |
| `pg_repack` | Online table rewrite (VACUUM FULL with only brief locks) | External install |
| `pgvector` | Vector similarity search (AI embeddings) | External install, `CREATE EXTENSION vector` |
| `pg_cron` | Cron jobs inside Postgres | External install + `shared_preload_libraries` |
| `timescaledb` | Time-series at scale (hypertables = automatic partitioning, compression) | External install + `shared_preload_libraries` |

### pg_trgm — Fuzzy Search

```sql
CREATE EXTENSION pg_trgm;

-- Find similar strings (0.0–1.0, higher = more similar)
-- similarity = shared trigrams / total distinct trigrams of both strings
-- (lowercased, padded: 'dhaka' → "  d"," dh","dha","hak","aka","ka ")
SELECT similarity('Dhaka', 'Dhakaa');   -- 0.625 (5 shared / 8 total)
SELECT similarity('Dhaka', 'Dhaaka');   -- 0.625 (5 shared / 8 total)

-- Fast LIKE/ILIKE with index:
CREATE INDEX idx_trgm ON cities USING GIN (name gin_trgm_ops);
SELECT * FROM cities WHERE name % 'Dhak';      -- similarity >= pg_trgm.similarity_threshold (default 0.3)
SELECT * FROM cities WHERE name ILIKE '%dhak%'; -- uses the GIN trgm index (patterns need 3+ characters to help)

-- Ranked fuzzy search:
SELECT name, similarity(name, 'Dhak') AS score
FROM cities
WHERE name % 'Dhak'
ORDER BY score DESC
LIMIT 10;

-- Levenshtein distance (edit distance):
CREATE EXTENSION fuzzystrmatch;
SELECT levenshtein('Dhaka', 'Dhakaa');  -- 1 (one insertion)
```

### pgvector — AI Embeddings

```sql
CREATE EXTENSION vector;

-- Store embedding vectors (dimension must match your model, e.g. OpenAI text-embedding-3-small = 1536)
ALTER TABLE articles ADD COLUMN embedding vector(1536);

-- Find most similar articles to a given embedding.
-- ORDER BY the operator expression directly so an index can be used:
SELECT id, title,
       embedding <=> '[0.1, 0.2, ...]'::vector AS distance
FROM articles
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;

-- Operators:
-- <=>  cosine distance (most common for text embeddings)
-- <->  Euclidean (L2) distance
-- <#>  negative inner product (negated so ORDER BY ASC returns the most similar)

-- Without an index, queries do exact (brute-force) search — fine for small tables.
-- Approximate nearest neighbor (ANN) indexes trade a little recall for speed.
-- The operator class must match the query operator (vector_cosine_ops ↔ <=>, vector_l2_ops ↔ <->).

-- HNSW: best speed/recall, slower build, more memory; can be built on an empty table
CREATE INDEX ON articles USING hnsw (embedding vector_cosine_ops);
SET hnsw.ef_search = 100;   -- default 40; higher = better recall, slower

-- IVFFlat: faster build, less memory; build AFTER loading data (clusters come from existing rows)
CREATE INDEX ON articles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);  -- ~rows/1000
SET ivfflat.probes = 10;    -- default 1; higher = better recall, slower
```

Combining a vector ORDER BY with a selective `WHERE` filter can return fewer than `LIMIT` rows, because the index finds nearest neighbors first and filters after. pgvector 0.8+ has iterative index scans (`hnsw.iterative_scan`) to mitigate this.

---

## 13. Production Incident Playbook

### Symptom: Database is Slow — Everything Hangs

```sql
-- Step 1: What's running right now?
SELECT pid, now() - query_start AS duration, state, wait_event_type, wait_event,
       LEFT(query, 100) AS query
FROM pg_stat_activity
WHERE state != 'idle' AND pid <> pg_backend_pid()
ORDER BY duration DESC;

-- Step 2: Is there a lock pile-up?
SELECT blocked.pid, blocked.query, blocking.pid AS blocking_pid, blocking.state, blocking.query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE blocked.wait_event_type = 'Lock';
-- The root blocker is the pid that appears as blocking_pid but is not itself blocked.
-- It is often 'idle in transaction', not a running query.

-- Step 3: Kill the blocker (graceful first) — replace 12345 with the blocking_pid
SELECT pg_cancel_backend(12345);     -- cancels the current query; does nothing for an idle-in-transaction session
-- If it doesn't respond, or the session is idle in transaction:
SELECT pg_terminate_backend(12345);  -- closes the connection, rolls back its transaction
```

### Symptom: Disk Full

```sql
-- Find what's eating disk:
SELECT relname,
       pg_size_pretty(pg_total_relation_size(oid)) AS total,
       pg_size_pretty(pg_relation_size(oid)) AS table,
       pg_size_pretty(pg_indexes_size(oid)) AS indexes
FROM pg_class
WHERE relkind = 'r'
ORDER BY pg_total_relation_size(oid) DESC
LIMIT 20;

-- Check WAL directory size (superuser or pg_monitor role):
SELECT pg_size_pretty(sum(size)) FROM pg_ls_waldir();

-- pg_wal growing? Usual causes: failing archive_command, stale replication slot,
-- or a huge max_wal_size / wal_keep_size.
SELECT archived_count, failed_count, last_failed_wal, last_failed_time FROM pg_stat_archiver;

-- Check for abandoned replication slots holding WAL:
SELECT slot_name, active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS wal_held
FROM pg_replication_slots
WHERE NOT active;
-- Drop them if stale (the replica/consumer using it will need re-seeding):
SELECT pg_drop_replication_slot('stale_slot');
```

Never delete files from `pg_wal` by hand — that corrupts the cluster. Fix the cause (slot, archiving) and let the next checkpoint remove old WAL.

### Symptom: A Specific Query Got Slow Overnight

Most likely causes: statistics are stale after a data change, the data distribution crossed a plan tipping point, or a prepared statement switched to a generic plan (see `plan_cache_mode`).

```sql
-- Refresh statistics:
ANALYZE anomaly_routes;

-- Check if estimates match reality:
EXPLAIN (ANALYZE, BUFFERS) SELECT ... ;
-- Compare "rows=X" (estimate) vs "rows=Y" (actual)
-- If wildly off, statistics are bad

-- Increase statistics target for the column:
ALTER TABLE anomaly_routes ALTER COLUMN status SET STATISTICS 500;
ANALYZE anomaly_routes;

-- Check if an index stopped being used (idx_scan not increasing), was dropped, or is invalid:
SELECT indexrelname, idx_scan, idx_tup_read, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE relname = 'anomaly_routes';

SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;  -- e.g. failed CREATE INDEX CONCURRENTLY
```

### Symptom: High CPU, Many Queries

```sql
-- Find duplicate/near-duplicate queries (same pattern, different parameters)
-- pg_stat_statements normalizes parameters, so these are already grouped:
SELECT LEFT(query, 100), calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC   -- = calls × mean_exec_time
LIMIT 10;

-- N+1 query pattern: a query called thousands of times
-- calls >> other queries is the signature

-- Check connection count:
SELECT count(*), state FROM pg_stat_activity GROUP BY state;
-- Many 'idle in transaction' connections = app not committing/closing transactions
```

### Symptom: `idle in transaction` Connections Piling Up

An application opened a transaction (`BEGIN`) but never committed or rolled back — holding its locks indefinitely **and** holding back the xmin horizon, so VACUUM can't clean dead tuples anywhere in the database (see section 4).

```sql
-- Find them (also matches 'idle in transaction (aborted)'):
SELECT pid, now() - xact_start AS txn_duration, state, query  -- query = last statement it ran
FROM pg_stat_activity
WHERE state LIKE 'idle in transaction%'
ORDER BY txn_duration DESC;

-- Kill old ones:
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state LIKE 'idle in transaction%'
AND now() - xact_start > INTERVAL '5 minutes';

-- Prevent via timeout (globally or per-role):
ALTER SYSTEM SET idle_in_transaction_session_timeout = '5min';
SELECT pg_reload_conf();
ALTER ROLE app_user SET idle_in_transaction_session_timeout = '1min';
-- PG17+: transaction_timeout caps total transaction duration, idle or not
```

### Symptom: Transaction ID Wraparound Warning

```
WARNING: database "mydb" must be vacuumed within 10985967 transactions
```

```sql
-- 1. Remove whatever blocks freezing FIRST, or VACUUM will run and achieve nothing:
--    long transactions, idle-in-transaction sessions, orphaned prepared transactions,
--    stale replication slots (queries in section 4: "What is holding back the xmin horizon?")
SELECT gid, prepared FROM pg_prepared_xacts;   -- ROLLBACK PREPARED 'gid' for orphans

-- 2. Find the oldest tables (in the database named in the warning):
SELECT c.oid::regclass AS table_name, age(c.relfrozenxid) AS xid_age
FROM pg_class c
WHERE c.relkind IN ('r', 'm', 't')
ORDER BY xid_age DESC
LIMIT 10;

-- 3. Vacuum them. A plain VACUUM on a table this old is already aggressive (freezes old XIDs);
--    FREEZE freezes everything, which is more work. Avoid VACUUM FULL here — it's slower and locks.
VACUUM (VERBOSE) most_ancient_table;
-- or the whole cluster in parallel from the shell: vacuumdb --all --freeze --jobs=4

-- Permanent fix: make sure autovacuum can keep up (raise autovacuum_vacuum_cost_limit,
-- lower per-table autovacuum_freeze_max_age on hot tables) and alert on long transactions.
-- Raising autovacuum_freeze_max_age (default 200M) only postpones the problem.
```

---

## 14. Useful Hidden System Views

```sql
-- All active queries with full detail
SELECT * FROM pg_stat_activity;

-- Every heavyweight lock held or awaited (granted = false means waiting);
-- use pg_blocking_pids(pid) for who-blocks-whom
SELECT * FROM pg_locks;

-- Index usage per table
SELECT * FROM pg_stat_user_indexes;

-- Table I/O statistics
SELECT * FROM pg_statio_user_tables;

-- Replication status
SELECT * FROM pg_stat_replication;       -- on primary
SELECT * FROM pg_stat_subscription;      -- on subscriber (logical replication)

-- Background writer stats (buffer writes)
SELECT * FROM pg_stat_bgwriter;
-- Checkpoint frequency: pg_stat_checkpointer (PG17+; columns lived in pg_stat_bgwriter before)
SELECT * FROM pg_stat_checkpointer;
-- I/O by backend type and object (PG16+)
SELECT * FROM pg_stat_io;

-- Database-level stats (transactions, tuples, temp files)
SELECT * FROM pg_stat_database WHERE datname = current_database();

-- Column statistics used by planner
SELECT * FROM pg_stats WHERE tablename = 'anomaly_routes';

-- All constraints
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'anomaly_routes'::regclass;

-- All indexes with their definitions
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'anomaly_routes';

-- All triggers
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'anomaly_routes';

-- Sequences and their current values
SELECT sequencename, last_value, increment_by, max_value
FROM pg_sequences;

-- Check for tables missing a primary key (dangerous for replication):
SELECT relname
FROM pg_class c
LEFT JOIN pg_constraint pk ON pk.conrelid = c.oid AND pk.contype = 'p'
WHERE c.relkind = 'r'
AND c.relnamespace = 'public'::regnamespace
AND pk.conname IS NULL;
```

---

## 15. Backup & Point-in-Time Recovery (PITR)

If you don't know this, you don't run a production database. Backups are not optional.

### pg_dump — Logical Backup

Exports SQL statements (or an archive) that recreate your data. Restores into the same or a **newer** major version — run the newer version's `pg_dump` for upgrades. Selective (per-database, per-table). Runs inside one `REPEATABLE READ` snapshot, so the dump is consistent and doesn't block normal reads/writes (it does block DDL like `ALTER TABLE` on dumped tables).

```bash
# Dump a single database (SQL format):
pg_dump -h localhost -U postgres mydb > backup.sql

# Restore:
psql -h localhost -U postgres mydb < backup.sql

# Custom format (compressed, selective restore, supports parallel restore):
pg_dump -h localhost -U postgres -Fc mydb > backup.dump

# Restore custom format:
pg_restore -h localhost -U postgres -d mydb backup.dump

# Parallel restore (uses N jobs, much faster for large DBs; custom or directory format):
pg_restore -h localhost -U postgres -d mydb -j 4 backup.dump

# Directory format is the only one that also supports a parallel DUMP:
pg_dump -h localhost -U postgres -Fd -j 4 -f backup_dir mydb

# Dump only specific tables:
pg_dump -t anomaly_routes -t cities mydb > tables.sql

# Dump only schema (no data):
pg_dump --schema-only mydb > schema.sql

# Dump only data (no schema):
pg_dump --data-only mydb > data.sql

# Dump all databases + roles + tablespaces (plain SQL only, single-threaded):
pg_dumpall -h localhost -U postgres > full_cluster.sql

# Roles and tablespaces only — pg_dump never includes them:
pg_dumpall -h localhost -U postgres --globals-only > globals.sql
```

**Limitations of pg_dump:**
- It's a snapshot of one moment — everything written after the dump started is lost if you restore it
- Cannot restore to a specific point in time between dumps
- Restore of a large database is slow: all indexes and constraints are rebuilt from scratch
- A long dump holds an old snapshot, which blocks VACUUM cleanup for its whole duration

### pg_basebackup — Physical Backup

Copies the entire cluster's data directory over the replication protocol while the server is running. The copied files are inconsistent on their own; the WAL generated during the copy is what makes the backup consistent. Used as the starting point for replicas and PITR. Same major version only.

```bash
# Create a base backup:
pg_basebackup -h localhost -U replicator -D /backup/base -P -Ft -z
# -Ft = tar format, -z = gzip compress, -P = progress
# Default --wal-method=stream (PG10+): WAL needed for consistency is streamed alongside
# (pg_wal.tar with -Ft), so the backup is self-contained.
# --wal-method=fetch collects WAL at the end instead (fails if it was recycled meanwhile);
# --wal-method=none relies on your WAL archive.

# PG17+: incremental backups (requires summarize_wal = on)
pg_basebackup -D /backup/incr1 --incremental=/backup/base/backup_manifest
pg_combinebackup /backup/base /backup/incr1 -o /backup/restored   # rebuild a full data dir
```

### WAL Archiving — The Foundation of PITR

WAL archiving continuously saves WAL segment files to a safe location. Combined with a base backup, you can replay WAL to any point in time.

```ini
# postgresql.conf:
wal_level = replica
archive_mode = on            # requires restart
archive_command = 'test ! -f /archive/wal/%f && cp %p /archive/wal/%f'
# %p = path to WAL file, %f = filename only
# Must return 0 ONLY when the file is safely stored; non-zero = Postgres retries and keeps the WAL.
# Never overwrite an existing archive file. Plain cp doesn't fsync — demo only; use a real tool in production.

# For S3/GCS/Azure, use WAL-G or pgBackRest:
archive_command = 'wal-g wal-push %p'
# archive_command = 'pgbackrest --stanza=main archive-push %p'
```

A broken `archive_command` makes `pg_wal` grow until the disk fills. Monitor `pg_stat_archiver.failed_count`.

### Point-in-Time Recovery (PITR)

Scenario: someone ran `DELETE FROM anomaly_routes WHERE city_id = 5` at 14:32 and shouldn't have. You need to restore to 14:31.

Restore into a **separate** data directory (ideally a separate host) and keep production running — you usually only need to copy the deleted rows back. Use a base backup taken **before** 14:32.

```bash
# 1. Restore the base backup to a new, empty, postgres-owned directory (chmod 700)
mkdir -p /var/lib/postgresql/data_restore
tar -xzf base.tar.gz -C /var/lib/postgresql/data_restore
# (with -Ft backups, also extract pg_wal.tar into data_restore/pg_wal)

# 2. Add recovery settings — APPEND, don't overwrite postgresql.conf; comments use #
cat >> /var/lib/postgresql/data_restore/postgresql.conf << 'EOF'
restore_command = 'cp /archive/wal/%f %p'
recovery_target_time = '2026-04-11 14:31:00+06'
recovery_target_action = 'pause'   # default: stop at target, stay read-only for inspection
port = 5433                        # avoid clashing with production on the same host
EOF

# 3. Create the signal file that tells Postgres to do targeted recovery (PG12+; not start normally):
touch /var/lib/postgresql/data_restore/recovery.signal

# 4. Start Postgres — it replays archived WAL up to 14:31 and pauses
pg_ctl start -D /var/lib/postgresql/data_restore

# 5. Verify the data (read-only queries on port 5433), then either:
#    - pg_dump / COPY the missing rows and load them into production, or
#    - SELECT pg_wal_replay_resume();  to end recovery and promote this copy to a new primary
#      (recovery_target_action = 'promote' does this automatically)
```

**Recovery target options** (set exactly one `recovery_target_*`, in postgresql.conf):

```ini
recovery_target_time = '2026-04-11 14:31:00'   # stop at this timestamp (server timezone unless one is given)
recovery_target_lsn  = '0/15D5FA8'             # stop at this WAL position
recovery_target_name = 'before_delete'          # stop at a named restore point
recovery_target_xid  = '12345'                  # stop at this transaction's commit
recovery_target_inclusive = true                # default: stop just AFTER the target; false = just before
recovery_target = 'immediate'                   # stop as soon as the backup is consistent
```

**Create named restore points (before risky operations):**

```sql
SELECT pg_create_restore_point('before_bulk_delete');
-- Then run your risky operation
-- If it goes wrong, PITR to 'before_bulk_delete'
```

### WAL-G — The Modern Backup Tool

`pg_basebackup` + hand-written WAL archiving is error-prone (retention, verification, fsync, parallelism). WAL-G automates base backups + WAL archiving + PITR to S3/GCS/Azure. **pgBackRest** is the main alternative (full/differential/incremental backups, parallel restore, backup verification).

```bash
# Configuration (~/.walg.json or env vars):
WALG_S3_PREFIX=s3://my-bucket/postgres-backups
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Take a base backup:
wal-g backup-push /var/lib/postgresql/data

# List backups:
wal-g backup-list

# Restore to a point in time:
wal-g backup-fetch /var/lib/postgresql/data LATEST   # or a backup name older than the target
# Then in postgresql.conf:
#   restore_command = 'wal-g wal-fetch %f %p'
#   recovery_target_time = '...'
# touch recovery.signal, and start Postgres
```

A backup you have never restored is not a backup. Schedule regular test restores.

---

## 16. Extended Statistics — Fixing Correlated Column Estimates

The planner assumes columns are **independent** when estimating rows for multi-column conditions. When columns are correlated, this assumption produces wildly wrong estimates, causing bad plans.

### The Problem

```sql
-- In anomaly_routes: city_id=5 is always Bangladesh, and is_intercity=false for all BD routes
-- Planner estimates for: WHERE city_id = 5 AND is_intercity = false
-- Estimate for city_id=5:      1000 rows (10% of 10,000)
-- Estimate for is_intercity=false: 5000 rows (50% of 10,000)
-- Combined estimate (independence assumption): 1000 × 0.50 = 500 rows
-- Reality: 1000 rows (100% of city_id=5 rows have is_intercity=false)

EXPLAIN ANALYZE SELECT * FROM anomaly_routes
WHERE city_id = 5 AND is_intercity = false;
-- Plan expects 500, gets 1000. 2× is harmless here, but with more columns the errors multiply
-- (3 correlated columns can be off by 10-100×) and drive wrong scan/join choices in larger queries.
```

### The Fix — Extended Statistics

```sql
-- Tell Postgres these columns are correlated:
CREATE STATISTICS stat_city_intercity ON city_id, is_intercity
    FROM anomaly_routes;

-- Refresh:
ANALYZE anomaly_routes;

-- Now check the estimate again — it should be much closer to reality
EXPLAIN ANALYZE SELECT * FROM anomaly_routes
WHERE city_id = 5 AND is_intercity = false;
```

### Types of Extended Statistics

```sql
-- 1. ndistinct: distinct counts of column combinations (GROUP BY a, b row estimates)
CREATE STATISTICS stat_city_status_nd (ndistinct) ON city_id, status FROM anomaly_routes;

-- 2. dependencies: functional dependencies between columns (equality WHERE clauses)
CREATE STATISTICS stat_city_intercity_dep (dependencies) ON city_id, is_intercity FROM anomaly_routes;

-- 3. mcv (PG12+): most common value combinations with their frequencies
--    (most accurate; also handles ranges, IN, and OR)
CREATE STATISTICS stat_city_status_mcv (mcv) ON city_id, status FROM anomaly_routes;

-- All three at once (default when you omit the type):
CREATE STATISTICS stat_all ON city_id, status, is_intercity FROM anomaly_routes;

-- PG14+: statistics on expressions
CREATE STATISTICS stat_created_month ON (date_trunc('month', created_at)) FROM anomaly_routes;

ANALYZE anomaly_routes;  -- extended statistics are only populated by ANALYZE
```

```sql
-- Inspect what was learned (readable view, PG12+):
SELECT statistics_name, attnames, n_distinct, dependencies, most_common_vals, most_common_freqs
FROM pg_stats_ext
WHERE tablename = 'anomaly_routes';
```

**When to use:** Anytime you see `rows=X (estimated)` wildly different from `rows=Y (actual)` in `EXPLAIN ANALYZE` for a multi-column `WHERE` or `GROUP BY` on a single table. That's a statistics problem, not an index problem. Extended statistics don't help estimates for correlations **across** joined tables.

---

## 17. JIT Compilation

JIT (Just-In-Time) compilation, available since Postgres 11, compiles parts of a query (expression evaluation, tuple deforming) to native machine code using LLVM at execution time. It helps for CPU-heavy analytical queries. It needs a server built with LLVM support (`SELECT pg_jit_available();`).

### When JIT Helps vs Hurts

**Helps:**
- Long-running queries doing heavy arithmetic or many function calls (analytics, aggregations over millions of rows)
- Queries where CPU is the bottleneck, not I/O

**Hurts:**
- Short OLTP queries — compilation overhead (tens to hundreds of ms) exceeds any gain
- Queries that return quickly — JIT never gets to amortize its startup cost
- Queries with **overestimated** row counts — JIT is triggered by *estimated* cost, so a bad estimate can make a 5ms query spend 200ms compiling

### Configuration

```ini
# postgresql.conf:
jit = on                            # enable JIT globally (default: off in PG11, on in PG12+)
jit_above_cost = 100000             # only JIT queries with estimated cost above this
jit_inline_above_cost = 500000      # inline function calls above this cost
jit_optimize_above_cost = 500000    # apply expensive optimizations above this cost
```

```sql
-- Check if JIT was used in a query:
EXPLAIN (ANALYZE, BUFFERS)
SELECT city_id, SUM(anomaly_score), AVG(estimated_distance)
FROM anomaly_routes
GROUP BY city_id;
-- Look for: JIT: Functions: 8, Options: Inlining true, Optimization true
-- Timing: Generation 2.345ms, Inlining 3.123ms, Optimization 45.23ms, Emission 12.34ms, Total 63ms

-- Disable JIT for a specific query (useful if JIT is hurting a short query):
SET jit = off;
SELECT ...;
RESET jit;
```

**Diagnosis:** If `EXPLAIN ANALYZE` shows JIT `Total Xms` is a significant fraction of the query's actual time, JIT is costing more than it saves. Raise `jit_above_cost` or disable it for that role.

```sql
-- Disable JIT for OLTP role (enable only for analytics role):
ALTER ROLE app_user SET jit = off;
ALTER ROLE analytics_user SET jit = on;
ALTER ROLE analytics_user SET jit_above_cost = 50000;
```

---

## 18. Zero-Downtime Migration Checklist

Every schema change in production is a risk. This is the decision framework, in order.

### Decision Tree

```
Is this change purely additive (new table, nullable column, column with a constant default,
index built CONCURRENTLY)?
  → YES: Usually safe. Still set lock_timeout — ADD COLUMN needs a brief ACCESS EXCLUSIVE lock.
  → NO: Continue ↓

Does it rewrite the table or scan it under ACCESS EXCLUSIVE?
  Rewrites: most column type changes (except binary-compatible ones like varchar(50) → varchar(100)
  or varchar → text), ADD COLUMN with a volatile default (e.g. gen_random_uuid()).
  Full scans: SET NOT NULL, ADD CHECK / FOREIGN KEY without NOT VALID.
  → YES: Use a multi-step migration (below). Never do it in one ALTER TABLE on a big table.
  → NO: Continue ↓

Is it metadata-only but still takes ACCESS EXCLUSIVE (RENAME, DROP COLUMN, DROP TABLE)?
  → YES: Set lock_timeout and retry; make sure app code is compatible first (expand/contract).
```

### Step-by-Step: Adding a NOT NULL Column

If every existing row gets the same constant, skip all of this on PG11+:
`ALTER TABLE anomaly_routes ADD COLUMN priority INTEGER NOT NULL DEFAULT 1;` is instant. The multi-step version is for values computed per row (or PG < 11):

```sql
-- Step 1: Add nullable (instant; brief ACCESS EXCLUSIVE, so use lock_timeout)
SET lock_timeout = '3s';
ALTER TABLE anomaly_routes ADD COLUMN priority INTEGER;
-- Make new rows non-NULL from now on (app code or a default), or the backfill never finishes
ALTER TABLE anomaly_routes ALTER COLUMN priority SET DEFAULT 1;

-- Step 2: Backfill in batches. Each batch must COMMIT, otherwise the whole loop is one
-- giant transaction: row locks held to the end, no VACUUM cleanup, one huge replica lag spike.
-- COMMIT inside DO works on PG11+ when the DO block is not run inside an explicit transaction
-- (some migration tools wrap everything in BEGIN — run this outside them).
DO $$
DECLARE
  batch_size BIGINT := 10000;
  max_id     BIGINT;
  cur_id     BIGINT := 0;
BEGIN
  SELECT MAX(id) INTO max_id FROM anomaly_routes;
  WHILE cur_id < max_id LOOP
    UPDATE anomaly_routes
    SET priority = 1          -- or a per-row expression
    WHERE id > cur_id AND id <= cur_id + batch_size AND priority IS NULL;
    COMMIT;
    cur_id := cur_id + batch_size;
    PERFORM pg_sleep(0.05);  -- brief pause to let replicas and autovacuum keep up
  END LOOP;
END $$;

-- Step 3: Add constraint as NOT VALID (checks new/updated rows only; no scan; brief ACCESS EXCLUSIVE)
ALTER TABLE anomaly_routes
    ADD CONSTRAINT priority_not_null CHECK (priority IS NOT NULL) NOT VALID;

-- Step 4: Validate (scans table but only holds SHARE UPDATE EXCLUSIVE — reads and writes continue)
ALTER TABLE anomaly_routes VALIDATE CONSTRAINT priority_not_null;

-- Step 5: Convert to real NOT NULL (PG12+ skips the scan because the CHECK proves it; brief ACCESS EXCLUSIVE)
ALTER TABLE anomaly_routes ALTER COLUMN priority SET NOT NULL;
ALTER TABLE anomaly_routes DROP CONSTRAINT priority_not_null;
```

### Step-by-Step: Adding an Index

```sql
-- NEVER do this on a live table (holds SHARE lock, blocks writes):
CREATE INDEX idx_priority ON anomaly_routes(priority);

-- ALWAYS use CONCURRENTLY:
CREATE INDEX CONCURRENTLY idx_priority ON anomaly_routes(priority);
-- Takes longer (two table scans, and it waits for all transactions older than it to finish)
-- but only holds SHARE UPDATE EXCLUSIVE (reads and writes continue).
-- Cannot run inside a transaction block — disable your migration tool's wrapping transaction.

-- If it fails midway (deadlock, unique violation, cancel), it leaves an INVALID index
-- with the same name that is still updated on every write but never used for reads:
SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;
DROP INDEX CONCURRENTLY idx_priority;
-- Then retry
```

### Step-by-Step: Renaming a Column

`ALTER TABLE ... RENAME COLUMN` itself is instant (catalog-only, brief ACCESS EXCLUSIVE). The problem is the application: during a rolling deploy, old and new app versions run at the same time, and one of them will query a column that doesn't exist. The zero-downtime approach is expand/contract:

```sql
-- Phase 1 (deploy): add new column, keep both in sync whichever one the app writes
ALTER TABLE anomaly_routes ADD COLUMN priority_level INTEGER;

CREATE OR REPLACE FUNCTION sync_priority() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.priority_level := COALESCE(NEW.priority_level, NEW.priority);
        NEW.priority       := COALESCE(NEW.priority, NEW.priority_level);
    ELSIF NEW.priority IS DISTINCT FROM OLD.priority THEN        -- old app wrote old column
        NEW.priority_level := NEW.priority;
    ELSIF NEW.priority_level IS DISTINCT FROM OLD.priority_level THEN  -- new app wrote new column
        NEW.priority := NEW.priority_level;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_priority
BEFORE INSERT OR UPDATE ON anomaly_routes
FOR EACH ROW EXECUTE FUNCTION sync_priority();

-- Backfill existing rows (in committed batches on large tables, as above):
UPDATE anomaly_routes SET priority_level = priority WHERE priority_level IS DISTINCT FROM priority;

-- Phase 2 (later deploy): app reads and writes only the new column
-- Phase 3 (final deploy, once no old app version runs): drop trigger, function, old column
DROP TRIGGER trg_sync_priority ON anomaly_routes;
DROP FUNCTION sync_priority();
ALTER TABLE anomaly_routes DROP COLUMN priority;  -- catalog-only; space is reclaimed as rows are rewritten
```

### Checklist Before Any Migration

- [ ] Tested on a production-sized copy of the database
- [ ] `SET lock_timeout = '3s'` before any DDL (prevents queuing behind long queries)
- [ ] `SET statement_timeout` on backfill batches
- [ ] Migration is idempotent (safe to run twice if it fails halfway)
- [ ] Rollback plan exists and has been tested
- [ ] Deployed during low-traffic window if any lock is involved
- [ ] `ANALYZE` run after migration if row counts changed significantly
- [ ] Replica lag monitored during migration

---

## 19. Change Data Capture (CDC)

CDC streams every INSERT, UPDATE, DELETE from Postgres to other systems in real time — without polling. The source is the WAL.

### Logical Decoding — The Engine Behind CDC

Postgres can decode WAL into a change stream via **output plugins**. The built-in plugin is `pgoutput` (binary protocol used by logical replication and Debezium); `test_decoding` ships in contrib as a text example. Third-party plugins include `wal2json` (JSON) and `decoderbufs` (Protobuf). A logical slot only sees **committed** changes, delivered in commit order.

```sql
-- Requires: wal_level = logical (restart required if not already set)
ALTER SYSTEM SET wal_level = 'logical';

-- Create a replication slot with the wal2json output plugin (plugin must be installed on the server):
SELECT pg_create_logical_replication_slot('cdc_slot', 'wal2json');

-- Peek at changes (non-destructive — does not advance the slot):
SELECT * FROM pg_logical_slot_peek_changes('cdc_slot', NULL, NULL,
    'pretty-print', '1', 'include-timestamp', '1');

-- Consume changes (advances the slot — changes are gone after this):
SELECT * FROM pg_logical_slot_get_changes('cdc_slot', NULL, NULL);

-- Drop when done:
SELECT pg_drop_replication_slot('cdc_slot');
```

Sample `wal2json` output (format-version 1; `oldkeys` contains the replica identity columns):

```json
{
  "change": [{
    "kind": "update",
    "schema": "public",
    "table": "anomaly_routes",
    "columnnames": ["id", "status", "resolved_by"],
    "columnvalues": [42, "ADMIN_APPROVED", "sourav@example.com"],
    "oldkeys": {
      "keynames": ["id"],
      "keyvalues": [42]
    }
  }]
}
```

### Debezium — Production CDC

Debezium is the standard open-source CDC platform. It runs as a Kafka Connect connector, reads Postgres logical replication slots, and publishes every row change to Kafka topics.

```
Postgres WAL → Debezium (Kafka Connect) → Kafka Topics → Consumers
                                                           (Elasticsearch, Redis, other DBs, analytics)
```

Debezium connector configuration (Debezium 2.x+; `topic.prefix` replaced `database.server.name`). `snapshot.mode: initial` takes an initial snapshot of existing rows, then streams changes. The connector user needs the `REPLICATION` attribute and `SELECT` on the captured tables.

```json
{
  "name": "postgres-cdc",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "localhost",
    "database.port": "5432",
    "database.user": "replicator",
    "database.password": "secret",
    "database.dbname": "mydb",
    "topic.prefix": "mydb",
    "table.include.list": "public.anomaly_routes,public.user_contributions",
    "plugin.name": "pgoutput",
    "slot.name": "debezium_slot",
    "publication.name": "debezium_pub",
    "snapshot.mode": "initial"
  }
}
```

Each Kafka message contains `before` and `after` states of the row, the operation type (`c`/`u`/`d`/`r` for snapshot reads), the source LSN, and a timestamp. `before` only contains the full old row with `REPLICA IDENTITY FULL` (see below); with the default it holds just the primary key, or nothing.

### Direct Logical Replication (without Kafka)

If you just need to sync one table to another Postgres database without the Kafka infrastructure:

```sql
-- Publisher:
CREATE PUBLICATION anomaly_pub FOR TABLE anomaly_routes;

-- Subscriber (the anomaly_routes table must already exist there with a compatible schema):
CREATE SUBSCRIPTION anomaly_sub
    CONNECTION 'host=primary dbname=mydb user=replicator password=secret'
    PUBLICATION anomaly_pub;
```

### Use Cases

| Use Case | Approach |
|----------|----------|
| Sync Postgres → Elasticsearch for search | Debezium → Kafka → Elasticsearch connector |
| Invalidate Redis cache on row change | Debezium → Kafka consumer → Redis DEL |
| Audit log of every data change | Logical decoding → append-only audit store (or triggers, if you need the DB user / in-transaction guarantees) |
| Event sourcing — replay history | CDC → event store |
| Zero-downtime major version upgrade | Logical replication to new-version replica, cut over |
| Cross-region data sync | Logical replication to replica in another region |

### Important Gotchas

**Replication slot lag = disk fill.** If your CDC consumer falls behind (or is switched off without dropping its slot), the slot holds WAL — and its `catalog_xmin` holds back VACUUM of system catalogs. Monitor it and set `max_slot_wal_keep_size` as a safety cap:

```sql
SELECT slot_name, active, wal_status,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS consumer_lag,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn))         AS wal_retained
FROM pg_replication_slots
WHERE slot_type = 'logical';
```

Before PG17, logical slots are not synced to physical standbys, so a failover loses them and CDC must re-snapshot. PG17+ can sync them (`failover = true` on the slot + `sync_replication_slots = on` on the standby).

**Tables need a replica identity for UPDATE/DELETE.** It decides which old-row columns are written to WAL:

```sql
-- Default: primary key columns only (usually fine). With no PK, nothing is logged and
-- UPDATE/DELETE on a table published by logical replication fails with an error.
ALTER TABLE anomaly_routes REPLICA IDENTITY DEFAULT;

-- A unique index on NOT NULL columns, for tables without a PK:
ALTER TABLE anomaly_routes REPLICA IDENTITY USING INDEX anomaly_routes_ref_key;

-- Full: all old columns in the before state (more WAL; subscribers without a usable index
-- must scan to find each row)
ALTER TABLE anomaly_routes REPLICA IDENTITY FULL;
```

---

## 20. Major Version Upgrades with `pg_upgrade`

Every production database eventually needs to jump major versions. You don't have to step through each one: `pg_upgrade` and `pg_dump` can go straight from e.g. 13 → 18. You have three strategies, with a huge trade-off between safety and downtime. Read the release notes ("Migration" section) of **every** version you skip.

### Strategy 1: pg_dump / pg_restore

The safest approach. Dump everything from the old cluster, restore into a new cluster on the new version.

```bash
# On a fresh machine with the new Postgres version installed (use the NEW version's client tools):
pg_dumpall -h old_host -U postgres > full_backup.sql
psql -h new_host -U postgres -f full_backup.sql

# Faster for big databases: globals + parallel per-database dump/restore
pg_dumpall -h old_host -U postgres --globals-only > globals.sql
psql -h new_host -U postgres -f globals.sql
pg_dump    -h old_host -U postgres -Fd -j 8 -f /dump/mydb mydb
pg_restore -h new_host -U postgres -C -d postgres -j 8 /dump/mydb   # -C creates mydb
```

**Pros:** Always works. Tests restore path. Leaves old cluster untouched as a rollback. Produces a freshly packed, bloat-free database.

**Cons:** Slow. A 1TB database can take hours (or days) to dump and restore. The entire window is downtime — or you accept data divergence between old and new.

### Strategy 2: pg_upgrade

`pg_upgrade` reuses the existing data files, since the on-disk format of user data is compatible across major versions. It dumps the schema (`pg_dump --binary-upgrade`), recreates it in a new empty cluster, then copies or links the data files over. It's orders of magnitude faster — minutes instead of hours — because it never re-reads or rewrites user data.

```bash
# Run as the postgres OS user, from a directory it can write to (pg_upgrade writes logs/scripts there).
# 1. Install the new Postgres version alongside the old one
# Both binaries must be accessible: /usr/lib/postgresql/14/bin and /usr/lib/postgresql/16/bin

# 2. Initialize the new cluster (empty data directory) with the SAME settings as the old one:
#    encoding, locale, and data checksums (PG18 initdb enables checksums by default — pass
#    --no-data-checksums if the old cluster has none)
/usr/lib/postgresql/16/bin/initdb -D /var/lib/postgresql/16/main

# 3. Stop BOTH clusters (critical — data must be quiescent). Downtime starts here.
/usr/lib/postgresql/14/bin/pg_ctl -D /var/lib/postgresql/14/main stop
/usr/lib/postgresql/16/bin/pg_ctl -D /var/lib/postgresql/16/main stop

# 4. Dry run (check compatibility without doing anything)
/usr/lib/postgresql/16/bin/pg_upgrade \
    --old-datadir=/var/lib/postgresql/14/main \
    --new-datadir=/var/lib/postgresql/16/main \
    --old-bindir=/usr/lib/postgresql/14/bin \
    --new-bindir=/usr/lib/postgresql/16/bin \
    --check

# 5. Run the upgrade in --link mode (fastest — hard-links files instead of copying)
/usr/lib/postgresql/16/bin/pg_upgrade \
    --old-datadir=/var/lib/postgresql/14/main \
    --new-datadir=/var/lib/postgresql/16/main \
    --old-bindir=/usr/lib/postgresql/14/bin \
    --new-bindir=/usr/lib/postgresql/16/bin \
    --link

# 6. Copy over postgresql.conf / pg_hba.conf changes, then start the new cluster
/usr/lib/postgresql/16/bin/pg_ctl -D /var/lib/postgresql/16/main start

# 7. Rebuild optimizer statistics (see below) — PG14+ prints this command instead of
#    generating analyze_new_cluster.sh
/usr/lib/postgresql/16/bin/vacuumdb --all --analyze-in-stages

# 8. Update extensions if pg_upgrade reported any (ALTER EXTENSION ... UPDATE),
#    then delete the old cluster once confirmed working
./delete_old_cluster.sh
```

Streaming replicas can't follow a `pg_upgrade` on their own: rebuild them with `pg_basebackup` afterwards (or, with `--link`, use the `rsync --hard-links` procedure from the `pg_upgrade` docs).

### `--link` vs `--copy` — The One-Shot Decision

| Mode | Speed | Safety |
|------|-------|--------|
| `--copy` (default) | Slow (copies all files, needs 2× disk) | Old cluster remains as rollback |
| `--link` | Near-instant (hard links; same filesystem required) | **Once the new cluster is started, the old one can't safely be used** — files are shared. No rollback. |
| `--clone` (Btrfs, XFS with reflink, APFS) | Near-instant (copy-on-write reflinks) | Old cluster stays fully usable — speed of link, safety of copy |
| `--swap` (PG18+) | Fastest (moves data directories) | Old cluster unusable afterwards, like `--link` |

**If you use `--link`, take a full backup first.** Once you start the new cluster, it writes to the shared files and the old data directory is no longer consistent. (If pg_upgrade fails *before* the new cluster is started, the old cluster can still be started — pg_upgrade tells you how.)

### What pg_upgrade Cannot Do

- **Extensions must be installed** for the new version (same extension packages built for the new major) before upgrading; `--check` lists missing ones. Some extensions (e.g. PostGIS, TimescaleDB) have their own upgrade instructions.
- **Collations** — if the upgrade also moves to a new OS / `glibc` (≥ 2.28 changed sort order for many locales) or ICU version, text indexes can silently be corrupt. Reindex text indexes after upgrade:

```sql
REINDEX INDEX CONCURRENTLY idx_name;
-- Or all indexes of a table (CONCURRENTLY = reads/writes continue; without it, writes are blocked):
REINDEX TABLE CONCURRENTLY anomaly_routes;
-- PG15+: Postgres warns about collation version mismatches; after reindexing, record the new version:
ALTER DATABASE mydb REFRESH COLLATION VERSION;
```

- **Cannot downgrade.** If the new version has a problem, you restore from backup.
- **Same platform only** — no architecture change; the old cluster's data must be on the same server.

### Statistics Are Not Carried Over (before PG18)

Before PG18, `pg_upgrade` does NOT copy optimizer statistics. Immediately after upgrade, every query has no statistics → catastrophic plans. PG18+ carries over most statistics, but **not** extended statistics (`CREATE STATISTICS`). Either way, run:

```bash
vacuumdb --all --analyze-in-stages
# --analyze-in-stages runs ANALYZE 3 times with increasing accuracy (statistics targets 1, 10, then
# the default) — the first pass is fast, giving the planner rough statistics immediately.
# PG18+: add --missing-stats-only to analyze only what wasn't carried over.
```

### Logical Replication — The Zero-Downtime Alternative

For a true zero-downtime upgrade:

1. Create the new cluster and copy the schema: `pg_dumpall --globals-only` + `pg_dump --schema-only` (DDL is not replicated)
2. Set up the new cluster as a logical replica of the old cluster; wait for initial sync + streaming catch-up
3. Freeze schema changes on the old cluster for the duration
4. At cutover: stop writes on old, wait for lag = 0, **copy sequence values** (not replicated), point the application to the new cluster

PG17+ also ships `pg_createsubscriber`, which turns a physical standby into a logical replica without the initial table copy.

```sql
-- On old (publisher):
CREATE PUBLICATION upgrade_pub FOR ALL TABLES;

-- On new (subscriber, different version):
CREATE SUBSCRIPTION upgrade_sub
    CONNECTION 'host=old_host dbname=mydb user=replicator password=secret'
    PUBLICATION upgrade_pub;

-- Monitor until caught up (per-table initial sync state: 'r' = ready):
SELECT * FROM pg_stat_subscription;
SELECT srrelid::regclass, srsubstate FROM pg_subscription_rel;

-- At cutover, on old: generate setval() calls for the new cluster
SELECT format('SELECT setval(%L, %s, true);', schemaname || '.' || sequencename, last_value)
FROM pg_sequences WHERE last_value IS NOT NULL;
```

Cutover becomes just an application config change — seconds of downtime instead of hours.

---

## 21. Wait Events — Diagnosing *Why* a Query is Slow

`EXPLAIN ANALYZE` tells you *what* a query is doing. **Wait events** tell you *why* it's waiting. This is how real DBAs diagnose mysterious slowness that isn't a missing index.

When a backend can't make progress, Postgres records *what it's waiting on* in `pg_stat_activity.wait_event_type` and `wait_event`. This is the single most valuable column for live diagnosis.

```sql
-- Snapshot of what every active query is waiting on right now:
SELECT pid,
       state,
       wait_event_type,
       wait_event,
       now() - query_start AS duration,
       LEFT(query, 80) AS query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
```

### Wait Event Categories

| Category | Meaning | Common root cause |
|----------|---------|-------------------|
| `Lock` | Waiting for a heavyweight lock (relation, tuple, transactionid, advisory) | Another transaction holds the lock |
| `LWLock` | Waiting for an internal lightweight lock | Contention on a shared data structure |
| `BufferPin` | Waiting for other backends to release a pin on a buffer | Usually VACUUM waiting for a cursor/scan to leave a page |
| `IO` | Waiting on disk I/O | Slow storage, cold cache, big sort spill |
| `IPC` | Waiting on inter-process communication | Parallel workers, sync replication (`SyncRep`), group commit |
| `Timeout` | Waiting on a timer | `pg_sleep`, vacuum cost delay (`VacuumDelay`) |
| `Extension` | Waiting inside an extension's code | Extension-specific |
| `Client` | Waiting for the client to send/receive data | Idle connection, slow app, network |
| `Activity` | Background process idle in its main loop | Normal — background processes |

`wait_event IS NULL` on an active backend means it is **running on CPU**, not waiting.

### The Most Important Wait Events

**`Lock: transactionid`** — waiting for another transaction to commit/rollback. Classic row lock contention.

```sql
-- Who's blocking whom:
SELECT blocked.pid AS blocked_pid,
       blocking.pid AS blocking_pid,
       blocked.wait_event,
       blocking.state AS blocker_state,
       now() - blocking.xact_start AS blocker_txn_age,
       LEFT(blocked.query, 60) AS blocked_query,
       LEFT(blocking.query, 60) AS blocker_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE blocked.wait_event_type = 'Lock';
```

**`LWLock: WALWrite`** — backends piling up waiting for another backend to finish writing/flushing WAL. Usually means:
- `synchronous_commit = on` + slow disk (fsync bottleneck)
- `wal_buffers` too small
- Too many tiny transactions — batch them

**`LWLock: LockManager`** — heavy contention on the shared lock table. Each backend has only 16 "fast-path" lock slots (configurable via `max_locks_per_transaction` in PG18+); a query touching more relations (partitions + their indexes) at high concurrency falls back to the shared lock table. Fix: make partition pruning work, fewer partitions/indexes per query, connection pooling.

**`LWLock: BufferContent`** — multiple backends trying to read/modify the same page at once. Hot page problem: a counter row everyone updates, or inserts all landing on the rightmost page of a sequential-key index. Fix: split the counter into N rows and sum on read, aggregate writes in the app, or batch them. For job queues where workers fight over the same rows, use `FOR UPDATE SKIP LOCKED`.

**`IO: DataFileRead`** — waiting for a heap page from disk. Cache miss. If persistent:
- Table too large for `shared_buffers`
- Recent restart (cold cache)
- Query pattern forces random reads (bad index or missing index)

**`IO: DataFileWrite`** — a backend writing a dirty page itself, typically because it needed a free buffer and had to evict a dirty one. Means the background writer isn't keeping up or `shared_buffers` is too small for the write rate. Check `pg_stat_io` (PG16+) for writes by `client backend`; tune `bgwriter_lru_maxpages` / `bgwriter_delay`, and spread checkpoints (`max_wal_size`, `checkpoint_completion_target`).

**`IO: WALSync`** — waiting for `fdatasync` on WAL. Disk is the bottleneck. Options: faster storage (low-latency fsync), batching commits in the app, `commit_delay` for group commit, or `synchronous_commit = off` for writes you can afford to lose on a crash (no corruption risk).

**`IPC: ProcArrayGroupUpdate`** — backends queuing to commit at the same time. Ultra-high concurrency. Rarely fixable at the SQL level — architectural (connection pooling, batching).

**`Client: ClientRead`** — waiting for the app to send the next command. Normal for `idle` connections. On `idle in transaction` connections it means the app opened a transaction and is doing something else (HTTP calls, slow code) before the next statement: **your app is slow, not Postgres.**

**`Client: ClientWrite`** — waiting for the app to receive results. Large result sets, a slow consumer, or network latency.

### Historical Wait Event Sampling

`pg_stat_activity` is a single point-in-time snapshot. For production diagnosis you need **history** — what events dominated over the last hour. The standard open-source tool is the `pg_wait_sampling` extension (managed services have equivalents, e.g. RDS Performance Insights):

```sql
-- Extension that samples wait events at high frequency (default every 10ms).
-- Requires shared_preload_libraries = 'pg_wait_sampling' + restart.
CREATE EXTENSION pg_wait_sampling;

-- Top wait events across all queries — the profile is cumulative until
-- SELECT pg_wait_sampling_reset_profile();
SELECT event_type, event, count
FROM pg_wait_sampling_profile
ORDER BY count DESC
LIMIT 20;

-- Wait events per query (join with pg_stat_statements on queryid; needs compute_query_id = on/auto, PG14+):
SELECT ss.query,
       ws.event_type,
       ws.event,
       ws.count
FROM pg_wait_sampling_profile ws
JOIN pg_stat_statements ss ON ws.queryid = ss.queryid
ORDER BY ws.count DESC
LIMIT 20;
```

### Diagnostic Playbook

```
"Query is slow"
    ↓
Run EXPLAIN ANALYZE
    ↓
Is there a Seq Scan when there shouldn't be?
    → Missing index, or bad row estimates (compare estimated vs actual rows), fix that
    ↓
Is the plan fine but time is bad?
    → Check pg_stat_activity.wait_event while running
    ↓
Lock wait? → find blocker, kill it or fix ordering
LWLock? → contention issue, architectural
IO wait? → cache miss or slow storage
Client wait? → app-side problem
    ↓
Still no answer?
    → Use pg_wait_sampling for historical data
```

### Live Sampling Query

Run this every second during a slow period to see what's actually happening (in psql, end it with `\watch 1` instead of `;`):

```sql
-- What's everyone waiting on right now (NULL wait_event = on CPU):
SELECT wait_event_type, wait_event, COUNT(*)
FROM pg_stat_activity
WHERE state = 'active' AND pid <> pg_backend_pid()
GROUP BY wait_event_type, wait_event
ORDER BY COUNT(*) DESC;
```

A large `LWLock: WALWrite` count = WAL bottleneck. A large `IO: DataFileRead` count = disk I/O bottleneck. A large `Lock: transactionid` count = application contention. Each points at a completely different fix.

---

## 22. Index Types Beyond B-Tree

B-tree covers `=`, `<`, `>`, `BETWEEN`, `IN`, `IS NULL`, `ORDER BY`, and prefix `LIKE 'abc%'` (only with `C` collation or a `text_pattern_ops` index). Containment, overlap, full-text, nearest-neighbour, and "billions of rows, tiny index" need a different access method.

| Type | Structure | Wins for | Watch out for |
| ---- | --------- | -------- | ------------- |
| **Hash** | Buckets of 4-byte hash codes | `=` on long keys (URLs, tokens) — entry size doesn't grow with key length | Equality only; no `UNIQUE`, multi-column, sorting, or index-only scans. Not WAL-logged before PG10 — never use on PG9.x |
| **GIN** | Inverted index: each key (array element, JSON key/value, lexeme, trigram) → sorted list of heap TIDs | Many values per row: `jsonb @>`, array `@>` / `&&`, full-text `@@`, `pg_trgm` | Large; slow to update; no ordering |
| **GiST** | Balanced tree of "bounding" predicates (lossy, results rechecked) | Overlap / containment / distance: ranges `&&`, PostGIS geometry, `EXCLUDE` constraints, KNN `ORDER BY col <-> value` | Slower than GIN for pure lookups; quality depends on the opclass |
| **SP-GiST** | Space-partitioned, unbalanced trees (quad-tree, k-d tree, radix trie) | Data with natural partitioning: points, `inet`, text prefixes | Niche; benchmark against GiST |
| **BRIN** | Min/max summary per block range (128 pages by default) | Huge append-only tables where the column follows physical order (timestamps, serial IDs) | Useless when correlation is low; always lossy |

### GIN — Inverted Index

```sql
-- Containment queries on a jsonb column (assume anomaly_routes.metadata jsonb):
CREATE INDEX idx_routes_meta ON anomaly_routes USING GIN (metadata jsonb_path_ops);

SELECT id FROM anomaly_routes WHERE metadata @> '{"vehicle": "bike"}';   -- uses the index
SELECT id FROM anomaly_routes WHERE metadata->>'vehicle' = 'bike';       -- does NOT

-- The ->> form needs an expression B-tree instead:
CREATE INDEX idx_routes_vehicle ON anomaly_routes ((metadata->>'vehicle'));
```

- **`jsonb_ops` (default) vs `jsonb_path_ops`:** `jsonb_ops` indexes every key and value separately and supports `?`, `?|`, `?&` (key exists) plus `@>`, `@?`, `@@`. `jsonb_path_ops` hashes each full path-to-value, supports only `@>`, `@?`, `@@`, and is usually much smaller and faster for containment.
- **Write cost — the pending list:** one row can produce hundreds of GIN keys. With `fastupdate = on` (default), new entries go to an unsorted pending list that is merged into the main tree by (auto)vacuum, when it exceeds `gin_pending_list_limit` (default 4MB), or by `SELECT gin_clean_pending_list('idx_routes_meta')`. Every search must also scan the pending list, so a big list means occasional slow reads, and the insert that triggers a merge pays for it. For read-latency-sensitive tables: `WITH (fastupdate = off)`.
- **Mixing scalars:** GIN can't index a plain `int` column; the `btree_gin` extension adds B-tree-like opclasses so `(tenant_id, tags)` can be one multi-column GIN index.

Full-text search uses GIN on a `tsvector`. The query must use the **same expression and text search configuration** as the index, so a stored generated column (PG12+) is the least error-prone:

```sql
ALTER TABLE articles ADD COLUMN tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))) STORED;
CREATE INDEX idx_articles_tsv ON articles USING GIN (tsv);

SELECT id, ts_rank(tsv, q) AS rank
FROM articles, websearch_to_tsquery('english', 'postgres vacuum -mysql') AS q
WHERE tsv @@ q
ORDER BY rank DESC
LIMIT 20;
```

Adding a `STORED` generated column rewrites the table (see section 18) — on a large table, add a plain column, backfill in batches, and keep it current with a trigger instead.

### GiST — Ranges, Geometry, Exclusion, Nearest Neighbour

```sql
-- No two bookings for the same room may overlap — enforced by the database, race-free:
CREATE EXTENSION btree_gist;   -- lets GiST handle the plain "room_id WITH =" part
CREATE TABLE bookings (
    room_id int       NOT NULL,
    during  tstzrange NOT NULL,
    EXCLUDE USING gist (room_id WITH =, during WITH &&)
);

-- KNN: the index returns rows already ordered by distance — no full sort, stops after LIMIT
CREATE INDEX idx_places_loc ON places USING gist (location);   -- location is a point
SELECT name FROM places ORDER BY location <-> point '(90.41, 23.81)' LIMIT 5;
```

An `EXCLUDE` constraint is the simplest race-free way to prevent overlapping ranges: "check then insert" in the application races under `READ COMMITTED` (see section 23).

### BRIN — Tiny Index for Huge, Ordered Tables

```sql
-- First check that physical order follows the column (close to 1 or -1 is good):
SELECT correlation FROM pg_stats WHERE tablename = 'events' AND attname = 'created_at';

CREATE INDEX idx_events_created_brin ON events USING brin (created_at)
    WITH (pages_per_range = 64, autosummarize = on);

-- Compare against a B-tree on the same column — often KB vs GB:
SELECT pg_size_pretty(pg_relation_size('idx_events_created_brin'));
```

How it works: for each range of `pages_per_range` heap pages, BRIN stores the min and max value. A query reads every range whose min/max could match, then rechecks every row in those pages (`Bitmap Heap Scan` with `Heap Blocks: lossy=N` and `Rows Removed by Index Recheck`).

- **Unsummarized tail:** pages appended since the last summarization aren't covered and are always scanned. Vacuum summarizes them; `autosummarize = on` (PG10+) requests it as soon as a range fills; `SELECT brin_summarize_new_values('idx_events_created_brin')` does it manually.
- **Updates and deletes kill it:** an old row updated with a new timestamp lands in a new page, widening that range's min/max until most ranges match every query. BRIN is for append-mostly data.
- **PG14+ opclasses:** `minmax_multi_ops` (several min/max intervals per range, tolerates outliers) and `bloom_ops` (equality on unordered values) extend BRIN to less perfectly ordered columns.

---

## 23. Transaction Isolation Levels & Serializable Snapshot Isolation (SSI)

Postgres implements three isolation levels. `READ UNCOMMITTED` is accepted but behaves as `READ COMMITTED` — dirty reads are impossible in Postgres.

| Level | Snapshot | Non-repeatable read | Phantom read | Lost update / write skew |
| ----- | -------- | ------------------- | ------------ | ------------------------ |
| `READ COMMITTED` (default) | New snapshot per **statement** | Possible | Possible | Possible |
| `REPEATABLE READ` | One snapshot per transaction, taken at the **first statement**, not at `BEGIN` | No | No (stricter than the SQL standard) | Lost update → error; write skew possible |
| `SERIALIZABLE` | Same snapshot + SSI conflict tracking | No | No | No — one transaction fails instead |

```sql
SHOW default_transaction_isolation;
BEGIN ISOLATION LEVEL REPEATABLE READ;
ALTER ROLE api_service SET default_transaction_isolation = 'serializable';
```

### READ COMMITTED — The Lost Update

```sql
-- Both sessions READ COMMITTED; the application computes the new value:
-- A: SELECT balance FROM accounts WHERE id = 1;            -- 100
-- B: SELECT balance FROM accounts WHERE id = 1;            -- 100
-- A: UPDATE accounts SET balance = 70 WHERE id = 1; COMMIT;  -- withdraw 30
-- B: UPDATE accounts SET balance = 50 WHERE id = 1; COMMIT;  -- withdraw 50 → final 50, A's withdrawal lost
```

When an `UPDATE`/`DELETE`/`SELECT FOR UPDATE` in `READ COMMITTED` hits a row another transaction changed, it waits for that transaction; if it commits, Postgres re-evaluates the `WHERE` clause against the **newest** row version (EvalPlanQual) and proceeds — while the rest of the statement still sees its original snapshot. Fixes, cheapest first:

1. **Atomic update:** `SET balance = balance - 30` — re-evaluated against the latest version, nothing lost.
2. **Pessimistic lock:** `SELECT ... FOR UPDATE` before computing the new value.
3. **Optimistic check:** `UPDATE ... SET balance = 70, version = version + 1 WHERE id = 1 AND version = 7` — 0 rows updated means someone else won; reload and retry.
4. **`REPEATABLE READ`:** B's `UPDATE` fails with `ERROR: could not serialize access due to concurrent update` (SQLSTATE `40001`); retry the transaction.

### REPEATABLE READ — Write Skew

Two transactions read overlapping data, then write **different** rows based on what they read. No row conflict, so `REPEATABLE READ` lets both commit:

```sql
-- Invariant: at least one doctor on call. Alice and Bob both are.
-- T1: SELECT count(*) FROM doctors WHERE on_call;                  -- 2
-- T2: SELECT count(*) FROM doctors WHERE on_call;                  -- 2
-- T1: UPDATE doctors SET on_call = false WHERE name = 'alice'; COMMIT;
-- T2: UPDATE doctors SET on_call = false WHERE name = 'bob';   COMMIT;
-- REPEATABLE READ: both commit → nobody on call.
-- SERIALIZABLE:    one of them fails with SQLSTATE 40001 (at UPDATE or COMMIT).
```

### SERIALIZABLE — How SSI Works

SSI runs every transaction on a `REPEATABLE READ` snapshot and additionally records what each one **read** as `SIReadLock` predicate locks (they block nothing). When it detects a "dangerous structure" — two consecutive read-write dependencies between concurrent transactions, the pattern every serialization anomaly needs — it aborts one transaction with SQLSTATE `40001`. The guarantee: any set of committed serializable transactions behaves as if they ran one at a time.

```sql
-- See the predicate locks:
SELECT pid, locktype, relation::regclass, page, tuple
FROM pg_locks WHERE mode = 'SIReadLock';
```

Production rules:

- **Retry is mandatory, not optional.** Any statement, including `COMMIT`, can fail with `40001` (or `40P01`, deadlock). Retry the **whole** transaction from `BEGIN`, re-running its reads — never just the failed statement.

  ```
  for attempt in 1..5:
      try:
          BEGIN ISOLATION LEVEL SERIALIZABLE
          ... all reads and writes ...
          COMMIT
          return
      except SQLSTATE in ('40001', '40P01'):
          ROLLBACK
          sleep(random jitter × attempt)
  raise
  ```

- **False positives come from coarse locks.** A sequential scan takes a relation-level SIRead lock, which conflicts with any write to the table. Indexes on the columns you filter by keep locks at tuple/page level. When a transaction holds too many tuple locks they are promoted to page, then relation level (`max_pred_locks_per_transaction`, default 64; `max_pred_locks_per_relation`; `max_pred_locks_per_page`).
- **Keep transactions short** — SIRead locks outlive the commit until every overlapping transaction finishes.
- **Long reports:** `BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE;` waits for a snapshot that is guaranteed safe, then runs with no SSI tracking and can never fail with `40001`.
- **All participants must be `SERIALIZABLE`.** A `READ COMMITTED` writer is invisible to SSI's checks.
- **Not available on hot standbys** — use `REPEATABLE READ` there.

**Sharing a snapshot across sessions:** `SELECT pg_export_snapshot();` in one `REPEATABLE READ` transaction, then `SET TRANSACTION SNAPSHOT '<id>';` in others — every session sees exactly the same data. This is how `pg_dump -j` produces a consistent parallel dump.

---

## 24. WAL & Checkpoint Internals

Section 6 covers the write-ahead rule and why replication reads WAL. This section is about measuring and tuning it.

### WAL on Disk and LSNs

WAL lives in `pg_wal/` as 16MB **segment** files (size fixed at `initdb --wal-segsize`). The 24-hex-digit name is timeline + log + segment: `000000010000003A0000007C` = timeline 1, segment `3A/7C`.

An **LSN** (Log Sequence Number) is a 64-bit byte position in the WAL stream, printed as `high/low` in hex (`3A/7C0012F8`). Subtracting two LSNs gives bytes — the basis for replication lag, slot retention, and WAL-rate measurements.

```sql
SELECT pg_current_wal_lsn(), pg_walfile_name(pg_current_wal_lsn());

-- WAL generated by a workload (psql):
SELECT pg_current_wal_lsn() AS before \gset
-- ... run the workload ...
SELECT pg_size_pretty(pg_current_wal_lsn() - :'before'::pg_lsn);

-- WAL generated by one statement (PG13+):
EXPLAIN (ANALYZE, WAL) UPDATE anomaly_routes SET status = 'DONE' WHERE city_id = 5;
--   WAL: records=1002 fpi=37 bytes=356120

-- Cluster-wide WAL counters (PG14+); per-query: pg_stat_statements.wal_bytes / wal_fpi (PG13+)
SELECT wal_records, wal_fpi, pg_size_pretty(wal_bytes) AS wal_bytes, wal_buffers_full
FROM pg_stat_wal;
```

`wal_buffers_full` climbing steadily = `wal_buffers` too small for the write burst rate (see section 5).

Inspecting raw records — what is actually filling WAL:

```bash
# Per record type: counts, bytes, full-page-image share
pg_waldump --stats=record -p "$PGDATA/pg_wal" 000000010000003A0000007C
```

```sql
-- Same from SQL (PG15+):
CREATE EXTENSION pg_walinspect;
SELECT * FROM pg_get_wal_stats('3A/7C000000', '3A/7D000000', true)
ORDER BY combined_size DESC LIMIT 10;
```

### Full-Page Images — The Hidden WAL Multiplier

After each checkpoint, the **first** change to every page writes the whole 8KB page into WAL (a full-page image, FPI), so crash recovery can repair a torn page. A one-byte update can cost 8KB of WAL. Consequences:

- **WAL volume spikes right after every checkpoint**, then decays. More frequent checkpoints = more FPIs.
- **Random-key inserts multiply FPIs.** A random UUIDv4 primary key touches a different B-tree leaf page on every insert, so most inserts dirty a "fresh" page and log an FPI. Time-ordered keys (`bigint` identity, UUIDv7 — `uuidv7()` built in from PG18) keep inserts on the rightmost pages.
- **`wal_compression`** compresses FPIs only: `on`/`pglz`, or `lz4` / `zstd` (PG15+). Usually a large WAL reduction for little CPU — worth enabling on write-heavy systems.
- **Never set `full_page_writes = off`** unless the filesystem guarantees atomic 8KB writes (e.g. ZFS). A crash mid-write then means silent corruption.

### Checkpoints — Mechanics and Tuning

```
Checkpoint:
  1. Record the redo point (current WAL position) — recovery starts replaying here
  2. Write every dirty buffer, throttled to finish within
     checkpoint_completion_target × checkpoint_timeout
  3. fsync the data files
  4. Write the checkpoint record and update pg_control
  5. Remove or recycle WAL segments older than the redo point
     (unless held by replication slots, failed archiving, or wal_keep_size)
```

Triggers: **timed** (`checkpoint_timeout` elapsed), **requested** (WAL since the last checkpoint reached roughly `max_wal_size / (1 + checkpoint_completion_target)`), manual `CHECKPOINT`, shutdown, and base backup start. Timed checkpoints are spread out and predictable; requested ones mean WAL outran `max_wal_size` — more frequent checkpoints, more FPIs, more I/O spikes.

```sql
-- PG17+:
SELECT num_timed, num_requested,
       round(100.0 * num_requested / nullif(num_timed + num_requested, 0), 1) AS pct_requested,
       write_time, sync_time, buffers_written
FROM pg_stat_checkpointer;

-- PG16 and older:
SELECT checkpoints_timed, checkpoints_req, checkpoint_write_time, checkpoint_sync_time, buffers_checkpoint
FROM pg_stat_bgwriter;
```

Target: well over 90% timed. If not:

1. Measure WAL produced per `checkpoint_timeout` at peak (LSN difference over that interval).
2. Set `max_wal_size` to at least ~2× that, so the size trigger isn't reached before the timer.
3. Watch the log: `log_checkpoints` (default on since PG15) prints buffers written, write/sync time, and `distance`/`estimate` (WAL between checkpoints); `checkpoints are occurring too frequently` appears when they are under `checkpoint_warning` (30s) apart.

The trade-off: crash recovery replays all WAL since the last redo point, so a larger `max_wal_size` and longer `checkpoint_timeout` mean longer recovery. 15–30 min with enough `max_wal_size` is typical for OLTP.

On a standby, checkpoints are **restartpoints**, only possible at checkpoint records replayed from the primary — a standby can't checkpoint more often than its primary.

### Why `pg_wal` Keeps Growing

WAL older than the last redo point is removed at the next checkpoint **unless** something still needs it:

- An inactive or lagging **replication slot** (`pg_replication_slots`, cap with `max_slot_wal_keep_size`)
- A failing `archive_command` (`pg_stat_archiver.failed_count`, `last_failed_wal`)
- `wal_keep_size`
- Write bursts above `max_wal_size` (soft limit — it is exceeded under load, then shrinks)

See section 13 for the incident playbook. Never delete files from `pg_wal` by hand.

---

## 25. Security — Roles, Privileges, and Row-Level Security

### Roles

Users and groups are the same object: a **role**. A role with `LOGIN` is a user; a role others are members of is a group. Members inherit the group's privileges (`INHERIT`, the default) or can `SET ROLE` to it.

Production layout — privileges live on `NOLOGIN` group roles, login roles only get memberships:

```sql
CREATE ROLE app_owner NOLOGIN;   -- owns schema and tables; migrations run as this
CREATE ROLE app_rw    NOLOGIN;   -- application read/write
CREATE ROLE app_ro    NOLOGIN;   -- analysts, reporting

CREATE ROLE migrator    LOGIN PASSWORD '...' IN ROLE app_owner;
CREATE ROLE api_service LOGIN PASSWORD '...' IN ROLE app_rw;
CREATE ROLE analyst     LOGIN PASSWORD '...' IN ROLE app_ro;

REVOKE ALL ON DATABASE mydb FROM PUBLIC;
GRANT CONNECT ON DATABASE mydb TO app_owner, app_rw, app_ro;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;   -- default since PG15; run it on older clusters

CREATE SCHEMA app AUTHORIZATION app_owner;
GRANT USAGE ON SCHEMA app TO app_rw, app_ro;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_rw;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA app TO app_rw;
GRANT SELECT ON ALL TABLES IN SCHEMA app TO app_ro;
```

Migrations should start with `SET ROLE app_owner;` — otherwise new tables are owned by `migrator`: default privileges (below) don't apply to them, and dropping or rotating that login role needs `REASSIGN OWNED` first.

### Default Privileges — The "New Table Is Invisible" Bug

`GRANT ... ON ALL TABLES IN SCHEMA` affects **existing** tables only. Future tables need default privileges, and those apply only to objects created by the role named in `FOR ROLE`:

```sql
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_rw;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
    GRANT USAGE ON SEQUENCES TO app_rw;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
    GRANT SELECT ON TABLES TO app_ro;
```

Classic incident: a migration runs as a different role than `FOR ROLE`, the new table gets no grants, and the deploy fails with `permission denied for table ...`. Check with `\ddp`.

```sql
\du                                     -- roles and memberships
\dp app.*                               -- table/column privileges (ACLs)
SELECT has_table_privilege('api_service', 'app.orders', 'UPDATE');

-- Column-level grants (SELECT * then fails for this role — list the columns):
GRANT SELECT (id, email, created_at) ON app.users TO support;
```

**Predefined roles** replace most reasons to hand out superuser: `pg_monitor` (monitoring agents), `pg_read_all_data` / `pg_write_all_data` (PG14+), `pg_signal_backend` (cancel/terminate non-superuser queries), `pg_checkpoint` (PG15+), `pg_maintain` (PG17+: `VACUUM`, `ANALYZE`, `REINDEX`, `CLUSTER`, `REFRESH MATERIALIZED VIEW`, `LOCK TABLE` on all relations).

**The application never connects as a superuser or as the table owner.** Superusers bypass every check; owners can `DROP`/`ALTER` their tables and bypass row-level security by default.

### Row-Level Security (RLS)

RLS adds a per-row filter to every query on a table — the standard way to enforce tenant isolation in the database instead of trusting every `WHERE tenant_id = ?` in application code.

```sql
ALTER TABLE app.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.orders FORCE ROW LEVEL SECURITY;   -- apply to the table owner too

CREATE POLICY tenant_isolation ON app.orders
    USING      (tenant_id = nullif(current_setting('app.tenant_id', true), '')::bigint)  -- rows you can see/update/delete
    WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::bigint); -- rows you can write

-- Per request, inside the transaction (safe with PgBouncer transaction pooling, see section 7):
BEGIN;
SET LOCAL app.tenant_id = '42';
SELECT * FROM app.orders;   -- only tenant 42's rows
COMMIT;
```

`current_setting(..., true)` returns NULL when unset (and `''` after a `SET LOCAL` has ended), and `nullif` turns both into NULL — so a missing tenant sees **zero rows** instead of erroring or leaking.

Rules that bite:

- **Default deny:** RLS enabled with no policy for a command = no rows visible or writable.
- **Combining policies:** permissive policies (default) are OR'ed; `AS RESTRICTIVE` policies are AND'ed on top. Scope with `FOR SELECT | INSERT | UPDATE | DELETE` and `TO role`.
- **Who bypasses:** superusers, roles with `BYPASSRLS`, and the table owner unless `FORCE ROW LEVEL SECURITY`.
- **Views bypass the caller's RLS:** a view runs with its **owner's** privileges, so it sees whatever the owner sees. PG15+: `CREATE VIEW ... WITH (security_invoker = true)` makes it run as the caller.
- **Performance:** the policy becomes an extra `WHERE` clause on every query — make `tenant_id` the leading column of the hot indexes. User-supplied conditions using functions not marked `LEAKPROOF` are evaluated after the policy filter, which can prevent using an index for them; check `EXPLAIN`.
- **Backups:** `pg_dump` sets `row_security = off`, so it errors instead of silently dumping a filtered subset when the dumping role is subject to RLS — dump as the owner or a `BYPASSRLS` role.

### SECURITY DEFINER Functions

A `SECURITY DEFINER` function runs with its **owner's** privileges — a controlled privilege escalation. Two defaults make it dangerous:

```sql
CREATE FUNCTION app.deactivate_user(p_id bigint) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp   -- without this, a caller can shadow tables/functions via their search_path
AS $$ UPDATE app.users SET active = false WHERE id = p_id $$;

REVOKE EXECUTE ON FUNCTION app.deactivate_user(bigint) FROM PUBLIC;   -- functions are executable by PUBLIC by default
GRANT EXECUTE ON FUNCTION app.deactivate_user(bigint) TO app_rw;
```

Schema-qualify every object inside the body, and keep `pg_temp` last in its `search_path` so temporary objects can't hijack it.

### Authentication

- `pg_hba.conf` is matched **top to bottom, first match wins** — a broad `trust` or `host all all 0.0.0.0/0` line above a strict one silently wins. `SELECT * FROM pg_hba_file_rules;` shows the parsed rules and any errors before you reload.
- Use `scram-sha-256` (default `password_encryption` since PG14). MD5 passwords are deprecated (PG18 warns). After switching, users must reset their passwords to store SCRAM hashes.
- Use `hostssl` lines to require TLS for remote connections; `host` accepts both.
- Audit: `log_connections`, `log_disconnections`, and the `pgaudit` extension for statement-level audit logs (DDL, role changes, reads of sensitive tables).

---

## What Separates God-Level from Expert-Level

You can learn everything in this document. What you can't learn from a document:

1. **Instinct under pressure** — knowing which query to run first when prod is down and 5 engineers are watching
2. **Reading a plan and knowing why it's wrong** — not just what it says, but why the planner made that choice and how to fix the underlying cause (statistics, configuration, or schema)
3. **Knowing what not to do** — the index you don't add, the vacuum you don't force, the constraint you don't validate during peak traffic
4. **Boring discipline** — monitoring vacuum health weekly, reviewing `pg_stat_statements` before problems happen, testing `EXPLAIN ANALYZE` on new queries before shipping

The technical ceiling is this document. The real ceiling is experience.
