## 1. `psql` Command-Line Meta-Commands

`psql` is the native, fastest, and most scriptable way to interact with PostgreSQL without relying on a GUI.

| Command | Action | Why use it? |
| --- | --- | --- |
| `\l` | List databases | To see all available environments on the server. |
| `\c db_name` | Connect to database | To switch context to a specific database. |
| `\dt` | List tables | To quickly view the tables in your current schema. |
| `\d table_name` | Describe table | To inspect columns, types, indexes, and constraints. |
| `\x` | Toggle expanded display | Formats wide tables vertically instead of horizontally for readability. |
| `\timing` | Toggle query timing | Shows exactly how many milliseconds a query took to execute. |

---

## 2. Advanced Data Types

PostgreSQL's strict and rich typing prevents bad data from entering your system and allows you to store complex structures natively.

| Type | Example | Why use it? |
| --- | --- | --- |
| **UUID** | `uuid` | Universally unique identifiers, great for distributed systems and hiding sequential IDs. |
| **JSONB** | `jsonb` | Binary JSON. Allows NoSQL document-store capabilities right inside a relational database with indexing. |
| **Array** | `text[]`, `int[]` | Store lists of items natively without needing a separate join table for simple one-to-many relationships. |
| **Enum** | `CREATE TYPE status AS ENUM ('draft', 'published');` | Enforces a strict set of allowed values, safer than standard strings. |
| **Range** | `int4range`, `tsrange` | Represents a range of values (e.g., meeting times). Excellent for preventing overlaps. |

---

## 3. Data Definition Language (DDL)

DDL defines the rigid structure, relationships, and rules (constraints) of your data, guaranteeing data integrity.

### Tables and Constraints

```sql
CREATE TABLE users (
    -- Identity is the modern, SQL-standard way to auto-increment over the old SERIAL type
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, 
    email VARCHAR(255) UNIQUE NOT NULL,
    age INT CHECK (age >= 18), -- Enforces business logic at the DB level
    created_at TIMESTAMPTZ DEFAULT NOW() -- Timezone-aware timestamp
);

```

### Table Partitioning

Splits massively large tables into smaller, manageable physical pieces behind the scenes, improving query and maintenance performance.

```sql
CREATE TABLE measurement (
    logdate date not null,
    peaktemp int,
    unitsales int
) PARTITION BY RANGE (logdate);

```

---

## 4. Data Manipulation Language (DML)

DML is how you safely mutate (Create, Update, Delete) your data.

### Insert with Returning

Eliminates the need to run a second `SELECT` query to get the ID of the row you just created.

```sql
INSERT INTO users (email, age) 
VALUES ('test@test.com', 25) 
RETURNING id, created_at;

```

### Upsert (Insert ON CONFLICT)

Handles race conditions gracefully. If a record exists, it updates it; if not, it inserts it—all in one atomic step.

```sql
INSERT INTO users (id, email) VALUES (1, 'new@test.com')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

```

---

## 5. Advanced Querying (DQL)

To extract, transform, and analyze relational data efficiently.

### Common Table Expressions (CTEs)

Breaks complex, nested subqueries into readable, reusable, step-by-step logic.

```sql
WITH ActiveUsers AS (
    SELECT id FROM users WHERE status = 'active'
),
UserOrders AS (
    SELECT user_id, SUM(total) as spend FROM orders GROUP BY user_id
)
SELECT * FROM ActiveUsers JOIN UserOrders ON ActiveUsers.id = UserOrders.user_id;

```

### Window Functions

Performs calculations across a set of rows related to the current row, without collapsing the rows like a `GROUP BY` does. Great for running totals and rankings.

```sql
SELECT 
    department, 
    employee_name, 
    salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank_in_dept
FROM employees;

```

### LATERAL Joins

Acts like a `foreach` loop in SQL. It allows a subquery in the `FROM` clause to reference columns from preceding tables.

```sql
SELECT u.name, recent_orders.total
FROM users u
LEFT JOIN LATERAL (
    SELECT total FROM orders WHERE user_id = u.id ORDER BY created_at DESC LIMIT 3
) recent_orders ON true;

```

---

## 6. Indexing & Performance

Indexes act like a book's glossary. Instead of scanning the whole table (Seq Scan), the database jumps straight to the relevant rows.

| Index Type | Command | Why use it? |
| --- | --- | --- |
| **B-Tree** | `CREATE INDEX idx_name ON users(name);` | The default. Best for exact matches and range queries (`<`, `>`, `=`). |
| **GIN** | `CREATE INDEX idx_json ON products USING GIN (details);` | Generalized Inverted Index. Essential for indexing JSONB, Arrays, and Full-Text Search. |
| **GiST** | `CREATE INDEX idx_loc ON stores USING GIST (geography);` | Best for geometric/spatial data (PostGIS) and overlapping ranges. |
| **Partial** | `CREATE INDEX idx_act ON users(id) WHERE active = true;` | Saves disk space and memory by only indexing rows that matter. |

**The ultimate performance tool:** Always prepend `EXPLAIN ANALYZE` to a slow query to see exactly how Postgres is executing it and where the bottlenecks are.

---

## 7. Transactions and Concurrency

Ensures ACID compliance. If a process requires multiple steps (e.g., deducting money from one account and adding to another), transactions guarantee either all steps happen, or none do.

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT; -- Or ROLLBACK if an error occurs

```

**MVCC (Multi-Version Concurrency Control):** This is a core feature of Postgres. It means "readers don't block writers, and writers don't block readers." Each transaction sees a snapshot of the database, preventing locking bottlenecks.

---

## 8. Programmability & Triggers

Keeps complex data logic close to the data itself, ensuring it runs reliably regardless of which backend API or application connects to the database.

```sql
-- 1. Create a function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Attach it to a trigger
CREATE TRIGGER update_user_modtime
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

```

---

## 9. Security & Access Control

Prevents unauthorized access and limits blast radius if an application is compromised.

### Row-Level Security (RLS)

The ultimate tool for multi-tenant applications (like SaaS). It enforces security at the database table level, ensuring User A can never query User B's data, even if the backend code has a bug.

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_policy ON documents
    USING (user_id = current_user_id());

```

---

## 10. The PostgreSQL "Superpowers"

These are specialized features that often prevent you from needing entirely separate database systems.

* **Full-Text Search:** Postgres has built-in search with stemming, dictionaries, and ranking. You often don't need Elasticsearch.
* **Foreign Data Wrappers (FDW):** Allows Postgres to connect to *other* databases (like MySQL, MongoDB, or another Postgres DB) and query their tables as if they were local.
* **LISTEN / NOTIFY:** Turns Postgres into a lightweight message broker (like RabbitMQ or Redis Pub/Sub). A trigger can `NOTIFY` a channel, and external applications can `LISTEN` for real-time updates.
* **PostGIS (Extension):** The gold standard for geospatial databases. Allows you to calculate distances, areas, and intersections of geographical coordinates.
