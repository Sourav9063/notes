## PostgreSQL String Matching Cheatsheet

### I. Basic Pattern Matching (LIKE, ILIKE)

These operators use simple wildcard characters.

| Operator | Description | Case-Sensitivity | Example | Result | Notes |
|---|---|---|---|---|---|
| `LIKE` | Matches a string against a pattern. | Case-sensitive | `'Hello'` `LIKE` `'H%o'` | `TRUE` | `%` matches any sequence of zero or more characters. `_` matches any single character. |
| `ILIKE` | Matches a string against a pattern. | Case-insensitive | `'Hello'` `ILIKE` `'h%O'` | `TRUE` | |
| `NOT LIKE` | Does not match. | Case-sensitive | `'Hello'` `NOT LIKE` `'h%o'` | `TRUE` | |
| `NOT ILIKE` | Does not match. | Case-insensitive | `'Hello'` `NOT ILIKE` `'h%O'` | `FALSE` | |

**Wildcard Characters:**

* `%`: Matches any sequence of zero or more characters.
    * `'abc%'`: Matches any string starting with "abc" (e.g., "abcd", "abc", "abcxyz").
    * `'%abc%'`: Matches any string containing "abc" (e.g., "xabcy", "abc").
    * `'%abc'`: Matches any string ending with "abc" (e.g., "xabc", "abc").
* `_`: Matches any single character.
    * `'a_c'`: Matches "abc", "axc", "a_c".
* **Escaping Wildcards:** To match a literal `%` or `_`, you need to escape it. The default escape character is `\`.
    * `'50\%'` `LIKE` `'50\%%'` (matches "50%")
    * You can specify a different escape character using `ESCAPE`: `'John\%Doe'` `LIKE` `'John#%%Doe'` `ESCAPE` `'#'`

**Common Scenarios:**

* **Starts with:** `column_name LIKE 'prefix%'`
* **Ends with:** `column_name LIKE '%suffix'`
* **Contains:** `column_name LIKE '%substring%'`
* **Exact match (case-insensitive):** `column_name ILIKE 'exact_string'` (similar to `=`)

### II. SQL Regular Expressions (SIMILAR TO)

`SIMILAR TO` offers more powerful pattern matching, combining `LIKE` functionality with some POSIX regular expression features.

| Operator | Description | Case-Sensitivity | Example | Result | Notes |
|---|---|---|---|---|---|
| `SIMILAR TO` | Matches a string against an SQL regular expression pattern. | Case-sensitive | `'abcde'` `SIMILAR TO` `'a%c_e'` | `TRUE` | The entire string must match the pattern. |
| `NOT SIMILAR TO` | Does not match. | Case-sensitive | `'abcde'` `NOT SIMILAR TO` `'a%c_e'` | `FALSE` | |

**Metacharacters for `SIMILAR TO`:**

* `%`: Matches any sequence of zero or more characters. (Same as `LIKE`)
* `_`: Matches any single character. (Same as `LIKE`)
* `|`: OR (alternation). E.g., `'a|b'` matches 'a' or 'b'.
* `*`: Zero or more of the preceding item. E.g., `'a*'` matches "", "a", "aa", etc.
* `+`: One or more of the preceding item. E.g., `'a+'` matches "a", "aa", etc.
* `?`: Zero or one of the preceding item. E.g., `'a?'` matches "" or "a".
* `{m}`: Exactly `m` repetitions. E.g., `'a{3}'` matches "aaa".
* `{m,}`: `m` or more repetitions. E.g., `'a{2,}'` matches "aa", "aaa", etc.
* `{m,n}`: Between `m` and `n` repetitions (inclusive). E.g., `'a{1,3}'` matches "a", "aa", "aaa".
* `()`: Grouping. E.g., `'(ab)|(cd)'`.
* `[]`: Character class. E.g., `'[0-9]'` for any digit, `'[a-zA-Z]'` for any letter.
* `^`: Matches the beginning of the string.
* `$`: Matches the end of the string.
* **Escaping:** Similar to `LIKE`, use `\` or `ESCAPE` clause.

### III. POSIX Regular Expressions (Operators and Functions)

PostgreSQL's most powerful string matching uses POSIX regular expressions, offering a comprehensive set of features.

**Operators:**

| Operator | Description | Case-Sensitivity | Example | Result |
|---|---|---|---|---|
| `~` | Matches regular expression. | Case-sensitive | `'thomas'` `~` `'t.*ma'` | `TRUE` |
| `~*` | Matches regular expression. | Case-insensitive | `'thomas'` `~*` `'T.*ma'` | `TRUE` |
| `!~` | Does not match regular expression. | Case-sensitive | `'thomas'` `!~` `'T.*ma'` | `TRUE` |
| `!~*` | Does not match regular expression. | Case-insensitive | `'thomas'` `!~*` `'T.*ma'` | `FALSE` |

**Common Metacharacters & Escapes (POSIX Regex):**

* `.`: Matches any single character (except newline by default).
* `*`: Zero or more of the preceding item.
* `+`: One or more of the preceding item.
* `?`: Zero or one of the preceding item.
* `{m,n}`: Repetition quantifiers (same as `SIMILAR TO`).
* `|`: Alternation (OR).
* `()`: Grouping and capturing.
* `[]`: Character classes.
    * `[abc]`: Matches 'a', 'b', or 'c'.
    * `[a-z]`: Matches any lowercase letter.
    * `[^0-9]`: Matches any character that is NOT a digit.
    * `[:alnum:]`: Alphanumeric characters (`[A-Za-z0-9]`).
    * `[:alpha:]`: Alphabetic characters (`[A-Za-z]`).
    `[:digit:]`: Digits (`[0-9]`).
    * `[:lower:]`: Lowercase letters (`[a-z]`).
    * `[:upper:]`: Uppercase letters (`[A-Z]`).
    * `[:space:]`: Whitespace characters.
* `^`: Matches the beginning of the string.
* `$`: Matches the end of the string.
* `\d`: Shorthand for `[[:digit:]]`.
* `\D`: Shorthand for `[^[:digit:]]`.
* `\s`: Shorthand for `[[:space:]]`.
* `\S`: Shorthand for `[^[:space:]]`.
* `\w`: Shorthand for `[[:alnum:]_]` (word characters).
* `\W`: Shorthand for `[^[:alnum:]_]`.
* `\b`: Word boundary.
* `\B`: Non-word boundary.
* `\m`: Matches only at the beginning of a word.
* `\M`: Matches only at the end of a word.
* `\y`: Matches only at the beginning or end of a word.
* `\Y`: Matches only at a point that is not the beginning or end of a word.
* `\A`: Matches only at the beginning of the string.
* `\Z`: Matches only at the end of the string.
* `\` (backslash): Escapes the next character. E.g., `\.` matches a literal dot.

**Functions:**

| Function | Description | Example | Result | Notes |
|---|---|---|---|---|
| `REGEXP_MATCHES(string, pattern [, flags])` | Returns a set of `text` arrays, one for each match. Each array contains the captured substrings. | `SELECT REGEXP_MATCHES('foo bar baz', '(b..)');` | `{'bar'}`, `{'baz'}` | `g` flag for global match. |
| `REGEXP_REPLACE(string, pattern, replacement [, flags])` | Replaces all occurrences (or first, if no `g` flag) of a substring that matches the pattern with the replacement string. | `SELECT REGEXP_REPLACE('hello world', 'o', 'X', 'g');` | `'hellX wXrld'` | `g`: global, `i`: case-insensitive, `x`: ignore whitespace in pattern. |
| `REGEXP_S_TO_ARRAY(string, pattern [, flags])` | Splits a string into an array of `text` items using a regex pattern as a delimiter. | `SELECT REGEXP_SPLIT_TO_ARRAY('1,2,3', ',');` | `{'1','2','3'}` | |
| `REGEXP_SPLIT_TO_TABLE(string, pattern [, flags])` | Splits a string into a set of `text` rows using a regex pattern as a delimiter. | `SELECT REGEXP_SPLIT_TO_TABLE('apple;banana;cherry', ';');` | `apple`, `banana`, `cherry` (as separate rows) | |
| `REGEXP_SUBSTR(string, pattern [, start_position [, nth_occurrence [, flags]]])` | Extracts the substring that matches the `n`th occurrence of the POSIX regular expression pattern. | `SELECT REGEXP_SUBSTR('foobar', 'o');` | `'o'` | `nth_occurrence` specifies which match to return. |
| `REGEXP_COUNT(string, pattern [, start_position [, flags]])` | Counts the number of times a POSIX regular expression pattern matches a string. | `SELECT REGEXP_COUNT('ababa', 'a', 1, 'g');` | `3` | `g` flag is usually implied for counting. |

**Flags for Regex Functions:**

* `i`: Case-insensitive matching.
* `g`: Global matching (find all occurrences, not just the first).
* `x`: Ignore whitespace in pattern.
* `n`: Newline-sensitive matching (`.` and `^`/`$` consider newlines).

---

### IV. Other Useful String Functions for Matching/Comparison

| Function/Operator | Description | Example | Result |
|---|---|---|---|
| `=` | Equality comparison. | `'hello' = 'hello'` | `TRUE` |
| `!=` or `<>` | Inequality comparison. | `'hello' != 'world'` | `TRUE` |
| `<, >, <=, >=` | Standard comparison operators. | `'apple' < 'banana'` | `TRUE` |
| `POSITION(substring IN string)` | Returns the starting position of the first occurrence of `substring` within `string`. Returns `0` if not found. | `POSITION('world' IN 'hello world')` | `7` |
| `STRPOS(string, substring)` | Similar to `POSITION`. | `STRPOS('hello world', 'world')` | `7` |
| `STARTS_WITH(string, prefix)` | Checks if a string starts with a given prefix. | `STARTS_WITH('PostgreSQL', 'Post')` | `TRUE` |
| `ENDS_WITH(string, suffix)` | Checks if a string ends with a given suffix. | `ENDS_WITH('PostgreSQL', 'SQL')` | `TRUE` |
| `SUBSTRING(string FROM pattern)` | Extracts a substring matching an SQL regular expression (different from POSIX regex `SUBSTRING`). | `SUBSTRING('ABCDE' FROM '%#"B_D#"_' FOR '#')` | `'BCD'` |
| `LEFT(string, n)` | Extracts the first `n` characters from a string. | `LEFT('PostgreSQL', 4)` | `'Post'` |
| `RIGHT(string, n)` | Extracts the last `n` characters from a string. | `RIGHT('PostgreSQL', 3)` | `'SQL'` |

