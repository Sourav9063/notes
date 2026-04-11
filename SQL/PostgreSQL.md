# PostgreSQL Deep Reference

---

## 1. `psql` Command-Line

`psql` is the native PostgreSQL CLI. It's faster than any GUI for inspecting schema, running quick queries, and scripting. Every DBA uses it.

### Meta-Commands

| Command              | Action                        | Notes                                                                 |
| -------------------- | ----------------------------- | --------------------------------------------------------------------- |
| `\l`                 | List databases                | Shows all databases on the server                                     |
| `\c db_name`         | Connect to database           | Switches session context                                              |
| `\dn`                | List schemas                  | Schemas are namespaces within a database (default: `public`)          |
| `\dt`                | List tables                   | Tables in current schema                                              |
| `\dt *.*`            | List all tables, all schemas  | Includes `pg_catalog`, `information_schema`                           |
| `\d table_name`      | Describe table                | Columns, types, defaults, indexes, foreign keys, triggers             |
| `\d+ table_name`     | Describe table (verbose)      | Also shows storage size and comments                                  |
| `\di`                | List indexes                  | Shows all indexes in the current schema                               |
| `\df`                | List functions                | Shows stored functions/procedures                                     |
| `\dv`                | List views                    | Shows views in current schema                                         |
| `\x`                 | Toggle expanded display       | Rotates wide rows vertically — essential for wide tables              |
| `\timing`            | Toggle query timing           | Prints milliseconds after every query                                 |
| `\e`                 | Open editor                   | Opens `$EDITOR` for multi-line SQL                                    |
| `\i file.sql`        | Run a SQL file                | Executes a `.sql` file inside the session                             |
| `\o file.txt`        | Pipe output to file           | Redirects all query output to a file                                  |
| `\watch N`           | Re-run last query every N sec | Like `watch` in bash — useful for monitoring live counts              |
| `\set VAR value`     | Set psql variable             | Use in queries as `:VAR` — useful for scripting                       |
| `\pset null '[NULL]'`| Display NULLs visibly         | By default NULLs are blank — this makes them visible                  |
| `\conninfo`          | Show current connection       | Host, port, user, database                                            |

### Useful One-liners

```bash
# Connect directly from terminal
psql -h localhost -p 5432 -U postgres -d mydb

# Run a query without entering interactive mode
psql -U postgres -d mydb -c "SELECT COUNT(*) FROM users;"

# Run a file
psql -U postgres -d mydb -f migration.sql

# Export query to CSV
psql -U postgres -d mydb -c "\COPY (SELECT * FROM users) TO 'users.csv' CSV HEADER;"
```

---

## 2. Data Types — Choosing Correctly

The right type enforces constraints at the database level, before your app even sees the data.

### Text: `TEXT` vs `VARCHAR(n)` vs `CHAR(n)`

In Postgres, `TEXT` and `VARCHAR` have **identical performance** — both use the same internal storage (`varlena`). The difference is purely about enforcement.

| Type         | Storage      | Enforcement                          | Use when                                      |
| ------------ | ------------ | ------------------------------------ | --------------------------------------------- |
| `TEXT`       | Variable     | None                                 | No meaningful length cap (names, descriptions)|
| `VARCHAR(n)` | Variable     | Error if > n chars                   | The limit is a real business rule             |
| `CHAR(n)`    | Fixed        | Pads with spaces to fill n chars     | Rarely useful — legacy fixed-width formats    |

```sql
-- TEXT: no meaningful cap on a user's display name
name TEXT NOT NULL

-- VARCHAR: status is always short and controlled
status VARCHAR(50) DEFAULT 'REPORTED'

-- CHAR is almost never what you want — 'ACTIVE' stored as CHAR(10) = 'ACTIVE    '
-- Comparisons work but it's confusing. Avoid it.
```

### Numbers: `INTEGER` vs `NUMERIC` vs `FLOAT`

| Type            | Size    | Exact?  | Use when                                              |
| --------------- | ------- | ------- | ----------------------------------------------------- |
| `SMALLINT`      | 2 bytes | Yes     | Tiny counters (0–32767)                               |
| `INTEGER`       | 4 bytes | Yes     | General-purpose IDs, counts                           |
| `BIGINT`        | 8 bytes | Yes     | Large IDs, timestamps in ms, high-volume counters     |
| `NUMERIC(p, s)` | Variable| Yes     | Money, percentages — anything where precision matters |
| `REAL`          | 4 bytes | No      | Scientific approximations only                        |
| `FLOAT8`/`DOUBLE PRECISION` | 8 bytes | No | Same — approximate. Never use for money.  |

```sql
-- NUMERIC: anomaly_score needs precision, not approximation
anomaly_score NUMERIC

-- NUMERIC(10, 2): up to 10 digits total, 2 after decimal — good for money
price NUMERIC(10, 2) NOT NULL

-- INTEGER is fine for counts
anomaly_rides_count INTEGER
```

**Never store money as FLOAT.** `0.1 + 0.2 = 0.30000000000000004` in floating point. Use `NUMERIC`.

### Timestamps: `TIMESTAMPTZ` vs `TIMESTAMP`

`TIMESTAMP` stores no timezone — it's just a naive datetime. `TIMESTAMPTZ` stores UTC internally and converts to the session timezone on display.

**Always use `TIMESTAMPTZ`.**

```sql
-- Good: stores UTC, displays in session timezone
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- TIMESTAMP WITH TIME ZONE is the same thing, just more verbose:
resolved_at TIMESTAMP WITH TIME ZONE

-- Dangerous: no timezone info — ambiguous across regions
-- created_at TIMESTAMP   <-- don't do this
```

**Hidden: `NOW()` vs `CURRENT_TIMESTAMP` vs `clock_timestamp()`**

- `NOW()` and `CURRENT_TIMESTAMP` return the **transaction start time** — they don't change mid-transaction.
- `clock_timestamp()` returns the **actual wall clock time** at the moment of the call.

```sql
BEGIN;
SELECT NOW();            -- 2026-04-11 10:00:00 (frozen at transaction start)
SELECT clock_timestamp(); -- 2026-04-11 10:00:03 (real time, keeps ticking)
COMMIT;
```

Use `clock_timestamp()` when you need accurate per-row timestamps inside a long transaction.

### Boolean

```sql
is_intercity BOOLEAN  -- stores TRUE / FALSE / NULL
```

Accepts: `TRUE`, `FALSE`, `'t'`, `'f'`, `'yes'`, `'no'`, `1`, `0`. NULL means unknown — not false.

### UUID

```sql
-- Requires the extension:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

id UUID DEFAULT uuid_generate_v4() PRIMARY KEY
-- or in Postgres 13+:
id UUID DEFAULT gen_random_uuid() PRIMARY KEY
```

UUIDs are globally unique — safe for distributed systems where sequences from multiple nodes could collide. Trade-off: larger (16 bytes vs 4), and B-tree indexes fragment more due to random insertion order.

### JSONB

```sql
metadata JSONB
```

- `JSON` stores raw text and re-parses on every access.
- `JSONB` parses once, stores binary — faster to query, supports indexing.

```sql
-- Access a key:
SELECT metadata -> 'city'         -- returns JSON type
SELECT metadata ->> 'city'        -- returns TEXT (no quotes)
SELECT metadata #>> '{address,zip}' -- nested path, returns TEXT

-- Filter:
SELECT * FROM records WHERE metadata @> '{"status": "active"}';

-- Index for fast @> queries:
CREATE INDEX idx_metadata ON records USING GIN (metadata);
```

### Arrays

```sql
tags TEXT[]
scores INTEGER[]
```

```sql
INSERT INTO posts (tags) VALUES (ARRAY['postgres', 'sql']);
INSERT INTO posts (tags) VALUES ('{"postgres","sql"}');  -- alternative syntax

-- Query:
SELECT * FROM posts WHERE 'postgres' = ANY(tags);
SELECT * FROM posts WHERE tags @> ARRAY['postgres'];   -- contains

-- Operators:
-- @>  contains
-- <@  is contained by
-- &&  overlaps (any element in common)
-- ||  concatenate arrays
```

### Enum

```sql
CREATE TYPE route_status AS ENUM (
    'REPORTED', 'PENDING_APPROVAL', 'PENDING_REJECTION',
    'SYSTEM_APPROVED', 'ADMIN_APPROVED', 'SYSTEM_REJECTED', 'REJECTED'
);

status route_status DEFAULT 'REPORTED'
```

Enums are stored as integers internally — very compact. But adding a value requires `ALTER TYPE`:

```sql
ALTER TYPE route_status ADD VALUE 'ESCALATED' AFTER 'PENDING_APPROVAL';
```

You cannot remove or rename values without recreating the type. For frequently changing sets, `VARCHAR` + a `CHECK` constraint is more flexible:

```sql
status VARCHAR(50) CHECK (status IN ('REPORTED', 'PENDING_APPROVAL', ...))
```

### Auto-increment: `SERIAL` vs `GENERATED ALWAYS AS IDENTITY`

```sql
-- Old (SERIAL is syntactic sugar for a SEQUENCE + DEFAULT):
id SERIAL PRIMARY KEY

-- Modern SQL-standard equivalent:
id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY

-- GENERATED BY DEFAULT allows manual override:
id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY
```

`GENERATED ALWAYS` blocks `INSERT INTO t (id) VALUES (5)` — Postgres forces the sequence. Use `OVERRIDING SYSTEM VALUE` when you need to insert a specific ID (e.g., during a migration):

```sql
INSERT INTO users (id, name) OVERRIDING SYSTEM VALUE VALUES (999, 'Admin');
```

### Generated (Computed) Columns

Postgres computes and stores the value automatically on every insert/update. You never write to it.

```sql
distance_diff NUMERIC GENERATED ALWAYS AS (ABS(actual_distance - estimated_distance)) STORED
```

- `STORED` — calculated and saved to disk. Can be indexed.
- There is no `VIRTUAL` in Postgres (unlike MySQL) — generated columns are always stored.
- The expression can only reference other columns in the same row — no subqueries, no functions with side effects.

```sql
-- Practical example: pre-compute a search vector
CREATE TABLE articles (
    title   TEXT,
    body    TEXT,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || body)
    ) STORED
);
CREATE INDEX ON articles USING GIN (search_vector);
```

---

## 3. Data Definition Language (DDL)

### Constraints

Constraints enforce business rules at the database level — they apply regardless of which application or script touches the data.

```sql
CREATE TABLE anomaly_routes (
    id          SERIAL PRIMARY KEY,                          -- unique, not null
    email       TEXT    NOT NULL,                            -- required
    status      VARCHAR(50) DEFAULT 'REPORTED',              -- has a default
    score       NUMERIC CHECK (score >= 0 AND score <= 100), -- range rule
    city_id     INTEGER REFERENCES cities(id)                -- foreign key
        ON DELETE SET NULL                                   -- what happens when city is deleted
        ON UPDATE CASCADE,                                   -- propagate city ID changes
    UNIQUE (email, city_id)                                  -- compound unique constraint
);
```

**`ON DELETE` / `ON UPDATE` options for foreign keys:**

| Option        | Behavior                                              |
| ------------- | ----------------------------------------------------- |
| `RESTRICT`    | Error — blocks the delete/update (default)            |
| `CASCADE`     | Deletes/updates dependent rows automatically          |
| `SET NULL`    | Sets the FK column to NULL                            |
| `SET DEFAULT` | Sets the FK column to its default value               |
| `NO ACTION`   | Like RESTRICT but checked at end of transaction       |

### Composite Primary Key

When a row's identity is defined by two columns together:

```sql
CREATE TABLE user_contributions (
    email              VARCHAR(255) NOT NULL,
    contribution_table VARCHAR(100) NOT NULL,
    pending_approval   INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (email, contribution_table)  -- pair must be unique; each alone can repeat
);
```

Postgres automatically creates a B-tree index on `(email, contribution_table)`. Queries filtering on `email` alone can use this index (leftmost prefix rule). Queries filtering on `contribution_table` alone cannot.

### Altering Tables Safely

```sql
-- Add a column with a default (Postgres 11+: instant, no table rewrite)
ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ DEFAULT NOW();

-- Remove a column
ALTER TABLE users DROP COLUMN legacy_field;

-- Rename
ALTER TABLE users RENAME COLUMN old_name TO new_name;

-- Change type (requires a CAST — may lock the table)
ALTER TABLE users ALTER COLUMN score TYPE NUMERIC USING score::NUMERIC;

-- Add a constraint
ALTER TABLE users ADD CONSTRAINT chk_age CHECK (age >= 0);

-- Drop a constraint
ALTER TABLE users DROP CONSTRAINT chk_age;
```

**Hidden: Adding a NOT NULL column to a large table**

`ADD COLUMN col TEXT NOT NULL DEFAULT 'x'` on a table with millions of rows used to rewrite the whole table. Since Postgres 11, if the default is a constant (not volatile like `NOW()`), it stores the default in metadata and rewrites lazily. Safe for production.

### Table Partitioning

Splits a logically single table into smaller physical pieces. Queries that filter on the partition key skip irrelevant partitions — called **partition pruning**.

```sql
-- Parent table (no data stored here directly)
CREATE TABLE anomaly_routes_archive (
    created_at TIMESTAMPTZ NOT NULL,
    status     VARCHAR(50),
    city_id    INTEGER
) PARTITION BY RANGE (created_at);

-- Child partitions
CREATE TABLE anomaly_routes_2025 PARTITION OF anomaly_routes_archive
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE anomaly_routes_2026 PARTITION OF anomaly_routes_archive
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Default partition catches everything that doesn't match
CREATE TABLE anomaly_routes_default PARTITION OF anomaly_routes_archive DEFAULT;
```

**Partition types:**
- `RANGE` — date ranges, numeric ranges (most common)
- `LIST` — explicit value lists (`FOR VALUES IN ('BD', 'IN', 'PK')`)
- `HASH` — distributes rows evenly by hash (`FOR VALUES WITH (modulus 4, remainder 0)`)

**Hidden: Global indexes don't exist in Postgres partitioning.** Each partition has its own indexes. A `UNIQUE` constraint on the parent must include the partition key — otherwise Postgres can't enforce uniqueness across partitions.

### Views and Materialized Views

```sql
-- Regular view: runs the query every time
CREATE VIEW active_users AS
    SELECT id, email FROM users WHERE active = true;

-- Materialized view: runs once, stores result — you refresh manually
CREATE MATERIALIZED VIEW user_stats AS
    SELECT email, COUNT(*) AS total FROM anomaly_routes GROUP BY email;

-- Refresh (locks reads during refresh unless CONCURRENTLY)
REFRESH MATERIALIZED VIEW user_stats;

-- Non-blocking refresh (requires a UNIQUE index on the mat view)
CREATE UNIQUE INDEX ON user_stats(email);
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
```

Use materialized views for expensive aggregations that are queried often but updated infrequently (dashboards, reporting).

---

## 4. Data Manipulation Language (DML)

### INSERT

```sql
-- Single row
INSERT INTO users (email, name) VALUES ('a@b.com', 'Sourav');

-- Multiple rows (one statement, faster than individual inserts)
INSERT INTO cities (name, country, population)
VALUES ('Dhaka', 'Bangladesh', 21000000),
       ('Delhi', 'India', 32900000),
       ('Shanghai', 'China', 28500000);

-- Insert from a SELECT
INSERT INTO archived_users (email, name)
SELECT email, name FROM users WHERE active = false;
```

### INSERT … RETURNING

Eliminates the second `SELECT` you'd otherwise need to get the ID or timestamp of the new row.

```sql
INSERT INTO users (email, name)
VALUES ('sourav@example.com', 'Sourav')
RETURNING id, created_at;

-- Also works with UPDATE and DELETE:
UPDATE users SET active = false WHERE email = 'x@y.com' RETURNING id;
DELETE FROM sessions WHERE expired = true RETURNING session_id;
```

### Upsert: INSERT … ON CONFLICT … DO UPDATE

Atomic "insert if not exists, update if it does" — no race condition, no two round-trips.

```sql
INSERT INTO user_contributions (email, contribution_table, pending_approval)
VALUES ('sourav@example.com', 'anomaly_routes', 1)
ON CONFLICT (email, contribution_table) DO UPDATE SET
    pending_approval = user_contributions.pending_approval + EXCLUDED.pending_approval,
    updated_at       = NOW();
```

**`EXCLUDED`** is a pseudo-table holding the row you tried to insert. It lets you reference incoming values vs existing values:

- `user_contributions.pending_approval` — value already in the table
- `EXCLUDED.pending_approval` — value you tried to insert

```sql
-- DO NOTHING: silently skip if conflict (idempotent inserts)
INSERT INTO tags (name) VALUES ('postgres')
ON CONFLICT (name) DO NOTHING;

-- Conflict on a specific constraint by name:
ON CONFLICT ON CONSTRAINT users_email_key DO UPDATE SET ...
```

### UPDATE

```sql
-- Basic
UPDATE users SET active = false WHERE last_login < NOW() - INTERVAL '90 days';

-- Update with a JOIN (using FROM)
UPDATE anomaly_routes ar
SET status = 'SYSTEM_APPROVED'
FROM cities c
WHERE ar.city_id = c.id AND c.country = 'Bangladesh';

-- Update multiple columns
UPDATE users SET name = 'New Name', updated_at = NOW() WHERE id = 42;
```

### DELETE

```sql
-- Basic
DELETE FROM sessions WHERE expires_at < NOW();

-- Delete with JOIN
DELETE FROM anomaly_routes
WHERE city_id IN (SELECT id FROM cities WHERE active = false);

-- TRUNCATE: faster than DELETE for wiping a whole table
TRUNCATE TABLE sessions;                  -- no WHERE, no triggers
TRUNCATE TABLE sessions RESTART IDENTITY; -- also resets sequences
TRUNCATE TABLE sessions CASCADE;          -- also truncates dependent tables
```

**Hidden: `DELETE` vs `TRUNCATE`**
- `DELETE` is logged row-by-row, fires triggers, respects `WHERE`, can be rolled back.
- `TRUNCATE` is a metadata operation — much faster, resets the table in one shot, also transactional but skips row-level triggers.

### Aggregate Filter: `COUNT(*) FILTER (WHERE ...)`

Computes multiple conditional counts in a single scan — far more efficient than multiple subqueries or `CASE WHEN` inside `SUM`.

```sql
-- One scan, six counters:
SELECT
    resolved_by,
    COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL')  AS pending_approval,
    COUNT(*) FILTER (WHERE status = 'PENDING_REJECTION') AS pending_rejection,
    COUNT(*) FILTER (WHERE status = 'SYSTEM_APPROVED')   AS system_approved,
    COUNT(*) FILTER (WHERE status = 'ADMIN_APPROVED')    AS admin_approved,
    COUNT(*) FILTER (WHERE status = 'SYSTEM_REJECTED')   AS system_rejected,
    COUNT(*) FILTER (WHERE status = 'REJECTED')          AS rejected
FROM anomaly_routes
WHERE resolved_by IS NOT NULL
GROUP BY resolved_by;

-- Works with any aggregate:
SELECT
    department,
    AVG(salary) FILTER (WHERE active = true)  AS avg_active_salary,
    SUM(bonus)  FILTER (WHERE year = 2025)    AS bonus_2025
FROM employees
GROUP BY department;
```

### CASE WHEN

Conditional logic inline in SQL. Can appear in `SELECT`, `WHERE`, `ORDER BY`, `INSERT` values, anywhere an expression is valid.

```sql
-- In SELECT: label rows
SELECT
    id,
    CASE status
        WHEN 'ADMIN_APPROVED' THEN 'Approved'
        WHEN 'REJECTED'       THEN 'Rejected'
        ELSE 'Pending'
    END AS display_status
FROM anomaly_routes;

-- Searched CASE (conditions, not equality):
CASE
    WHEN score >= 90 THEN 'critical'
    WHEN score >= 50 THEN 'moderate'
    ELSE 'low'
END AS severity

-- In INSERT: route a single value to the right column
INSERT INTO user_contributions (email, contribution_table, pending_approval, system_approved)
VALUES (
    p_email, p_table,
    CASE WHEN p_status = 'PENDING_APPROVAL' THEN p_delta ELSE 0 END,
    CASE WHEN p_status = 'SYSTEM_APPROVED'  THEN p_delta ELSE 0 END
);
```

---

## 5. Advanced Querying (DQL)

### Common Table Expressions (CTEs)

A `WITH` clause defines named, temporary result sets. Each CTE runs once; its result is reused. Think of them as named subqueries that make complex logic readable.

```sql
WITH
-- Step 1: find active users
ActiveUsers AS (
    SELECT id, email FROM users WHERE active = true
),
-- Step 2: aggregate their orders
UserSpend AS (
    SELECT user_id, SUM(total) AS spend
    FROM orders
    GROUP BY user_id
)
-- Step 3: join and filter
SELECT u.email, s.spend
FROM ActiveUsers u
JOIN UserSpend s ON u.id = s.user_id
WHERE s.spend > 1000;
```

**Recursive CTEs — hierarchies and graphs:**

```sql
-- Walk a tree: find all descendants of a given region
WITH RECURSIVE region_tree AS (
    -- Base case: start node
    SELECT id, name, parent_id FROM regions WHERE id = 1

    UNION ALL

    -- Recursive case: children of current nodes
    SELECT r.id, r.name, r.parent_id
    FROM regions r
    JOIN region_tree rt ON r.parent_id = rt.id
)
SELECT * FROM region_tree;
```

**Hidden: CTE materialization**

By default in Postgres 12+, CTEs are optimized inline (treated like subqueries). In older versions, they were always materialized (run once, result stored). You can force behavior:

```sql
WITH data AS MATERIALIZED (     -- always store result
    SELECT * FROM large_table
)
WITH data AS NOT MATERIALIZED ( -- always inline (let optimizer decide)
    SELECT * FROM large_table
)
```

### Window Functions

Calculates a value across a set of rows related to the current row — without collapsing rows like `GROUP BY` does. The `OVER (...)` clause defines the window.

```sql
SELECT
    department,
    employee_name,
    salary,

    -- Rank within department (ties get same rank, gap after)
    RANK()       OVER (PARTITION BY department ORDER BY salary DESC) AS rank,

    -- Rank without gaps
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank,

    -- Position (no ties, arbitrary order for ties)
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS row_num,

    -- Running total within department
    SUM(salary)  OVER (PARTITION BY department ORDER BY salary DESC
                       ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,

    -- Average salary of the 3 rows before and after (moving average)
    AVG(salary)  OVER (PARTITION BY department ORDER BY salary
                       ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING) AS moving_avg,

    -- Access adjacent rows
    LAG(salary, 1)  OVER (PARTITION BY department ORDER BY salary) AS prev_salary,
    LEAD(salary, 1) OVER (PARTITION BY department ORDER BY salary) AS next_salary,

    -- First/last value in the window
    FIRST_VALUE(salary) OVER (PARTITION BY department ORDER BY salary DESC) AS top_salary
FROM employees;
```

**Key concepts:**
- `PARTITION BY` — resets the window for each group (like `GROUP BY` but keeps all rows)
- `ORDER BY` inside `OVER` — defines row order within the window (not the final output order)
- `ROWS BETWEEN` — controls the frame: which rows in the partition are included in the calculation

**Use case — deduplicate keeping latest:**

```sql
-- Keep only the most recent record per user
WITH ranked AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
    FROM events
)
DELETE FROM events WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
```

### LATERAL Joins

A subquery in `FROM` that can reference columns from tables listed before it. Like a `forEach` — for each outer row, the subquery runs with that row's values.

```sql
-- Get the 3 most recent anomalies for each city
SELECT c.name, a.status, a.created_at
FROM cities c
LEFT JOIN LATERAL (
    SELECT status, created_at
    FROM anomaly_routes
    WHERE city_id = c.id          -- references c.id from the outer query
    ORDER BY created_at DESC
    LIMIT 3
) a ON true;
```

Without `LATERAL`, the subquery in `FROM` cannot see `c.id`. `LATERAL` lifts that restriction.

**Use case — calling a function per row:**

```sql
SELECT u.email, stats.*
FROM users u
CROSS JOIN LATERAL get_user_stats(u.id) AS stats;
```

### Subqueries

```sql
-- Scalar subquery (returns one value)
SELECT name, (SELECT COUNT(*) FROM orders WHERE user_id = u.id) AS order_count
FROM users u;

-- EXISTS (short-circuits on first match — faster than IN for large sets)
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total > 1000);

-- NOT EXISTS
SELECT * FROM users u
WHERE NOT EXISTS (SELECT 1 FROM bans b WHERE b.email = u.email);

-- IN vs ANY
WHERE id IN (1, 2, 3)
WHERE id = ANY(ARRAY[1, 2, 3])  -- equivalent, ANY is more flexible
```

**Hidden: `IN` vs `EXISTS` performance**

For large subquery results, `EXISTS` is almost always faster — it stops scanning as soon as it finds one match. `IN` materializes the entire subquery result first.

---

## 6. String Functions

### Concatenation

```sql
-- || operator: returns NULL if either operand is NULL
SELECT name || ', ' || country AS location FROM cities;

-- CONCAT: silently skips NULLs — safer when columns might be null
SELECT CONCAT(name, ', ', country) AS location FROM cities;

-- CONCAT_WS: concat with separator — skips NULLs automatically
SELECT CONCAT_WS(', ', name, sub_area, area) AS full_address FROM anomaly_routes;
-- If sub_area is NULL: 'Dhaka, Gulshan' (no double comma)
```

### Case and Padding

```sql
SELECT UPPER(name)    FROM cities;   -- 'DHAKA'
SELECT LOWER(name)    FROM cities;   -- 'dhaka'
SELECT INITCAP(name)  FROM cities;   -- 'Dhaka' (capitalizes each word)

SELECT LPAD('7', 3, '0');   -- '007' — pad left to length 3
SELECT RPAD('hi', 5, '.');  -- 'hi...' — pad right
```

### Trimming and Searching

```sql
SELECT TRIM('  hello  ');           -- 'hello'
SELECT LTRIM('  hello  ');          -- 'hello  '
SELECT RTRIM('  hello  ');          -- '  hello'
SELECT TRIM(BOTH 'x' FROM 'xxhixx');-- 'hi'

SELECT LENGTH('hello');             -- 5
SELECT CHAR_LENGTH('hello');        -- 5 (same, but counts Unicode characters)

SELECT POSITION('lo' IN 'hello');   -- 4 (1-indexed)
SELECT STRPOS('hello', 'lo');       -- 4 (same)

SELECT SUBSTRING('hello' FROM 2 FOR 3); -- 'ell'
SELECT LEFT('hello', 3);               -- 'hel'
SELECT RIGHT('hello', 3);              -- 'llo'
```

### Replace and Format

```sql
SELECT REPLACE('hello world', 'world', 'postgres'); -- 'hello postgres'

-- REGEXP_REPLACE: regex-based replace
SELECT REGEXP_REPLACE('abc123', '[0-9]+', 'NUM');   -- 'abcNUM'

-- FORMAT: sprintf-style
SELECT FORMAT('User %s has %s points', 'Sourav', 42); -- 'User Sourav has 42 points'
SELECT FORMAT('INSERT INTO %I VALUES (%L)', 'users', 'O''Brien'); -- safe quoting
-- %I = identifier (quoted if needed), %L = literal (quoted safely)
```

### Math Operators

| Operator | Meaning        | Example               |
| -------- | -------------- | --------------------- |
| `+`, `-`, `*`, `/` | Arithmetic | Standard              |
| `%`      | Modulo         | `7 % 3` → `1`        |
| `^`      | Exponent       | `2^10` → `1024`      |
| `\|/`    | Square root    | `\|/25.0` → `5`      |
| `\|\|/`  | Cube root      | `\|\|/27.0` → `3`    |
| `@`      | Absolute value | `@ -5` → `5`         |
| `!`      | Factorial      | `5!` → `120`         |

```sql
-- Population density
SELECT name, country, |/population/area AS density FROM cities;

-- Rounding
SELECT ROUND(3.14159, 2);   -- 3.14
SELECT CEIL(3.1);            -- 4
SELECT FLOOR(3.9);           -- 3
SELECT TRUNC(3.9);           -- 3 (towards zero)
```

---

## 7. Indexing & Performance

An index lets Postgres jump directly to matching rows instead of scanning the entire table (Sequential Scan). The trade-off: indexes speed up reads but slow down writes slightly (the index must be updated too).

### Index Types

| Type        | Use when                                                               |
| ----------- | ---------------------------------------------------------------------- |
| **B-Tree**  | Default. Equality (`=`), ranges (`<`, `>`, `BETWEEN`), `ORDER BY`     |
| **Hash**    | Only equality (`=`). Slightly faster than B-tree for pure lookups      |
| **GIN**     | JSONB, arrays, full-text search — when a column contains multiple values |
| **GiST**    | Geometric/spatial data (PostGIS), range types, full-text search        |
| **BRIN**    | Very large tables where values correlate with physical storage order (e.g., time-series append-only tables). Tiny index, less precise. |
| **SP-GiST** | Non-balanced tree structures — IP ranges, phone numbers, geometric points |

```sql
-- B-tree (default)
CREATE INDEX idx_status ON anomaly_routes(status);

-- Composite index: useful for queries filtering on both columns
CREATE INDEX idx_city_status ON anomaly_routes(city_id, status);
-- Can also serve queries filtering on city_id alone (leftmost prefix)
-- Cannot serve queries filtering on status alone

-- Partial index: only index rows that match a condition
CREATE INDEX idx_pending ON anomaly_routes(id)
    WHERE status = 'PENDING_APPROVAL';
-- Tiny, fast — only the pending rows. Other status values aren't indexed here.

-- Expression index: index on a computed value
CREATE INDEX idx_lower_email ON users(LOWER(email));
-- Makes WHERE LOWER(email) = 'sourav@example.com' use the index

-- Covering index: include extra columns so queries don't hit the table at all
CREATE INDEX idx_status_covering ON anomaly_routes(status)
    INCLUDE (city_id, created_at);
-- A query SELECT city_id, created_at WHERE status = '...' is satisfied entirely by the index

-- GIN for JSONB
CREATE INDEX idx_metadata ON routes USING GIN (metadata);

-- Unique index (also enforces constraint)
CREATE UNIQUE INDEX idx_unique_email ON users(email);

-- Concurrent index build: doesn't lock the table (takes longer)
CREATE INDEX CONCURRENTLY idx_slow ON large_table(column);
```

### EXPLAIN ANALYZE

The most important tool for diagnosing slow queries. Always use it before adding an index.

```sql
EXPLAIN ANALYZE
SELECT * FROM anomaly_routes WHERE status = 'PENDING_APPROVAL' AND city_id = 5;
```

**Reading the output:**
- `Seq Scan` — full table scan. Fine for small tables; bad for large ones.
- `Index Scan` — used an index. Good.
- `Index Only Scan` — satisfied entirely from the index (no table hit). Best.
- `Bitmap Heap Scan` — used index to find pages, then fetched rows. Common for range queries.
- `Hash Join`, `Nested Loop`, `Merge Join` — join strategies. Nested Loop is fast for small sets; Hash Join for larger.
- `cost=0.00..123.45` — estimated cost. `rows=500` — estimated row count.
- `actual time=0.023..1.45` — real execution time. `rows=500 loops=1` — real row count.

**Hidden: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`**

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON)
SELECT * FROM anomaly_routes WHERE city_id = 5;
```

`BUFFERS` shows cache hits vs disk reads — crucial for diagnosing I/O bottlenecks. `FORMAT JSON` is parseable by `pgAdmin` and other tools.

### Vacuuming and Table Bloat

Postgres uses MVCC — deleted/updated rows aren't physically removed immediately, just marked dead. `VACUUM` reclaims that space.

```sql
-- Manual vacuum (reclaim dead rows)
VACUUM anomaly_routes;

-- Vacuum + rewrite table (reclaims space to OS, locks table briefly)
VACUUM FULL anomaly_routes;

-- Analyze: update statistics used by the query planner
ANALYZE anomaly_routes;

-- Both together:
VACUUM ANALYZE anomaly_routes;
```

`autovacuum` does this automatically. If you see query plans suddenly getting worse on a table with lots of updates/deletes, check if autovacuum is keeping up:

```sql
SELECT relname, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

---

## 8. Transactions and Concurrency

A transaction makes a group of statements all-or-nothing. If any step fails, the whole thing rolls back — the database is left exactly as it was before.

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;   -- both happen
-- or ROLLBACK; -- neither happens
```

### Isolation Levels

Different transactions can interfere with each other. Isolation levels control what a transaction is allowed to see.

| Level              | Dirty Read | Non-Repeatable Read | Phantom Read | Use when                                    |
| ------------------ | ---------- | ------------------- | ------------ | ------------------------------------------- |
| `READ UNCOMMITTED` | Possible   | Possible            | Possible     | Not supported by Postgres (treated as READ COMMITTED) |
| `READ COMMITTED`   | No         | Possible            | Possible     | Default. Fine for most operations           |
| `REPEATABLE READ`  | No         | No                  | No*          | Reports, consistent snapshots               |
| `SERIALIZABLE`     | No         | No                  | No           | Financial transactions, strict correctness  |

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- All reads in this transaction see the same snapshot
SELECT SUM(balance) FROM accounts;  -- consistent even if others update concurrently
COMMIT;
```

### MVCC (Multi-Version Concurrency Control)

Postgres's core concurrency model. Each transaction sees a **snapshot** of the database at the moment it started. Readers never block writers; writers never block readers. Old row versions are kept until `VACUUM` cleans them up.

This is why `SELECT` never blocks on a heavy `UPDATE` — they see different versions of the same rows.

### SAVEPOINT

Partial rollback within a transaction. The outer transaction can still commit.

```sql
BEGIN;
INSERT INTO logs (message) VALUES ('started');

SAVEPOINT before_delete;
DELETE FROM sessions WHERE expired = true;

-- Something went wrong — undo just the DELETE
ROLLBACK TO SAVEPOINT before_delete;

-- The INSERT is still live
COMMIT;  -- only the INSERT happens
```

### Locking

Postgres has automatic locking. Most of the time you don't manage it manually. But sometimes you need explicit control.

```sql
-- Row-level lock: lock specific rows for update (blocks other updaters, not readers)
SELECT * FROM anomaly_routes WHERE id = 42 FOR UPDATE;

-- Skip locked rows (useful for job queues — multiple workers, no contention)
SELECT * FROM jobs WHERE status = 'pending' LIMIT 1
FOR UPDATE SKIP LOCKED;

-- Advisory locks: application-level named locks (not tied to a table)
SELECT pg_advisory_lock(12345);       -- blocks until lock acquired
SELECT pg_try_advisory_lock(12345);   -- returns false immediately if locked
SELECT pg_advisory_unlock(12345);     -- release
```

**`FOR UPDATE SKIP LOCKED` use case:**

```sql
-- Worker picks one job without colliding with other workers
BEGIN;
SELECT id FROM jobs WHERE status = 'pending' LIMIT 1 FOR UPDATE SKIP LOCKED;
UPDATE jobs SET status = 'processing' WHERE id = :picked_id;
COMMIT;
```

---

## 9. Programmability: Functions & Triggers

### Stored Functions

Reusable logic that lives inside the database. Runs on the server — no network round-trip for each operation.

```sql
CREATE OR REPLACE FUNCTION upsert_contribution(
    p_email  VARCHAR,
    p_table  VARCHAR,
    p_status VARCHAR,
    p_delta  INTEGER
) RETURNS VOID AS $$
BEGIN
    -- Guard: skip nulls and the initial REPORTED status
    IF p_email IS NULL OR p_status = 'REPORTED' THEN
        RETURN;
    END IF;

    INSERT INTO user_contributions (
        email, contribution_table,
        pending_approval, system_approved, rejected
    )
    VALUES (
        p_email, p_table,
        CASE WHEN p_status = 'PENDING_APPROVAL' THEN p_delta ELSE 0 END,
        CASE WHEN p_status = 'SYSTEM_APPROVED'  THEN p_delta ELSE 0 END,
        CASE WHEN p_status = 'REJECTED'         THEN p_delta ELSE 0 END
    )
    ON CONFLICT (email, contribution_table) DO UPDATE SET
        pending_approval = user_contributions.pending_approval + EXCLUDED.pending_approval,
        system_approved  = user_contributions.system_approved  + EXCLUDED.system_approved,
        rejected         = user_contributions.rejected         + EXCLUDED.rejected,
        updated_at       = NOW();
END;
$$ LANGUAGE plpgsql;
```

**Key syntax:**
- `$$` — dollar-quoting. Lets you write single quotes inside the body without escaping. You can use any label: `$body$`, `$func$`.
- `LANGUAGE plpgsql` — PL/pgSQL: Postgres's procedural language. Supports `IF`, `LOOP`, `RAISE`, variables, cursors.
- `RETURNS VOID` — the function performs side effects and returns nothing.
- `PERFORM expr` — like `SELECT` but discards the result. Use when calling a void function or a query whose result you don't need:

```sql
PERFORM upsert_contribution(OLD.resolved_by, TG_TABLE_NAME::VARCHAR, OLD.status, -1);
```

**Functions that return a value:**

```sql
CREATE OR REPLACE FUNCTION get_anomaly_count(p_city_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM anomaly_routes
    WHERE city_id = p_city_id AND status = 'PENDING_APPROVAL';

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Call it:
SELECT get_anomaly_count(5);
```

**Functions that return a table:**

```sql
CREATE OR REPLACE FUNCTION get_user_anomalies(p_email TEXT)
RETURNS TABLE (id INTEGER, status VARCHAR, created_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
        SELECT ar.id, ar.status, ar.created_at
        FROM anomaly_routes ar
        WHERE ar.resolved_by = p_email;
END;
$$ LANGUAGE plpgsql;

-- Use it like a table:
SELECT * FROM get_user_anomalies('sourav@example.com');
```

**Error handling with `RAISE`:**

```sql
IF p_delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'delta must be +1 or -1, got: %', p_delta;
END IF;

RAISE NOTICE 'Processing user: %', p_email;  -- informational, not an error
RAISE WARNING 'Score is unusually high: %', v_score;
```

### Triggers

A trigger fires automatically when a table event occurs. The trigger function must be defined first, then the trigger attachment.

```sql
CREATE OR REPLACE FUNCTION fn_update_user_contributions()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Undo credit for the old row state
        PERFORM upsert_contribution(OLD.resolved_by, TG_TABLE_NAME::VARCHAR, OLD.status, -1);
        -- Apply credit for the new row state
        PERFORM upsert_contribution(NEW.resolved_by, TG_TABLE_NAME::VARCHAR, NEW.status, +1);
        RETURN NEW;
    END IF;

    -- Always return NEW (or OLD for BEFORE DELETE)
    -- Returning NULL from a BEFORE trigger cancels the operation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Built-in trigger variables — available automatically, no declaration needed:**

| Variable         | Value                                                      |
| ---------------- | ---------------------------------------------------------- |
| `TG_OP`          | `'INSERT'`, `'UPDATE'`, `'DELETE'`, `'TRUNCATE'`           |
| `TG_TABLE_NAME`  | Name of the table that fired the trigger                   |
| `TG_TABLE_SCHEMA`| Schema of the table                                        |
| `TG_NAME`        | Name of the trigger itself                                 |
| `TG_WHEN`        | `'BEFORE'` or `'AFTER'`                                    |
| `TG_LEVEL`       | `'ROW'` or `'STATEMENT'`                                   |
| `NEW`            | The new row (after INSERT/UPDATE) — NULL on DELETE         |
| `OLD`            | The old row (before UPDATE/DELETE) — NULL on INSERT        |

**Attaching a trigger:**

```sql
-- Column-level firing: only fires when `status` is actually changed
CREATE TRIGGER trg_user_contributions
AFTER UPDATE OF status ON anomaly_routes
FOR EACH ROW
EXECUTE FUNCTION fn_update_user_contributions();
```

`AFTER UPDATE OF status` is more precise than `AFTER UPDATE` — if someone updates `resolved_at` only, this trigger doesn't fire. This avoids unnecessary work.

**Same function, multiple tables:**

```sql
CREATE TRIGGER trg_user_contributions_missing_routes
AFTER UPDATE OF status ON missing_routes
FOR EACH ROW
EXECUTE FUNCTION fn_update_user_contributions();
```

Inside the function, `TG_TABLE_NAME` returns `'anomaly_routes'` or `'missing_routes'` depending on which table fired it — the same function works for both.

**BEFORE vs AFTER triggers:**

| Timing   | Use when                                                                           |
| -------- | ---------------------------------------------------------------------------------- |
| `BEFORE` | Modify or validate the row before it's written. Return `NULL` to cancel the write. |
| `AFTER`  | React to changes after they're committed to the table. Can't cancel the operation. |
| `INSTEAD OF` | On views — replace the default behavior of INSERT/UPDATE/DELETE on a view.   |

**Statement-level trigger (fires once per statement, not once per row):**

```sql
CREATE TRIGGER trg_audit_bulk_update
AFTER UPDATE ON anomaly_routes
FOR EACH STATEMENT
EXECUTE FUNCTION fn_log_bulk_operation();
-- Fires once even if 10,000 rows were updated
```

**Conditional trigger with WHEN:**

```sql
-- Only fire when status actually changes value (not just any UPDATE)
CREATE TRIGGER trg_status_change
AFTER UPDATE OF status ON anomaly_routes
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION fn_update_user_contributions();
```

`IS DISTINCT FROM` handles NULLs correctly — `NULL IS DISTINCT FROM 'REPORTED'` is `true`.

---

## 10. Security & Access Control

### Row-Level Security (RLS)

Enforces data isolation at the database level. Even if your backend has a bug, a user can never read another user's rows — Postgres appends the policy as a `WHERE` clause to every query.

```sql
ALTER TABLE user_contributions ENABLE ROW LEVEL SECURITY;

-- Users see only their own rows
CREATE POLICY own_rows ON user_contributions
    USING (email = current_setting('app.current_user_email'));
```

Every `SELECT`, `UPDATE`, `DELETE` on `user_contributions` now automatically has `WHERE email = current_setting('app.current_user_email')` applied.

### What is `current_setting('app.current_user_email')`?

It reads a **session-level variable** that your backend sets immediately after acquiring a connection from the pool. Postgres lets you store arbitrary key-value pairs on the session with `SET`. The `app.` prefix is just a convention — it avoids clashing with built-in Postgres settings.

**Why not use `current_user` (the DB login role)?**

In most web apps, all requests share one database role (e.g. `app_user`). Postgres only sees one DB user — it has no idea which of your 10,000 application users is making the request. So you inject the identity yourself:

**End-to-end flow:**

```sql
-- Backend runs this right after getting a connection:
SET app.current_user_email = 'sourav@example.com';

-- RLS reads it on every query automatically:
CREATE POLICY own_rows ON user_contributions
    USING (email = current_setting('app.current_user_email'));

-- This query now silently becomes:
-- SELECT * FROM user_contributions WHERE email = 'sourav@example.com'
SELECT * FROM user_contributions;
```

**In TypeScript/Node.js:**

```ts
const client = await pool.connect();
await client.query(`SET app.current_user_email = $1`, [session.userEmail]);
// all queries on this client are now RLS-filtered to that user
```

**Gotcha with connection pools — use `SET LOCAL`:**

Pooled connections are reused across requests. Without resetting, the next request could inherit the previous user's identity. `SET LOCAL` automatically clears the variable at transaction end:

```sql
BEGIN;
SET LOCAL app.current_user_email = 'sourav@example.com';
SELECT * FROM user_contributions; -- filtered to sourav
COMMIT;
-- after COMMIT, app.current_user_email is gone from this session
```

Always use `SET LOCAL` inside a transaction in pooled environments.

### RLS Using Email (not integer ID)

Yes — you can use any column as the identity. Since your schema uses `email` as the natural identity:

```sql
-- No ::INT cast needed — both sides are TEXT/VARCHAR
CREATE POLICY own_contributions ON user_contributions
    USING (email = current_setting('app.current_user_email'));

-- For INSERT: WITH CHECK controls what new rows are allowed
CREATE POLICY insert_own ON user_contributions
    FOR INSERT
    WITH CHECK (email = current_setting('app.current_user_email'));

-- Separate policies per operation:
CREATE POLICY select_own ON user_contributions FOR SELECT
    USING (email = current_setting('app.current_user_email'));

CREATE POLICY update_own ON user_contributions FOR UPDATE
    USING (email = current_setting('app.current_user_email'));
```

**`USING` vs `WITH CHECK`:**
- `USING` — filters which rows are visible/modifiable (applied to `SELECT`, `UPDATE`, `DELETE`)
- `WITH CHECK` — validates rows being written (applied to `INSERT`, `UPDATE`) — the new row must satisfy this condition or Postgres rejects it

### Admin Bypass

You often want RLS for your API-facing role but not for internal admin/service roles:

```sql
-- App role: RLS applies
GRANT SELECT, INSERT, UPDATE ON user_contributions TO app_user;

-- Service/admin role: bypasses all RLS policies
ALTER ROLE service_role BYPASSRLS;
```

Or allow admins through in the policy itself:

```sql
CREATE POLICY own_or_admin ON user_contributions
    USING (
        email = current_setting('app.current_user_email')
        OR current_setting('app.current_user_role') = 'admin'
    );
```

**Hidden: table owner bypasses RLS by default**

The table owner is not subject to RLS unless you explicitly enable it:

```sql
ALTER TABLE user_contributions FORCE ROW LEVEL SECURITY;
-- Now the owner is also subject to policies
```

### Roles and Privileges

```sql
-- Create a role (like a user)
CREATE ROLE app_user LOGIN PASSWORD 'secret';
CREATE ROLE readonly_user LOGIN PASSWORD 'secret';

-- Grant privileges
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON anomaly_routes TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- Grant privilege on future tables too
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO readonly_user;

-- Revoke
REVOKE DELETE ON anomaly_routes FROM app_user;
```

---

## 11. NULL Semantics — The Biggest Source of Silent Bugs

NULL means **unknown** — not zero, not empty string, not false. This single distinction causes more subtle bugs than almost anything else in SQL.

### NULL is not equal to anything — including itself

```sql
SELECT NULL = NULL;    -- NULL (not TRUE)
SELECT NULL != NULL;   -- NULL (not FALSE)
SELECT NULL = 'hello'; -- NULL

-- The only correct way to check for NULL:
SELECT * FROM anomaly_routes WHERE resolved_by IS NULL;
SELECT * FROM anomaly_routes WHERE resolved_by IS NOT NULL;

-- IS DISTINCT FROM: NULL-safe equality (treats NULL = NULL as TRUE)
SELECT NULL IS DISTINCT FROM NULL;   -- FALSE  (they are not distinct)
SELECT NULL IS DISTINCT FROM 'x';    -- TRUE
SELECT 'x' IS DISTINCT FROM 'x';     -- FALSE
```

Use `IS DISTINCT FROM` in trigger `WHEN` clauses where either value could be NULL:

```sql
WHEN (OLD.status IS DISTINCT FROM NEW.status)  -- safe
-- vs:
WHEN (OLD.status != NEW.status)                -- wrong: NULL != 'REPORTED' = NULL = falsy
```

### NULL propagates through expressions

Any arithmetic or string operation with NULL produces NULL:

```sql
SELECT 1 + NULL;          -- NULL
SELECT 'hello' || NULL;   -- NULL  ← this is why CONCAT is safer than ||
SELECT NULL > 5;          -- NULL  ← not FALSE
```

### NULL in WHERE — the trap

```sql
-- These rows are EXCLUDED even though they have a status value:
SELECT * FROM anomaly_routes WHERE status != 'REJECTED';
-- Rows where status IS NULL are not returned — NULL != 'REJECTED' = NULL = not true

-- Fix: explicitly include NULLs if you want them:
SELECT * FROM anomaly_routes WHERE status != 'REJECTED' OR status IS NULL;
```

### NULL in aggregates

`COUNT(*)` counts all rows. `COUNT(column)` counts non-NULL values only.

```sql
SELECT
    COUNT(*)            AS total_rows,      -- includes NULLs
    COUNT(resolved_by)  AS resolved_count,  -- excludes NULL resolved_by
    SUM(anomaly_rides_count)                -- NULL values are ignored
FROM anomaly_routes;

-- AVG also ignores NULLs — it's SUM/COUNT(non-null), not SUM/total_rows
SELECT AVG(score) FROM results;
-- If 3 of 10 rows have NULL score: AVG = SUM(7 scores) / 7, not / 10
```

### NOT IN with NULLs — the silent killer

```sql
-- This query returns NO rows if emails contains even one NULL:
SELECT * FROM users
WHERE email NOT IN (SELECT email FROM banned_users);
-- If banned_users has any NULL email: NOT IN (..., NULL) = NOT (... OR NULL) = NULL = always false

-- Safe alternative:
SELECT * FROM users u
WHERE NOT EXISTS (SELECT 1 FROM banned_users b WHERE b.email = u.email);
-- EXISTS ignores NULLs correctly
```

### COALESCE and NULLIF

```sql
-- COALESCE: return first non-NULL value
SELECT COALESCE(resolved_by, 'unassigned') FROM anomaly_routes;
SELECT COALESCE(NULL, NULL, 'third', 'fourth');  -- 'third'

-- Practical: safe division (avoid divide-by-zero)
SELECT total_rides / NULLIF(total_days, 0) AS rides_per_day;
-- NULLIF returns NULL when total_days = 0 → division returns NULL instead of error

-- NULLIF: return NULL when two values are equal
SELECT NULLIF(status, 'REPORTED');  -- returns NULL when status = 'REPORTED', else status
```

### NULL in CASE

```sql
-- CASE with no ELSE returns NULL implicitly:
CASE WHEN status = 'APPROVED' THEN 'yes' END
-- When status = 'REJECTED': returns NULL (no ELSE)

-- Be explicit:
CASE WHEN status = 'APPROVED' THEN 'yes' ELSE 'no' END
```

---

## 12. Date & Time Functions

Postgres has the richest date/time support of any SQL database. Since you use `TIMESTAMPTZ` everywhere, this section is critical.

### Current Time

```sql
SELECT NOW();                  -- 2026-04-11 10:30:00+06 (transaction start time, with timezone)
SELECT CURRENT_TIMESTAMP;      -- same as NOW()
SELECT CURRENT_DATE;           -- 2026-04-11
SELECT CURRENT_TIME;           -- 10:30:00+06
SELECT clock_timestamp();      -- real wall-clock time, advances mid-transaction
SELECT LOCALTIME;              -- current time without timezone
SELECT LOCALTIMESTAMP;         -- current timestamp without timezone
```

### Truncating — Group by Time Period

`DATE_TRUNC` is essential for time-series aggregations:

```sql
-- Truncate to the start of the containing period:
SELECT DATE_TRUNC('hour',  '2026-04-11 10:47:32+06');  -- 2026-04-11 10:00:00+06
SELECT DATE_TRUNC('day',   '2026-04-11 10:47:32+06');  -- 2026-04-11 00:00:00+06
SELECT DATE_TRUNC('week',  '2026-04-11 10:47:32+06');  -- 2026-04-07 (Monday)
SELECT DATE_TRUNC('month', '2026-04-11 10:47:32+06');  -- 2026-04-01 00:00:00+06
SELECT DATE_TRUNC('year',  '2026-04-11 10:47:32+06');  -- 2026-01-01 00:00:00+06

-- Count anomalies per day:
SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*) AS count
FROM anomaly_routes
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day;

-- Count per hour of day (extract the hour, group across all days):
SELECT EXTRACT(hour FROM created_at) AS hour, COUNT(*) AS count
FROM anomaly_routes
GROUP BY hour
ORDER BY hour;
```

### Extracting Parts

```sql
SELECT EXTRACT(year   FROM created_at) FROM anomaly_routes;  -- 2026
SELECT EXTRACT(month  FROM created_at) FROM anomaly_routes;  -- 4
SELECT EXTRACT(day    FROM created_at) FROM anomaly_routes;  -- 11
SELECT EXTRACT(hour   FROM created_at) FROM anomaly_routes;  -- 10
SELECT EXTRACT(dow    FROM created_at) FROM anomaly_routes;  -- 0=Sunday..6=Saturday
SELECT EXTRACT(epoch  FROM created_at) FROM anomaly_routes;  -- Unix timestamp (seconds)
SELECT EXTRACT(epoch  FROM NOW() - created_at)              -- age in seconds

-- DATE_PART is equivalent (older syntax):
SELECT DATE_PART('month', created_at) FROM anomaly_routes;
```

### Intervals — Arithmetic on Timestamps

```sql
-- Add/subtract intervals:
SELECT NOW() + INTERVAL '1 day';
SELECT NOW() - INTERVAL '3 months';
SELECT NOW() + INTERVAL '1 year 2 months 3 days';
SELECT NOW() - INTERVAL '90 minutes';
SELECT created_at + INTERVAL '7 days' AS expires_at FROM sessions;

-- INTERVAL from a number:
SELECT NOW() + (5 || ' days')::INTERVAL;   -- dynamic interval from a variable

-- Difference between two timestamps:
SELECT resolved_at - created_at AS resolution_time FROM anomaly_routes;
-- Returns an INTERVAL, e.g., '2 days 04:30:00'

-- Difference in specific units:
SELECT EXTRACT(epoch FROM (resolved_at - created_at)) / 3600 AS hours_to_resolve
FROM anomaly_routes WHERE resolved_at IS NOT NULL;
```

### AGE — Human-readable difference

```sql
SELECT AGE(NOW(), created_at) AS age FROM anomaly_routes;
-- '3 mons 5 days 04:30:00'

SELECT AGE('2026-04-11', '2025-12-01');
-- '4 mons 10 days'
```

### Timezone Conversion

```sql
-- Convert stored UTC to a display timezone:
SELECT created_at AT TIME ZONE 'Asia/Dhaka' FROM anomaly_routes;
SELECT created_at AT TIME ZONE 'Asia/Dhaka' AT TIME ZONE 'UTC' FROM anomaly_routes;

-- Set session timezone (all timestamps display in this zone):
SET timezone = 'Asia/Dhaka';
SET timezone = 'UTC';

-- List all available timezone names:
SELECT * FROM pg_timezone_names WHERE name LIKE 'Asia/%';
```

### Common Patterns

```sql
-- Rows from the last 7 days:
SELECT * FROM anomaly_routes WHERE created_at > NOW() - INTERVAL '7 days';

-- Rows from today (in a specific timezone):
SELECT * FROM anomaly_routes
WHERE DATE_TRUNC('day', created_at AT TIME ZONE 'Asia/Dhaka') =
      DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Dhaka');

-- Format a timestamp as a string:
SELECT TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') FROM anomaly_routes;
SELECT TO_CHAR(created_at, 'Day, DD Month YYYY') FROM anomaly_routes;
-- 'Saturday, 11 April 2026'

-- Parse a string to timestamp:
SELECT TO_TIMESTAMP('11-04-2026 10:30', 'DD-MM-YYYY HH24:MI');
SELECT '2026-04-11'::DATE;
SELECT '2026-04-11 10:30:00+06'::TIMESTAMPTZ;

-- First and last day of current month:
SELECT DATE_TRUNC('month', NOW()) AS first_day;
SELECT DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day' AS last_day;
```

---

## 13. COPY — Bulk Loading and Exporting Data

For loading or exporting large amounts of data, `COPY` is 10–100x faster than `INSERT`. It bypasses the query parser and executor overhead for each row.

### COPY FROM — Loading Data

```sql
-- Load from a CSV file (runs on the server, must be accessible by postgres OS user):
COPY anomaly_routes (city_id, status, created_at)
FROM '/var/data/anomalies.csv'
WITH (FORMAT CSV, HEADER true, DELIMITER ',', NULL '');

-- Options:
-- FORMAT: CSV, TEXT, BINARY
-- HEADER: skip first line
-- DELIMITER: column separator (default tab for TEXT, comma for CSV)
-- NULL: string that represents NULL ('', 'NULL', '\N')
-- QUOTE: quote character for CSV (default ")
-- ESCAPE: escape character (default same as QUOTE)
```

### \COPY — Client-side (use this in practice)

`COPY` reads from the **server's** filesystem. `\COPY` (psql meta-command) reads from the **client's** filesystem — what you almost always want:

```sql
-- In psql: loads from your local machine
\COPY anomaly_routes (city_id, status) FROM 'local_file.csv' CSV HEADER;

-- Export to local file:
\COPY (SELECT * FROM anomaly_routes WHERE status = 'PENDING_APPROVAL') TO 'export.csv' CSV HEADER;
```

### COPY TO — Exporting Data

```sql
-- Export whole table:
COPY anomaly_routes TO '/var/data/backup.csv' WITH (FORMAT CSV, HEADER true);

-- Export a query result:
COPY (
    SELECT ar.id, ar.status, c.name AS city
    FROM anomaly_routes ar
    JOIN cities c ON ar.city_id = c.id
    WHERE ar.created_at > '2026-01-01'
) TO '/var/data/q1_anomalies.csv' WITH (FORMAT CSV, HEADER true);
```

### COPY with STDIN/STDOUT — Piping

```bash
# Pipe data directly (useful for backups and migrations):
psql -c "COPY anomaly_routes TO STDOUT CSV HEADER" > anomalies.csv

# Load from pipe:
cat anomalies.csv | psql -c "COPY anomaly_routes FROM STDIN CSV HEADER"

# Cross-database transfer without a temp file:
psql source_db -c "COPY anomaly_routes TO STDOUT" | psql target_db -c "COPY anomaly_routes FROM STDIN"
```

### Performance Tips for Bulk Load

```sql
-- Fastest bulk load pattern:
BEGIN;

-- 1. Disable triggers temporarily (if you know data is clean)
ALTER TABLE anomaly_routes DISABLE TRIGGER ALL;

-- 2. Drop indexes before load, rebuild after (faster than maintaining them during load)
DROP INDEX idx_status;
COPY anomaly_routes FROM '/data/large_file.csv' CSV HEADER;
CREATE INDEX idx_status ON anomaly_routes(status);

-- 3. Re-enable triggers
ALTER TABLE anomaly_routes ENABLE TRIGGER ALL;

COMMIT;

-- 4. Update statistics after large load:
ANALYZE anomaly_routes;
```

For truly massive loads (tens of millions of rows), also set:
```sql
SET synchronous_commit = off;  -- don't fsync WAL per transaction (risky but fast)
SET maintenance_work_mem = '2GB';  -- more memory for index builds
```

---

## 14. PostgreSQL Superpowers

### Full-Text Search

Built-in search with stemming, ranking, and phrase support. Often replaces Elasticsearch for basic use cases.

```sql
-- tsvector: preprocessed search tokens
-- to_tsvector parses text into lexemes (stems), removes stop words
SELECT to_tsvector('english', 'The quick brown fox jumped');
-- 'brown':3 'fox':4 'jump':5 'quick':2

-- tsquery: search query
SELECT to_tsquery('english', 'jump & fox');   -- AND
SELECT to_tsquery('english', 'jump | fox');   -- OR
SELECT to_tsquery('english', 'jump & !fox');  -- AND NOT
SELECT phraseto_tsquery('english', 'quick fox'); -- phrase match

-- Search:
SELECT * FROM articles
WHERE to_tsvector('english', title || ' ' || body) @@ to_tsquery('english', 'anomaly & route');

-- Rank results (higher = more relevant):
SELECT title, ts_rank(search_vector, query) AS rank
FROM articles, to_tsquery('english', 'anomaly') query
WHERE search_vector @@ query
ORDER BY rank DESC;

-- Index for fast search (use generated column + GIN):
ALTER TABLE articles ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED;
CREATE INDEX ON articles USING GIN (search_vector);
```

### JSONB Operators

```sql
-- Access
data -> 'key'           -- returns JSONB
data ->> 'key'          -- returns TEXT
data -> 'a' -> 'b'      -- nested
data #> '{a,b}'         -- nested path, returns JSONB
data #>> '{a,b}'        -- nested path, returns TEXT

-- Existence and containment
data ? 'key'             -- does key exist?
data ?| ARRAY['a','b']   -- does any key exist?
data ?& ARRAY['a','b']   -- do all keys exist?
data @> '{"status":"active"}'  -- does data contain this subset?
'{"status":"active"}' <@ data  -- is this a subset of data?

-- Modify
data || '{"newkey": 1}'::jsonb  -- merge/overwrite
data - 'key'                    -- remove key
data #- '{a,b}'                 -- remove nested key

-- Expand JSONB array to rows
SELECT * FROM jsonb_array_elements('[1,2,3]'::jsonb);
-- Expand JSONB object to key-value rows
SELECT * FROM jsonb_each('{"a":1,"b":2}'::jsonb);
```

### LISTEN / NOTIFY

Turns Postgres into a lightweight pub/sub message broker. A trigger (or any SQL) publishes; your app subscribes.

```sql
-- Publisher: send a notification on status change
CREATE OR REPLACE FUNCTION notify_status_change() RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'anomaly_status_changed',
        json_build_object('id', NEW.id, 'status', NEW.status)::TEXT
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify
AFTER UPDATE OF status ON anomaly_routes
FOR EACH ROW EXECUTE FUNCTION notify_status_change();

-- Subscriber (in psql):
LISTEN anomaly_status_changed;
-- Notifications arrive as: Asynchronous notification "anomaly_status_changed" received
```

In Node.js with `pg`, use `client.on('notification', ...)` after `client.query('LISTEN channel')`.

Payload max size is 8000 bytes. For larger data, send only the row ID in the payload and fetch the full row separately.

### Foreign Data Wrappers (FDW)

Query tables in remote databases as if they're local.

```sql
-- Connect to another Postgres instance
CREATE EXTENSION postgres_fdw;

CREATE SERVER remote_db FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'other-host', dbname 'analytics', port '5432');

CREATE USER MAPPING FOR app_user SERVER remote_db
    OPTIONS (user 'remote_user', password 'secret');

IMPORT FOREIGN SCHEMA public
    FROM SERVER remote_db INTO local_schema;

-- Now query it like a local table:
SELECT * FROM local_schema.remote_table WHERE date > '2026-01-01';
```

### PostGIS — Geospatial Queries

```sql
CREATE EXTENSION postgis;

-- Store a geographic point (longitude, latitude order)
location GEOGRAPHY(POINT, 4326)

-- Insert
INSERT INTO locations (name, location)
VALUES ('Dhaka', ST_MakePoint(90.4125, 23.8103));

-- Distance in meters between two points
SELECT ST_Distance(
    'POINT(90.4125 23.8103)'::geography,
    'POINT(90.3938 23.7461)'::geography
);

-- Find all locations within 5km of a point
SELECT name FROM locations
WHERE ST_DWithin(
    location,
    ST_MakePoint(90.4125, 23.8103)::geography,
    5000   -- meters
);

-- Index for fast spatial queries
CREATE INDEX ON locations USING GIST (location);
```

### Useful System Functions

```sql
-- Current database info
SELECT current_database();
SELECT current_user;
SELECT version();

-- Table size
SELECT pg_size_pretty(pg_total_relation_size('anomaly_routes'));  -- includes indexes
SELECT pg_size_pretty(pg_relation_size('anomaly_routes'));         -- table only
SELECT pg_size_pretty(pg_indexes_size('anomaly_routes'));          -- indexes only

-- Find long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > INTERVAL '5 minutes';

-- Kill a query
SELECT pg_cancel_backend(pid);   -- graceful (sends SIGINT)
SELECT pg_terminate_backend(pid); -- forceful (sends SIGTERM)

-- Check index usage — find unused indexes
SELECT indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public';
-- Indexes with 0 scans are never used — they slow writes for no read benefit

-- Check table bloat (dead rows)
SELECT relname, n_dead_tup, n_live_tup,
       ROUND(n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 1) AS dead_pct
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- Sequence current value
SELECT last_value FROM users_id_seq;
-- Reset a sequence
ALTER SEQUENCE users_id_seq RESTART WITH 1000;
```
