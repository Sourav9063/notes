# Go for Node.js Developers (Modern Edition)

> Side-by-side Node.js and Go examples, rewritten for **Go 1.27** and **Node.js 24 LTS**.

Based on [golang-for-nodejs-developers](https://github.com/miguelmota/golang-for-nodejs-developers) by Miguel Mota (MIT), whose last update was in 2022. A verbatim mirror lives in [`../golang-for-nodejs-developers`](../golang-for-nodejs-developers/README.md). This edition keeps the same idea, then:

- replaces deprecated APIs (`ioutil`, `interface{}` everywhere, `sort.Slice`, hand-rolled helpers, dead third-party packages) with current standard library equivalents;
- adds what changed since 2022: generics, iterators, `slices`/`maps`, `log/slog`, `context`, `errors.Join`/`errors.AsType`, `sync.WaitGroup.Go`, `testing/synctest`, `encoding/json/v2`, `uuid`, method-and-wildcard routing in `net/http`; and on the Node side ESM, `fetch`, `node:test`, `node:sqlite`, `util.parseArgs`, iterator helpers, `Set` methods, `using`, `RegExp.escape`;
- adds topics the original skipped: cancellation, graceful shutdown, HTTP clients, fuzzing, embedding, profiling, and a gotchas list;
- prints real output: every example was run on Go 1.27.1 and Node.js 24.21.0. Output marked *(varies)* depends on time, randomness, or scheduling.

It assumes you know JavaScript and have skimmed [A Tour of Go](https://go.dev/tour/). Node examples are ES modules (save as `.mjs`, or set `"type": "module"`). Go examples are complete programs: save as `main.go` in a folder with a `go.mod` and run `go run .`.

## Mental model

| Node.js | Go |
| --- | --- |
| One thread runs your JS; I/O is async and lands on the event loop | Many goroutines run on all cores; I/O blocks the goroutine, not the thread |
| `async`/`await`, promises | Plain blocking calls inside goroutines; channels, `sync`, `context` |
| Dynamic types, optional TypeScript | Static types, generics, interfaces satisfied implicitly |
| `throw` / `try`/`catch` | Errors are return values; `panic` only for bugs |
| Classes and prototypes | Structs, methods, embedding, interfaces |
| npm packages, `node_modules` | Modules (`go.mod`), downloaded to a shared cache |
| Ship source + runtime | Ship one static binary |
| `undefined` / `null` | Zero values (`0`, `""`, `false`, `nil`) |

## Contents

- [Tooling](#tooling)
- [Basics](#basics)
  - [comments](#comments)
  - [printing](#printing)
  - [variables and constants](#variables-and-constants)
  - [types and zero values](#types-and-zero-values)
  - [type check](#type-check)
  - [interpolation](#interpolation)
  - [if/else](#ifelse)
  - [ternary](#ternary)
  - [for](#for)
  - [while](#while)
  - [switch](#switch)
- [Collections](#collections)
  - [arrays and slices](#arrays-and-slices)
  - [slice helpers](#slice-helpers)
  - [map, filter, reduce](#map-filter-reduce)
  - [sorting](#sorting)
  - [maps](#maps)
  - [sets](#sets)
  - [destructuring](#destructuring)
  - [spread and rest](#spread-and-rest)
  - [swapping](#swapping)
- [Strings and bytes](#strings-and-bytes)
  - [strings](#strings)
  - [unicode and runes](#unicode-and-runes)
  - [building strings](#building-strings)
  - [buffers and bytes](#buffers-and-bytes)
  - [regex](#regex)
- [Functions](#functions)
  - [functions and closures](#functions-and-closures)
  - [default values and options](#default-values-and-options)
  - [IIFE](#iife)
  - [generics](#generics)
  - [defer and cleanup](#defer-and-cleanup)
- [Types and objects](#types-and-objects)
  - [objects and structs](#objects-and-structs)
  - [classes and methods](#classes-and-methods)
  - [interfaces](#interfaces)
  - [enums](#enums)
  - [pointers and values](#pointers-and-values)
- [Errors](#errors)
  - [errors as values](#errors-as-values)
  - [wrapping and inspecting errors](#wrapping-and-inspecting-errors)
  - [panic and recover](#panic-and-recover)
  - [stack traces](#stack-traces)
- [Iterators and generators](#iterators-and-generators)
  - [generators](#generators)
  - [iterator helpers](#iterator-helpers)
- [Dates and timers](#dates-and-timers)
  - [datetime](#datetime)
  - [timeout](#timeout)
  - [interval](#interval)
- [Async and concurrency](#async-and-concurrency)
  - [async/await](#asyncawait)
  - [Promise.all](#promiseall)
  - [Promise.race and select](#promiserace-and-select)
  - [cancellation: AbortController and context](#cancellation-abortcontroller-and-context)
  - [channels and message passing](#channels-and-message-passing)
  - [shared state and mutexes](#shared-state-and-mutexes)
  - [event emitter](#event-emitter)
  - [worker threads and CPU-bound work](#worker-threads-and-cpu-bound-work)
  - [process forking](#process-forking)
- [Files and I/O](#files-and-io)
  - [files](#files)
  - [reading lines](#reading-lines)
  - [directories and paths](#directories-and-paths)
  - [streams](#streams)
  - [stdin, stdout, stderr](#stdin-stdout-stderr)
  - [cli args and flags](#cli-args-and-flags)
  - [environment variables](#environment-variables)
  - [exec](#exec)
  - [signals](#signals)
  - [gzip](#gzip)
  - [embedding files](#embedding-files)
- [Data formats](#data-formats)
  - [json](#json)
  - [big numbers](#big-numbers)
  - [crypto, hashing, and ids](#crypto-hashing-and-ids)
  - [random numbers](#random-numbers)
  - [url parse](#url-parse)
- [Networking](#networking)
  - [http server](#http-server)
  - [graceful shutdown](#graceful-shutdown)
  - [http client](#http-client)
  - [tcp server](#tcp-server)
  - [udp server](#udp-server)
  - [dns](#dns)
  - [websockets](#websockets)
- [Application building blocks](#application-building-blocks)
  - [logging](#logging)
  - [databases](#databases)
- [Testing](#testing)
  - [unit tests](#unit-tests)
  - [benchmarks](#benchmarks)
  - [fuzzing and examples](#fuzzing-and-examples)
  - [testing time and http handlers](#testing-time-and-http-handlers)
- [Modules and packages](#modules-and-packages)
  - [modules](#modules)
  - [documentation](#documentation)
- [Runtime](#runtime)
  - [memory, gc, and profiling](#memory-gc-and-profiling)
- [Gotchas for Node.js developers](#gotchas-for-nodejs-developers)
  - [common traps](#common-traps)
- [Further reading](#further-reading)

## Tooling

| Task | Node.js | Go |
| --- | --- | --- |
| Install / switch versions | `nvm install 24`, `fnm`, `volta` | Download from go.dev; `go.mod`'s `toolchain` line auto-downloads newer toolchains |
| New project | `npm init -y` | `go mod init github.com/you/app` |
| Run | `node main.mjs` | `go run .` |
| Watch mode | `node --watch main.mjs` | none built in; `air`, `watchexec -r go run .` |
| Add dependency | `npm install pkg` | `go get example.com/pkg@latest` (or just import it and run `go mod tidy`) |
| Remove unused deps | `npm prune` | `go mod tidy` |
| Lock file | `package-lock.json` | `go.sum` (checksums; versions live in `go.mod`) |
| Run a CLI tool | `npx tool` | `go run example.com/tool@v1.2.3`, or `go get -tool` then `go tool name` |
| Format | Prettier | `gofmt -w .` / `go fmt ./...` (one style, no config) |
| Lint | ESLint | `go vet ./...`, plus `staticcheck` or `golangci-lint` |
| Auto-modernize code | codemods | `go fix ./...` rewrites old idioms to current ones |
| Test | `node --test` | `go test ./...` |
| Env file | `node --env-file=.env main.mjs` | none in stdlib; export vars or use `github.com/joho/godotenv` |
| Build | bundler; single executable apps via `--experimental-sea-config` | `go build -o app .` |
| Cross-compile | n/a | `GOOS=linux GOARCH=arm64 go build .` |
| Docs | JSDoc, TypeDoc | `go doc pkg.Symbol`, pkg.go.dev |
| TypeScript | `node main.ts` runs it with types stripped | n/a; Go is typed |

A minimal module:

```text
app/
├── go.mod        // module github.com/you/app; go 1.27
├── main.go       // package main
└── internal/     // importable only from inside app/
    └── store/
        └── store.go
```

## Basics

### comments

#### Node.js

```js
// line comment

/*
  block comment
*/

/**
 * JSDoc documents the next declaration.
 * @param {string} name
 */
function greet(name) {}
```

#### Go

```go
package main

// line comment

/*
   block comment
*/

// Greet returns a greeting. Doc comments start with the name
// they document and sit directly above the declaration.
func Greet(name string) string { return "hi " + name }

func main() { _ = Greet }
```

### printing

#### Node.js

```js
console.log('print to stdout')
console.log('format %s %d %o', 'str', 42, { a: 1 })
console.log('a', 'b', 1) // spaces between args, newline at end
process.stdout.write('no newline')
process.stdout.write('\n')
console.error('print to stderr')
```

Output

```text
print to stdout
format str 42 { a: 1 }
a b 1
no newline
print to stderr
```

#### Go

```go
package main

import (
	"fmt"
	"os"
)

type point struct{ X, Y int }

func main() {
	fmt.Println("print to stdout")
	fmt.Printf("format %s %d %v\n", "str", 42, map[string]int{"a": 1})
	fmt.Println("a", "b", 1) // spaces between operands, newline at end
	fmt.Print("no newline")
	fmt.Print("\n")

	p := point{1, 2}
	fmt.Printf("%v %+v %#v %T\n", p, p, p, p) // value, with field names, Go syntax, type
	fmt.Printf("%q %x %08.3f %t\n", "hi", 255, 3.14159, true)

	fmt.Fprintln(os.Stderr, "print to stderr")
}
```

Output

```text
print to stdout
format str 42 map[a:1]
a b 1
no newline
{1 2} {X:1 Y:2} main.point{X:1, Y:2} main.point
"hi" ff 0003.142 true
print to stderr
```

### variables and constants

#### Node.js

```js
// block scoped
let a = 'mutable'
const b = 'immutable binding'
let c // undefined
const [x, y] = [1, 2]

a = 'changed'
console.log(a, b, c, x, y)
```

Output

```text
changed immutable binding undefined 1 2
```

#### Go

```go
package main

import "fmt"

const (
	Pi     = 3.14159 // untyped constant, evaluated at compile time
	MaxLen = 1 << 10
)

// iota counts up inside a const block, the usual enum pattern
type Color int

const (
	Red Color = iota
	Green
	Blue
)

var global = "package level"

func main() {
	var a string = "explicit type"
	var c int // zero value: 0
	b := "short declaration, type inferred"
	x, y := 1, 2

	a = "changed"
	fmt.Println(a, b, c, x, y, Pi, MaxLen, Blue, global)
}
```

Output

```text
changed short declaration, type inferred 0 1 2 3.14159 1024 2 package level
```

Go refuses to compile unused local variables and unused imports. Use `_` to discard a value on purpose.

### types and zero values

#### Node.js

```js
const values = [
  true, 42, 3.14, 10n, 'text', Symbol('id'),
  null, undefined, {}, [], () => {},
]
console.log(values.map(v => typeof v).join(' '))
console.log(Number.MAX_SAFE_INTEGER, 0.1 + 0.2)
```

Output

```text
boolean number number bigint string symbol object undefined object object function
9007199254740991 0.30000000000000004
```

#### Go

```go
package main

import (
	"fmt"
	"math"
)

func main() {
	var (
		b   bool
		i   int     // 64-bit on 64-bit platforms
		i8  int8    // also int16, int32, int64
		u   uint    // also uint8 (= byte), uint16, uint32, uint64, uintptr
		f   float64 // also float32
		c   complex128
		s   string // immutable bytes, usually UTF-8
		r   rune   // = int32, one Unicode code point
		p   *int
		sl  []int
		m   map[string]int
		ch  chan int
		fn  func()
		err error
		a   any // = interface{}
	)
	fmt.Println(b, i, i8, u, f, c, s == "", r, p, sl, m, ch, fn == nil, err, a)
	fmt.Println(sl == nil, m == nil, len(sl), len(m))

	fmt.Println(math.MaxInt64, 0.1+0.2) // constant arithmetic is exact
	x, y := 0.1, 0.2
	fmt.Println(x + y) // float64 arithmetic is not
}
```

Output

```text
false 0 0 0 0 (0+0i) true 0 <nil> [] map[] <nil> true <nil> <nil>
true true 0 0
9223372036854775807 0.3
0.30000000000000004
```

Every type has a zero value, so there is no `undefined`. Go has no implicit conversions: `int + float64` does not compile; write `float64(i) + f`.

### type check

#### Node.js

```js
const values = [1, 'a', [1], { a: 1 }, null, new Date(0)]

for (const v of values) {
  const kind =
    v === null ? 'null'
    : Array.isArray(v) ? 'array'
    : v instanceof Date ? 'date'
    : typeof v
  console.log(kind)
}
```

Output

```text
number
string
array
object
null
date
```

#### Go

```go
package main

import (
	"fmt"
	"reflect"
	"time"
)

func describe(v any) string {
	switch x := v.(type) {
	case nil:
		return "nil"
	case int, float64:
		return fmt.Sprintf("number %v", x)
	case string:
		return "string of length " + fmt.Sprint(len(x))
	case []int:
		return "slice of int"
	case time.Time:
		return "time " + x.UTC().Format(time.DateOnly)
	case fmt.Stringer: // any type with String() string
		return "stringer " + x.String()
	default:
		return "other " + reflect.TypeOf(x).String()
	}
}

func main() {
	for _, v := range []any{1, "a", []int{1}, map[string]int{"a": 1}, nil, time.Unix(0, 0), time.Second} {
		fmt.Println(describe(v))
	}

	// single type assertion; the comma-ok form never panics
	var v any = "hello"
	s, ok := v.(string)
	n, ok2 := v.(int)
	fmt.Println(s, ok, n, ok2)
	fmt.Printf("%T\n", v)
}
```

Output

```text
number 1
string of length 1
slice of int
other map[string]int
nil
time 1970-01-01
stringer 1s
hello true 0 false
string
```

### interpolation

#### Node.js

```js
const name = 'bob'
const age = 21
const msg = `${name} is ${age} years old, next year ${age + 1}`
console.log(msg)
console.log(`${(0.1 + 0.2).toFixed(2)} | ${'pad'.padStart(6)} | ${String(7).padStart(3, '0')}`)
```

Output

```text
bob is 21 years old, next year 22
0.30 |    pad | 007
```

#### Go

```go
package main

import "fmt"

func main() {
	name := "bob"
	age := 21
	msg := fmt.Sprintf("%s is %d years old, next year %d", name, age, age+1)
	fmt.Println(msg)
	fmt.Printf("%.2f | %6s | %03d\n", 0.1+0.2, "pad", 7)
}
```

Output

```text
bob is 21 years old, next year 22
0.30 |    pad | 007
```

### if/else

#### Node.js

```js
const array = [1, 2]

if (array.length > 0) {
  console.log('not empty')
}

const value = 'b'
if (value === 'a') {
  console.log('a')
} else if (value === 'b') {
  console.log('b')
} else {
  console.log('other')
}

// truthiness: 0, '', null, undefined, NaN are falsy
if (!'') console.log('empty string is falsy')
```

Output

```text
not empty
b
empty string is falsy
```

#### Go

```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	array := []int{1, 2}

	if len(array) > 0 {
		fmt.Println("not empty")
	}

	value := "b"
	if value == "a" {
		fmt.Println("a")
	} else if value == "b" {
		fmt.Println("b")
	} else {
		fmt.Println("other")
	}

	// no truthiness: conditions must be bool
	if s := ""; s == "" {
		fmt.Println("empty string checked explicitly")
	}

	// init statement scopes n and err to the if/else chain
	if n, err := strconv.Atoi("42"); err != nil {
		fmt.Println("bad number:", err)
	} else {
		fmt.Println("parsed", n)
	}
}
```

Output

```text
not empty
b
empty string checked explicitly
parsed 42
```

### ternary

#### Node.js

```js
const n = 5
const label = n > 3 ? 'big' : 'small'
const name = undefined ?? 'default'
console.log(label, name, Math.max(3, 9), Math.min(3, 9))
```

Output

```text
big default 9 3
```

#### Go

```go
package main

import (
	"cmp"
	"fmt"
)

func main() {
	// Go has no ternary operator; use if/else
	n := 5
	label := "small"
	if n > 3 {
		label = "big"
	}

	// cmp.Or returns the first non-zero value, like ?? for zero values
	name := cmp.Or("", "default")

	// built-in min and max work on any ordered type
	fmt.Println(label, name, max(3, 9), min(3, 9), min("b", "a"))
}
```

Output

```text
big default 9 3 a
```

### for

#### Node.js

```js
for (let i = 0; i < 3; i++) console.log(i)

for (const v of ['a', 'b']) console.log(v)

for (const [i, v] of ['a', 'b'].entries()) console.log(i, v)

for (const k in { x: 1, y: 2 }) console.log(k)

outer: for (const i of [1, 2]) {
  for (const j of [1, 2]) {
    if (j === 2) continue outer
    console.log(i, j)
  }
}
```

Output

```text
0
1
2
a
b
0 a
1 b
x
y
1 1
2 1
```

#### Go

```go
package main

import "fmt"

func main() {
	for i := 0; i < 3; i++ {
		fmt.Println(i)
	}

	for i := range 3 { // range over an int, Go 1.22
		fmt.Print(i, " ")
	}
	fmt.Println()

	for _, v := range []string{"a", "b"} {
		fmt.Println(v)
	}

	for i, v := range []string{"a", "b"} {
		fmt.Println(i, v)
	}

	// map order is random; sort keys when order matters (see maps)
	for k := range map[string]int{"x": 1} {
		fmt.Println(k)
	}

	// range over a string yields byte offset and rune
	for i, r := range "héy" {
		fmt.Println(i, string(r))
	}

outer:
	for _, i := range []int{1, 2} {
		for _, j := range []int{1, 2} {
			if j == 2 {
				continue outer
			}
			fmt.Println(i, j)
		}
	}
}
```

Output

```text
0
1
2
0 1 2 
a
b
0 a
1 b
x
0 h
1 é
3 y
1 1
2 1
```

Since Go 1.22 each iteration gets a fresh loop variable, so closures and goroutines capturing `i` behave like `let` in JavaScript.

### while

#### Node.js

```js
let i = 0
while (i < 3) {
  console.log(i++)
}

let n = 0
do {
  n++
} while (n < 5)
console.log(n)
```

Output

```text
0
1
2
5
```

#### Go

```go
package main

import "fmt"

func main() {
	// for is Go's only loop keyword
	i := 0
	for i < 3 {
		fmt.Println(i)
		i++
	}

	n := 0
	for { // infinite loop, like while (true)
		n++
		if n >= 5 {
			break
		}
	}
	fmt.Println(n)
}
```

Output

```text
0
1
2
5
```

### switch

#### Node.js

```js
function kind(value) {
  switch (value) {
    case 'a':
    case 'b':
      return 'a or b'
    case 'c':
      return 'c'
    default:
      return 'other'
  }
}
console.log(kind('b'), kind('c'), kind('z'))
```

Output

```text
a or b c other
```

#### Go

```go
package main

import "fmt"

func kind(value string) string {
	switch value { // no break needed; cases do not fall through
	case "a", "b":
		return "a or b"
	case "c":
		return "c"
	default:
		return "other"
	}
}

func grade(score int) string {
	switch { // switch true: a cleaner if/else chain
	case score >= 90:
		return "A"
	case score >= 80:
		return "B"
	default:
		return "C"
	}
}

func main() {
	fmt.Println(kind("b"), kind("c"), kind("z"), grade(85))

	switch n := 1; n {
	case 1:
		fmt.Println("one")
		fallthrough // explicit opt-in
	case 2:
		fmt.Println("and two")
	}
}
```

Output

```text
a or b c other B
one
and two
```

## Collections

### arrays and slices

#### Node.js

```js
const fixed = new Array(3).fill(0)
const list = [1, 2, 3]

list.push(4)               // append
list.unshift(0)            // prepend
const part = list.slice(1, 3) // copy of [1, 3)
const copy = [...list]
const joined = [...list, ...[5, 6]]

console.log(fixed, list, part, copy.length, joined)
console.log(list.at(-1), list.includes(2), list.indexOf(3))
```

Output

```text
[ 0, 0, 0 ] [ 0, 1, 2, 3, 4 ] [ 1, 2 ] 5 [
  0, 1, 2, 3,
  4, 5, 6
]
4 true 3
```

#### Go

```go
package main

import (
	"fmt"
	"slices"
)

func main() {
	// arrays have a fixed length that is part of the type; rarely used directly
	var fixed [3]int

	// slices are views over an array: pointer, length, capacity
	list := []int{1, 2, 3}

	list = append(list, 4)           // append returns the new slice; always reassign
	list = slices.Insert(list, 0, 0) // prepend
	part := list[1:3]                // shares memory with list, no copy
	copied := slices.Clone(list)     // independent copy
	joined := slices.Concat(list, []int{5, 6})

	fmt.Println(fixed, list, part, len(copied), joined)
	fmt.Println(list[len(list)-1], slices.Contains(list, 2), slices.Index(list, 3))

	// preallocate when the size is known
	squares := make([]int, 0, 5)
	for i := range 5 {
		squares = append(squares, i*i)
	}
	fmt.Println(squares, len(squares), cap(squares))
}
```

Output

```text
[0 0 0] [0 1 2 3 4] [1 2] 5 [0 1 2 3 4 5 6]
4 true 3
[0 1 4 9 16] 5 5
```

A sub-slice shares the backing array, so writing to `part[0]` changes `list[1]`. Use `slices.Clone` when you need JavaScript's `slice()` copy semantics.

### slice helpers

#### Node.js

```js
const nums = [3, 1, 4, 1, 5, 9, 2, 6]

console.log(Math.max(...nums), Math.min(...nums))
console.log(nums.toSorted((a, b) => a - b))    // non-mutating
console.log(nums.toReversed())
console.log([...new Set(nums)])                // dedupe
console.log(nums.findIndex(n => n > 4))
console.log(nums.toSpliced(1, 2))              // remove 2 items at index 1
console.log(Object.groupBy(nums, n => (n % 2 ? 'odd' : 'even')))
```

Output

```text
9 1
[
  1, 1, 2, 3,
  4, 5, 6, 9
]
[
  6, 2, 9, 5,
  1, 4, 1, 3
]
[
  3, 1, 4, 5,
  9, 2, 6
]
4
[ 3, 1, 5, 9, 2, 6 ]
[Object: null prototype] { odd: [ 3, 1, 1, 5, 9 ], even: [ 4, 2, 6 ] }
```

#### Go

```go
package main

import (
	"fmt"
	"slices"
)

func main() {
	nums := []int{3, 1, 4, 1, 5, 9, 2, 6}

	fmt.Println(slices.Max(nums), slices.Min(nums))

	sorted := slices.Sorted(slices.Values(nums)) // sorted copy
	fmt.Println(sorted)

	reversed := slices.Clone(nums)
	slices.Reverse(reversed) // in place
	fmt.Println(reversed)

	fmt.Println(slices.Compact(slices.Clone(sorted))) // dedupe adjacent values
	fmt.Println(slices.IndexFunc(nums, func(n int) bool { return n > 4 }))
	fmt.Println(slices.Delete(slices.Clone(nums), 1, 3)) // remove [1, 3)

	for chunk := range slices.Chunk(nums, 3) {
		fmt.Print(chunk, " ")
	}
	fmt.Println()

	groups := map[string][]int{}
	for _, n := range nums {
		key := "even"
		if n%2 != 0 {
			key = "odd"
		}
		groups[key] = append(groups[key], n)
	}
	fmt.Println(groups)
	fmt.Println(slices.Equal(nums[:2], []int{3, 1}))
}
```

Output

```text
9 1
[1 1 2 3 4 5 6 9]
[6 2 9 5 1 4 1 3]
[1 2 3 4 5 6 9]
4
[3 1 5 9 2 6]
[3 1 4] [1 5 9] [2 6] 
map[even:[4 2 6] odd:[3 1 1 5 9]]
true
```

### map, filter, reduce

#### Node.js

```js
const nums = [1, 2, 3, 4, 5]

const doubled = nums.map(n => n * 2)
const evens = nums.filter(n => n % 2 === 0)
const sum = nums.reduce((acc, n) => acc + n, 0)
const firstBig = nums.find(n => n > 3)
const anyBig = nums.some(n => n > 4)
const allPos = nums.every(n => n > 0)

console.log(doubled, evens, sum, firstBig, anyBig, allPos)
```

Output

```text
[ 2, 4, 6, 8, 10 ] [ 2, 4 ] 15 4 true true
```

#### Go

The standard library has no `Map`/`Filter`/`Reduce`; a plain loop is idiomatic. With generics you can write them once:

```go
package main

import (
	"fmt"
	"slices"
)

func Map[T, U any](s []T, f func(T) U) []U {
	out := make([]U, 0, len(s))
	for _, v := range s {
		out = append(out, f(v))
	}
	return out
}

func Filter[T any](s []T, keep func(T) bool) []T {
	var out []T
	for _, v := range s {
		if keep(v) {
			out = append(out, v)
		}
	}
	return out
}

func Reduce[T, A any](s []T, init A, f func(A, T) A) A {
	acc := init
	for _, v := range s {
		acc = f(acc, v)
	}
	return acc
}

func main() {
	nums := []int{1, 2, 3, 4, 5}

	doubled := Map(nums, func(n int) int { return n * 2 })
	evens := Filter(nums, func(n int) bool { return n%2 == 0 })
	sum := Reduce(nums, 0, func(acc, n int) int { return acc + n })

	i := slices.IndexFunc(nums, func(n int) bool { return n > 3 })
	anyBig := slices.ContainsFunc(nums, func(n int) bool { return n > 4 })

	fmt.Println(doubled, evens, sum, nums[i], anyBig)

	// the loop version is usually clearer
	total := 0
	for _, n := range nums {
		total += n
	}
	fmt.Println(total)
}
```

Output

```text
[2 4 6 8 10] [2 4] 15 4 true
15
```

### sorting

#### Node.js

```js
const people = [
  { name: 'Ana', age: 30 },
  { name: 'Bo', age: 25 },
  { name: 'Cy', age: 30 },
]

// sort is stable; sort by age desc, then name asc
people.sort((a, b) => b.age - a.age || a.name.localeCompare(b.name))
console.log(people.map(p => `${p.name}:${p.age}`).join(' '))

const words = ['banana', 'Apple', 'cherry']
console.log(words.toSorted())
console.log(words.toSorted((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })))
```

Output

```text
Ana:30 Cy:30 Bo:25
[ 'Apple', 'banana', 'cherry' ]
[ 'Apple', 'banana', 'cherry' ]
```

#### Go

```go
package main

import (
	"cmp"
	"fmt"
	"slices"
	"strings"
)

type Person struct {
	Name string
	Age  int
}

func main() {
	people := []Person{{"Ana", 30}, {"Bo", 25}, {"Cy", 30}}

	// comparator returns negative, zero, or positive like JavaScript's
	slices.SortStableFunc(people, func(a, b Person) int {
		return cmp.Or(
			cmp.Compare(b.Age, a.Age),       // age desc
			strings.Compare(a.Name, b.Name), // then name asc
		)
	})
	fmt.Println(people)

	words := []string{"banana", "Apple", "cherry"}
	slices.Sort(words) // byte order: uppercase first
	fmt.Println(words)

	slices.SortFunc(words, func(a, b string) int {
		return strings.Compare(strings.ToLower(a), strings.ToLower(b))
	})
	fmt.Println(words, slices.IsSorted([]int{1, 2, 3}))

	i, found := slices.BinarySearch([]int{10, 20, 30}, 20)
	fmt.Println(i, found)
}
```

Output

```text
[{Ana 30} {Cy 30} {Bo 25}]
[Apple banana cherry]
[Apple banana cherry] true
1 true
```

### maps

#### Node.js

```js
const m = new Map([['a', 1]])
m.set('b', 2)

console.log(m.get('a'), m.get('zz'), m.has('b'), m.size)
m.delete('a')

for (const [k, v] of m) console.log(k, v)

// plain objects are also used as string-keyed maps
const obj = { x: 1, y: 2 }
console.log(Object.keys(obj), Object.entries(obj))
console.log(Object.fromEntries([['k', 'v']]))
```

Output

```text
1 undefined true 2
b 2
[ 'x', 'y' ] [ [ 'x', 1 ], [ 'y', 2 ] ]
{ k: 'v' }
```

#### Go

```go
package main

import (
	"fmt"
	"maps"
	"slices"
)

func main() {
	m := map[string]int{"a": 1}
	m["b"] = 2

	v, ok := m["zz"] // missing key yields the zero value; ok reports presence
	fmt.Println(m["a"], v, ok, len(m))
	delete(m, "a")

	m["c"] = 3
	// iteration order is randomized on purpose; sort keys for stable output
	for _, k := range slices.Sorted(maps.Keys(m)) {
		fmt.Println(k, m[k])
	}

	clone := maps.Clone(m)
	clear(m) // remove all entries
	fmt.Println(len(m), len(clone), maps.Equal(clone, map[string]int{"b": 2, "c": 3}))

	// a nil map can be read but not written
	var nilMap map[string]int
	fmt.Println(nilMap["x"])
	// nilMap["x"] = 1 // panic: assignment to entry in nil map

	// count occurrences
	counts := map[rune]int{}
	for _, r := range "hello" {
		counts[r]++
	}
	fmt.Println(counts['l'])
}
```

Output

```text
1 0 false 2
b 2
c 3
0 2 true
0
2
```

### sets

#### Node.js

```js
const a = new Set([1, 2, 3])
const b = new Set([2, 3, 4])

a.add(5)
console.log(a.has(2), a.size)
console.log(a.union(b), a.intersection(b), a.difference(b))
console.log(new Set([1]).isSubsetOf(a))
```

Output

```text
true 4
Set(5) { 1, 2, 3, 5, 4 } Set(2) { 2, 3 } Set(2) { 1, 5 }
true
```

#### Go

```go
package main

import (
	"fmt"
	"maps"
	"slices"
)

// map[T]struct{} is the idiomatic set; struct{} takes no memory
type Set[T comparable] map[T]struct{}

func Of[T comparable](items ...T) Set[T] {
	s := Set[T]{}
	for _, v := range items {
		s[v] = struct{}{}
	}
	return s
}

func (s Set[T]) Has(v T) bool { _, ok := s[v]; return ok }

func (s Set[T]) Intersection(o Set[T]) Set[T] {
	out := Set[T]{}
	for v := range s {
		if o.Has(v) {
			out[v] = struct{}{}
		}
	}
	return out
}

func main() {
	a, b := Of(1, 2, 3), Of(2, 3, 4)
	a[5] = struct{}{}

	union := maps.Clone(a)
	maps.Copy(union, b)

	fmt.Println(a.Has(2), len(a))
	fmt.Println(slices.Sorted(maps.Keys(union)), slices.Sorted(maps.Keys(a.Intersection(b))))
}
```

Output

```text
true 4
[1 2 3 4 5] [2 3]
```

### destructuring

#### Node.js

```js
const obj = { key: 'foo', value: 'bar', extra: 1 }
const { key, value, missing = 'default' } = obj
const [first, , third = 'none'] = ['a', 'b']

console.log(key, value, missing, first, third)
```

Output

```text
foo bar default a none
```

#### Go

```go
package main

import "fmt"

type Pair struct{ Key, Value string }

func split() (string, string) { return "a", "b" }

func main() {
	// no destructuring: read fields directly
	p := Pair{Key: "foo", Value: "bar"}
	key, value := p.Key, p.Value

	// multiple return values are the closest equivalent
	first, _ := split()

	fmt.Println(key, value, first)
}
```

Output

```text
foo bar a
```

### spread and rest

#### Node.js

```js
const sum = (...nums) => nums.reduce((a, n) => a + n, 0)
const nums = [1, 2, 3]

console.log(sum(...nums), sum())

const base = { a: 1, b: 2 }
const merged = { ...base, b: 3, c: 4 }
const { a, ...rest } = merged
console.log(merged, rest)
```

Output

```text
6 0
{ a: 1, b: 3, c: 4 } { b: 3, c: 4 }
```

#### Go

```go
package main

import (
	"fmt"
	"maps"
)

// variadic parameter: nums is a []int
func sum(nums ...int) int {
	total := 0
	for _, n := range nums {
		total += n
	}
	return total
}

type Config struct {
	Host string
	Port int
}

func main() {
	nums := []int{1, 2, 3}
	fmt.Println(sum(nums...), sum())

	// structs are copied on assignment; override fields after copying
	base := Config{Host: "localhost", Port: 80}
	merged := base
	merged.Port = 8080
	fmt.Println(base, merged)

	// maps merge with maps.Copy
	m := map[string]int{"a": 1, "b": 2}
	maps.Copy(m, map[string]int{"b": 3, "c": 4})
	fmt.Println(m)
}
```

Output

```text
6 0
{localhost 80} {localhost 8080}
map[a:1 b:3 c:4]
```

### swapping

#### Node.js

```js
let a = 'foo'
let b = 'bar'
;[a, b] = [b, a]
console.log(a, b)
```

Output

```text
bar foo
```

#### Go

```go
package main

import "fmt"

func main() {
	a, b := "foo", "bar"
	a, b = b, a
	fmt.Println(a, b)
}
```

Output

```text
bar foo
```

## Strings and bytes

### strings

#### Node.js

```js
const s = '  Hello, World  '
const t = s.trim()

console.log(t.toUpperCase(), t.toLowerCase())
console.log(t.includes('World'), t.startsWith('He'), t.endsWith('!'))
console.log(t.indexOf('o'), t.lastIndexOf('o'))
console.log(t.split(', '), ['a', 'b'].join('-'))
console.log(t.replaceAll('l', 'L'), 'ab'.repeat(3))
console.log(t.slice(0, 5), t.slice(-5))
console.log('a=1'.split('='), 'path/to/file.txt'.split('/').at(-1))
```

Output

```text
HELLO, WORLD hello, world
true true false
4 8
[ 'Hello', 'World' ] a-b
HeLLo, WorLd ababab
Hello World
[ 'a', '1' ] file.txt
```

#### Go

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	s := "  Hello, World  "
	t := strings.TrimSpace(s)

	fmt.Println(strings.ToUpper(t), strings.ToLower(t))
	fmt.Println(strings.Contains(t, "World"), strings.HasPrefix(t, "He"), strings.HasSuffix(t, "!"))
	fmt.Println(strings.Index(t, "o"), strings.LastIndex(t, "o"))
	fmt.Println(strings.Split(t, ", "), strings.Join([]string{"a", "b"}, "-"))
	fmt.Println(strings.ReplaceAll(t, "l", "L"), strings.Repeat("ab", 3))
	fmt.Println(t[:5], t[len(t)-5:]) // byte offsets; safe here because the text is ASCII

	key, value, found := strings.Cut("a=1", "=")
	fmt.Println(key, value, found)

	_, file, _ := strings.CutLast("path/to/file.txt", "/") // Go 1.27
	fmt.Println(file)

	fmt.Println(strings.Fields(" a  b c "), strings.EqualFold("Go", "GO"))
	fmt.Println(strings.TrimPrefix("v1.2.3", "v"), strings.TrimSuffix("file.go", ".go"))

	// iterate lines or parts without allocating a slice (Go 1.24)
	for line := range strings.Lines("one\ntwo\n") {
		fmt.Printf("%q ", line)
	}
	for part := range strings.SplitSeq("x,y", ",") {
		fmt.Print(part, " ")
	}
	fmt.Println()
}
```

Output

```text
HELLO, WORLD hello, world
true true false
4 8
[Hello World] a-b
HeLLo, WorLd ababab
Hello World
a 1 true
file.txt
[a b c] true
1.2.3 file
"one\n" "two\n" x y 
```

### unicode and runes

#### Node.js

```js
const s = 'héllo 👋'

console.log(s.length)                          // UTF-16 code units
console.log([...s].length)                     // code points
console.log(new TextEncoder().encode(s).length) // UTF-8 bytes
console.log([...s].reverse().join(''))
console.log(s.codePointAt(1), String.fromCodePoint(233))
```

Output

```text
8
7
11
👋 olléh
233 é
```

#### Go

```go
package main

import (
	"fmt"
	"slices"
	"unicode"
	"unicode/utf8"
)

func main() {
	s := "héllo 👋"

	fmt.Println(len(s))                    // UTF-8 bytes
	fmt.Println(utf8.RuneCountInString(s)) // code points

	runes := []rune(s)
	slices.Reverse(runes)
	fmt.Println(string(runes))

	fmt.Println(s[1], runes[len(runes)-2], string(rune(233))) // s[1] is a byte, not a character
	fmt.Println(unicode.IsUpper('A'), unicode.IsLetter('é'), unicode.IsDigit('7'))
}
```

Output

```text
11
7
👋 olléh
195 233 é
true true true
```

### building strings

#### Node.js

```js
const parts = []
for (let i = 0; i < 3; i++) parts.push(`item${i}`)
console.log(parts.join(','))
```

Output

```text
item0,item1,item2
```

#### Go

```go
package main

import (
	"fmt"
	"strconv"
	"strings"
)

func main() {
	// strings are immutable; += in a loop copies every time
	var b strings.Builder
	for i := range 3 {
		if i > 0 {
			b.WriteByte(',')
		}
		b.WriteString("item")
		b.WriteString(strconv.Itoa(i))
	}
	fmt.Println(b.String())

	// conversions live in strconv
	n, _ := strconv.Atoi("42")
	f, _ := strconv.ParseFloat("3.5", 64)
	ok, _ := strconv.ParseBool("true")
	fmt.Println(n+1, f*2, ok, strconv.Quote("a\"b"), strconv.FormatInt(255, 2))

	_, err := strconv.Atoi("abc")
	fmt.Println(err)
}
```

Output

```text
item0,item1,item2
43 7 true "a\"b" 11111111
strconv.Atoi: parsing "abc": invalid syntax
```

### buffers and bytes

#### Node.js

```js
const buf = Buffer.from('hello')               // Buffer is a Uint8Array subclass
const bytes = new Uint8Array([104, 105])

console.log(buf, buf.length, buf[0])
console.log(buf.toString('hex'), buf.toString('base64'))
console.log(Buffer.from('68656c6c6f', 'hex').toString())
console.log(new TextDecoder().decode(bytes))
console.log(Buffer.concat([buf, Buffer.from('!')]).toString())
console.log(Buffer.compare(Buffer.from('a'), Buffer.from('b')), buf.equals(Buffer.from('hello')))

const out = Buffer.alloc(6)
out.writeUInt32BE(0xdeadbeef, 0)
out.writeUInt16LE(0x0102, 4)
console.log(out, out.readUInt32BE(0).toString(16))
```

Output

```text
<Buffer 68 65 6c 6c 6f> 5 104
68656c6c6f aGVsbG8=
hello
hi
hello!
-1 true
<Buffer de ad be ef 02 01> deadbeef
```

#### Go

```go
package main

import (
	"bytes"
	"encoding/base64"
	"encoding/binary"
	"encoding/hex"
	"fmt"
)

func main() {
	buf := []byte("hello") // []byte is Go's Buffer/Uint8Array
	fmt.Println(buf, len(buf), buf[0])
	fmt.Println(hex.EncodeToString(buf), base64.StdEncoding.EncodeToString(buf))

	decoded, _ := hex.DecodeString("68656c6c6f")
	fmt.Println(string(decoded), string([]byte{104, 105}))

	var b bytes.Buffer // growable buffer, also an io.Reader and io.Writer
	b.Write(buf)
	b.WriteString("!")
	fmt.Println(b.String())

	fmt.Println(bytes.Compare([]byte("a"), []byte("b")), bytes.Equal(buf, []byte("hello")))

	out := binary.BigEndian.AppendUint32(nil, 0xdeadbeef)
	out = binary.LittleEndian.AppendUint16(out, 0x0102)
	fmt.Printf("% x %x\n", out, binary.BigEndian.Uint32(out))
}
```

Output

```text
[104 101 108 108 111] 5 104
68656c6c6f aGVsbG8=
hello hi
hello!
-1 true
de ad be ef 02 01 deadbeef
```

### regex

#### Node.js

```js
const re = /(\w+)@(\w+)\.com/g
const text = 'ann@example.com, bob@test.com'

console.log(re.test(text)) // a /g regex keeps lastIndex between calls
re.lastIndex = 0
console.log([...text.matchAll(re)].map(m => m[1]))
console.log(text.replace(re, '$1 at $2'))

const named = /(?<year>\d{4})-(?<month>\d{2})/.exec('2026-10')
console.log(named.groups.year, named.groups.month)

console.log(RegExp.escape('1+1=2?')) // Node 24
```

Output

```text
true
[ 'ann', 'bob' ]
ann at example, bob at test
2026 10
\x31\+1\x3d2\?
```

#### Go

```go
package main

import (
	"fmt"
	"regexp"
)

// compile once at package level; MustCompile panics on a bad pattern
var re = regexp.MustCompile(`(\w+)@(\w+)\.com`)

func main() {
	text := "ann@example.com, bob@test.com"

	fmt.Println(re.MatchString(text))
	for _, m := range re.FindAllStringSubmatch(text, -1) {
		fmt.Print(m[1], " ")
	}
	fmt.Println()
	fmt.Println(re.ReplaceAllString(text, "$1 at $2"))

	named := regexp.MustCompile(`(?P<year>\d{4})-(?P<month>\d{2})`)
	m := named.FindStringSubmatch("2026-10")
	fmt.Println(m[named.SubexpIndex("year")], m[named.SubexpIndex("month")])

	fmt.Println(regexp.QuoteMeta("1+1=2?"))
}
```

Output

```text
true
ann bob 
ann at example, bob at test
2026 10
1\+1=2\?
```

Go's `regexp` uses RE2: matching is guaranteed linear time, so there are no lookaheads, lookbehinds, or backreferences.

## Functions

### functions and closures

#### Node.js

```js
function add(a, b) {
  return a + b
}

const multiply = (a, b) => a * b

function divmod(a, b) {
  return [Math.trunc(a / b), a % b]
}

function counter() {
  let n = 0
  return () => ++n
}

const next = counter()
next()
const apply = (fn, x) => fn(x)

console.log(add(1, 2), multiply(2, 3), divmod(7, 2), next(), apply(x => x * 10, 4))
```

Output

```text
3 6 [ 3, 1 ] 2 40
```

#### Go

```go
package main

import "fmt"

func add(a, b int) int {
	return a + b
}

// multiple return values instead of returning an array
func divmod(a, b int) (int, int) {
	return a / b, a % b
}

// named results document meaning; a bare return returns them
func split(sum int) (x, y int) {
	x = sum * 4 / 9
	y = sum - x
	return
}

// closures capture variables by reference
func counter() func() int {
	n := 0
	return func() int {
		n++
		return n
	}
}

// functions are values with types
func apply(fn func(int) int, x int) int { return fn(x) }

func main() {
	multiply := func(a, b int) int { return a * b }

	next := counter()
	next()

	q, r := divmod(7, 2)
	fmt.Println(add(1, 2), multiply(2, 3), q, r, next(), apply(func(x int) int { return x * 10 }, 4))
	fmt.Println(split(17))
}
```

Output

```text
3 6 3 1 2 40
7 10
```

### default values and options

#### Node.js

```js
function connect(host = 'localhost', { port = 80, tls = false } = {}) {
  return `${tls ? 'https' : 'http'}://${host}:${port}`
}

console.log(connect())
console.log(connect('example.com', { port: 443, tls: true }))
```

Output

```text
http://localhost:80
https://example.com:443
```

#### Go

Go has no default parameters or overloading. Use an options struct whose zero values mean "default", or functional options for public APIs.

```go
package main

import (
	"cmp"
	"fmt"
)

// options struct
type ConnectOptions struct {
	Port int
	TLS  bool
}

func connect(host string, opts ConnectOptions) string {
	host = cmp.Or(host, "localhost")
	port := cmp.Or(opts.Port, 80)
	scheme := "http"
	if opts.TLS {
		scheme = "https"
	}
	return fmt.Sprintf("%s://%s:%d", scheme, host, port)
}

// functional options
type Server struct {
	addr    string
	timeout int
}

type Option func(*Server)

func WithTimeout(sec int) Option { return func(s *Server) { s.timeout = sec } }

func NewServer(addr string, opts ...Option) *Server {
	s := &Server{addr: addr, timeout: 30}
	for _, opt := range opts {
		opt(s)
	}
	return s
}

func main() {
	fmt.Println(connect("", ConnectOptions{}))
	fmt.Println(connect("example.com", ConnectOptions{Port: 443, TLS: true}))
	fmt.Printf("%+v %+v\n", *NewServer(":80"), *NewServer(":80", WithTimeout(5)))
}
```

Output

```text
http://localhost:80
https://example.com:443
{addr::80 timeout:30} {addr::80 timeout:5}
```

### IIFE

#### Node.js

```js
const value = (() => {
  const secret = 21
  return secret * 2
})()
console.log(value)
```

Output

```text
42
```

#### Go

```go
package main

import "fmt"

func main() {
	value := func() int {
		secret := 21
		return secret * 2
	}()
	fmt.Println(value)
}
```

Output

```text
42
```

### generics

#### Node.js

JavaScript is dynamically typed; TypeScript generics are erased at runtime.

```js
// TypeScript: function first<T>(items: T[]): T | undefined
function first(items) {
  return items[0]
}

class Stack {
  #items = []
  push(v) { this.#items.push(v) }
  pop() { return this.#items.pop() }
}

const s = new Stack()
s.push(1)
s.push(2)
console.log(first(['a', 'b']), s.pop())
```

Output

```text
a 2
```

#### Go

```go
package main

import (
	"cmp"
	"fmt"
)

// type parameters with constraints
func First[T any](items []T) (T, bool) {
	var zero T
	if len(items) == 0 {
		return zero, false
	}
	return items[0], true
}

// cmp.Ordered: any type supporting < <= >= >
func MaxOf[T cmp.Ordered](a T, rest ...T) T {
	m := a
	for _, v := range rest {
		m = max(m, v)
	}
	return m
}

// a constraint can list types; ~ includes types defined on them
type Number interface {
	~int | ~int64 | ~float64
}

func Sum[T Number](nums []T) T {
	var total T
	for _, n := range nums {
		total += n
	}
	return total
}

// generic type
type Stack[T any] struct{ items []T }

func (s *Stack[T]) Push(v T) { s.items = append(s.items, v) }

func (s *Stack[T]) Pop() (T, bool) {
	var zero T
	if len(s.items) == 0 {
		return zero, false
	}
	v := s.items[len(s.items)-1]
	s.items = s.items[:len(s.items)-1]
	return v, true
}

type Celsius float64

func main() {
	v, ok := First([]string{"a", "b"})
	fmt.Println(v, ok)
	fmt.Println(MaxOf(3, 9, 4), MaxOf("pear", "apple"))
	fmt.Println(Sum([]Celsius{1.5, 2.5}))

	var s Stack[int]
	s.Push(1)
	s.Push(2)
	fmt.Println(s.Pop())
}
```

Output

```text
a true
9 pear
4
2 true
```

Reach for generics for containers and algorithms that are truly type-independent. For behavior, prefer interfaces.

### defer and cleanup

#### Node.js

```js
function work() {
  try {
    console.log('working')
    return 'result'
  } finally {
    console.log('cleanup runs last')
  }
}
console.log(work())

// explicit resource management, Node 24
function open(name) {
  console.log('open', name)
  return { [Symbol.dispose]() { console.log('close', name) } }
}
{
  using a = open('a')
  using b = open('b')
  console.log('using both')
} // disposed in reverse order
```

Output

```text
working
cleanup runs last
result
open a
open b
using both
close b
close a
```

#### Go

```go
package main

import "fmt"

func work() string {
	defer fmt.Println("cleanup runs last")
	fmt.Println("working")
	return "result"
}

type resource struct{ name string }

func open(name string) *resource {
	fmt.Println("open", name)
	return &resource{name}
}

func (r *resource) Close() { fmt.Println("close", r.name) }

func main() {
	fmt.Println(work())

	func() {
		a := open("a")
		defer a.Close() // deferred calls run when the function returns, last in first out
		b := open("b")
		defer b.Close()
		fmt.Println("using both")
	}()

	// arguments are evaluated when defer runs, not when the function exits
	for i := range 3 {
		defer fmt.Print(i, " ")
	}
}
```

Output

```text
working
cleanup runs last
result
open a
open b
using both
close b
close a
2 1 0 
```

`defer` is function scoped, not block scoped: deferring inside a long loop holds every resource until the function returns. Wrap the loop body in a function instead.

## Types and objects

### objects and structs

#### Node.js

```js
const user = { name: 'Ann', age: 30, tags: ['admin'] }
user.age++
user.email = 'ann@example.com' // add fields at runtime
delete user.tags

const copy = { ...user }       // shallow copy
const deep = structuredClone(user)

console.log(user, copy === user, deep.name)
console.log(JSON.stringify(user))
```

Output

```text
{ name: 'Ann', age: 31, email: 'ann@example.com' } false Ann
{"name":"Ann","age":31,"email":"ann@example.com"}
```

#### Go

```go
package main

import "fmt"

type User struct {
	Name string
	Age  int
	Tags []string
}

func main() {
	user := User{Name: "Ann", Age: 30, Tags: []string{"admin"}}
	user.Age++

	copied := user // structs are values: assignment copies the fields
	copied.Name = "Bob"
	copied.Tags[0] = "root" // but the slice inside still shares memory

	ptr := &user // pointers share one struct
	ptr.Age = 40

	fmt.Printf("%+v\n%+v\n", user, copied)

	// anonymous struct for one-off shapes
	point := struct{ X, Y int }{1, 2}
	fmt.Println(point, point == struct{ X, Y int }{1, 2})
}
```

Output

```text
{Name:Ann Age:40 Tags:[root]}
{Name:Bob Age:31 Tags:[root]}
{1 2} true
```

Struct fields are fixed at compile time; use `map[string]any` only for truly dynamic data. Structs compare with `==` only when every field is comparable, so `User` (which holds a slice) cannot be compared, but `point` can.

### classes and methods

#### Node.js

```js
class Animal {
  #sound // private field

  constructor(name, sound) {
    this.name = name
    this.#sound = sound
  }

  speak() {
    return `${this.name} says ${this.#sound}`
  }

  static create(name) {
    return new Animal(name, '...')
  }
}

class Dog extends Animal {
  constructor(name) {
    super(name, 'woof')
  }

  speak() {
    return super.speak() + '!'
  }

  fetch() {
    return `${this.name} fetches`
  }
}

const d = new Dog('Rex')
console.log(d.speak(), d.fetch(), Animal.create('Cat').speak(), d instanceof Animal)
```

Output

```text
Rex says woof! Rex fetches Cat says ... true
```

#### Go

```go
package main

import "fmt"

// Lowercase identifiers are private to the package; uppercase are exported.
type Animal struct {
	Name  string
	sound string
}

// constructor by convention: NewX returns a ready-to-use value
func NewAnimal(name, sound string) *Animal {
	return &Animal{Name: name, sound: sound}
}

// pointer receiver: can modify a and avoids copying
func (a *Animal) Speak() string {
	return a.Name + " says " + a.sound
}

// embedding promotes Animal's fields and methods; it is composition, not inheritance
type Dog struct {
	*Animal
}

func NewDog(name string) *Dog {
	return &Dog{Animal: NewAnimal(name, "woof")}
}

// "overriding" shadows the promoted method; call the inner one explicitly
func (d *Dog) Speak() string { return d.Animal.Speak() + "!" }

func (d *Dog) Fetch() string { return d.Name + " fetches" }

func main() {
	d := NewDog("Rex")
	fmt.Println(d.Speak(), d.Fetch(), NewAnimal("Cat", "...").Speak())
	// a *Dog is not an *Animal; there is no instanceof across struct types
	var a *Animal = d.Animal
	fmt.Println(a.Name)
}
```

Output

```text
Rex says woof! Rex fetches Cat says ...
Rex
```

There is no `this`: the receiver (`a`, `d`) is an ordinary named parameter, so method values never lose their binding.

```go
package main

import "fmt"

type Counter struct{ n int }

func (c *Counter) Inc() { c.n++ }

func main() {
	c := &Counter{}
	inc := c.Inc // bound to c, unlike const inc = obj.inc in JS
	inc()
	inc()
	fmt.Println(c.n)
}
```

Output

```text
2
```

### interfaces

#### Node.js

```js
// duck typing: anything with area() works
const shapes = [
  { area: () => 4 },
  new (class Circle { constructor(r) { this.r = r } area() { return 3 * this.r ** 2 } })(1),
]
console.log(shapes.reduce((sum, s) => sum + s.area(), 0))
```

Output

```text
7
```

#### Go

```go
package main

import (
	"fmt"
	"math"
)

// Interfaces are satisfied implicitly; no "implements" keyword.
type Shape interface {
	Area() float64
}

type Square struct{ Side float64 }
type Circle struct{ R float64 }

func (s Square) Area() float64 { return s.Side * s.Side }
func (c Circle) Area() float64 { return math.Pi * c.R * c.R }

// String makes a type print nicely, like toString()
func (c Circle) String() string { return fmt.Sprintf("Circle(r=%g)", c.R) }

func totalArea(shapes ...Shape) float64 {
	var sum float64
	for _, s := range shapes {
		sum += s.Area()
	}
	return sum
}

// compile-time check that Circle implements Shape
var _ Shape = Circle{}

func main() {
	fmt.Printf("%.2f\n", totalArea(Square{2}, Circle{1}))
	fmt.Println(Circle{2})

	var s Shape = Square{3}
	if sq, ok := s.(Square); ok {
		fmt.Println("square with side", sq.Side)
	}
}
```

Output

```text
7.14
Circle(r=2)
square with side 3
```

Keep interfaces small (`io.Reader` has one method) and declare them where they are used, not next to the implementation.

### enums

#### Node.js

```js
const Status = Object.freeze({ Active: 'active', Disabled: 'disabled' })

function label(status) {
  switch (status) {
    case Status.Active: return 'on'
    case Status.Disabled: return 'off'
    default: throw new Error(`unknown status ${status}`)
  }
}
console.log(label(Status.Active), Object.values(Status))
```

Output

```text
on [ 'active', 'disabled' ]
```

#### Go

```go
package main

import "fmt"

type Status int

const (
	Active Status = iota + 1 // start at 1 so the zero value means "unset"
	Disabled
)

func (s Status) String() string {
	switch s {
	case Active:
		return "active"
	case Disabled:
		return "disabled"
	default:
		return fmt.Sprintf("Status(%d)", int(s))
	}
}

func main() {
	var unset Status
	fmt.Println(Active, Disabled, unset, Status(9))
	fmt.Printf("%d %v\n", Disabled, Disabled)
}
```

Output

```text
active disabled Status(0) Status(9)
2 disabled
```

`go generate` with `golang.org/x/tools/cmd/stringer` writes the `String` method for you.

### pointers and values

#### Node.js

```js
// arguments are copied, but an object argument is a reference to the same object
function rename(user) { user.name = 'changed' }
function bump(n) { n++ }

const user = { name: 'orig' }
let n = 1
rename(user)
bump(n)
console.log(user.name, n)
```

Output

```text
changed 1
```

#### Go

```go
package main

import "fmt"

type User struct{ Name string }

func renameCopy(u User) { u.Name = "changed" } // gets a copy
func rename(u *User)    { u.Name = "changed" } // gets the address
func bump(n *int)       { *n++ }

func main() {
	u := User{Name: "orig"}
	renameCopy(u)
	fmt.Println(u.Name)

	rename(&u)
	n := 1
	bump(&n)
	fmt.Println(u.Name, n)

	p := new(int) // pointer to a zero int
	*p = 5
	q := new(42) // Go 1.26: new accepts an expression
	fmt.Println(*p, *q)

	var missing *User
	fmt.Println(missing == nil) // dereferencing it would panic
}
```

Output

```text
orig
changed 2
5 42
true
```

Everything in Go is passed by value. Slices, maps, channels, functions, and interfaces are small values that point to shared data, which is why modifying a map inside a function is visible to the caller. There is no pointer arithmetic.

## Errors

### errors as values

#### Node.js

```js
function parsePort(s) {
  const n = Number(s)
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new RangeError(`invalid port ${JSON.stringify(s)}`)
  }
  return n
}

for (const input of ['8080', 'abc']) {
  try {
    console.log('port', parsePort(input))
  } catch (err) {
    console.log(err.name, err.message)
  }
}
```

Output

```text
port 8080
RangeError invalid port "abc"
```

#### Go

```go
package main

import (
	"errors"
	"fmt"
	"strconv"
)

// error is an interface with one method: Error() string
func parsePort(s string) (int, error) {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0, fmt.Errorf("invalid port %q: %w", s, err) // %w wraps the cause
	}
	if n < 1 || n > 65535 {
		return 0, errors.New("port out of range")
	}
	return n, nil
}

func main() {
	for _, input := range []string{"8080", "abc", "70000"} {
		port, err := parsePort(input)
		if err != nil {
			fmt.Println("error:", err)
			continue
		}
		fmt.Println("port", port)
	}
}
```

Output

```text
port 8080
error: invalid port "abc": strconv.Atoi: parsing "abc": invalid syntax
error: port out of range
```

Check `err` right after every call that returns one. The `if err != nil` repetition is deliberate: every failure path is visible.

### wrapping and inspecting errors

#### Node.js

```js
class NotFoundError extends Error {
  constructor(id) {
    super(`user ${id} not found`)
    this.name = 'NotFoundError'
    this.id = id
  }
}

function loadUser(id) {
  try {
    throw new NotFoundError(id)
  } catch (cause) {
    throw new Error('load profile', { cause })
  }
}

try {
  loadUser(7)
} catch (err) {
  console.log(err.message, '<-', err.cause.message)
  console.log(err.cause instanceof NotFoundError, err.cause.id)
  console.log(Error.isError(err)) // Node 24, works across realms
}

const all = new AggregateError([new Error('a'), new Error('b')], 'many failed')
console.log(all.message, all.errors.map(e => e.message))
```

Output

```text
load profile <- user 7 not found
true 7
true
many failed [ 'a', 'b' ]
```

#### Go

```go
package main

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
)

// sentinel error: compare with errors.Is
var ErrNotFound = errors.New("not found")

// custom error type: extract with errors.As / errors.AsType
type NotFoundError struct{ ID int }

func (e *NotFoundError) Error() string { return fmt.Sprintf("user %d not found", e.ID) }

func (e *NotFoundError) Unwrap() error { return ErrNotFound }

func loadUser(id int) error {
	return fmt.Errorf("load profile: %w", &NotFoundError{ID: id})
}

func main() {
	err := loadUser(7)
	fmt.Println(err)
	fmt.Println(errors.Is(err, ErrNotFound)) // walks the Unwrap chain

	// Go 1.26: generic, no target variable needed
	if nf, ok := errors.AsType[*NotFoundError](err); ok {
		fmt.Println("missing id", nf.ID)
	}

	// classic form
	var nf *NotFoundError
	fmt.Println(errors.As(err, &nf), nf.ID)

	_, err = os.Open("/no/such/file")
	fmt.Println(errors.Is(err, fs.ErrNotExist))

	joined := errors.Join(errors.New("a"), errors.New("b"))
	fmt.Println(joined)
}
```

Output

```text
load profile: user 7 not found
true
missing id 7
true 7
true
a
b
```

Wrap with `%w` when callers may need the cause, and add context once per layer ("load profile: ..."), not a stack trace.

### panic and recover

#### Node.js

```js
process.on('uncaughtException', err => {
  console.log('caught at top level:', err.message)
})

function risky() {
  throw new Error('boom')
}

try {
  risky()
} catch (err) {
  console.log('recovered:', err.message)
}

setTimeout(() => risky(), 0) // thrown outside any try/catch
```

Output

```text
recovered: boom
caught at top level: boom
```

#### Go

`panic` is for programmer errors (nil dereference, out of range index, impossible states), not for expected failures.

```go
package main

import (
	"errors"
	"fmt"
)

func risky() {
	panic("boom")
}

// recover only works inside a deferred function
func safely(fn func()) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("recovered: %v", r)
		}
	}()
	fn()
	return nil
}

func main() {
	fmt.Println(safely(risky))

	fmt.Println(safely(func() {
		var s []int
		_ = s[3]
	}))

	err := safely(func() { panic(errors.New("typed")) })
	fmt.Println(err)
}
```

Output

```text
recovered: boom
recovered: runtime error: index out of range [3] with length 0
recovered: typed
```

A panic in a goroutine that nobody recovers crashes the whole program, unlike an unhandled rejection in Node which you can log and survive. `net/http` recovers panics per request for you.

### stack traces

#### Node.js

```js
function inner() {
  return new Error('where am I').stack.split('\n').slice(0, 2).join('\n')
}
console.log(inner().replace(/\(.*\//, '('))
```

Output (varies)

```text
Error: where am I
    at inner (main.mjs:2:10)
```

#### Go

```go
package main

import (
	"fmt"
	"runtime"
	"runtime/debug"
	"strings"
)

func inner() {
	_, file, line, _ := runtime.Caller(0)
	fmt.Println(file[strings.LastIndex(file, "/")+1:], line)

	stack := string(debug.Stack()) // full goroutine stack, like err.stack
	fmt.Println(strings.Contains(stack, "main.inner"))
}

func main() { inner() }
```

Output

```text
main.go 11
true
```

Go errors do not capture stacks. Add context while wrapping instead; an unrecovered panic prints every goroutine's stack.

## Iterators and generators

### generators

#### Node.js

```js
function* fibonacci() {
  let [a, b] = [0, 1]
  while (true) {
    yield a
    ;[a, b] = [b, a + b]
  }
}

for (const n of fibonacci()) {
  if (n > 50) break
  process.stdout.write(n + ' ')
}
console.log()

function* entries(obj) {
  for (const k of Object.keys(obj)) yield [k, obj[k]]
}
for (const [k, v] of entries({ a: 1, b: 2 })) console.log(k, v)
```

Output

```text
0 1 1 2 3 5 8 13 21 34 
a 1
b 2
```

#### Go

Since Go 1.23 any function of shape `func(yield func(V) bool)` can be ranged over. The `iter` package names these `iter.Seq[V]` and `iter.Seq2[K, V]`.

```go
package main

import (
	"fmt"
	"iter"
)

func Fibonacci() iter.Seq[int] {
	return func(yield func(int) bool) {
		a, b := 0, 1
		for {
			if !yield(a) { // false when the loop body breaks
				return
			}
			a, b = b, a+b
		}
	}
}

func Entries[K comparable, V any](keys []K, m map[K]V) iter.Seq2[K, V] {
	return func(yield func(K, V) bool) {
		for _, k := range keys {
			if !yield(k, m[k]) {
				return
			}
		}
	}
}

func main() {
	for n := range Fibonacci() {
		if n > 50 {
			break
		}
		fmt.Print(n, " ")
	}
	fmt.Println()

	for k, v := range Entries([]string{"a", "b"}, map[string]int{"a": 1, "b": 2}) {
		fmt.Println(k, v)
	}

	// pull style, like calling gen.next()
	next, stop := iter.Pull(Fibonacci())
	defer stop()
	for range 3 {
		v, ok := next()
		fmt.Print(v, ok, " ")
	}
	fmt.Println()
}
```

Output

```text
0 1 1 2 3 5 8 13 21 34 
a 1
b 2
0 true 1 true 1 true 
```

### iterator helpers

#### Node.js

```js
const evensSquared = Iterator.from([1, 2, 3, 4, 5, 6])
  .filter(n => n % 2 === 0)
  .map(n => n * n)
  .take(2)
  .toArray()

console.log(evensSquared)
console.log(new Map([['b', 2], ['a', 1]]).keys().toArray().sort())
```

Output

```text
[ 4, 16 ]
[ 'a', 'b' ]
```

#### Go

The standard library ships producers (`slices.Values`, `maps.Keys`, `strings.SplitSeq`, ...) and consumers (`slices.Collect`, `slices.Sorted`, `maps.Collect`), but no `Map`/`Filter`. Write small adapters when they pay off:

```go
package main

import (
	"fmt"
	"iter"
	"maps"
	"slices"
)

func Filter[V any](seq iter.Seq[V], keep func(V) bool) iter.Seq[V] {
	return func(yield func(V) bool) {
		for v := range seq {
			if keep(v) && !yield(v) {
				return
			}
		}
	}
}

func Map[V, U any](seq iter.Seq[V], f func(V) U) iter.Seq[U] {
	return func(yield func(U) bool) {
		for v := range seq {
			if !yield(f(v)) {
				return
			}
		}
	}
}

func Take[V any](seq iter.Seq[V], n int) iter.Seq[V] {
	return func(yield func(V) bool) {
		if n <= 0 {
			return
		}
		i := 0
		for v := range seq {
			if !yield(v) {
				return
			}
			if i++; i == n {
				return
			}
		}
	}
}

func main() {
	nums := slices.Values([]int{1, 2, 3, 4, 5, 6})
	evens := Filter(nums, func(n int) bool { return n%2 == 0 })
	squared := Map(evens, func(n int) int { return n * n })
	fmt.Println(slices.Collect(Take(squared, 2)))

	fmt.Println(slices.Sorted(maps.Keys(map[string]int{"b": 2, "a": 1})))
}
```

Output

```text
[4 16]
[a b]
```

## Dates and timers

### datetime

#### Node.js

```js
const t = new Date(Date.UTC(2026, 0, 15, 9, 30)) // months are 0-based
console.log(t.toISOString())
console.log(t.getTime(), Math.floor(t.getTime() / 1000))

const parsed = new Date('2026-03-01T12:00:00Z')
console.log((parsed - t) / 86_400_000, 'days apart')

const later = new Date(t)
later.setUTCDate(later.getUTCDate() + 30)
console.log(later.toISOString().slice(0, 10))

console.log(new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tokyo',
}).format(t))
```

Output

```text
2026-01-15T09:30:00.000Z
1768469400000 1768469400
45.104166666666664 days apart
2026-02-14
Jan 15, 2026, 6:30 PM
```

#### Go

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	t := time.Date(2026, time.January, 15, 9, 30, 0, 0, time.UTC)
	fmt.Println(t.Format(time.RFC3339))
	fmt.Println(t.UnixMilli(), t.Unix())

	parsed, err := time.Parse(time.RFC3339, "2026-03-01T12:00:00Z")
	if err != nil {
		panic(err)
	}
	diff := parsed.Sub(t) // time.Duration
	fmt.Println(diff, diff.Hours()/24, "days apart")

	fmt.Println(t.AddDate(0, 0, 30).Format(time.DateOnly))
	fmt.Println(t.Add(90 * time.Minute).Format(time.Kitchen))

	// layouts are written with the reference time Mon Jan 2 15:04:05 MST 2006
	fmt.Println(t.Format("Jan 2, 2006 at 3:04 PM"), t.Format("2006/01/02"))

	tokyo, _ := time.LoadLocation("Asia/Tokyo")
	fmt.Println(t.In(tokyo).Format("Jan 2, 2006, 3:04 PM MST"))

	d, _ := time.ParseDuration("1h15m30s")
	fmt.Println(d.Seconds(), t.Before(parsed), t.Truncate(time.Hour).Format(time.TimeOnly))
}
```

Output

```text
2026-01-15T09:30:00Z
1768469400000 1768469400
1082h30m0s 45.104166666666664 days apart
2026-02-14
11:00AM
Jan 15, 2026 at 9:30 AM 2026/01/15
Jan 15, 2026, 6:30 PM JST
4530 true 09:00:00
```

Use `time.Since(start)` to measure elapsed time; it uses the monotonic clock, so it is safe across wall clock changes.

### timeout

#### Node.js

```js
import { setTimeout as sleep } from 'node:timers/promises'

const handle = setTimeout(() => console.log('never runs'), 100)
clearTimeout(handle)

setTimeout(() => console.log('after 50ms'), 50)
await sleep(100)
console.log('after sleeping 100ms')
```

Output

```text
after 50ms
after sleeping 100ms
```

#### Go

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	timer := time.AfterFunc(100*time.Millisecond, func() { fmt.Println("never runs") })
	timer.Stop()

	time.AfterFunc(50*time.Millisecond, func() { fmt.Println("after 50ms") }) // runs in its own goroutine
	time.Sleep(100 * time.Millisecond)                                        // blocks only this goroutine
	fmt.Println("after sleeping 100ms")

	<-time.After(10 * time.Millisecond) // a channel that receives once, handy in select
	fmt.Println("timed out")
}
```

Output

```text
after 50ms
after sleeping 100ms
timed out
```

### interval

#### Node.js

```js
import { setInterval as every } from 'node:timers/promises'

let n = 0
const id = setInterval(() => {
  console.log('tick', ++n)
  if (n === 3) clearInterval(id)
}, 20)

await new Promise(r => setTimeout(r, 100))

for await (const _ of every(20)) {
  console.log('async tick')
  break
}
```

Output

```text
tick 1
tick 2
tick 3
async tick
```

#### Go

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ticker := time.NewTicker(20 * time.Millisecond)
	defer ticker.Stop()

	for n := 1; n <= 3; n++ {
		<-ticker.C
		fmt.Println("tick", n)
	}
}
```

Output

```text
tick 1
tick 2
tick 3
```

## Async and concurrency

### async/await

#### Node.js

```js
import { setTimeout as sleep } from 'node:timers/promises'

async function fetchUser(id) {
  await sleep(50) // I/O happens elsewhere; the thread is free meanwhile
  if (id < 0) throw new Error(`bad id ${id}`)
  return { id, name: `user${id}` }
}

const user = await fetchUser(1)
console.log(user)

try {
  await fetchUser(-1)
} catch (err) {
  console.log('error:', err.message)
}
```

Output

```text
{ id: 1, name: 'user1' }
error: bad id -1
```

#### Go

There are no async functions. Write blocking code; run it concurrently by starting a goroutine with `go`. Blocking a goroutine is cheap: the runtime parks it and runs others.

```go
package main

import (
	"fmt"
	"time"
)

type User struct {
	ID   int
	Name string
}

func fetchUser(id int) (User, error) {
	time.Sleep(50 * time.Millisecond)
	if id < 0 {
		return User{}, fmt.Errorf("bad id %d", id)
	}
	return User{id, fmt.Sprintf("user%d", id)}, nil
}

func main() {
	user, err := fetchUser(1) // looks synchronous, and that is the point
	fmt.Println(user, err)

	if _, err := fetchUser(-1); err != nil {
		fmt.Println("error:", err)
	}

	// "fire and await later": a goroutine plus a channel
	result := make(chan User, 1)
	go func() {
		u, _ := fetchUser(2)
		result <- u
	}()
	fmt.Println("doing other work")
	fmt.Println(<-result)
}
```

Output

```text
{1 user1} <nil>
error: bad id -1
doing other work
{2 user2}
```

### Promise.all

#### Node.js

```js
import { setTimeout as sleep } from 'node:timers/promises'

async function fetchUser(id) {
  await sleep(50 * (4 - id))
  if (id === 99) throw new Error('bad id 99')
  return `user${id}`
}

console.time('all')
console.log(await Promise.all([1, 2, 3].map(fetchUser))) // keeps input order
console.timeEnd('all')

const settled = await Promise.allSettled([fetchUser(1), fetchUser(99)])
console.log(settled.map(r => r.status))

try {
  await Promise.all([fetchUser(1), fetchUser(99)])
} catch (err) {
  console.log('first error:', err.message)
}
```

Output (varies)

```text
[ 'user1', 'user2', 'user3' ]
all: 152.4ms
[ 'fulfilled', 'rejected' ]
first error: bad id 99
```

#### Go

`sync.WaitGroup.Go` (Go 1.25) starts a goroutine and tracks it; write results by index so order is kept without locks.

```go
package main

import (
	"errors"
	"fmt"
	"sync"
	"time"
)

func fetchUser(id int) (string, error) {
	time.Sleep(time.Duration(4-id) * 50 * time.Millisecond)
	if id == 99 {
		return "", errors.New("bad id 99")
	}
	return fmt.Sprintf("user%d", id), nil
}

func main() {
	start := time.Now()
	ids := []int{1, 2, 3}
	results := make([]string, len(ids))
	errs := make([]error, len(ids))

	var wg sync.WaitGroup
	for i, id := range ids {
		wg.Go(func() {
			results[i], errs[i] = fetchUser(id)
		})
	}
	wg.Wait()

	fmt.Println(results, errors.Join(errs...))
	fmt.Println("concurrent:", time.Since(start) < 300*time.Millisecond) // sequential would take 300ms
}
```

Output

```text
[user1 user2 user3] <nil>
concurrent: true
```

For "fail fast on first error and cancel the rest", use `golang.org/x/sync/errgroup` (an official Go module outside the standard library):

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"time"

	"golang.org/x/sync/errgroup"
)

func fetchUser(ctx context.Context, id int) (string, error) {
	select {
	case <-time.After(time.Duration(id) * 20 * time.Millisecond):
	case <-ctx.Done():
		return "", ctx.Err()
	}
	if id == 2 {
		return "", errors.New("bad id 2")
	}
	return fmt.Sprintf("user%d", id), nil
}

func main() {
	g, ctx := errgroup.WithContext(context.Background())
	g.SetLimit(10) // at most 10 goroutines at once, like p-limit

	ids := []int{1, 2, 3}
	results := make([]string, len(ids))
	for i, id := range ids {
		g.Go(func() error {
			var err error
			results[i], err = fetchUser(ctx, id)
			return err
		})
	}

	err := g.Wait() // first error; ctx is cancelled so id 3 stops early
	fmt.Println(err)
	fmt.Printf("%q\n", results)
}
```

Output

```text
bad id 2
["user1" "" ""]
```

### Promise.race and select

#### Node.js

```js
import { setTimeout as sleep } from 'node:timers/promises'

const slow = sleep(200).then(() => 'slow')
const fast = sleep(50).then(() => 'fast')
console.log(await Promise.race([slow, fast]))

const timeout = ms => sleep(ms).then(() => { throw new Error('timeout') })
try {
  await Promise.race([sleep(200), timeout(50)])
} catch (err) {
  console.log(err.message)
}
```

Output

```text
fast
timeout
```

#### Go

```go
package main

import (
	"fmt"
	"time"
)

func after(d time.Duration, v string) <-chan string {
	ch := make(chan string, 1) // buffered so the sender never blocks if nobody reads
	go func() {
		time.Sleep(d)
		ch <- v
	}()
	return ch
}

func main() {
	// select waits on several channel operations and runs the first ready one
	select {
	case v := <-after(200*time.Millisecond, "slow"):
		fmt.Println(v)
	case v := <-after(50*time.Millisecond, "fast"):
		fmt.Println(v)
	}

	select {
	case <-after(200*time.Millisecond, "work"):
		fmt.Println("done")
	case <-time.After(50 * time.Millisecond):
		fmt.Println("timeout")
	}

	// default makes select non-blocking
	ch := make(chan int)
	select {
	case v := <-ch:
		fmt.Println(v)
	default:
		fmt.Println("nothing ready")
	}
}
```

Output

```text
fast
timeout
nothing ready
```

### cancellation: AbortController and context

#### Node.js

```js
import { setTimeout as sleep } from 'node:timers/promises'

async function work(signal) {
  for (let i = 1; ; i++) {
    signal.throwIfAborted()
    await sleep(40, undefined, { signal })
    console.log('step', i)
  }
}

const signal = AbortSignal.timeout(100)
try {
  await work(signal)
} catch (err) {
  // sleep rejects with an AbortError; the reason lives on the signal
  console.log(err.name, signal.reason.name)
}

const controller = new AbortController()
setTimeout(() => controller.abort(new Error('user cancelled')), 60)
try {
  await work(controller.signal)
} catch {
  console.log(controller.signal.reason.message)
}
```

Output

```text
step 1
step 2
AbortError TimeoutError
step 1
user cancelled
```

#### Go

`context.Context` carries cancellation, deadlines, and request-scoped values. Pass it as the first parameter to anything that blocks.

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"time"
)

func work(ctx context.Context) error {
	for i := 1; ; i++ {
		select {
		case <-ctx.Done():
			return context.Cause(ctx)
		case <-time.After(40 * time.Millisecond):
			fmt.Println("step", i)
		}
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel() // always release resources
	err := work(ctx)
	fmt.Println(err, errors.Is(err, context.DeadlineExceeded))

	ctx2, cancel2 := context.WithCancelCause(context.Background())
	time.AfterFunc(60*time.Millisecond, func() { cancel2(errors.New("user cancelled")) })
	fmt.Println(work(ctx2))

	// run a callback once ctx2 is done, like signal.addEventListener('abort', ...)
	context.AfterFunc(ctx2, func() { fmt.Println("cleanup after cancel") })
	time.Sleep(10 * time.Millisecond)
}
```

Output

```text
step 1
step 2
context deadline exceeded true
step 1
user cancelled
cleanup after cancel
```

### channels and message passing

#### Node.js

```js
// an async generator plays the role of a producer
async function* producer() {
  for (let i = 1; i <= 3; i++) {
    await new Promise(r => setTimeout(r, 10))
    yield i
  }
}

for await (const n of producer()) {
  console.log('received', n)
}
console.log('producer finished')
```

Output

```text
received 1
received 2
received 3
producer finished
```

#### Go

"Do not communicate by sharing memory; share memory by communicating."

```go
package main

import (
	"fmt"
	"sync"
)

func producer(n int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out) // closing ends the consumer's range loop
		for i := 1; i <= n; i++ {
			out <- i // blocks until a receiver is ready
		}
	}()
	return out
}

// fan-out: several workers read from one channel
func square(in <-chan int, workers int) <-chan int {
	out := make(chan int)
	var wg sync.WaitGroup
	for range workers {
		wg.Go(func() {
			for v := range in {
				out <- v * v
			}
		})
	}
	go func() {
		wg.Wait()
		close(out)
	}()
	return out
}

func main() {
	for n := range producer(3) {
		fmt.Println("received", n)
	}
	fmt.Println("producer finished")

	sum := 0
	for v := range square(producer(100), 4) {
		sum += v
	}
	fmt.Println("sum of squares", sum)
}
```

Output

```text
received 1
received 2
received 3
producer finished
sum of squares 338350
```

Rules of thumb: the sender closes, never the receiver; sending on a closed channel panics; receiving from a closed channel yields the zero value immediately (`v, ok := <-ch` tells you which).

### shared state and mutexes

#### Node.js

```js
// one thread runs your JS, so this is safe without locks
let counter = 0
await Promise.all(Array.from({ length: 1000 }, async () => { counter++ }))
console.log(counter)

// memoize a promise so concurrent callers share one load
let configPromise
const loadConfig = () => (configPromise ??= Promise.resolve({ debug: true }))
console.log(await loadConfig() === await loadConfig())
```

Output

```text
1000
true
```

#### Go

Goroutines run in parallel, so unsynchronized writes are data races. Run tests with `go test -race`.

```go
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

type Counter struct {
	mu sync.Mutex
	m  map[string]int
}

func (c *Counter) Inc(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.m[key]++
}

type Config struct{ Debug bool }

// OnceValue runs the function once, even under concurrent calls
var loadConfig = sync.OnceValue(func() *Config {
	fmt.Println("loading config")
	return &Config{Debug: true}
})

func main() {
	c := Counter{m: map[string]int{}}
	var hits atomic.Int64
	var wg sync.WaitGroup
	for range 1000 {
		wg.Go(func() {
			c.Inc("a")
			hits.Add(1)
		})
	}
	wg.Wait()
	fmt.Println(c.m["a"], hits.Load())

	fmt.Println(loadConfig() == loadConfig())
}
```

Output

```text
1000 1000
loading config
true
```

### event emitter

#### Node.js

```js
import { EventEmitter, once } from 'node:events'

const emitter = new EventEmitter()
emitter.on('message', msg => console.log('got', msg))
emitter.once('message', () => console.log('only the first time'))

emitter.emit('message', 'hello')
emitter.emit('message', 'again')

setTimeout(() => emitter.emit('ready', 42), 10)
const [value] = await once(emitter, 'ready')
console.log('ready with', value)
```

Output

```text
got hello
only the first time
got again
ready with 42
```

#### Go

No built-in emitter. Callbacks guarded by a mutex cover in-process events; channels cover "wait for an event".

```go
package main

import (
	"fmt"
	"sync"
)

type Emitter[T any] struct {
	mu        sync.Mutex
	listeners map[string][]func(T)
}

func (e *Emitter[T]) On(event string, fn func(T)) {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.listeners == nil {
		e.listeners = map[string][]func(T){}
	}
	e.listeners[event] = append(e.listeners[event], fn)
}

func (e *Emitter[T]) Emit(event string, v T) {
	e.mu.Lock()
	fns := e.listeners[event]
	e.mu.Unlock()
	for _, fn := range fns { // call outside the lock so listeners can emit
		fn(v)
	}
}

func main() {
	var e Emitter[string]
	e.On("message", func(msg string) { fmt.Println("got", msg) })
	e.Emit("message", "hello")
	e.Emit("message", "again")

	ready := make(chan int, 1)
	go func() { ready <- 42 }()
	fmt.Println("ready with", <-ready)
}
```

Output

```text
got hello
got again
ready with 42
```

### worker threads and CPU-bound work

#### Node.js

CPU-heavy JS blocks the event loop. Move it to a worker thread.

```js
import { Worker } from 'node:worker_threads'
import os from 'node:os'

const code = `
  const { parentPort, workerData } = require('node:worker_threads')
  let sum = 0
  for (let i = workerData.from; i < workerData.to; i++) sum += i
  parentPort.postMessage(sum)
`

const n = 4
const chunk = 1e7 / n
const sums = await Promise.all(
  Array.from({ length: n }, (_, k) => new Promise((resolve, reject) => {
    const w = new Worker(code, { eval: true, workerData: { from: k * chunk, to: (k + 1) * chunk } })
    w.once('message', resolve)
    w.once('error', reject)
  })),
)
console.log(sums.reduce((a, b) => a + b), os.availableParallelism() > 0)
```

Output

```text
49999995000000 true
```

#### Go

Goroutines already use every core (`GOMAXPROCS` defaults to the CPU count, and respects container CPU limits since Go 1.25).

```go
package main

import (
	"fmt"
	"runtime"
	"sync"
)

func main() {
	const total = 10_000_000
	n := runtime.NumCPU()
	sums := make([]int, n)
	chunk := total / n

	var wg sync.WaitGroup
	for k := range n {
		wg.Go(func() {
			from, to := k*chunk, (k+1)*chunk
			if k == n-1 {
				to = total
			}
			for i := from; i < to; i++ {
				sums[k] += i
			}
		})
	}
	wg.Wait()

	sum := 0
	for _, s := range sums {
		sum += s
	}
	fmt.Println(sum, runtime.GOMAXPROCS(0) > 0)
}
```

Output

```text
49999995000000 true
```

### process forking

#### Node.js

```js
import { fork } from 'node:child_process'
import { writeFileSync } from 'node:fs'

writeFileSync('child.mjs', `
  process.on('message', msg => {
    process.send({ echo: msg.toUpperCase(), pid: typeof process.pid })
    process.exit(0)
  })
`)

const child = fork('child.mjs')
child.on('message', msg => console.log('from child:', msg))
child.send('hello')
```

Output

```text
from child: { echo: 'HELLO', pid: 'number' }
```

#### Go

There is no `fork` of a running Go program. Run another program with `os/exec` (see [exec](#exec)) or, usually, just start a goroutine.

## Files and I/O

### files

#### Node.js

```js
import { readFile, writeFile, appendFile, rm, stat, open } from 'node:fs/promises'

await writeFile('test.txt', 'hello\n')
await appendFile('test.txt', 'world\n')
console.log(await readFile('test.txt', 'utf8'))

const info = await stat('test.txt')
console.log(info.size, info.isFile())

// file handles for partial reads; `await using` closes it automatically
{
  await using fh = await open('test.txt', 'r')
  const { bytesRead, buffer } = await fh.read(Buffer.alloc(5), 0, 5, 0)
  console.log(bytesRead, buffer.toString())
}

await rm('test.txt')
try {
  await readFile('test.txt')
} catch (err) {
  console.log(err.code)
}
```

Output

```text
hello
world

12 true
5 hello
ENOENT
```

#### Go

```go
package main

import (
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
)

func main() {
	if err := os.WriteFile("test.txt", []byte("hello\n"), 0o644); err != nil {
		panic(err)
	}

	f, err := os.OpenFile("test.txt", os.O_APPEND|os.O_WRONLY, 0)
	if err != nil {
		panic(err)
	}
	f.WriteString("world\n")
	f.Close()

	data, _ := os.ReadFile("test.txt")
	fmt.Println(string(data))

	info, _ := os.Stat("test.txt")
	fmt.Println(info.Size(), info.Mode().IsRegular())

	f, _ = os.Open("test.txt") // read-only
	defer f.Close()
	buf := make([]byte, 5)
	n, _ := io.ReadFull(f, buf)
	fmt.Println(n, string(buf))

	os.Remove("test.txt")
	_, err = os.ReadFile("test.txt")
	fmt.Println(errors.Is(err, fs.ErrNotExist))
}
```

Output

```text
hello
world

12 true
5 hello
true
```

`io/ioutil` is deprecated; its functions moved to `os` and `io`.

### reading lines

#### Node.js

```js
import { createReadStream } from 'node:fs'
import { writeFile, rm } from 'node:fs/promises'
import { createInterface } from 'node:readline'

await writeFile('lines.txt', 'one\ntwo\nthree\n')

const rl = createInterface({ input: createReadStream('lines.txt'), crlfDelay: Infinity })
let n = 0
for await (const line of rl) console.log(++n, line)

await rm('lines.txt')
```

Output

```text
1 one
2 two
3 three
```

#### Go

```go
package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	os.WriteFile("lines.txt", []byte("one\ntwo\nthree\n"), 0o644)
	defer os.Remove("lines.txt")

	f, err := os.Open("lines.txt")
	if err != nil {
		panic(err)
	}
	defer f.Close()

	scanner := bufio.NewScanner(f) // lines up to 64 KiB by default; see scanner.Buffer
	n := 0
	for scanner.Scan() {
		n++
		fmt.Println(n, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		panic(err)
	}
}
```

Output

```text
1 one
2 two
3 three
```

### directories and paths

#### Node.js

```js
import { mkdir, writeFile, readdir, rm, glob } from 'node:fs/promises'
import path from 'node:path'

await mkdir('demo/sub', { recursive: true })
await writeFile('demo/a.txt', '')
await writeFile('demo/sub/b.txt', '')

console.log((await readdir('demo', { recursive: true })).sort())
console.log((await Array.fromAsync(glob('demo/**/*.txt'))).sort())

console.log(path.join('demo', 'sub', '..', 'a.txt'), path.extname('a.tar.gz'), path.basename('/x/y.js', '.js'))
console.log(import.meta.dirname === path.dirname(import.meta.filename))

await rm('demo', { recursive: true, force: true })
```

Output

```text
[ 'a.txt', 'sub', 'sub/b.txt' ]
[ 'demo/a.txt', 'demo/sub/b.txt' ]
demo/a.txt .gz y
true
```

#### Go

```go
package main

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
)

func main() {
	os.MkdirAll("demo/sub", 0o755)
	os.WriteFile("demo/a.txt", nil, 0o644)
	os.WriteFile("demo/sub/b.txt", nil, 0o644)
	defer os.RemoveAll("demo")

	var all []string
	filepath.WalkDir("demo", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if p != "demo" {
			rel, _ := filepath.Rel("demo", p)
			all = append(all, rel)
		}
		return nil
	})
	fmt.Println(all) // WalkDir visits in lexical order

	matches, _ := filepath.Glob("demo/*.txt") // no ** support; use WalkDir or fs.Glob on os.DirFS
	fmt.Println(matches)

	fmt.Println(filepath.Join("demo", "sub", "..", "a.txt"), filepath.Ext("a.tar.gz"), filepath.Base("/x/y.go"))

	// os.Root (Go 1.24) confines file access to a directory, blocking ../ escapes
	root, _ := os.OpenRoot("demo")
	defer root.Close()
	_, err := root.Open("../go.mod")
	fmt.Println(err)

	exe, _ := os.Executable()
	fmt.Println(filepath.IsAbs(exe))
}
```

Output

```text
[a.txt sub sub/b.txt]
[demo/a.txt]
demo/a.txt .gz y.go
openat ../go.mod: path escapes from parent
true
```

Use `path/filepath` for OS paths and `path` for slash-separated paths such as URLs.

### streams

#### Node.js

```js
import { pipeline } from 'node:stream/promises'
import { Readable, Transform, Writable } from 'node:stream'

const upper = new Transform({
  transform(chunk, _enc, done) {
    done(null, chunk.toString().toUpperCase())
  },
})

const chunks = []
const sink = new Writable({
  write(chunk, _enc, done) {
    chunks.push(chunk.toString())
    done()
  },
})

await pipeline(Readable.from(['hello ', 'stream ', 'world']), upper, sink)
console.log(chunks.join(''))
```

Output

```text
HELLO STREAM WORLD
```

#### Go

`io.Reader` and `io.Writer` are the stream interfaces; files, sockets, HTTP bodies, gzip, hashes, and buffers all implement them, and they compose by wrapping.

```go
package main

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"os"
	"strings"
)

// a transform is a Writer that wraps another Writer
type upperWriter struct{ w io.Writer }

func (u upperWriter) Write(p []byte) (int, error) {
	return u.w.Write(bytes.ToUpper(p))
}

func main() {
	src := strings.NewReader("hello stream world")
	var sink bytes.Buffer

	if _, err := io.Copy(upperWriter{&sink}, src); err != nil {
		panic(err)
	}
	fmt.Println(sink.String())

	// io.Pipe connects a writer goroutine to a reader, like a PassThrough
	pr, pw := io.Pipe()
	go func() {
		defer pw.Close()
		for i := range 3 {
			fmt.Fprintf(pw, "line %d\n", i)
		}
	}()
	io.Copy(os.Stdout, pr)

	// MultiWriter tees output; TeeReader, LimitReader, SectionReader also exist
	var a, b bytes.Buffer
	w := bufio.NewWriter(io.MultiWriter(&a, &b))
	w.WriteString("tee")
	w.Flush() // buffered writers must be flushed
	fmt.Println(a.String(), b.String())
}
```

Output

```text
HELLO STREAM WORLD
line 0
line 1
line 2
tee tee
```

### stdin, stdout, stderr

#### Node.js

```js
// file: main.mjs
import { createInterface } from 'node:readline/promises'
import { stdin, stdout, stderr } from 'node:process'

const rl = createInterface({ input: stdin })
for await (const line of rl) {
  stdout.write(`> ${line.toUpperCase()}\n`)
}
stderr.write('done\n')
```

```bash
printf 'hello\nworld\n' | node main.mjs
```

Output

```text
> HELLO
> WORLD
done
```

#### Go

```go
// file: main.go
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		fmt.Fprintf(os.Stdout, "> %s\n", strings.ToUpper(scanner.Text()))
	}
	fmt.Fprintln(os.Stderr, "done")
}
```

```bash
printf 'hello\nworld\n' | go run .
```

Output

```text
> HELLO
> WORLD
done
```

### cli args and flags

#### Node.js

```js
// file: main.mjs
import { parseArgs } from 'node:util'

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    name: { type: 'string', short: 'n', default: 'world' },
    verbose: { type: 'boolean', short: 'v' },
    tag: { type: 'string', multiple: true },
  },
})
console.log(values, positionals)
```

```bash
node main.mjs -v --name Ann --tag a --tag b file1 file2
```

Output

```text
[Object: null prototype] {
  verbose: true,
  name: 'Ann',
  tag: [ 'a', 'b' ]
} [ 'file1', 'file2' ]
```

#### Go

```go
// file: main.go
package main

import (
	"flag"
	"fmt"
	"os"
	"strings"
)

// a custom flag type for repeated values
type tags []string

func (t *tags) String() string     { return strings.Join(*t, ",") }
func (t *tags) Set(v string) error { *t = append(*t, v); return nil }

func main() {
	name := flag.String("name", "world", "who to greet")
	verbose := flag.Bool("v", false, "verbose output")
	var tagList tags
	flag.Var(&tagList, "tag", "tag (repeatable)")
	flag.Parse() // stops at the first positional argument

	fmt.Println(*name, *verbose, tagList, flag.Args())
	fmt.Println(len(os.Args) > 1) // raw arguments, os.Args[0] is the program
}
```

```bash
go run . -v --name Ann --tag a --tag b file1 file2
```

Output

```text
Ann true [a b] [file1 file2]
true
```

`flag` accepts `-name` and `--name` alike and generates `-h` help. For subcommands and GNU-style short flags, `github.com/spf13/cobra` is the common choice.

### environment variables

#### Node.js

```js
// file: main.mjs
console.log(process.env.APP_MODE ?? 'development')
console.log(process.env.PORT, typeof process.env.PORT)
process.env.EXTRA = 'set at runtime'
console.log(process.env.EXTRA)
```

```bash
printf 'PORT=8080\n' > .env && APP_MODE=production node --env-file=.env main.mjs
```

Output

```text
production
8080 string
set at runtime
```

#### Go

```go
// file: main.go
package main

import (
	"cmp"
	"fmt"
	"os"
	"strconv"
)

func main() {
	fmt.Println(cmp.Or(os.Getenv("APP_MODE"), "development"))

	port, ok := os.LookupEnv("PORT") // distinguishes unset from empty
	n, err := strconv.Atoi(port)
	fmt.Println(n, ok, err)

	os.Setenv("EXTRA", "set at runtime")
	fmt.Println(os.Getenv("EXTRA"))
}
```

```bash
APP_MODE=production PORT=8080 go run .
```

Output

```text
production
8080 true <nil>
set at runtime
```

### exec

#### Node.js

```js
import { execFileSync, execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'

// sync
console.log(execFileSync('echo', ['sync hello']).toString().trim())

// async with buffered output
const { stdout } = await promisify(execFile)('echo', ['async hello'])
console.log(stdout.trim())

// streaming output and exit code
const child = spawn('sh', ['-c', 'echo streamed; exit 3'])
child.stdout.on('data', d => process.stdout.write(d))
child.on('close', code => console.log('exit code', code))
```

Output

```text
sync hello
async hello
streamed
exit code 3
```

#### Go

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"time"
)

func main() {
	out, err := exec.Command("echo", "hello").Output() // no shell involved
	if err != nil {
		panic(err)
	}
	fmt.Print(string(out))

	cmd := exec.Command("sh", "-c", "echo streamed; exit 3")
	cmd.Stdout = os.Stdout // stream directly
	err = cmd.Run()
	var exitErr *exec.ExitError
	if errors.As(err, &exitErr) {
		fmt.Println("exit code", exitErr.ExitCode())
	}

	// kill the process when the context expires
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()
	err = exec.CommandContext(ctx, "sleep", "5").Run()
	fmt.Println(err, ctx.Err())

	// run in the background and wait later
	bg := exec.Command("sleep", "0.01")
	bg.Start()
	fmt.Println(bg.Wait())
}
```

Output

```text
hello
streamed
exit code 3
signal: killed context deadline exceeded
<nil>
```

### signals

#### Node.js

```js
process.once('SIGINT', () => {
  console.log('shutting down')
  process.exit(0)
})
console.log('running, press Ctrl+C')
setTimeout(() => process.kill(process.pid, 'SIGINT'), 50) // simulate Ctrl+C
setInterval(() => {}, 1000)
```

Output

```text
running, press Ctrl+C
shutting down
```

#### Go

```go
package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// ctx is cancelled on SIGINT or SIGTERM
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	fmt.Println("running, press Ctrl+C")
	time.AfterFunc(50*time.Millisecond, func() { syscall.Kill(os.Getpid(), syscall.SIGINT) }) // simulate Ctrl+C

	<-ctx.Done()
	fmt.Println("shutting down")
}
```

Output

```text
running, press Ctrl+C
shutting down
```

### gzip

#### Node.js

```js
import { gzipSync, gunzipSync, createGzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { Readable, Writable } from 'node:stream'

const input = 'hello '.repeat(100)
const zipped = gzipSync(input)
console.log(input.length, zipped.length < input.length)
console.log(gunzipSync(zipped).toString().slice(0, 11))

// streaming
let size = 0
await pipeline(
  Readable.from([input]),
  createGzip(),
  new Writable({ write(chunk, _e, done) { size += chunk.length; done() } }),
)
console.log(size === zipped.length)
```

Output

```text
600 true
hello hello
true
```

#### Go

```go
package main

import (
	"bytes"
	"compress/gzip"
	"fmt"
	"io"
	"strings"
)

func main() {
	input := strings.Repeat("hello ", 100)

	var zipped bytes.Buffer
	zw := gzip.NewWriter(&zipped) // any io.Writer: file, HTTP response, ...
	zw.Write([]byte(input))
	zw.Close() // flushes the footer; required
	fmt.Println(len(input), zipped.Len() < len(input))

	zr, err := gzip.NewReader(&zipped)
	if err != nil {
		panic(err)
	}
	out, _ := io.ReadAll(zr)
	fmt.Println(string(out[:11]))
}
```

Output

```text
600 true
hello hello
```

### embedding files

#### Node.js

Node reads assets from disk at runtime (`readFile(new URL('./tpl.html', import.meta.url))`), or bundles them with a build tool or single executable app assets.

#### Go

`//go:embed` compiles files into the binary, so a single executable can ship its templates, migrations, and static web assets.

```text
// file: hello.txt
hello from an embedded file
```

```go
// file: main.go
package main

import (
	"embed"
	"fmt"
	"io/fs"
	"strings"
)

//go:embed hello.txt
var hello string

//go:embed *.txt
var assets embed.FS // implements fs.FS; serve with http.FileServerFS(assets)

func main() {
	fmt.Println(strings.TrimSpace(hello))
	names, _ := fs.Glob(assets, "*.txt")
	fmt.Println(names)
}
```

```bash
go run .
```

Output

```text
hello from an embedded file
[hello.txt]
```

## Data formats

### json

#### Node.js

```js
const user = { name: 'Ann', age: 30, email: undefined, tags: ['a'], createdAt: new Date(0) }

const text = JSON.stringify(user)
console.log(text)
console.log(JSON.stringify({ a: 1, b: [1, 2] }, null, 2))

const parsed = JSON.parse('{"name":"Bob","age":"oops","extra":true}')
console.log(parsed.name, typeof parsed.age, parsed.extra)

try {
  JSON.parse('{bad json}')
} catch (err) {
  console.log(err.name)
}
```

Output

```text
{"name":"Ann","age":30,"tags":["a"],"createdAt":"1970-01-01T00:00:00.000Z"}
{
  "a": 1,
  "b": [
    1,
    2
  ]
}
Bob string true
SyntaxError
```

#### Go

Struct tags map fields to JSON keys. Only exported (capitalized) fields are encoded.

```go
package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type User struct {
	Name      string    `json:"name"`
	Age       int       `json:"age"`
	Email     string    `json:"email,omitempty"` // dropped when ""
	Tags      []string  `json:"tags"`
	CreatedAt time.Time `json:"createdAt,omitzero"` // dropped when zero (Go 1.24)
	password  string    // unexported: never encoded
}

func main() {
	u := User{Name: "Ann", Age: 30, Tags: []string{"a"}, CreatedAt: time.Unix(0, 0).UTC(), password: "x"}

	data, err := json.Marshal(u)
	if err != nil {
		panic(err)
	}
	fmt.Println(string(data))

	pretty, _ := json.MarshalIndent(map[string]any{"a": 1, "b": []int{1, 2}}, "", "  ")
	fmt.Println(string(pretty))

	var parsed User
	err = json.Unmarshal([]byte(`{"name":"Bob","age":"oops","extra":true}`), &parsed)
	fmt.Println(parsed.Name, err) // unknown fields are ignored; type mismatches are errors

	// unknown shape: decode into any (objects become map[string]any, numbers float64)
	var anyValue map[string]any
	json.Unmarshal([]byte(`{"n":1,"list":[true,null]}`), &anyValue)
	fmt.Println(anyValue["n"], anyValue["list"])

	var syntaxErr *json.SyntaxError
	err = json.Unmarshal([]byte(`{bad json}`), &anyValue)
	fmt.Println(fmt.Sprintf("%T", err) == fmt.Sprintf("%T", syntaxErr))

	// stream many values, e.g. NDJSON or an HTTP body
	dec := json.NewDecoder(strings.NewReader(`{"name":"a"} {"name":"b"}`))
	for dec.More() {
		var v User
		dec.Decode(&v)
		fmt.Print(v.Name, " ")
	}
	fmt.Println()
}
```

Output

```text
{"name":"Ann","age":30,"tags":["a"],"createdAt":"1970-01-01T00:00:00Z"}
{
  "a": 1,
  "b": [
    1,
    2
  ]
}
Bob json: cannot unmarshal string into Go struct field User.age of type int
1 [true <nil>]
true
a b 
```

Go 1.27 adds `encoding/json/v2`: faster, stricter by default (rejects duplicate keys and invalid UTF-8, matches field names case-sensitively), and configurable per call. `encoding/json` stays supported and now runs on the same engine.

```go
package main

import (
	"encoding/json/v2"
	"fmt"
)

type User struct {
	Name string `json:"name"`
	Age  int    `json:"age,omitzero"`
}

func main() {
	data, _ := json.Marshal(User{Name: "Ann"})
	fmt.Println(string(data))

	var u User
	err := json.Unmarshal([]byte(`{"name":"Bob","extra":1}`), &u, json.RejectUnknownMembers(true))
	fmt.Println(err)

	err = json.Unmarshal([]byte(`{"name":"a","name":"b"}`), &u)
	fmt.Println(err)
}
```

Output

```text
{"name":"Ann"}
json: cannot unmarshal JSON string into Go main.User: unknown object member name "extra"
jsontext: duplicate object member name "name"
```

### big numbers

#### Node.js

```js
const big = 2n ** 100n
console.log(big, big.toString(16))
console.log(BigInt('123456789012345678901234567890') * 2n)
console.log(7n / 2n, 7n % 2n, 10n > 9, BigInt.asUintN(8, 257n))
console.log(0.1 + 0.2 === 0.3, (0.1 * 10 + 0.2 * 10) / 10)
```

Output

```text
1267650600228229401496703205376n 10000000000000000000000000
246913578024691357802469135780n
3n 1n true 1n
false 0.3
```

#### Go

```go
package main

import (
	"fmt"
	"math"
	"math/big"
)

func main() {
	big2 := new(big.Int).Exp(big.NewInt(2), big.NewInt(100), nil)
	fmt.Println(big2, big2.Text(16))

	n, _ := new(big.Int).SetString("123456789012345678901234567890", 10)
	fmt.Println(new(big.Int).Mul(n, big.NewInt(2)))

	q, r := new(big.Int).QuoRem(big.NewInt(7), big.NewInt(2), new(big.Int))
	fmt.Println(q, r, big2.Cmp(n) > 0)

	// exact decimal arithmetic with rationals
	sum := new(big.Rat).Add(big.NewRat(1, 10), big.NewRat(2, 10))
	fmt.Println(sum, sum.FloatString(2))

	// fixed-size integers wrap around silently
	var u8 uint8 = 255
	u8++
	fmt.Println(u8, math.MaxInt64)
}
```

Output

```text
1267650600228229401496703205376 10000000000000000000000000
246913578024691357802469135780
3 1 true
3/10 0.30
0 9223372036854775807
```

### crypto, hashing, and ids

#### Node.js

```js
import { createHash, createHmac, randomBytes, randomUUID, hash, timingSafeEqual } from 'node:crypto'

console.log(createHash('sha256').update('hello').digest('hex'))
console.log(hash('sha1', 'hello')) // one-shot helper
console.log(createHmac('sha256', 'secret').update('msg').digest('base64url'))
console.log(randomBytes(16).length, randomUUID().length)
console.log(timingSafeEqual(Buffer.from('a'), Buffer.from('a')))
```

Output

```text
2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d
_k-cQY9oPwNPavkNHdW4asA1XdljMsWcx0WY0HNhB_Y
16 36
true
```

#### Go

```go
package main

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"uuid"
)

func main() {
	sum := sha256.Sum256([]byte("hello"))
	fmt.Println(hex.EncodeToString(sum[:]))
	fmt.Printf("%x\n", sha1.Sum([]byte("hello")))

	mac := hmac.New(sha256.New, []byte("secret"))
	mac.Write([]byte("msg"))
	fmt.Println(base64.RawURLEncoding.EncodeToString(mac.Sum(nil)))

	key := make([]byte, 16)
	rand.Read(key)                          // never returns an error since Go 1.24
	fmt.Println(len(key), len(rand.Text())) // rand.Text: a random base32 token

	id := uuid.New() // Go 1.27 standard library; NewV7 gives time-ordered ids
	fmt.Println(len(id.String()), uuid.NewV7().String()[14] == '7')

	fmt.Println(hmac.Equal([]byte("a"), []byte("a"))) // constant-time compare
}
```

Output

```text
2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d
_k-cQY9oPwNPavkNHdW4asA1XdljMsWcx0WY0HNhB_Y
16 26
36 true
true
```

Hash passwords with `golang.org/x/crypto/argon2` or `bcrypt`, never with a plain hash.

### random numbers

#### Node.js

```js
import { randomInt } from 'node:crypto'

const dice = Math.floor(Math.random() * 6) + 1 // not for security
const secure = randomInt(1, 7)
const pick = ['a', 'b', 'c'][Math.floor(Math.random() * 3)]
console.log(dice >= 1 && dice <= 6, secure >= 1 && secure <= 6, pick.length)
```

Output

```text
true true 1
```

#### Go

```go
package main

import (
	"fmt"
	"math/rand/v2"
)

func main() {
	dice := rand.IntN(6) + 1 // auto-seeded; not for security (use crypto/rand)
	pick := []string{"a", "b", "c"}[rand.IntN(3)]
	f := rand.Float64()

	deck := []int{1, 2, 3, 4}
	rand.Shuffle(len(deck), func(i, j int) { deck[i], deck[j] = deck[j], deck[i] })

	// reproducible sequence for tests
	r := rand.New(rand.NewPCG(1, 2))
	fmt.Println(dice >= 1 && dice <= 6, len(pick), f < 1, len(deck), r.IntN(100), r.IntN(100))
}
```

Output

```text
true 1 true 4 76 61
```

### url parse

#### Node.js

```js
const url = new URL('https://user:pass@example.com:8080/a/b?q=go&q=node&x=1#frag')

console.log(url.protocol, url.hostname, url.port, url.pathname, url.hash)
console.log(url.searchParams.getAll('q'), url.searchParams.get('x'))

url.searchParams.set('page', '2')
url.searchParams.delete('x')
console.log(url.href)

console.log(new URL('../c', 'https://example.com/a/b/').href)
console.log(encodeURIComponent('a b&c'))

const pattern = new URLPattern({ pathname: '/users/:id' }) // Node 24 global
console.log(pattern.exec('https://x.dev/users/42').pathname.groups.id)
```

Output

```text
https: example.com 8080 /a/b #frag
[ 'go', 'node' ] 1
https://user:pass@example.com:8080/a/b?q=go&q=node&page=2#frag
https://example.com/a/c
a%20b%26c
42
```

#### Go

```go
package main

import (
	"fmt"
	"net/url"
)

func main() {
	u, err := url.Parse("https://user:pass@example.com:8080/a/b?q=go&q=node&x=1#frag")
	if err != nil {
		panic(err)
	}

	fmt.Println(u.Scheme, u.Hostname(), u.Port(), u.Path, u.Fragment, u.User.Username())

	q := u.Query() // url.Values is map[string][]string
	fmt.Println(q["q"], q.Get("x"))

	q.Set("page", "2")
	q.Del("x")
	u.RawQuery = q.Encode() // Encode sorts keys
	fmt.Println(u)

	base, _ := url.Parse("https://example.com/a/b/")
	fmt.Println(base.ResolveReference(&url.URL{Path: "../c"}))
	fmt.Println(url.QueryEscape("a b&c"), url.PathEscape("a b&c"))
}
```

Output

```text
https example.com 8080 /a/b frag user
[go node] 1
https://user:pass@example.com:8080/a/b?page=2&q=go&q=node#frag
https://example.com/a/c
a+b%26c a%20b&c
```

## Networking

### http server

#### Node.js

```js
import { createServer } from 'node:http'

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const match = url.pathname.match(/^\/users\/(\d+)$/)
  if (req.method === 'GET' && match) {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ id: Number(match[1]) }))
    return
  }
  res.writeHead(404).end('not found\n')
})

server.listen(0, async () => {
  const base = `http://localhost:${server.address().port}`
  const ok = await fetch(`${base}/users/7`)
  console.log(ok.status, ok.headers.get('content-type'), await ok.json())
  const missing = await fetch(`${base}/nope`)
  console.log(missing.status, await missing.text())
  server.close()
})
```

Output

```text
200 application/json { id: 7 }
404 not found
```

#### Go

Since Go 1.22 `http.ServeMux` matches methods and path wildcards, so a router library is optional.

```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"strconv"
	"time"
)

func getUser(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "bad id", http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"id": id})
}

// middleware is a function that wraps a handler
func logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		_ = time.Since(start) // log method, path, duration here
	})
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /users/{id}", getUser) // method + wildcard
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "home") // {$} matches only "/"
	})

	ln, err := net.Listen("tcp", "127.0.0.1:0") // port 0: pick a free port
	if err != nil {
		log.Fatal(err)
	}
	srv := &http.Server{Handler: logging(mux), ReadHeaderTimeout: 5 * time.Second}
	go srv.Serve(ln) // in a real program: log.Fatal(srv.ListenAndServe()) with Addr ":8080"

	base := "http://" + ln.Addr().String()
	for _, path := range []string{"/users/7", "/users/x", "/nope"} {
		res, err := http.Get(base + path)
		if err != nil {
			log.Fatal(err)
		}
		body, _ := io.ReadAll(res.Body)
		res.Body.Close()
		fmt.Printf("%d %s", res.StatusCode, body)
	}

	res, _ := http.Post(base+"/users/7", "text/plain", nil)
	res.Body.Close()
	fmt.Println(res.StatusCode, res.Header.Get("Allow"))
	srv.Close()
}
```

Output

```text
200 {"id":7}
400 bad id
404 404 page not found
405 GET, HEAD
```

### graceful shutdown

#### Node.js

```js
import { createServer } from 'node:http'
import { once } from 'node:events'
import { setTimeout as sleep } from 'node:timers/promises'

const started = Promise.withResolvers()
const server = createServer(async (req, res) => {
  started.resolve()
  await sleep(100) // slow request
  res.end('finished\n')
})
server.listen(0)
await once(server, 'listening')

const response = fetch(`http://localhost:${server.address().port}`).then(r => r.text())
await started.promise

// in a real program: process.once('SIGTERM', ...)
console.log('shutting down')
const closed = new Promise(resolve => server.close(resolve)) // stop accepting, finish in-flight requests
console.log('client got', (await response).trim())
await closed
console.log('closed after in-flight requests')
```

Output

```text
shutting down
client got finished
closed after in-flight requests
```

#### Go

```go
package main

import (
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"time"
)

func main() {
	started := make(chan struct{})
	srv := &http.Server{Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		close(started)
		time.Sleep(100 * time.Millisecond) // slow request
		fmt.Fprintln(w, "finished")
	})}
	ln, _ := net.Listen("tcp", "127.0.0.1:0")
	go srv.Serve(ln)

	response := make(chan string, 1)
	go func() {
		res, err := http.Get("http://" + ln.Addr().String())
		if err != nil {
			response <- err.Error()
			return
		}
		defer res.Body.Close()
		body, _ := io.ReadAll(res.Body)
		response <- string(body)
	}()
	<-started

	// in a real program: <-signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM).Done()
	fmt.Println("shutting down")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	shutdownErr := make(chan error, 1)
	go func() { shutdownErr <- srv.Shutdown(ctx) }() // stop accepting, finish in-flight requests

	fmt.Print("client got ", <-response)
	if err := <-shutdownErr; err != nil {
		fmt.Println("forced:", err)
	}
	fmt.Println("closed after in-flight requests")
}
```

Output

```text
shutting down
client got finished
closed after in-flight requests
```

### http client

#### Node.js

```js
import { createServer } from 'node:http'

const server = createServer((req, res) => {
  let body = ''
  req.on('data', c => (body += c))
  req.on('end', () => {
    if (req.url === '/slow') return setTimeout(() => res.end('late'), 200)
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ method: req.method, auth: req.headers.authorization, body: JSON.parse(body || 'null') }))
  })
}).listen(0)
const base = `http://localhost:${server.address().port}`

const res = await fetch(`${base}/echo`, {
  method: 'POST',
  headers: { authorization: 'Bearer t0k3n', 'content-type': 'application/json' },
  body: JSON.stringify({ hello: 'world' }),
})
if (!res.ok) throw new Error(`HTTP ${res.status}`) // fetch does not reject on 4xx/5xx
console.log(await res.json())

try {
  await fetch(`${base}/slow`, { signal: AbortSignal.timeout(50) })
} catch (err) {
  console.log(err.name)
}
server.close()
server.closeAllConnections()
```

Output

```text
{ method: 'POST', auth: 'Bearer t0k3n', body: { hello: 'world' } }
TimeoutError
```

#### Go

```go
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"time"
)

func main() {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/slow" {
			time.Sleep(200 * time.Millisecond)
		}
		body, _ := io.ReadAll(r.Body)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"method": r.Method, "auth": r.Header.Get("Authorization"), "body": json.RawMessage(body),
		})
	}))
	defer srv.Close()

	// reuse one client; the zero http.DefaultClient has no timeout
	client := &http.Client{Timeout: 10 * time.Second}

	payload, _ := json.Marshal(map[string]string{"hello": "world"})
	req, _ := http.NewRequestWithContext(context.Background(), "POST", srv.URL+"/echo", bytes.NewReader(payload))
	req.Header.Set("Authorization", "Bearer t0k3n")
	req.Header.Set("Content-Type", "application/json")

	res, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer res.Body.Close() // always close, or connections leak
	if res.StatusCode != http.StatusOK {
		panic(res.Status) // like fetch, non-2xx is not an error
	}
	var out struct {
		Method, Auth string
		Body         map[string]string
	}
	json.NewDecoder(res.Body).Decode(&out)
	fmt.Printf("%+v\n", out)

	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()
	req, _ = http.NewRequestWithContext(ctx, "GET", srv.URL+"/slow", nil)
	_, err = client.Do(req)
	fmt.Println(errors.Is(err, context.DeadlineExceeded))
}
```

Output

```text
{Method:POST Auth:Bearer t0k3n Body:map[hello:world]}
true
```

### tcp server

#### Node.js

```js
import net from 'node:net'

const server = net.createServer(socket => {
  socket.on('data', data => socket.write(`echo: ${data}`))
})

server.listen(0, () => {
  const client = net.connect(server.address().port, () => client.write('hello'))
  client.on('data', data => {
    console.log(data.toString())
    client.end()
    server.close()
  })
})
```

Output

```text
echo: hello
```

#### Go

```go
package main

import (
	"bufio"
	"fmt"
	"io"
	"net"
)

func handle(conn net.Conn) {
	defer conn.Close()
	io.Copy(conn, conn) // echo until the client closes
}

func main() {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		panic(err)
	}
	defer ln.Close()

	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return // listener closed
			}
			go handle(conn) // one goroutine per connection
		}
	}()

	conn, _ := net.Dial("tcp", ln.Addr().String())
	fmt.Fprintln(conn, "hello")
	line, _ := bufio.NewReader(conn).ReadString('\n')
	fmt.Print("echo: ", line)
	conn.Close()
}
```

Output

```text
echo: hello
```

### udp server

#### Node.js

```js
import dgram from 'node:dgram'

const server = dgram.createSocket('udp4')
server.on('message', (msg, rinfo) => {
  server.send(`ack: ${msg}`, rinfo.port, rinfo.address)
})

server.bind(0, '127.0.0.1', () => {
  const client = dgram.createSocket('udp4')
  client.on('message', msg => {
    console.log(msg.toString())
    client.close()
    server.close()
  })
  client.send('ping', server.address().port, '127.0.0.1')
})
```

Output

```text
ack: ping
```

#### Go

```go
package main

import (
	"fmt"
	"net"
)

func main() {
	server, err := net.ListenPacket("udp", "127.0.0.1:0")
	if err != nil {
		panic(err)
	}
	defer server.Close()

	go func() {
		buf := make([]byte, 1024)
		for {
			n, addr, err := server.ReadFrom(buf)
			if err != nil {
				return
			}
			server.WriteTo(append([]byte("ack: "), buf[:n]...), addr)
		}
	}()

	conn, _ := net.Dial("udp", server.LocalAddr().String())
	defer conn.Close()
	conn.Write([]byte("ping"))

	buf := make([]byte, 1024)
	n, _ := conn.Read(buf)
	fmt.Println(string(buf[:n]))
}
```

Output

```text
ack: ping
```

### dns

#### Node.js

```js
import { lookup, resolve4 } from 'node:dns/promises'

console.log(await lookup('localhost', { family: 4 })) // OS resolver, like getaddrinfo
try {
  await resolve4('no-such-host.invalid') // DNS query
} catch (err) {
  console.log(err.code)
}
```

Output

```text
{ address: '127.0.0.1', family: 4 }
ENOTFOUND
```

#### Go

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"net"
	"slices"
)

func main() {
	addrs, err := net.LookupHost("localhost")
	if err != nil {
		panic(err)
	}
	fmt.Println(slices.Contains(addrs, "127.0.0.1"))

	ips, _ := net.DefaultResolver.LookupIP(context.Background(), "ip4", "localhost")
	fmt.Println(ips)

	_, err = net.LookupHost("no-such-host.invalid")
	var dnsErr *net.DNSError
	fmt.Println(errors.As(err, &dnsErr) && dnsErr.IsNotFound)
	// also: net.LookupMX, LookupTXT, LookupCNAME, LookupNS, LookupSRV
}
```

Output

```text
true
[127.0.0.1]
true
```

### websockets

Node 22+ has a global `WebSocket` client; servers still need a package such as `ws`. Go's standard library has neither; the common choices are `github.com/coder/websocket` and `github.com/gorilla/websocket`, both built on `net/http` handlers.

## Application building blocks

### logging

#### Node.js

```js
console.info('info level')
console.log(JSON.stringify({ level: 'info', msg: 'user login', userId: 42 }))
console.warn('warn level goes to stderr')
// structured logging libraries: pino, winston
```

Output

```text
info level
{"level":"info","msg":"user login","userId":42}
warn level goes to stderr
```

#### Go

`log/slog` (Go 1.21) is the standard structured logger.

```go
package main

import (
	"log"
	"log/slog"
	"os"
)

func main() {
	log.SetFlags(0) // drop the timestamp prefix for this demo
	log.SetOutput(os.Stdout)
	log.Println("classic logger") // log.Fatal also exits with status 1

	// drop the time attribute so the output is reproducible
	noTime := func(groups []string, a slog.Attr) slog.Attr {
		if a.Key == slog.TimeKey && len(groups) == 0 {
			return slog.Attr{}
		}
		return a
	}

	text := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{ReplaceAttr: noTime}))
	text.Info("user login", "userId", 42, "admin", true)

	jsonLogger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level:       slog.LevelDebug,
		ReplaceAttr: noTime,
	}))
	reqLogger := jsonLogger.With("requestId", "abc") // child logger with fixed fields
	reqLogger.Debug("cache miss", slog.Group("cache", "key", "user:42"))
	reqLogger.Error("query failed", "err", os.ErrNotExist)

	slog.SetDefault(jsonLogger) // slog.Info and the log package now use it
	slog.Info("via default")
}
```

Output

```text
classic logger
level=INFO msg="user login" userId=42 admin=true
{"level":"DEBUG","msg":"cache miss","requestId":"abc","cache":{"key":"user:42"}}
{"level":"ERROR","msg":"query failed","requestId":"abc","err":"file does not exist"}
{"level":"INFO","msg":"via default"}
```

`slog.NewMultiHandler` (Go 1.26) fans one record out to several handlers, for example text to the console and JSON to a file.

### databases

#### Node.js

`node:sqlite` is built in (no flag needed since Node 22.13).

```js
import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync(':memory:')
db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)')

const insert = db.prepare('INSERT INTO users (name) VALUES (?)')
for (const name of ['ann', 'bob']) insert.run(name)

console.log(db.prepare('SELECT id, name FROM users WHERE name = ?').get('bob'))
console.log(db.prepare('SELECT count(*) AS n FROM users').get().n)
db.close()
```

Output

```text
[Object: null prototype] { id: 2, name: 'bob' }
2
```

#### Go

`database/sql` is the standard interface; drivers are separate modules. `modernc.org/sqlite` is pure Go (no cgo); for Postgres use `github.com/jackc/pgx/v5`.

```go
package main

import (
	"context"
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite" // registers the "sqlite" driver
)

type User struct {
	ID   int64
	Name string
}

func main() {
	ctx := context.Background()
	db, err := sql.Open("sqlite", ":memory:") // a connection pool, not one connection
	if err != nil {
		panic(err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1) // each :memory: connection is a separate database

	if _, err := db.ExecContext(ctx, `CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)`); err != nil {
		panic(err)
	}

	tx, _ := db.BeginTx(ctx, nil)
	for _, name := range []string{"ann", "bob"} {
		tx.ExecContext(ctx, `INSERT INTO users (name) VALUES (?)`, name) // placeholders, never string concat
	}
	tx.Commit()

	var u User
	err = db.QueryRowContext(ctx, `SELECT id, name FROM users WHERE name = ?`, "bob").Scan(&u.ID, &u.Name)
	fmt.Printf("%+v %v\n", u, err)

	err = db.QueryRowContext(ctx, `SELECT id FROM users WHERE name = ?`, "zed").Scan(&u.ID)
	fmt.Println(err == sql.ErrNoRows)

	rows, _ := db.QueryContext(ctx, `SELECT id, name FROM users ORDER BY id`)
	defer rows.Close()
	for rows.Next() {
		var r User
		rows.Scan(&r.ID, &r.Name)
		fmt.Print(r.Name, " ")
	}
	fmt.Println(rows.Err())
}
```

Output

```text
{ID:2 Name:bob} <nil>
true
ann bob <nil>
```

## Testing

### unit tests

#### Node.js

```js
// file: math.mjs
export const sum = (...nums) => nums.reduce((a, b) => a + b, 0)
```

```js
// file: math.test.mjs
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { sum } from './math.mjs'

describe('sum', () => {
  const cases = [
    { name: 'empty', in: [], want: 0 },
    { name: 'one', in: [5], want: 5 },
    { name: 'many', in: [1, 2, 3], want: 6 },
  ]
  for (const c of cases) {
    test(c.name, () => assert.equal(sum(...c.in), c.want))
  }

  test('mock', t => {
    const fn = t.mock.fn(sum)
    fn(1, 2)
    assert.equal(fn.mock.callCount(), 1)
    assert.deepEqual(fn.mock.calls[0].arguments, [1, 2])
  })
})
```

```bash
node --test --test-reporter=dot
```

Output

```text
.....
```

#### Go

Tests live next to the code in `_test.go` files. Table-driven tests with subtests are the norm.

```text
// file: go.mod
module example.com/mathx

go 1.27
```

```go
// file: mathx.go
package mathx

func Sum(nums ...int) int {
	total := 0
	for _, n := range nums {
		total += n
	}
	return total
}
```

```go
// file: mathx_test.go
package mathx

import "testing"

func TestSum(t *testing.T) {
	tests := []struct {
		name string
		in   []int
		want int
	}{
		{"empty", nil, 0},
		{"one", []int{5}, 5},
		{"many", []int{1, 2, 3}, 6},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := Sum(tt.in...); got != tt.want {
				t.Errorf("Sum(%v) = %d, want %d", tt.in, got, tt.want) // t.Fatalf stops the test
			}
		})
	}
}
```

```bash
go test -run TestSum -v . | grep -E '^(---|    ---|PASS|FAIL)'
```

Output

```text
--- PASS: TestSum (0.00s)
    --- PASS: TestSum/empty (0.00s)
    --- PASS: TestSum/one (0.00s)
    --- PASS: TestSum/many (0.00s)
PASS
```

Call `t.Parallel()` at the top of a test or subtest to run it in parallel with others. Useful flags: `-run 'TestSum/many'`, `-count=1` (skip the cache), `-race`, `-cover`, `-shuffle=on`. There is no built-in assert library; `t.Errorf` plus `cmp.Diff` from `github.com/google/go-cmp` covers most needs, and `github.com/stretchr/testify` is popular. Mock by depending on small interfaces and passing fakes.

### benchmarks

#### Node.js

No built-in benchmark runner; measure with `performance.now()` or use a library such as `mitata` or `tinybench`.

```js
const sum = (...nums) => nums.reduce((a, b) => a + b, 0)
const nums = Array.from({ length: 1000 }, (_, i) => i)

const start = performance.now()
for (let i = 0; i < 10_000; i++) sum(...nums)
const ms = performance.now() - start
console.log(`${((ms * 1e6) / 10_000).toFixed(0)} ns/op`)
```

Output (varies)

```text
2671 ns/op
```

#### Go

```text
// file: go.mod
module example.com/mathx

go 1.27
```

```go
// file: mathx.go
package mathx

func Sum(nums ...int) int {
	total := 0
	for _, n := range nums {
		total += n
	}
	return total
}
```

```go
// file: mathx_test.go
package mathx

import "testing"

func BenchmarkSum(b *testing.B) {
	nums := make([]int, 1000) // setup before b.Loop is excluded from timing
	for b.Loop() {            // Go 1.24; replaces for i := 0; i < b.N; i++
		Sum(nums...)
	}
}
```

```bash
go test -bench=. -benchmem -run='^$' . | grep -c 'BenchmarkSum'
```

Output

```text
1
```

A typical line reads `BenchmarkSum-10   4012340   297.1 ns/op   0 B/op   0 allocs/op`. Compare runs with `golang.org/x/perf/cmd/benchstat`.

### fuzzing and examples

#### Node.js

No built-in fuzzer; property-based testing libraries such as `fast-check` fill the gap. Doc examples are not executed.

#### Go

Fuzz tests generate inputs and keep failing ones in `testdata/fuzz` as regression cases. Example functions are compiled, run as tests, and shown in documentation.

```text
// file: go.mod
module example.com/rev

go 1.27
```

```go
// file: rev.go
package rev

// Reverse reverses a string by runes.
func Reverse(s string) string {
	r := []rune(s)
	for i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {
		r[i], r[j] = r[j], r[i]
	}
	return string(r)
}
```

```go
// file: rev_test.go
package rev

import (
	"fmt"
	"testing"
	"unicode/utf8"
)

func FuzzReverse(f *testing.F) {
	f.Add("hello") // seed corpus
	f.Fuzz(func(t *testing.T, s string) {
		if !utf8.ValidString(s) {
			t.Skip()
		}
		if got := Reverse(Reverse(s)); got != s {
			t.Errorf("double reverse of %q = %q", s, got)
		}
	})
}

func ExampleReverse() {
	fmt.Println(Reverse("héllo"))
	// Output: olléh
}
```

```bash
go test -fuzz=FuzzReverse -fuzztime=2s . > /dev/null && go test -run Example -v . | grep -E '^(---|PASS)'
```

Output

```text
--- PASS: ExampleReverse (0.00s)
PASS
```

### testing time and http handlers

#### Node.js

```js
// file: clock.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'

test('fake timers', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let fired = false
  setTimeout(() => (fired = true), 60_000)
  t.mock.timers.tick(60_000) // no real waiting
  assert.ok(fired)
})
```

```bash
node --test --test-reporter=dot
```

Output

```text
.
```

#### Go

`testing/synctest` (Go 1.25) runs a test in a bubble with a fake clock: `time.Sleep` returns instantly once every goroutine in the bubble is blocked. `net/http/httptest` tests handlers without a network.

```text
// file: go.mod
module example.com/clock

go 1.27
```

```go
// file: clock_test.go
package clock

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/synctest"
	"time"
)

func TestTimeout(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		start := time.Now()
		ctx, cancel := context.WithTimeout(t.Context(), time.Minute)
		defer cancel()
		<-ctx.Done() // returns immediately in fake time
		if got := time.Since(start); got != time.Minute {
			t.Fatalf("elapsed %v", got)
		}
	})
}

func hello(w http.ResponseWriter, r *http.Request) {
	io.WriteString(w, "hello "+r.URL.Query().Get("name"))
}

func TestHandler(t *testing.T) {
	rec := httptest.NewRecorder()
	hello(rec, httptest.NewRequest("GET", "/?name=go", nil))
	if rec.Code != http.StatusOK || rec.Body.String() != "hello go" {
		t.Fatalf("got %d %q", rec.Code, rec.Body.String())
	}
}
```

```bash
go test -v . | grep -E '^(---|PASS)'
```

Output

```text
--- PASS: TestTimeout (0.00s)
--- PASS: TestHandler (0.00s)
PASS
```

## Modules and packages

### modules

#### Node.js

```js
// file: greeter.mjs
const prefix = 'Hello' // not exported: private to the module

export function greet(name) {
  return `${prefix}, ${name}!`
}

export default { version: '1.0.0' }
```

```js
// file: main.mjs
import meta, { greet } from './greeter.mjs'
import { readFile } from 'node:fs/promises' // node: prefix for built-ins

console.log(greet('gopher'), meta.version, typeof readFile)
```

```bash
node main.mjs
```

Output

```text
Hello, gopher! 1.0.0 function
```

#### Go

A module (`go.mod`) contains packages; a package is a directory. Every file in a directory shares one package and sees all of its identifiers. Capitalized identifiers are exported. Imports use the module path plus the directory.

```text
// file: go.mod
module example.com/app

go 1.27
```

```go
// file: greeter/greeter.go
// Package greeter builds greetings.
package greeter

const prefix = "Hello" // unexported: private to the package

var Version = "1.0.0"

func Greet(name string) string {
	return prefix + ", " + name + "!"
}

func init() { // runs once when the package is first imported
	Version += "-go"
}
```

```go
// file: internal/secret/secret.go
// Package secret is importable only from inside example.com/app.
package secret

func Value() int { return 42 }
```

```go
// file: main.go
package main

import (
	"fmt"

	"example.com/app/greeter"
	"example.com/app/internal/secret"
)

func main() {
	fmt.Println(greeter.Greet("gopher"), greeter.Version, secret.Value())
}
```

```bash
go run .
```

Output

```text
Hello, gopher! 1.0.0-go 42
```

| Node.js | Go |
| --- | --- |
| `package.json` `name` | `module` line in `go.mod` |
| `dependencies` with semver ranges | `require` with exact minimum versions (minimal version selection) |
| `npm install` | `go get pkg@version`, `go mod tidy` |
| `node_modules/` per project | Shared module cache (`go env GOMODCACHE`) |
| npm registry | Any git host; served through `proxy.golang.org` with checksums in `sum.golang.org` |
| `npm publish` | Push a git tag such as `v1.2.0` |
| Breaking change: bump major | Bump major *and* change the import path: `example.com/lib/v2` |
| Workspaces | `go work init ./a ./b` |
| Circular imports allowed | Import cycles are a compile error |

### documentation

#### Node.js

```js
/**
 * Adds two numbers.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 * @example add(1, 2) // 3
 */
export function add(a, b) {
  return a + b
}
```

#### Go

Doc comments are plain comments directly above a declaration, starting with its name. `go doc` and pkg.go.dev render them; `[Name]` links to other symbols.

```text
// file: go.mod
module example.com/calc

go 1.27
```

```go
// file: calc.go
// Package calc does arithmetic.
package calc

// Add returns the sum of a and b. See also [Sub].
func Add(a, b int) int { return a + b }

// Sub returns a minus b.
//
// Deprecated: use Add(a, -b).
func Sub(a, b int) int { return a - b }
```

```bash
go doc -short .
```

Output

```text
func Add(a, b int) int
func Sub(a, b int) int
```

## Runtime

### memory, gc, and profiling

#### Node.js

```js
const before = process.memoryUsage().heapUsed
const big = Array.from({ length: 1e6 }, (_, i) => ({ i }))
console.log(process.memoryUsage().heapUsed > before, big.length)

const registry = new FinalizationRegistry(key => console.log('collected', key))
let obj = { name: 'temp' }
const ref = new WeakRef(obj)
registry.register(obj, 'temp')
console.log(ref.deref()?.name)
// profiling: node --cpu-prof main.mjs, node --heap-prof, node --inspect + Chrome DevTools
```

Output

```text
true 1000000
temp
```

#### Go

```go
package main

import (
	"fmt"
	"runtime"
	"weak"
)

type Blob struct{ data []byte }

func main() {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	before := m.HeapAlloc

	big := make([]int, 1_000_000)
	runtime.ReadMemStats(&m)
	fmt.Println(m.HeapAlloc > before, len(big))

	// weak pointers and cleanups (Go 1.24), like WeakRef and FinalizationRegistry
	b := &Blob{data: make([]byte, 1024)}
	wp := weak.Make(b)
	done := make(chan struct{})
	runtime.AddCleanup(b, func(name string) {
		fmt.Println("collected", name)
		close(done)
	}, "blob")
	fmt.Println(wp.Value() != nil)

	b = nil
	runtime.GC()
	<-done
	fmt.Println(wp.Value() == nil)
}
```

Output

```text
true 1000000
true
collected blob
true
```

Profile with `go test -cpuprofile cpu.out -memprofile mem.out`, or import `net/http/pprof` in a server, then run `go tool pprof -http=: cpu.out`. `go build -gcflags=-m` shows which values escape to the heap. Since Go 1.26 the Green Tea garbage collector is the default.

## Gotchas for Node.js developers

### common traps

#### Go

```go
package main

import (
	"errors"
	"fmt"
)

type MyErr struct{}

func (*MyErr) Error() string { return "my error" }

func mayFail(fail bool) error {
	var p *MyErr // typed nil pointer
	if fail {
		p = &MyErr{}
	}
	return p // never nil as an interface: it holds the type *MyErr
}

func main() {
	// 1. append may or may not share the backing array
	a := make([]int, 3, 10)
	b := append(a, 4)
	c := append(a, 5) // overwrites b[3]: both share a's spare capacity
	fmt.Println(b[3], c[3])

	// 2. range gives copies of elements
	type item struct{ n int }
	items := []item{{1}, {2}}
	for _, it := range items {
		it.n *= 10 // modifies the copy
	}
	for i := range items {
		items[i].n *= 10 // modifies the element
	}
	fmt.Println(items)

	// 3. an interface holding a nil pointer is not nil
	err := mayFail(false)
	fmt.Println(err == nil, err != nil)

	// 4. indexing a string gives bytes; len counts bytes
	s := "é"
	fmt.Println(len(s), s[0], string([]rune(s)[0]))

	// 5. integer division truncates and fixed-size ints overflow silently
	var i8 int8 = 127
	i8++
	fmt.Println(7/2, -7/2, 7.0/2, i8)

	// 6. := in an inner scope shadows the outer variable
	var result error
	if true {
		result := errors.New("shadowed")
		_ = result
	}
	fmt.Println(result)

	// 7. a nil map reads fine but panics on write; a nil slice appends fine
	var m map[string]int
	var sl []int
	sl = append(sl, 1)
	fmt.Println(m["x"], sl)
}
```

Output

```text
5 5
[{10} {20}]
false true
2 195 é
3 -3 3.5 -128
<nil>
0 [1]
```

More to watch for:

- **No `undefined`.** A missing map key, an unset field, and a decoded JSON field that was absent all give the zero value. Use `v, ok := m[k]`, pointer fields, or `omitzero` when "absent" must differ from "zero".
- **Goroutine leaks.** A goroutine blocked forever on a channel is never collected. Give every goroutine a way to finish: close the channel, or select on `ctx.Done()`.
- **Unrecovered panics in goroutines** kill the whole process.
- **`for` + `defer`** defers until the function returns, not the iteration.
- **Map iteration order is random**, and maps are not safe for concurrent writes; use a `sync.Mutex` (or `sync.Map` for append-mostly caches).
- **Time layouts** use the reference date `2006-01-02 15:04:05`, not `YYYY-MM-DD`.
- **`http.DefaultClient` has no timeout** and response bodies must be closed.
- **Unused variables and imports** do not compile; `_ = x` or `import _ "pkg"` when intended.
- **Exported means capitalized.** `json.Marshal` silently skips lowercase fields.

## Further reading

- [A Tour of Go](https://go.dev/tour/), [Effective Go](https://go.dev/doc/effective_go) ([local copy](../Effective-Go/README.md)), [Go by Example](https://gobyexample.com/)
- [Go release notes](https://go.dev/doc/devel/release) and [Node.js changelog](https://github.com/nodejs/node/tree/main/doc/changelogs)
- [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments) and [Go Proverbs](https://go-proverbs.github.io/)
- [The Go Blog: range over function types](https://go.dev/blog/range-functions), [structured logging](https://go.dev/blog/slog), [testing time](https://go.dev/blog/synctest)

## License

The original guide is © Miguel Mota, [MIT License](../golang-for-nodejs-developers/LICENSE). This edition is released under the same license.
