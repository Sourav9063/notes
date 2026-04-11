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
└──────────────────────────────────────────┘
```

Key implications:
- Reading 1 row = reading 8KB from disk. Row size matters for how many rows fit per page.
- A table with 1 million rows and avg row size 200 bytes = ~24,000 pages = ~195MB.
- `pg_relation_size('table')` tells you exactly how many pages your table occupies.

### Tuple (Row) Structure — The HeapTupleHeader

Every row has a hidden header Postgres uses for MVCC. You never see these columns, but they govern everything:

| Hidden field   | Size    | Purpose                                                           |
| -------------- | ------- | ----------------------------------------------------------------- |
| `t_xmin`       | 4 bytes | Transaction ID that **inserted** this row                        |
| `t_xmax`       | 4 bytes | Transaction ID that **deleted/updated** this row (0 if live)     |
| `t_ctid`       | 6 bytes | Current TID: physical location `(page, offset)` of the row. If updated, points to the new version. |
| `t_infomask`   | 2 bytes | Status flags: is xmin committed? is xmax committed? has nulls?   |
| `t_hoff`       | 1 byte  | Offset to actual data (accounts for null bitmap size)            |

```sql
-- You can actually query these hidden fields:
SELECT ctid, xmin, xmax, * FROM anomaly_routes LIMIT 5;

-- ctid = (page_number, tuple_offset_within_page)
-- e.g., (0,1) = page 0, first tuple
-- After an UPDATE, the old row's ctid still exists but xmax is set
```

### MVCC — What Really Happens on UPDATE

This is the single most important thing to understand about Postgres performance.

**Postgres never updates in place.** Every `UPDATE` is actually:
1. Mark the old row as deleted (`t_xmax = current_txid`)
2. Write a brand new row version with updated values (`t_xmin = current_txid`)
3. The new row's `ctid` is its new physical location

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

Postgres pages are 8KB. What happens when a single column value (like a JSON blob or polyline string) exceeds that?

**TOAST** (The Oversized-Attribute Storage Technique) kicks in automatically when any row exceeds ~2KB:

1. **Compression** — Postgres tries to compress the value (PGLZ algorithm by default, LZ4 available in v14+)
2. **Out-of-line storage** — If still too large, the value is sliced into ~2KB chunks and stored in a separate `pg_toast.pg_toast_<oid>` table. The main table row holds a pointer.

```sql
-- Check if TOAST is being used on your table
SELECT relname, reltoastrelid
FROM pg_class
WHERE relname = 'anomaly_routes';

-- See TOAST table size
SELECT pg_size_pretty(pg_total_relation_size('pg_toast.pg_toast_12345'));

-- Per-column storage strategy:
SELECT attname, attstorage
FROM pg_attribute
WHERE attrelid = 'anomaly_routes'::regclass AND attnum > 0;
-- 'p' = plain (no toast), 'x' = compress then out-of-line (default for text)
-- 'e' = out-of-line only, 'm' = compress only
```

Your `estimated_polyline TEXT` and `actual_polyline TEXT` columns in `anomaly_routes` are almost certainly TOASTed. Reading those columns has hidden I/O cost — fetching from the TOAST table.

```sql
-- If you rarely need the polyline, exclude it to avoid TOAST fetches:
SELECT id, status, city_id FROM anomaly_routes WHERE status = 'PENDING_APPROVAL';
-- vs (forces TOAST fetch for every row):
SELECT * FROM anomaly_routes WHERE status = 'PENDING_APPROVAL';
```

### Fillfactor

By default, Postgres fills pages 100%. For tables with frequent UPDATEs, this means the new tuple version always goes on a different page — causing index bloat and slower HOT updates.

**HOT updates (Heap Only Tuple):** If a new tuple version fits on the **same page** as the old one, Postgres can update without touching indexes — a massive write speedup.

```sql
-- Set fillfactor to 70%: leave 30% of each page free for updates
-- New tuple versions land on the same page → HOT update possible → no index churn
ALTER TABLE anomaly_routes SET (fillfactor = 70);
VACUUM anomaly_routes; -- needed to apply the new fillfactor

-- Check HOT update ratio (high n_tup_hot_upd = good)
SELECT relname, n_tup_upd, n_tup_hot_upd,
       ROUND(n_tup_hot_upd::NUMERIC / NULLIF(n_tup_upd, 0) * 100, 1) AS hot_pct
FROM pg_stat_user_tables
WHERE relname = 'anomaly_routes';
```

Use fillfactor 70-80 for tables with frequent updates. Keep 100 for append-only tables (logs, events).

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
Planner        → Generate all possible plans, estimate costs, pick cheapest
   ↓
Executor       → Run the chosen plan
```

### Statistics — What the Planner Relies On

The planner cannot read your data to make decisions — it uses **statistics** stored in `pg_statistic` (exposed via `pg_stats`). These are collected by `ANALYZE`.

```sql
-- What statistics Postgres has about a column:
SELECT
    attname,
    n_distinct,          -- estimated distinct values (-1 means all unique)
    correlation,         -- physical sort order vs logical order (1.0 = perfectly sorted)
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

-- Increase statistics target for a column with high cardinality
-- (default is 100 histogram buckets — increase for better estimates on skewed data)
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
-- For SSD storage:
SET random_page_cost = 1.1;  -- random ≈ sequential on SSD

-- Or permanently in postgresql.conf:
-- random_page_cost = 1.1
```

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
        Filter: ((status)::text = 'PENDING_APPROVAL')
        Rows Removed by Filter: 9577
        Buffers: shared hit=850 read=34
  ->  Hash  (cost=10.20..10.20 rows=400 width=32)
            (actual time=1.234..1.234 rows=400 loops=1)
        Buckets: 1024  Batches: 1  Memory Usage: 48kB
        ->  Seq Scan on cities c ...
```

**How to read it:**
- `cost=15.20..1823.50` — estimated startup cost .. total cost
- `rows=450` — planner estimated 450 rows; `actual rows=423` — reality was 423. Close = good statistics.
- `loops=1` — this node ran once. In nested loops, it could run 1000 times: multiply time by loops.
- `Buffers: shared hit=892 read=34` — 892 pages from cache, 34 from disk. High `read` = I/O bottleneck.
- `Rows Removed by Filter: 9577` — scanned 10,000 rows, discarded 9,577. This screams for an index on `status`.

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
| Nested Loop | Small outer, indexed inner | O(outer × log(inner)) |
| Hash Join | Large unsorted tables | O(n+m), needs work_mem for hash table |
| Merge Join | Both sides already sorted or have sort-supporting indexes | O(n log n + m log m) |

### plan_cache_mode and Prepared Statements

When you use prepared statements (`PREPARE` or parameterized queries), Postgres caches the plan after 5 executions. The cached plan uses generic estimates, not the actual parameter value.

```sql
-- Problem: a query for status='PENDING_APPROVAL' (10,000 rows) gets a plan
-- optimized for status='ADMIN_APPROVED' (2 rows). Seq Scan vs Index Scan mismatch.

-- Force custom (parameter-aware) plans:
SET plan_cache_mode = 'force_custom_plan';

-- Force generic plans (avoid per-execution planning overhead):
SET plan_cache_mode = 'force_generic_plan';

-- Default: auto (Postgres decides after 5 executions)
SET plan_cache_mode = 'auto';
```

In Node.js with `pg`, parameterized queries use the extended query protocol and are subject to this. If you see a fast query suddenly slow after N executions, generic plan caching is a suspect.

---

## 3. Indexing — Deep Internals

### B-Tree Internals

A B-tree index is a balanced tree where all leaf nodes are at the same depth and are linked as a doubly-linked list (enables range scans without going back to the root).

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
- **Index size**: roughly 10-30% of table size for a single-column integer index

### Index Selectivity

An index is only useful when it's **selective** — when the indexed value narrows down to a small fraction of the table.

```sql
-- Low selectivity: 'status' has 7 values across 100,000 rows = ~14,000 rows per value
-- Postgres may prefer Seq Scan because reading 14,000 rows via index = 14,000 random I/Os
-- A full table scan reads pages sequentially — potentially faster

-- High selectivity: 'id' is unique = 1 row per value = always use index

-- The tipping point is roughly 5-15% of rows
-- Below that = index scan wins. Above that = seq scan often wins.
```

**This is why an index on a low-cardinality column like `is_intercity` (boolean) is often useless.** Postgres will skip it.

### Multi-Column Index Column Order

```sql
-- Index on (city_id, status)
CREATE INDEX idx_city_status ON anomaly_routes(city_id, status);

-- Can serve:
WHERE city_id = 5                          -- yes (leftmost prefix)
WHERE city_id = 5 AND status = 'PENDING'   -- yes (both columns)
WHERE city_id = 5 AND status > 'P'         -- yes (range on last column fine)

-- Cannot efficiently serve:
WHERE status = 'PENDING'                   -- no (skips city_id)
WHERE status = 'PENDING' AND city_id = 5   -- same as above, order doesn't matter in WHERE
```

Rule: **put equality conditions before range conditions** in a composite index.

```sql
-- Optimal for: WHERE city_id = 5 AND created_at > '2026-01-01'
CREATE INDEX ON anomaly_routes(city_id, created_at);
-- city_id = equality first, created_at = range second
```

### Index-Only Scans and Visibility Map

An Index Only Scan reads data entirely from the index — no heap (table) access. Fastest possible read path.

But there's a catch: Postgres needs to verify the row is visible to the current transaction (MVCC). It checks the **visibility map** — a per-page bitmap. If a page is marked "all tuples visible," no heap access needed. If not (e.g., recently updated), Postgres fetches the heap page to check visibility.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT status FROM anomaly_routes WHERE status = 'PENDING_APPROVAL';

-- Look for:
-- Index Only Scan ... Heap Fetches: 0   ← ideal, all pages in visibility map
-- Index Only Scan ... Heap Fetches: 523 ← many pages not in visibility map, VACUUM needed
```

```sql
-- VACUUM updates the visibility map:
VACUUM anomaly_routes;
-- After this, Index Only Scans become truly index-only
```

### Bloat — Index Bloat

B-tree indexes accumulate dead pages too (from deleted index entries). Unlike table bloat, `VACUUM` can reuse dead index pages but doesn't shrink the index file.

```sql
-- Check index bloat (requires pgstattuple extension):
CREATE EXTENSION pgstattuple;

SELECT * FROM pgstatindex('idx_status');
-- leaf_fragmentation: % of leaf pages with lots of dead space
-- avg_leaf_density: avg % of leaf page actually used (low = bloated)

-- Rebuild a bloated index without locking:
REINDEX INDEX CONCURRENTLY idx_status;
```

---

## 4. Vacuuming — The Engine That Keeps Postgres Alive

### What VACUUM Does

1. Marks dead tuples' space as reusable (doesn't shrink the file)
2. Updates the **visibility map** (enables Index Only Scans)
3. Updates **free space map** (tells Postgres which pages have room for new tuples)
4. Advances the **oldest xmin** — critical for transaction ID wraparound (see below)

### VACUUM FULL

Rewrites the entire table to a new file, removing all dead space. Reclaims disk. **But it holds an exclusive lock** — the table is completely unavailable during the operation.

```sql
VACUUM FULL anomaly_routes;  -- dangerous on large production tables
```

For online reclamation, use `pg_repack` instead (3rd party but safe):
```bash
pg_repack -t anomaly_routes -d mydb  # rewrites table without lock
```

### Transaction ID Wraparound — The Most Dangerous Postgres Failure

Transaction IDs are 32-bit integers. Postgres can have ~2 billion live transactions before IDs wrap around. When wraparound happens, all your data becomes invisible (Postgres considers all rows "in the future").

Postgres prevents this with **aggressive VACUUM** — freezing old tuples (marking them with a special "frozen" flag that's always visible, bypassing MVCC checks).

```sql
-- Check how close each table is to wraparound:
SELECT relname,
       age(relfrozenxid) AS xid_age,
       2147483648 - age(relfrozenxid) AS xids_remaining
FROM pg_class
WHERE relkind = 'r'
ORDER BY xid_age DESC;
-- If xid_age approaches ~200 million, Postgres will force aggressive autovacuum
-- If it approaches 2 billion, Postgres shuts down with a panic to prevent data loss
```

```sql
-- Force freeze all old tuples:
VACUUM FREEZE anomaly_routes;
```

This is why you must never disable autovacuum on a production database. Tables that aren't vacuumed will eventually cause a full database shutdown.

### Autovacuum Tuning

Autovacuum runs when: `pg_stat_user_tables.n_dead_tup > autovacuum_vacuum_threshold + autovacuum_vacuum_scale_factor * reltuples`

Default: `50 + 0.2 * table_size` — triggers when 20% of the table is dead tuples.

For high-write tables (like `anomaly_routes` where status changes constantly), this default is too conservative:

```sql
-- Per-table autovacuum tuning (overrides global postgresql.conf settings):
ALTER TABLE anomaly_routes SET (
    autovacuum_vacuum_scale_factor = 0.01,   -- trigger at 1% dead tuples (not 20%)
    autovacuum_vacuum_threshold = 100,        -- or at 100 dead tuples minimum
    autovacuum_vacuum_cost_delay = 2,         -- 2ms delay between I/O bursts (less impact on queries)
    autovacuum_analyze_scale_factor = 0.005  -- re-analyze after 0.5% changes (better statistics)
);
```

```sql
-- Monitor autovacuum activity live:
SELECT pid, datname, usename, state, wait_event_type, wait_event, query
FROM pg_stat_activity
WHERE query LIKE 'autovacuum%';

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

# Per-query memory for sorts and hash joins
# Too low: sorts spill to disk. Too high: OOM if many concurrent queries.
# Rule: (RAM * 0.25) / max_connections — but monitor actual spills first.
work_mem = 64MB

# Used by VACUUM, CREATE INDEX, ALTER TABLE
# Higher = faster maintenance, but only one maintenance op at a time
maintenance_work_mem = 1GB

# ─── CONNECTIONS ─────────────────────────────────────────────────────────────

# Each connection uses ~5-10MB RAM. Never set this to 1000.
# Use PgBouncer for connection pooling instead of raising this.
max_connections = 100

# ─── WAL (Write-Ahead Log) ───────────────────────────────────────────────────

# Size of WAL buffer before flush to disk
wal_buffers = 64MB                # default is 1/32 of shared_buffers, often too small

# Sync WAL to disk on every COMMIT
# 'on' = safest (no data loss on crash), 'off' = dangerous but fast, 'local' = middle ground
synchronous_commit = on

# How often checkpoint writes dirty pages to disk
# Higher = fewer checkpoints (less I/O) but longer crash recovery
checkpoint_completion_target = 0.9   # spread checkpoint I/O over 90% of checkpoint interval
max_wal_size = 2GB                   # trigger checkpoint after this much WAL

# ─── QUERY PLANNER ───────────────────────────────────────────────────────────

# For SSD storage (hugely important for index usage):
random_page_cost = 1.1            # default 4.0 is calibrated for HDDs
effective_io_concurrency = 200    # for SSDs; 1 for HDDs

# Enable parallel query (uses multiple CPU cores for large scans)
max_parallel_workers_per_gather = 4
max_parallel_workers = 8

# ─── LOGGING ─────────────────────────────────────────────────────────────────

# Log slow queries (essential for production tuning)
log_min_duration_statement = 1000   # log queries taking > 1 second
log_checkpoints = on                 # log checkpoint start/end times
log_lock_waits = on                  # log when a query waits >deadlock_timeout for a lock
log_temp_files = 0                   # log every temp file (sort/hash spill to disk)
```

### work_mem — The Most Misunderstood Setting

`work_mem` is **per sort/hash operation per query**, not per query, not per connection. A single complex query with 5 sort nodes and 2 hash joins can use `7 × work_mem`.

```sql
-- Check if sorts are spilling to disk (the main symptom of low work_mem):
SELECT query, total_exec_time, rows, temp_blks_written
FROM pg_stat_statements
WHERE temp_blks_written > 0
ORDER BY temp_blks_written DESC;

-- Or check log for: "temporary file: size 50MB" (with log_temp_files = 0)

-- Set higher work_mem for a specific session/query without changing globally:
SET work_mem = '256MB';
EXPLAIN ANALYZE SELECT ... ORDER BY ...;  -- see if Sort Method changes to "quicksort" (in-memory)
RESET work_mem;
```

### shared_buffers and Double Caching

Postgres has its own page cache (`shared_buffers`) AND the OS has a file system cache. A page can be in both simultaneously — "double buffering." This is why `effective_cache_size` exists: tell the planner about OS cache so it can account for pages likely already in memory even if not in `shared_buffers`.

```sql
-- Check shared buffer hit rate (should be > 99% in production):
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
  3. On COMMIT: WAL buffer flushed to disk (fdatasync)
  4. Client receives success
  5. Dirty data pages written to disk later (by background writer + checkpointer)
```

Crash recovery: replay WAL from last checkpoint forward.

This is also why streaming replication works — replicas receive and replay the WAL stream.

### Streaming Replication (Physical)

Sends the raw WAL byte stream to replicas. The replica is a byte-for-byte copy of the primary. Read-only.

```sql
-- On PRIMARY: create a replication user
CREATE USER replicator WITH REPLICATION LOGIN PASSWORD 'secret';

-- postgresql.conf on primary:
-- wal_level = replica          (or logical for logical replication)
-- max_wal_senders = 5
-- wal_keep_size = 1GB          (keep this much WAL for slow replicas)

-- pg_hba.conf on primary:
-- host replication replicator replica_ip/32 md5

-- Initialize replica (from primary):
pg_basebackup -h primary_host -U replicator -D /var/lib/postgresql/data -P -R
-- -R creates recovery.conf (pg 11) or standby.signal (pg 12+) automatically
```

```sql
-- Monitor replication lag (run on primary):
SELECT
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    (sent_lsn - replay_lsn) AS replication_lag_bytes
FROM pg_stat_replication;

-- On replica: check lag in seconds
SELECT now() - pg_last_xact_replay_timestamp() AS replication_delay;
```

### Synchronous vs Asynchronous Replication

```sql
-- Async (default): primary commits without waiting for replica
-- Risk: if primary dies before replica catches up, you lose those transactions

-- Sync: primary waits for replica to confirm WAL received before committing
-- Cost: every COMMIT blocks until replica acknowledges
synchronous_standby_names = 'replica1'
-- or for any one of multiple replicas:
synchronous_standby_names = 'ANY 1 (replica1, replica2)'
```

### Replication Slots — Preventing WAL Deletion

Without replication slots, Postgres can delete WAL that a slow replica hasn't consumed yet — breaking replication.

```sql
-- Create a slot:
SELECT pg_create_physical_replication_slot('replica1_slot');

-- Check slots:
SELECT slot_name, active, restart_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag
FROM pg_replication_slots;
```

**Danger:** An inactive replication slot will hold WAL forever, filling your disk. Drop unused slots:

```sql
SELECT pg_drop_replication_slot('unused_slot');
```

### Logical Replication

Replicates individual tables, not the whole cluster. Replica can be a different Postgres version, different schema, can even write to other tables.

```sql
-- On publisher:
ALTER SYSTEM SET wal_level = 'logical';
-- Restart required

CREATE PUBLICATION my_pub FOR TABLE anomaly_routes, cities;
-- or: FOR ALL TABLES

-- On subscriber:
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

Postgres has a **process-per-connection** model. Each connection forks a backend process (~5-10MB RAM). At 500 connections, that's 2.5-5GB RAM just for connection overhead.

**PgBouncer** sits between your app and Postgres. Your app holds thousands of connections to PgBouncer; PgBouncer holds a small pool to Postgres.

```ini
# pgbouncer.ini
[databases]
mydb = host=localhost port=5432 dbname=mydb

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
max_client_conn = 10000     # app connections to PgBouncer
default_pool_size = 25      # actual Postgres connections
pool_mode = transaction     # most efficient: connection returned to pool after each transaction
```

**Pool modes:**

| Mode | Connection held | Works with | Limitations |
|------|----------------|------------|-------------|
| `session` | Entire session | Everything | No real pooling benefit |
| `transaction` | One transaction | Most apps | `SET`, temp tables, prepared statements don't persist |
| `statement` | One statement | Very simple queries | No transactions |

`transaction` mode is the right default for web apps. Just ensure you don't rely on session-level state (`SET app.current_user_email` must be inside a transaction with `SET LOCAL`).

### Patroni — Automated Failover

Patroni is the standard for HA Postgres. It uses a distributed consensus store (etcd, ZooKeeper, or Consul) to elect a leader and manage failover.

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
1. node1 disappears
2. Patroni agents on node2/node3 notice (missing heartbeat in etcd)
3. An election occurs
4. node2 wins, promotes itself to primary
5. node3 reconfigures to replicate from node2
6. HAProxy/vip-manager updates the endpoint your app connects to

```bash
# Patronictl commands:
patronictl -c /etc/patroni/config.yml list           # cluster status
patronictl -c /etc/patroni/config.yml failover mydb  # manual failover
patronictl -c /etc/patroni/config.yml switchover mydb --master node1 --candidate node2
```

---

## 8. Advanced Locking — Diagnosing Deadlocks and Lock Contention

### Lock Types

Postgres has multiple lock levels. Every DML statement acquires locks automatically:

| Lock Mode | Acquired by | Conflicts with |
|-----------|-------------|----------------|
| `ACCESS SHARE` | SELECT | ACCESS EXCLUSIVE only |
| `ROW SHARE` | SELECT FOR UPDATE | EXCLUSIVE, ACCESS EXCLUSIVE |
| `ROW EXCLUSIVE` | INSERT, UPDATE, DELETE | SHARE and above |
| `SHARE UPDATE EXCLUSIVE` | VACUUM, CREATE INDEX CONCURRENTLY | Itself and above |
| `SHARE` | CREATE INDEX | ROW EXCLUSIVE and above |
| `SHARE ROW EXCLUSIVE` | Some triggers | ROW SHARE and above |
| `EXCLUSIVE` | Rare | ROW SHARE and above |
| `ACCESS EXCLUSIVE` | ALTER TABLE, DROP, TRUNCATE | Everything |

**`ALTER TABLE` is the most dangerous lock.** It acquires ACCESS EXCLUSIVE — blocks all reads and writes. If a long-running `SELECT` holds ACCESS SHARE, your `ALTER TABLE` queues behind it — and everything queued after the ALTER is also blocked.

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
-- BAD: locks the table for the entire duration
ALTER TABLE anomaly_routes ADD COLUMN notes TEXT;

-- GOOD on Postgres 11+: instant for constant defaults (stored in catalog, not rewritten)
ALTER TABLE anomaly_routes ADD COLUMN notes TEXT DEFAULT '';

-- For non-constant defaults (old Postgres / complex defaults):
-- 1. Add nullable column (instant)
ALTER TABLE anomaly_routes ADD COLUMN notes TEXT;
-- 2. Backfill in batches (doesn't hold one giant lock)
UPDATE anomaly_routes SET notes = '' WHERE id BETWEEN 1 AND 10000;
-- ... repeat in batches
-- 3. Add NOT NULL constraint using a CHECK CONSTRAINT (Postgres 12+ validates without full lock)
ALTER TABLE anomaly_routes ADD CONSTRAINT notes_not_null CHECK (notes IS NOT NULL) NOT VALID;
ALTER TABLE anomaly_routes VALIDATE CONSTRAINT notes_not_null;  -- validates without lock
-- 4. Convert to real NOT NULL (after validation, this is instant)
ALTER TABLE anomaly_routes ALTER COLUMN notes SET NOT NULL;
ALTER TABLE anomaly_routes DROP CONSTRAINT notes_not_null;
```

### lock_timeout and statement_timeout

```sql
-- Abort if we can't get a lock within 2 seconds (prevents migration from blocking for hours)
SET lock_timeout = '2s';
ALTER TABLE anomaly_routes ADD COLUMN notes TEXT;
-- If blocked for 2 seconds: ERROR: canceling statement due to lock timeout

-- Abort if query takes longer than 30 seconds:
SET statement_timeout = '30s';

-- Per-role default (in postgresql.conf or ALTER ROLE):
ALTER ROLE app_user SET statement_timeout = '30s';
ALTER ROLE migrations_user SET lock_timeout = '5s';
```

### Deadlocks

A deadlock is when two transactions each hold a lock the other needs.

```
Transaction A: locked row 1, waiting for row 2
Transaction B: locked row 2, waiting for row 1
→ Neither can proceed. Postgres detects this and kills one.
```

```sql
-- Postgres logs deadlocks automatically (with details) when log_lock_waits = on
-- You'll see: ERROR: deadlock detected. DETAIL: Process 123 waits for ShareLock on transaction 456

-- Prevention: always acquire locks in the same order across transactions
-- Instead of:
--   Tx A: UPDATE users WHERE id=1; UPDATE users WHERE id=2;
--   Tx B: UPDATE users WHERE id=2; UPDATE users WHERE id=1;
-- Do:
--   Both: UPDATE users WHERE id IN (1,2) ORDER BY id;  -- consistent order
```

---

## 9. pg_stat_statements — The Production Monitoring Tool

`pg_stat_statements` tracks execution statistics for every distinct query. It's the most important extension for production tuning.

```sql
-- Enable (requires postgresql.conf change + restart):
-- shared_preload_libraries = 'pg_stat_statements'
-- pg_stat_statements.track = all

CREATE EXTENSION pg_stat_statements;

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
EXPLAIN SELECT COUNT(*) FROM anomaly_routes;
-- Gather (workers launched: 3)
-- →  Parallel Seq Scan on anomaly_routes

-- Configure:
SET max_parallel_workers_per_gather = 4;  -- workers per query node
SET parallel_setup_cost = 1000;           -- cost threshold to start a parallel plan (lower = more parallel)
SET parallel_tuple_cost = 0.1;            -- per-tuple cost for parallel

-- Force a parallel plan for testing:
SET force_parallel_mode = on;

-- Disable for a specific query:
SET max_parallel_workers_per_gather = 0;
```

**Parallel doesn't always win.** The overhead of spawning workers and merging results costs time. For small tables or fast index scans, parallel is slower. The planner estimates the crossover point — which is why correct statistics matter.

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

**Partition pruning — verify it's working:**

```sql
EXPLAIN SELECT * FROM events WHERE created_at >= '2026-01-01' AND created_at < '2026-02-01';
-- Should show: Append → Seq Scan on events_2026_01
-- Should NOT show scans on other partitions
```

**Detach and archive old partitions:**

```sql
-- Detach (instantly, no lock on active partitions):
ALTER TABLE events DETACH PARTITION events_2025_01;

-- Now events_2025_01 is a standalone table — archive to cold storage, drop, or compress
ALTER TABLE events_2025_01 SET (autovacuum_enabled = false);  -- no maintenance needed
```

### Partition-wise Joins and Aggregates

When two partitioned tables are joined on their partition key, Postgres can join matching partitions directly — "partition-wise join."

```sql
-- Enable:
SET enable_partitionwise_join = on;
SET enable_partitionwise_aggregate = on;
```

---

## 12. Extensions — The Ecosystem

```sql
-- List installed extensions:
SELECT name, default_version, installed_version, comment
FROM pg_available_extensions
WHERE installed_version IS NOT NULL;
```

| Extension | Purpose | Install |
|-----------|---------|---------|
| `pg_stat_statements` | Query performance tracking | `shared_preload_libraries` |
| `pgcrypto` | Cryptographic functions (`crypt`, `gen_random_bytes`, `pgp_sym_encrypt`) | `CREATE EXTENSION pgcrypto` |
| `uuid-ossp` | UUID generation (v1-v5) | `CREATE EXTENSION "uuid-ossp"` |
| `pg_trgm` | Trigram similarity — fuzzy search (`%` operator, `similarity()`) | `CREATE EXTENSION pg_trgm` |
| `fuzzystrmatch` | `levenshtein`, `soundex`, `metaphone` distance functions | `CREATE EXTENSION fuzzystrmatch` |
| `tablefunc` | `crosstab()` for pivot tables | `CREATE EXTENSION tablefunc` |
| `hstore` | Key-value pairs in a column (predates JSONB) | `CREATE EXTENSION hstore` |
| `pgcrypto` | Encrypt columns, hash passwords | `CREATE EXTENSION pgcrypto` |
| `postgis` | Geospatial | `CREATE EXTENSION postgis` |
| `pg_partman` | Automatic partition management | External install |
| `pg_repack` | Online table rewrite (VACUUM FULL without lock) | External install |
| `pgvector` | Vector similarity search (AI embeddings) | External install |
| `pg_cron` | Cron jobs inside Postgres | `shared_preload_libraries` |
| `timescaledb` | Time-series at scale (automatic partitioning, compression) | External install |

### pg_trgm — Fuzzy Search

```sql
CREATE EXTENSION pg_trgm;

-- Find similar strings (0.0–1.0, higher = more similar)
SELECT similarity('Dhaka', 'Dhakaa');   -- 0.55
SELECT similarity('Dhaka', 'Dhaaka');   -- 0.5

-- Fast LIKE/ILIKE with index:
CREATE INDEX idx_trgm ON cities USING GIN (name gin_trgm_ops);
SELECT * FROM cities WHERE name % 'Dhak';      -- similarity threshold (default 0.3)
SELECT * FROM cities WHERE name ILIKE '%dhak%'; -- uses the GIN trgm index

-- Levenshtein distance (edit distance):
CREATE EXTENSION fuzzystrmatch;
SELECT levenshtein('Dhaka', 'Dhakaa');  -- 1 (one insertion)
```

### pgvector — AI Embeddings

```sql
CREATE EXTENSION vector;

-- Store embedding vectors (e.g., from OpenAI text-embedding-ada-002 = 1536 dims)
ALTER TABLE articles ADD COLUMN embedding vector(1536);

-- Find most similar articles to a given embedding:
SELECT id, title,
       embedding <=> '[0.1, 0.2, ...]'::vector AS distance
FROM articles
ORDER BY distance
LIMIT 10;

-- Operators:
-- <=>  cosine distance (most common for text embeddings)
-- <->  Euclidean (L2) distance
-- <#>  negative inner product

-- Index for approximate nearest neighbor (exact search for small sets):
CREATE INDEX ON articles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- or HNSW (faster query, slower build):
CREATE INDEX ON articles USING hnsw (embedding vector_cosine_ops);
```

---

## 13. Production Incident Playbook

### Symptom: Database is Slow — Everything Hangs

```sql
-- Step 1: What's running right now?
SELECT pid, now() - query_start AS duration, state, wait_event_type, wait_event,
       LEFT(query, 100) AS query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Step 2: Is there a lock pile-up?
SELECT blocked.pid, blocked.query, blocking.pid AS blocking_pid, blocking.query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE blocked.wait_event_type = 'Lock';

-- Step 3: Kill the blocker (graceful first)
SELECT pg_cancel_backend(blocking_pid);
-- If it doesn't respond:
SELECT pg_terminate_backend(blocking_pid);
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

-- Check WAL directory size:
SELECT pg_size_pretty(sum(size)) FROM pg_ls_waldir();

-- Check for abandoned replication slots holding WAL:
SELECT slot_name, active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS wal_held
FROM pg_replication_slots
WHERE NOT active;
-- Drop them if stale:
SELECT pg_drop_replication_slot('stale_slot');
```

### Symptom: A Specific Query Got Slow Overnight

Most likely cause: statistics are stale after a data change.

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

-- Check if an index was dropped or became bloated:
SELECT indexrelname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE relname = 'anomaly_routes';
```

### Symptom: High CPU, Many Queries

```sql
-- Find duplicate/near-duplicate queries (same pattern, different parameters)
-- pg_stat_statements normalizes parameters, so these are already grouped:
SELECT LEFT(query, 100), calls, mean_exec_time
FROM pg_stat_statements
ORDER BY calls * mean_exec_time DESC
LIMIT 10;

-- N+1 query pattern: a query called thousands of times
-- calls >> other queries is the signature

-- Check connection count:
SELECT count(*), state FROM pg_stat_activity GROUP BY state;
-- Many 'idle in transaction' connections = app not committing/closing transactions
```

### Symptom: `idle in transaction` Connections Piling Up

An application opened a transaction (`BEGIN`) but never committed or rolled back — holding locks indefinitely.

```sql
-- Find them:
SELECT pid, now() - xact_start AS txn_duration, state, query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY txn_duration DESC;

-- Kill old ones:
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle in transaction'
AND now() - xact_start > INTERVAL '5 minutes';

-- Prevent via timeout (add to postgresql.conf or per-role):
idle_in_transaction_session_timeout = '5min'
```

### Symptom: Transaction ID Wraparound Warning

```
WARNING: database "mydb" must be vacuumed within 10985967 transactions
```

```sql
-- Immediate action: find and vacuum the oldest table
SELECT relname, age(relfrozenxid) AS xid_age
FROM pg_class
WHERE relkind = 'r'
ORDER BY xid_age DESC
LIMIT 10;

VACUUM FREEZE VERBOSE most_ancient_table;

-- If autovacuum can't keep up, run aggressive vacuum manually:
VACUUM (FREEZE, ANALYZE, VERBOSE) anomaly_routes;

-- Permanently fix: tune autovacuum_freeze_max_age (default 200M)
-- and ensure autovacuum is not being blocked by long transactions
```

---

## 14. Useful Hidden System Views

```sql
-- All active queries with full detail
SELECT * FROM pg_stat_activity;

-- Lock dependency graph
SELECT * FROM pg_locks;

-- Index usage per table
SELECT * FROM pg_stat_user_indexes;

-- Table I/O statistics
SELECT * FROM pg_statio_user_tables;

-- Replication status
SELECT * FROM pg_stat_replication;       -- on primary
SELECT * FROM pg_stat_subscription;      -- on subscriber (logical replication)

-- Background writer stats (checkpoint frequency, buffer writes)
SELECT * FROM pg_stat_bgwriter;

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

Exports SQL statements that recreate your data. Works across Postgres versions. Selective (per-database, per-table).

```bash
# Dump a single database (SQL format):
pg_dump -h localhost -U postgres mydb > backup.sql

# Restore:
psql -h localhost -U postgres mydb < backup.sql

# Custom format (compressed, faster restore, supports parallel):
pg_dump -h localhost -U postgres -Fc mydb > backup.dump

# Restore custom format:
pg_restore -h localhost -U postgres -d mydb backup.dump

# Parallel restore (uses N jobs, much faster for large DBs):
pg_restore -h localhost -U postgres -d mydb -j 4 backup.dump

# Dump only specific tables:
pg_dump -t anomaly_routes -t cities mydb > tables.sql

# Dump only schema (no data):
pg_dump --schema-only mydb > schema.sql

# Dump only data (no schema):
pg_dump --data-only mydb > data.sql

# Dump all databases + roles + tablespaces:
pg_dumpall -h localhost -U postgres > full_cluster.sql
```

**Limitations of pg_dump:**
- It's a snapshot — takes time to run, DB keeps changing during dump
- For large databases, the window of inconsistency grows
- Cannot restore to a specific point in time between dumps

### pg_basebackup — Physical Backup

Copies the entire data directory at the filesystem level. Fast, consistent, used as the starting point for replicas and PITR.

```bash
# Create a base backup:
pg_basebackup -h localhost -U replicator -D /backup/base -P -Ft -z
# -Ft = tar format, -z = gzip compress, -P = progress

# With WAL included (standalone, no streaming needed):
pg_basebackup -h localhost -U replicator -D /backup/base -P -Ft -z --wal-method=fetch
```

### WAL Archiving — The Foundation of PITR

WAL archiving continuously saves WAL segment files to a safe location. Combined with a base backup, you can replay WAL to any point in time.

```ini
# postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/wal/%f'
# %p = full path to WAL file, %f = filename only

# For S3 (using WAL-G or pgBackRest):
archive_command = 'wal-g wal-push %p'
```

### Point-in-Time Recovery (PITR)

Scenario: someone ran `DELETE FROM anomaly_routes WHERE city_id = 5` at 14:32 and shouldn't have. You need to restore to 14:31.

```bash
# 1. Stop the database
pg_ctl stop -D /var/lib/postgresql/data

# 2. Restore the base backup to a new location
tar -xzf base.tar.gz -C /var/lib/postgresql/data_restore

# 3. Create recovery configuration
cat > /var/lib/postgresql/data_restore/postgresql.conf << EOF
restore_command = 'cp /archive/wal/%f %p'
recovery_target_time = '2026-04-11 14:31:00+06'
recovery_target_action = 'promote'   -- become primary after reaching target
EOF

# Create the signal file that tells Postgres to recover (not start normally):
touch /var/lib/postgresql/data_restore/recovery.signal

# 4. Start Postgres — it will replay WAL up to 14:31 then stop
pg_ctl start -D /var/lib/postgresql/data_restore

# 5. Verify the data is correct, then promote or use for data extraction
```

**Recovery target options:**

```sql
recovery_target_time = '2026-04-11 14:31:00'   -- stop at this timestamp
recovery_target_lsn  = '0/15D5FA8'             -- stop at this WAL position
recovery_target_name = 'before_delete'          -- stop at a named restore point
recovery_target_xid  = '12345'                  -- stop before this transaction
recovery_target_inclusive = true                -- include/exclude the target itself
```

**Create named restore points (before risky operations):**

```sql
SELECT pg_create_restore_point('before_bulk_delete');
-- Then run your risky operation
-- If it goes wrong, PITR to 'before_bulk_delete'
```

### WAL-G — The Modern Backup Tool

`pg_dump` + manual WAL archiving is error-prone. WAL-G automates base backups + WAL archiving + PITR to S3/GCS/Azure.

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
wal-g backup-fetch /var/lib/postgresql/data LATEST
# Then set recovery_target_time and start Postgres
```

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
-- Plan expects 500, gets 1000 → wrong join strategy chosen
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
-- 1. ndistinct: better estimate of distinct value combinations
CREATE STATISTICS stat_city_status (ndistinct) ON city_id, status FROM anomaly_routes;

-- 2. dependencies: detect functional dependencies between columns
CREATE STATISTICS stat_city_intercity (dependencies) ON city_id, is_intercity FROM anomaly_routes;

-- 3. mcv (most common values): track the most common combinations
CREATE STATISTICS stat_city_status (mcv) ON city_id, status FROM anomaly_routes;

-- All three at once (default when you omit the type):
CREATE STATISTICS stat_all ON city_id, status, is_intercity FROM anomaly_routes;

ANALYZE anomaly_routes;
```

```sql
-- Inspect what was learned:
SELECT stxname, stxkeys, stxdependencies, stxmcv
FROM pg_statistic_ext
JOIN pg_statistic_ext_data ON pg_statistic_ext.oid = pg_statistic_ext_data.stxoid
WHERE stxrelid = 'anomaly_routes'::regclass;
```

**When to use:** Anytime you see `rows=X (estimated)` wildly different from `rows=Y (actual)` in `EXPLAIN ANALYZE` for a multi-column `WHERE`. That's a statistics problem, not an index problem.

---

## 17. JIT Compilation

JIT (Just-In-Time) compilation, available since Postgres 11, compiles parts of a query to native machine code using LLVM at execution time. It helps for CPU-heavy analytical queries.

### When JIT Helps vs Hurts

**Helps:**
- Long-running queries doing heavy arithmetic or many function calls (analytics, aggregations over millions of rows)
- Queries where CPU is the bottleneck, not I/O

**Hurts:**
- Short OLTP queries — compilation overhead (~10ms) exceeds any gain
- Queries that return quickly — JIT never gets to amortize its startup cost

### Configuration

```ini
# postgresql.conf:
jit = on                            # enable JIT globally (default: on in pg 12+)
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
Is this change purely additive (new table, new nullable column, new index)?
  → YES: Usually safe. Deploy anytime.
  → NO: Continue ↓

Does it require a table rewrite (type change, add NOT NULL without default)?
  → YES: Must use multi-step migration below. Never do in one ALTER TABLE.
  → NO: Continue ↓

Does it acquire ACCESS EXCLUSIVE lock (ALTER TABLE, DROP)?
  → YES: Set lock_timeout, deploy during low-traffic window.
  → NO: Continue ↓
```

### Step-by-Step: Adding a NOT NULL Column

```sql
-- Step 1: Add nullable (instant, no lock worth worrying about)
ALTER TABLE anomaly_routes ADD COLUMN priority INTEGER;

-- Step 2: Backfill in batches to avoid long locks and excessive WAL
DO $$
DECLARE
  batch_size INT := 10000;
  max_id     INT;
  cur_id     INT := 0;
BEGIN
  SELECT MAX(id) INTO max_id FROM anomaly_routes;
  WHILE cur_id < max_id LOOP
    UPDATE anomaly_routes
    SET priority = 1
    WHERE id > cur_id AND id <= cur_id + batch_size AND priority IS NULL;
    cur_id := cur_id + batch_size;
    PERFORM pg_sleep(0.05);  -- brief pause to let replicas catch up
  END LOOP;
END $$;

-- Step 3: Add constraint as NOT VALID (validates new rows only, no table scan, instant)
ALTER TABLE anomaly_routes
    ADD CONSTRAINT priority_not_null CHECK (priority IS NOT NULL) NOT VALID;

-- Step 4: Validate (scans table but only holds SHARE UPDATE EXCLUSIVE lock — reads still work)
ALTER TABLE anomaly_routes VALIDATE CONSTRAINT priority_not_null;

-- Step 5: Convert to real NOT NULL (instant because constraint already validated)
ALTER TABLE anomaly_routes ALTER COLUMN priority SET NOT NULL;
ALTER TABLE anomaly_routes DROP CONSTRAINT priority_not_null;
```

### Step-by-Step: Adding an Index

```sql
-- NEVER do this on a live table (holds SHARE lock, blocks writes):
CREATE INDEX idx_priority ON anomaly_routes(priority);

-- ALWAYS use CONCURRENTLY:
CREATE INDEX CONCURRENTLY idx_priority ON anomaly_routes(priority);
-- Takes longer but only holds SHARE UPDATE EXCLUSIVE (reads and writes continue)

-- If it fails midway, clean up the invalid index first:
DROP INDEX CONCURRENTLY idx_priority_incomplete;
-- Then retry
```

### Step-by-Step: Renaming a Column

You cannot rename a column without an ACCESS EXCLUSIVE lock. The zero-downtime approach is expand/contract:

```sql
-- Phase 1 (deploy): add new column, write to both
ALTER TABLE anomaly_routes ADD COLUMN priority_level INTEGER;

-- Trigger to keep both in sync during transition:
CREATE OR REPLACE FUNCTION sync_priority() RETURNS TRIGGER AS $$
BEGIN
    NEW.priority_level := NEW.priority;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_priority
BEFORE INSERT OR UPDATE ON anomaly_routes
FOR EACH ROW EXECUTE FUNCTION sync_priority();

-- Backfill:
UPDATE anomaly_routes SET priority_level = priority;

-- Phase 2 (later deploy): update app to read from new column
-- Phase 3 (final deploy): drop old column and trigger
DROP TRIGGER trg_sync_priority ON anomaly_routes;
ALTER TABLE anomaly_routes DROP COLUMN priority;
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

Postgres can decode WAL into a human-readable change stream via **output plugins**. The built-in plugin is `pgoutput` (used by logical replication). Third-party plugins include `wal2json` and `decoderbufs`.

```sql
-- Requires: wal_level = logical (restart required if not already set)
ALTER SYSTEM SET wal_level = 'logical';

-- Create a replication slot with the wal2json output plugin:
SELECT pg_create_logical_replication_slot('cdc_slot', 'wal2json');

-- Peek at changes (non-destructive — slot remembers position):
SELECT * FROM pg_logical_slot_peek_changes('cdc_slot', NULL, NULL,
    'pretty-print', '1', 'include-timestamp', '1');

-- Consume changes (advances the slot — changes are gone after this):
SELECT * FROM pg_logical_slot_get_changes('cdc_slot', NULL, NULL);

-- Drop when done:
SELECT pg_drop_replication_slot('cdc_slot');
```

Sample `wal2json` output:

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

```json
// Debezium connector configuration:
{
  "name": "postgres-cdc",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "localhost",
    "database.port": "5432",
    "database.user": "replicator",
    "database.password": "secret",
    "database.dbname": "mydb",
    "database.server.name": "mydb",
    "table.include.list": "public.anomaly_routes,public.user_contributions",
    "plugin.name": "pgoutput",
    "slot.name": "debezium_slot",
    "publication.name": "debezium_pub",
    "snapshot.mode": "initial"   // take initial snapshot then stream changes
  }
}
```

Each Kafka message contains `before` and `after` states of the row, the operation type, and a timestamp — enabling full event sourcing.

### Direct Logical Replication (without Kafka)

If you just need to sync one table to another Postgres database without the Kafka infrastructure:

```sql
-- Publisher:
CREATE PUBLICATION anomaly_pub FOR TABLE anomaly_routes;

-- Subscriber:
CREATE SUBSCRIPTION anomaly_sub
    CONNECTION 'host=primary dbname=mydb user=replicator password=secret'
    PUBLICATION anomaly_pub;
```

### Use Cases

| Use Case | Approach |
|----------|----------|
| Sync Postgres → Elasticsearch for search | Debezium → Kafka → Elasticsearch connector |
| Invalidate Redis cache on row change | Debezium → Kafka consumer → Redis DEL |
| Audit log of every data change | Logical decoding → append-only audit table |
| Event sourcing — replay history | CDC → event store |
| Zero-downtime major version upgrade | Logical replication to new-version replica, cut over |
| Cross-region data sync | Logical replication to replica in another region |

### Important Gotchas

**Replication slot lag = disk fill.** If your CDC consumer falls behind, the slot holds WAL. Monitor it:

```sql
SELECT slot_name,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS consumer_lag
FROM pg_replication_slots
WHERE slot_type = 'logical';
```

**Tables need a replica identity for UPDATE/DELETE.** Without it, Debezium can't send the `before` state:

```sql
-- Default: primary key only (usually fine)
ALTER TABLE anomaly_routes REPLICA IDENTITY DEFAULT;

-- Full: send all columns in before state (more WAL, but complete history)
ALTER TABLE anomaly_routes REPLICA IDENTITY FULL;
```

---

## What Separates God-Level from Expert-Level

You can learn everything in this document. What you can't learn from a document:

1. **Instinct under pressure** — knowing which query to run first when prod is down and 5 engineers are watching
2. **Reading a plan and knowing why it's wrong** — not just what it says, but why the planner made that choice and how to fix the underlying cause (statistics, configuration, or schema)
3. **Knowing what not to do** — the index you don't add, the vacuum you don't force, the constraint you don't validate during peak traffic
4. **Boring discipline** — monitoring vacuum health weekly, reviewing `pg_stat_statements` before problems happen, testing `EXPLAIN ANALYZE` on new queries before shipping

The technical ceiling is this document. The real ceiling is experience.
