Whew, that is a massive request! PostgreSQL is famous for having one of the most robust and "extensible" sets of functions and operators in the SQL world. Listing *literally every single one* would be a book-length endeavor (the official documentation is hundreds of pages long), but I can certainly give you the definitive "Power Player" list.

I've categorized these by how they are used so you can actually find what you need.

---

## 1. String Functions & Operators

These are your bread and butter for text manipulation.

| Function/Operator | Description | Example |
| --- | --- | --- |
| `UPPER(str)` / `LOWER(str)` | Changes case. | `UPPER('hello')` → `'HELLO'` |
| `CONCAT(a, b, ...)` | Joins strings together. | `CONCAT('Postgre', 'SQL')` |
| ` |  | ` |
| `SUBSTRING(str FROM start FOR len)` | Extracts a portion of a string. | `SUBSTRING('Thomas' FROM 2 FOR 3)` → `'hom'` |
| `TRIM(...)` | Removes leading/trailing spaces or chars. | `TRIM('  test  ')` → `'test'` |
| `LENGTH(str)` | Returns number of characters. | `LENGTH('apple')` → `5` |
| `REPLACE(str, from, to)` | Replaces substrings. | `REPLACE('abc', 'b', 'z')` → `'azc'` |
| `LPAD` / `RPAD` | Pads string to a certain length. | `LPAD('hi', 5, '*')` → `'***hi'` |
| `~` / `~*` | Regex match (case sensitive / insensitive). | `'text' ~ 'te.*'` → `true` |

---

## 2. Mathematical Functions & Operators

Postgres handles everything from basic arithmetic to complex calculus.

| Function/Operator | Description | Example |
| --- | --- | --- |
| `+`, `-`, `*`, `/` | Standard arithmetic. | `10 / 2` → `5` |
| `%` | Modulo (remainder). | `5 % 2` → `1` |
| `^` | Exponentiation. | `2 ^ 3` → `8` |
| `|/` | **Square root.** | `|/ 25.0` → `5` |
| `||/` | **Cubic root.** | `||/ 27.0` → `3` |
| `@` | Absolute value. | `@ -5.0` → `5` |
| `ROUND(val, precision)` | Rounds to nearest decimal. | `ROUND(10.556, 2)` → `10.56` |
| `CEIL(val)` / `FLOOR(val)` | Rounds up or down. | `CEIL(12.1)` → `13` |
| `RANDOM()` | Returns a value between 0.0 and 1.0. | `SELECT RANDOM();` |

---

## 3. Aggregate Functions

These are used with `GROUP BY` to summarize data.

* **`COUNT(*)`**: Counts all rows.
* **`SUM(col)`**: Adds up all values.
* **`AVG(col)`**: Returns the mean.
* **`MIN(col)` / `MAX(col)**`: Lowest and highest values.
* **`STRING_AGG(col, separator)`**: Concatenates values from rows into a single string.
* **`ARRAY_AGG(col)`**: Collects values into a Postgres Array.

---

## 4. Date and Time Functions

Postgres is arguably the best database for handling time zones and intervals.

* **`NOW()`**: Current date and time.
* **`CURRENT_DATE`**: Current date only.
* **`AGE(timestamp, timestamp)`**: Returns the interval between two dates.
* *Example:* `AGE(TIMESTAMP '2026-01-01', TIMESTAMP '2025-01-01')` → `1 year`


* **`EXTRACT(field FROM source)`**: Pulls parts of a date.
* *Example:* `EXTRACT(YEAR FROM NOW())` → `2026`


* **`DATE_TRUNC('unit', source)`**: Truncates time to a specific precision (e.g., 'month', 'hour').
* **`interval`**: An operator/type for adding time.
* *Example:* `NOW() + INTERVAL '1 day'`



---

## 5. JSONB Operators (The Modern Essentials)

Since Postgres is often used as a NoSQL store, these are vital.

* **`->`**: Get JSON object field by key (returns JSONB).
* **`->>`**: Get JSON object field by key (returns **text**).
* **`@>`**: Does the left JSON path contain the right JSON path?
* **`?`**: Does the string exist as a top-level key?

---

## 6. Comparison & Logic Operators

* **`BETWEEN x AND y`**: Check if a value is in a range.
* **`IN (a, b, c)`**: Check if a value matches any in a list.
* **`IS NULL` / `IS NOT NULL**`: Check for emptiness.
* **`COALESCE(val1, val2, ...)`**: Returns the first non-null value in a list (great for defaults!).

---

### Pro-Tip: How to see everything inside Postgres

If you are using the `psql` command line tool, you don't need a manual. You can query the database for its own list of functions:

* `\df`: List all functions.
* `\do`: List all operators.
* `\df string*`: List all functions starting with "string".
Window functions in PostgreSQL are like "super-aggregates." Unlike a normal `GROUP BY`, which collapses rows into a single result, window functions allow you to perform calculations across a set of table rows that are still related to the current row.

They are defined by the `OVER()` clause, which usually contains `PARTITION BY` (to group rows) and `ORDER BY` (to define the sequence).

---

## 1. Ranking Functions

These are used to assign a number to a row based on its position within a group.

| Function | How it Works | Example Use Case |
| --- | --- | --- |
| **`ROW_NUMBER()`** | Assigns a unique, sequential integer (1, 2, 3...). | Getting the "Top 10" latest orders. |
| **`RANK()`** | Assigns rank with gaps. If two rows tie for 1st, the next is 3rd. | Standard Olympic-style leaderboards. |
| **`DENSE_RANK()`** | Assigns rank without gaps. If two tie for 1st, the next is 2nd. | Grouping items by popularity tiers. |
| **`NTILE(n)`** | Divides rows into `n` buckets (quartiles, percentiles). | Splitting customers into 4 spending tiers. |

---

## 2. Positional (Value) Functions

These allow you to "look around" the current row to see what came before or what comes after.

### `LAG(col, offset, default)`

Pulls data from a **previous** row.

* **How to use:** `LAG(salary, 1) OVER (ORDER BY date)`
* **Why:** Great for calculating "Month-over-Month" growth or finding the time difference between two events.

### `LEAD(col, offset, default)`

Pulls data from a **following** row.

* **How to use:** `LEAD(price, 1) OVER (ORDER BY id)`
* **Why:** Useful for predicting the "next step" in a user funnel or finding when a subscription will end based on the next start date.

### `FIRST_VALUE(col)` / `LAST_VALUE(col)`

Returns the very first or very last value in the partition.

* **Why:** Finding the "starting price" vs "ending price" for a stock in a single day.

---

## 3. Statistical & Cumulative Functions

These treat the window like a running total.

* **`CUME_DIST()`**: Calculates the cumulative distribution (percentile) of a value.
* **`PERCENT_RANK()`**: Returns the relative rank of a row as a percentage (0 to 1).
* **Running Totals**: You can use standard aggregates like `SUM` as window functions.
* *Syntax:* `SUM(sales) OVER (PARTITION BY region ORDER BY date)`
* *Result:* This creates a running sum that grows row-by-row within each region.



---

## 4. Frame Clauses (The "Pro" Level)

Sometimes you don't want the window to be the *entire* partition, but just a specific "frame" around the current row. You use `ROWS` or `RANGE` for this.

**Example: Moving Average**
If you want a 3-day moving average of sales:

```sql
AVG(sales) OVER (
  ORDER BY date 
  ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
)

```

This tells Postgres: "Look at the current row and the two rows before it, then give me the average."

---

## Summary Table: Which to use?

| If you want to... | Use this Function |
| --- | --- |
| Compare today's price to yesterday's | `LAG()` |
| Find the top 3 performers in every department | `DENSE_RANK()` |
| Create a running total of expenses | `SUM(...) OVER(...)` |
| Calculate a 7-day rolling average | `AVG(...) OVER(ROWS BETWEEN...)` |
