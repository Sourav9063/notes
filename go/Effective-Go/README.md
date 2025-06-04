# Introduction [cite: 1]

Go is a new language. Although it borrows ideas from existing languages, it has unusual properties that make effective Go programs different in character from programs written in its relatives. [cite: 1] A straightforward translation of a C++ or Java program into Go is unlikely to produce a satisfactory result—Java programs are written in Java, not Go. [cite: 2] On the other hand, thinking about the problem from a Go perspective could produce a successful but quite different program. [cite: 3] In other words, to write Go well, it's important to understand its properties and idioms. [cite: 4] It's also important to know the established conventions for programming in Go, such as naming, formatting, program construction, and so on, so that programs you write will be easy for other Go programmers to understand. [cite: 5]

This document gives tips for writing clear, idiomatic Go code. [cite: 6] It augments the language specification, the Tour of Go, and How to Write Go Code, all of which you should read first. [cite: 7]

Note added January, 2022: This document was written for Go's release in 2009, and has not been updated significantly since. [cite: 8] Although it is a good guide to understand how to use the language itself, thanks to the stability of the language, it says little about the libraries and nothing about significant changes to the Go ecosystem since it was written, such as the build system, testing, modules, and polymorphism. [cite: 9] There are no plans to update it, as so much has happened and a large and growing set of documents, blogs, and books do a fine job of describing modern Go usage. [cite: 10] Effective Go continues to be useful, but the reader should understand it is far from a complete guide. [cite: 11] See issue 28782 for context. [cite: 12]

# Examples [cite: 12]

The Go package sources are intended to serve not only as the core library but also as examples of how to use the language. [cite: 12] Moreover, many of the packages contain working, self-contained executable examples you can run directly from the go.dev web site, such as this one (if necessary, click on the word "Example" to open it up). [cite: 14] If you have a question about how to approach a problem or how something might be implemented, the documentation, code and examples in the library can provide answers, ideas and background. [cite: 15]

# Formatting [cite: 16]

Formatting issues are the most contentious but the least consequential. [cite: 16] People can adapt to different formatting styles but it's better if they don't have to, and less time is devoted to the topic if everyone adheres to the same style. [cite: 17] The problem is how to approach this Utopia without a long prescriptive style guide. [cite: 18] With Go we take an unusual approach and let the machine take care of most formatting issues. [cite: 19] The `gofmt` program (also available as `go fmt`, which operates at the package level rather than source file level) reads a Go program and emits the source in a standard style of indentation and vertical alignment, retaining and if necessary reformatting comments. [cite: 20] If you want to know how to handle some new layout situation, run `gofmt`; [cite: 21] if the answer doesn't seem right, rearrange your program (or file a bug about `gofmt`), don't work around it. [cite: 22] As an example, there's no need to spend time lining up the comments on the fields of a structure. [cite: 23] `Gofmt` will do that for you. [cite: 24] Given the declaration:
```go
type T struct {
    name string // name of the object
    value int // its value
}
```
`gofmt` will line up the columns:
```go
type T struct {
    name    string // name of the object
    value   int    // its value
}
```
All Go code in the standard packages has been formatted with `gofmt`. [cite: 24]

Some formatting details remain. Very briefly:
* **Indentation** [cite: 25]
    We use tabs for indentation and `gofmt` emits them by default. [cite: 25] Use spaces only if you must. [cite: 26]
* **Line length** [cite: 26]
    Go has no line length limit. [cite: 26] Don't worry about overflowing a punched card. [cite: 27] If a line feels too long, wrap it and indent with an extra tab. [cite: 27]
* **Parentheses** [cite: 28]
    Go needs fewer parentheses than C and Java: control structures (`if`, `for`, `switch`) do not have parentheses in their syntax. [cite: 28] Also, the operator precedence hierarchy is shorter and clearer, so
    `x<<8 + y<<16`
    means what the spacing implies, unlike in the other languages. [cite: 29]

# Commentary [cite: 30]

Go provides C-style `/* */` block comments and C++-style `//` line comments. [cite: 30] Line comments are the norm; [cite: 30] block comments appear mostly as package comments, but are useful within an expression or to disable large swaths of code. [cite: 31] Comments that appear before top-level declarations, with no intervening newlines, are considered to document the declaration itself. [cite: 32] These “doc comments” are the primary documentation for a given Go package or command. [cite: 33] For more about doc comments, see “Go Doc Comments”. [cite: 34]

# Names [cite: 34]

Names are as important in Go as in any other language. [cite: 34] They even have semantic effect: the visibility of a name outside a package is determined by whether its first character is upper case. [cite: 35] It's therefore worth spending a little time talking about naming conventions in Go programs. [cite: 36]

## Package names [cite: 37]

When a package is imported, the package name becomes an accessor for the contents. [cite: 37] After
```go
import "bytes"
```
the importing package can talk about `bytes.Buffer`. [cite: 38] It's helpful if everyone using the package can use the same name to refer to its contents, which implies that the package name should be good: short, concise, evocative. [cite: 39] By convention, packages are given lower case, single-word names; there should be no need for underscores or mixedCaps. [cite: 40] Err on the side of brevity, since everyone using your package will be typing that name. [cite: 41] And don't worry about collisions `a priori`. [cite: 42] The package name is only the default name for imports; [cite: 42] it need not be unique across all source code, and in the rare case of a collision the importing package can choose a different name to use locally. [cite: 43] In any case, confusion is rare because the file name in the import determines just which package is being used. [cite: 44]

Another convention is that the package name is the base name of its source directory; [cite: 45] the package in `src/encoding/base64` is imported as `"encoding/base64"` but has name `base64`, not `encoding_base64` and not `encodingBase64`. [cite: 46] The importer of a package will use the name to refer to its contents, so exported names in the package can use that fact to avoid repetition. [cite: 47] (Don't use the `import .` notation, which can simplify tests that must run outside the package they are testing, but should otherwise be avoided.) [cite: 48] For instance, the buffered reader type in the `bufio` package is called `Reader`, not `BufReader`, because users see it as `bufio.Reader`, which is a clear, concise name. [cite: 48] Moreover, because imported entities are always addressed with their package name, `bufio.Reader` does not conflict with `io.Reader`. [cite: 49] Similarly, the function to make new instances of `ring.Ring`—which is the definition of a `constructor` in Go—would normally be called `NewRing`, but since `Ring` is the only type exported by the package, and since the package is called `ring`, it's called just `New`, which clients of the package see as `ring.New`. [cite: 50] Use the package structure to help you choose good names. [cite: 51]

Another short example is `once.Do`; [cite: 51] `once.Do(setup)` reads well and would not be improved by writing `once.DoOrWaitUntilDone(setup)`. [cite: 52] Long names don't automatically make things more readable. [cite: 52] A helpful doc comment can often be more valuable than an extra long name. [cite: 53]

## Getters [cite: 54]

Go doesn't provide automatic support for getters and setters. [cite: 54] There's nothing wrong with providing getters and setters yourself, and it's often appropriate to do so, but it's neither idiomatic nor necessary to put `Get` into the getter's name. [cite: 55] If you have a field called `owner` (lower case, unexported), the getter method should be called `Owner` (upper case, exported), not `GetOwner`. [cite: 56] The use of upper-case names for export provides the hook to discriminate the field from the method. [cite: 57] A setter function, if needed, will likely be called `SetOwner`. [cite: 58] Both names read well in practice: [cite: 59]
```go
owner := obj.Owner()
if owner != user {
    obj.SetOwner(user)
}
```

## Interface names [cite: 59]

By convention, one-method interfaces are named by the method name plus an `-er` suffix or similar modification to construct an agent noun: `Reader`, `Writer`, `Formatter`, `CloseNotifier` etc. [cite: 59] There are a number of such names and it's productive to honor them and the function names they capture. [cite: 59] `Read`, `Write`, `Close`, `Flush`, `String` and so on have canonical signatures and meanings. [cite: 60] To avoid confusion, don't give your method one of those names unless it has the same signature and meaning. [cite: 61] Conversely, if your type implements a method with the same meaning as a method on a well-known type, give it the same name and signature; [cite: 62] call your string-converter method `String` not `ToString`. [cite: 63]

## MixedCaps [cite: 63]

Finally, the convention in Go is to use `MixedCaps` or `mixedCaps` rather than underscores to write multiword names. [cite: 63]

# Semicolons [cite: 64]

Like C, Go's formal grammar uses semicolons to terminate statements, but unlike in C, those semicolons do not appear in the source. [cite: 64] Instead the lexer uses a simple rule to insert semicolons automatically as it scans, so the input text is mostly free of them. [cite: 65] The rule is this. If the last token before a newline is an identifier (which includes words like `int` and `float64`), a basic literal such as a number or string constant, or one of the tokens
`break continue fallthrough return ++ -- ) }`
the lexer always inserts a semicolon after the token. [cite: 66] This could be summarized as, “if the newline comes after a token that could end a statement, insert a semicolon”. [cite: 67] A semicolon can also be omitted immediately before a closing brace, so a statement such as
```go
go func() { for { dst <- <-src } }()
```
needs no semicolons. [cite: 68]

Idiomatic Go programs have semicolons only in places such as `for` loop clauses, to separate the initializer, condition, and continuation elements. [cite: 69] They are also necessary to separate multiple statements on a line, should you write code that way. [cite: 70]

One consequence of the semicolon insertion rules is that you cannot put the opening brace of a control structure (`if`, `for`, `switch`, or `select`) on the next line. [cite: 71] If you do, a semicolon will be inserted before the brace, which could cause unwanted effects. [cite: 72] Write them like this:
```go
if i < f() {
    g()
}
```
not like this:
```go
if i < f()  // wrong!
{           // wrong!
    g()
}
```

# Control structures [cite: 74]

The control structures of Go are related to those of C but differ in important ways. [cite: 74] There is no `do` or `while` loop, only a slightly generalized `for`; [cite: 75] `switch` is more flexible; [cite: 75] `if` and `switch` accept an optional initialization statement like that of `for`; [cite: 76] `break` and `continue` statements take an optional label to identify what to break or continue; [cite: 77] and there are new control structures including a type switch and a multiway communications multiplexer, `select`. [cite: 78] The syntax is also slightly different: there are no parentheses and the bodies must always be brace-delimited. [cite: 79]

## If [cite: 80]

In Go a simple `if` looks like this:
```go
if x > 0 {
    return y
}
```
Mandatory braces encourage writing simple `if` statements on multiple lines. [cite: 80] It's good style to do so anyway, especially when the body contains a control statement such as a `return` or `break`. [cite: 81]

Since `if` and `switch` accept an initialization statement, it's common to see one used to set up a local variable. [cite: 82]
```go
if err := file.Chmod(0664); err != nil {
    log.Print(err)
    return err
}
```
In the Go libraries, you'll find that when an `if` statement doesn't flow into the next statement—that is, the body ends in `break`, `continue`, `goto`, or `return`—the unnecessary `else` is omitted. [cite: 83]
```go
f, err := os.Open(name)
if err != nil {
    return err
}
codeUsing(f)
```
This is an example of a common situation where code must guard against a sequence of error conditions. [cite: 84] The code reads well if the successful flow of control runs down the page, eliminating error cases as they arise. [cite: 85] Since error cases tend to end in `return` statements, the resulting code needs no `else` statements. [cite: 85]
```go
f, err := os.Open(name)
if err != nil {
    return err
}
d, err := f.Stat()
if err != nil {
    f.Close()
    return err
}
codeUsing(f, d)
```

## Redeclaration and reassignment [cite: 654]

An aside: The last example in the previous section demonstrates a detail of how the `:=` short declaration form works. [cite: 654] The declaration that calls `os.Open` reads, [cite: 655]
```go
f, err := os.Open(name)
```
This statement declares two variables, `f` and `err`. [cite: 655] A few lines later, the call to `f.Stat` reads, [cite: 656]
```go
d, err := f.Stat()
```
which looks as if it declares `d` and `err`. [cite: 657] Notice, though, that `err` appears in both statements. [cite: 657] This duplication is legal: `err` is declared by the first statement, but only `re-assigned` in the second. [cite: 658] This means that the call to `f.Stat` uses the existing `err` variable declared above, and just gives it a new value. [cite: 659] In a `:=` declaration a variable `v` may appear even if it has already been declared, provided: [cite: 660]
* this declaration is in the same scope as the existing declaration of `v` (if `v` is already declared in an outer scope, the declaration will create a new variable §), [cite: 660]
* the corresponding value in the initialization is assignable to `v`, and [cite: 660]
* there is at least one other variable that is created by the declaration. [cite: 660]

This unusual property is pure pragmatism, making it easy to use a single `err` value, for example, in a long `if-else` chain. [cite: 661] You'll see it used often. [cite: 662]
§ It's worth noting here that in Go the scope of function parameters and return values is the same as the function body, even though they appear lexically outside the braces that enclose the body. [cite: 663]

## For [cite: 664]

The Go `for` loop is similar to—but not the same as—C's. [cite: 664] It unifies `for` and `while` and there is no `do-while`. [cite: 665] There are three forms, only one of which has semicolons. [cite: 665]
```go
// Like a C for
for init; condition; post { }

// Like a C while
for condition { }

// Like a C for(;;)
for { }
```
Short declarations make it easy to declare the index variable right in the loop. [cite: 667]
```go
sum := 0
for i := 0; i < 10; i++ {
    sum += i
}
```
If you're looping over an array, slice, string, or map, or reading from a channel, a `range` clause can manage the loop. [cite: 668]
```go
for key, value := range oldMap {
    newMap[key] = value
}
```
If you only need the first item in the range (the key or index), drop the second:
```go
for key := range m {
    if key.expired() {
        delete(m, key)
    }
}
```
If you only need the second item in the range (the value), use the `blank identifier`, an underscore, to discard the first:
```go
sum := 0
for _, value := range array {
    sum += value
}
```
The blank identifier has many uses, as described in a later section. [cite: 669]

For strings, the `range` does more work for you, breaking out individual Unicode code points by parsing the UTF-8. [cite: 670] Erroneous encodings consume one byte and produce the replacement rune U+FFFD. [cite: 671] (The name (with associated builtin type) `rune` is Go terminology for a single Unicode code point. See the language specification for details.) The loop
```go
for pos, char := range "日本\x80語" { // \x80 is an illegal UTF-8 encoding
    fmt.Printf("character %#U starts at byte position %d\n", char, pos)
}
```
prints
```
character U+65E5 '日' starts at byte position 0
character U+672C '本' starts at byte position 3
character U+FFFD '�' starts at byte position 6
character U+8A9E '語' starts at byte position 7
```
Finally, Go has no comma operator and `++` and `--` are statements not expressions. [cite: 672] Thus if you want to run multiple variables in a `for` you should use parallel assignment (although that precludes `++` and `--`). [cite: 673]
```go
// Reverse a
for i, j := 0, len(a)-1; i < j; i, j = i+1, j-1 {
    a[i], a[j] = a[j], a[i]
}
```

## Switch [cite: 675]

Go's `switch` is more general than C's. [cite: 675] The expressions need not be constants or even integers, the cases are evaluated top to bottom until a match is found, and if the `switch` has no expression it switches on `true`. [cite: 676] It's therefore possible—and idiomatic—to write an `if-else-if-else` chain as a `switch`. [cite: 677]
```go
func unhex(c byte) byte {
    switch {
    case '0' <= c && c <= '9':
        return c - '0'
    case 'a' <= c && c <= 'f':
        return c - 'a' + 10
    case 'A' <= c && c <= 'F':
        return c - 'A' + 10
    }
    return 0
}
```
There is no automatic fall through, but cases can be presented in comma-separated lists. [cite: 678]
```go
func shouldEscape(c byte) bool {
    switch c {
    case ' ', '?', '&', '=', '#', '+', '%':
        return true
    }
    return false
}
```
Although they are not nearly as common in Go as some other C-like languages, `break` statements can be used to terminate a `switch` early. [cite: 679] Sometimes, though, it's necessary to break out of a surrounding loop, not the switch, and in Go that can be accomplished by putting a label on the loop and "breaking" to that label. [cite: 680] This example shows both uses. [cite: 680]
```go
Loop:
    for n := 0; n < len(src); n += size {
        switch {
        case src[n] < sizeOne:
            if validateOnly {
                break
            }
            size = 1
            update(src[n])

        case src[n] < sizeTwo:
            if n+1 >= len(src) {
                err = errShortInput
                break Loop
            }
            if validateOnly {
                break
            }
            size = 2
            update(src[n] + src[n+1]<<shift)
        }
    }
```
Of course, the `continue` statement also accepts an optional label but it applies only to loops. [cite: 684]

To close this section, here's a comparison routine for byte slices that uses two `switch` statements:
```go
// Compare returns an integer comparing the two byte slices,
// lexicographically.
// The result will be 0 if a == b, -1 if a < b, and +1 if a > b
func Compare(a, b []byte) int {
    for i := 0; i < len(a) && i < len(b); i++ {
        switch {
        case a[i] > b[i]:
            return 1
        case a[i] < b[i]:
            return -1
        }
    }
    switch {
    case len(a) > len(b):
        return 1
    case len(a) < len(b):
        return -1
    }
    return 0
}
```

## Type switch [cite: 688]

A switch can also be used to discover the dynamic type of an interface variable. [cite: 688] Such a `type switch` uses the syntax of a type assertion with the keyword `type` inside the parentheses. [cite: 689] If the switch declares a variable in the expression, the variable will have the corresponding type in each clause. [cite: 690] It's also idiomatic to reuse the name in such cases, in effect declaring a new variable with the same name but a different type in each case. [cite: 691]
```go
var t interface{}
t = functionOfSomeType()
switch t := t.(type) {
default:
    fmt.Printf("unexpected type %T\n", t)     // %T prints whatever type t has
case bool:
    fmt.Printf("boolean %t\n", t)             // t has type bool
case int:
    fmt.Printf("integer %d\n", t)             // t has type int
case *bool:
    fmt.Printf("pointer to boolean %t\n", *t) // t has type *bool
case *int:
    fmt.Printf("pointer to integer %d\n", *t) // t has type *int
}
```

# Functions [cite: 692]

## Multiple return values [cite: 693]

One of Go's unusual features is that functions and methods can return multiple values. [cite: 693] This form can be used to improve on a couple of clumsy idioms in C programs: in-band error returns such as `-1` for `EOF` and modifying an argument passed by address. [cite: 694]

In C, a write error is signaled by a negative count with the error code secreted away in a volatile location. [cite: 695] In Go, `Write` can return a count `and` an error: “Yes, you wrote some bytes but not all of them because you filled the device”. [cite: 696] The signature of the `Write` method on files from package `os` is: [cite: 697]
```go
func (file *File) Write(b []byte) (n int, err error)
```
and as the documentation says, it returns the number of bytes written and a non-nil `error` when `n != len(b)`. [cite: 697] This is a common style; see the section on error handling for more examples. [cite: 698]

A similar approach obviates the need to pass a pointer to a return value to simulate a reference parameter. [cite: 699] Here's a simple-minded function to grab a number from a position in a byte slice, returning the number and the next position. [cite: 700]
```go
func nextInt(b []byte, i int) (int, int) {
    for ; i < len(b) && !isDigit(b[i]); i++ {
    }
    x := 0
    for ; i < len(b) && isDigit(b[i]); i++ {
        x = x*10 + int(b[i]) - '0'
    }
    return x, i
}
```
You could use it to scan the numbers in an input slice `b` like this: [cite: 703]
```go
for i := 0; i < len(b); {
    x, i = nextInt(b, i)
    fmt.Println(x)
}
```

## Named result parameters [cite: 704]

The return or result "parameters" of a Go function can be given names and used as regular variables, just like the incoming parameters. [cite: 704] When named, they are initialized to the zero values for their types when the function begins; [cite: 705] if the function executes a `return` statement with no arguments, the current values of the result parameters are used as the returned values. [cite: 706] The names are not mandatory but they can make code shorter and clearer: they're documentation. [cite: 707] If we name the results of `nextInt` it becomes obvious which returned `int` is which. [cite: 708]
```go
func nextInt(b []byte, pos int) (value, nextPos int) {
```
Because named results are initialized and tied to an unadorned return, they can simplify as well as clarify. [cite: 709] Here's a version of `io.ReadFull` that uses them well: [cite: 709]
```go
func ReadFull(r Reader, buf []byte) (n int, err error) {
    for len(buf) > 0 && err == nil {
        var nr int
        nr, err = r.Read(buf)
        n += nr
        buf = buf[nr:]
    }
    return
}
```

## Defer [cite: 710]

Go's `defer` statement schedules a function call (the `deferred` function) to be run immediately before the function executing the `defer` returns. [cite: 710] It's an unusual but effective way to deal with situations such as resources that must be released regardless of which path a function takes to return. [cite: 711] The canonical examples are unlocking a mutex or closing a file. [cite: 711]
```go
// Contents returns the file's contents as a string.
func Contents(filename string) (string, error) {
    f, err := os.Open(filename)
    if err != nil {
        return "", err
    }
    defer f.Close()  // f.Close will run when we're finished.
    var result []byte
    buf := make([]byte, 100)
    for {
        n, err := f.Read(buf[0:])
        result = append(result, buf[0:n]...) // append is discussed later.
        if err != nil {
            if err == io.EOF {
                break
            }
            return "", err  // f will be closed if we return here.
        }
    }
    return string(result), nil // f will be closed if we return here.
}
```
Deferring a call to a function such as `Close` has two advantages. [cite: 717] First, it guarantees that you will never forget to close the file, a mistake that's easy to make if you later edit the function to add a new return path. [cite: 717] Second, it means that the close sits near the open, which is much clearer than placing it at the end of the function. [cite: 718]

The arguments to the deferred function (which include the receiver if the function is a method) are evaluated when the `defer` executes, not when the `call` executes. [cite: 719] Besides avoiding worries about variables changing values as the function executes, this means that a single deferred call site can defer multiple function executions. [cite: 720] Here's a silly example. [cite: 721]
```go
for i := 0; i < 5; i++ {
    defer fmt.Printf("%d ", i)
}
```
Deferred functions are executed in LIFO order, so this code will cause `4 3 2 1 0` to be printed when the function returns. [cite: 722]

A more plausible example is a simple way to trace function execution through the program. [cite: 723] We could write a couple of simple tracing routines like this: [cite: 724]
```go
func trace(s string)   { fmt.Println("entering:", s) }
func untrace(s string) { fmt.Println("leaving:", s) }

// Use them like this:
func a() {
    trace("a")
    defer untrace("a")
    // do something....
}
```
We can do better by exploiting the fact that arguments to deferred functions are evaluated when the `defer` executes. [cite: 725] The tracing routine can set up the argument to the untracing routine. [cite: 726] This example: [cite: 726]
```go
func trace(s string) string {
    fmt.Println("entering:", s)
    return s
}

func un(s string) {
    fmt.Println("leaving:", s)
}

func a() {
    defer un(trace("a"))
    fmt.Println("in a")
}

func b() {
    defer un(trace("b"))
    fmt.Println("in b")
    a()
}

func main() {
    b()
}
```
prints
```
entering: b
in b
entering: a
in a
leaving: a
leaving: b
```
For programmers accustomed to block-level resource management from other languages, `defer` may seem peculiar, but its most interesting and powerful applications come precisely from the fact that it's not block-based but function-based. [cite: 727] In the section on `panic` and `recover` we'll see another example of its possibilities. [cite: 728]

# Data [cite: 728]

## Allocation with `new` [cite: 729]

Go has two allocation primitives, the built-in functions `new` and `make`. [cite: 729] They do different things and apply to different types, which can be confusing, but the rules are simple. [cite: 730] Let's talk about `new` first. It's a built-in function that allocates memory, but unlike its namesakes in some other languages it does not `initialize` the memory, it only `zeros` it. [cite: 730] That is, `new(T)` allocates zeroed storage for a new item of type `T` and returns its address, a value of type `*T`. [cite: 731] In Go terminology, it returns a pointer to a newly allocated zero value of type `T`. [cite: 732]

Since the memory returned by `new` is zeroed, it's helpful to arrange when designing your data structures that the zero value of each type can be used without further initialization. [cite: 733] This means a user of the data structure can create one with `new` and get right to work. [cite: 734] For example, the documentation for `bytes.Buffer` states that "the zero value for `Buffer` is an empty buffer ready to use." [cite: 735] Similarly, `sync.Mutex` does not have an explicit constructor or `Init` method. [cite: 736] Instead, the zero value for a `sync.Mutex` is defined to be an unlocked mutex. [cite: 737]

The zero-value-is-useful property works transitively. Consider this type declaration. [cite: 738]
```go
type SyncedBuffer struct {
    lock    sync.Mutex
    buffer  bytes.Buffer
}
```
Values of type `SyncedBuffer` are also ready to use immediately upon allocation or just declaration. [cite: 739] In the next snippet, both `p` and `v` will work correctly without further arrangement. [cite: 740]
```go
p := new(SyncedBuffer)  // type *SyncedBuffer
var v SyncedBuffer      // type  SyncedBuffer
```

## Constructors and composite literals [cite: 741]

Sometimes the zero value isn't good enough and an initializing constructor is necessary, as in this example derived from package `os`. [cite: 741]
```go
func NewFile(fd int, name string) *File {
    if fd < 0 {
        return nil
    }
    f := new(File)
    f.fd = fd
    f.name = name
    f.dirinfo = nil
    f.nepipe = 0
    return f
}
```
There's a lot of boilerplate in there. [cite: 742] We can simplify it using a `composite literal`, which is an expression that creates a new instance each time it is evaluated. [cite: 743]
```go
func NewFile(fd int, name string) *File {
    if fd < 0 {
        return nil
    }
    f := File{fd, name, nil, 0}
    return &f
}
```
Note that, unlike in C, it's perfectly OK to return the address of a local variable; [cite: 744] the storage associated with the variable survives after the function returns. [cite: 745] In fact, taking the address of a composite literal allocates a fresh instance each time it is evaluated, so we can combine these last two lines. [cite: 746]
```go
return &File{fd, name, nil, 0}
```
The fields of a composite literal are laid out in order and must all be present. [cite: 747] However, by labeling the elements explicitly as `field: value` pairs, the initializers can appear in any order, with the missing ones left as their respective zero values. [cite: 748] Thus we could say
```go
return &File{fd: fd, name: name}
```
As a limiting case, if a composite literal contains no fields at all, it creates a zero value for the type. [cite: 749] The expressions `new(File)` and `&File{}` are equivalent. [cite: 750]

Composite literals can also be created for arrays, slices, and maps, with the field labels being indices or map keys as appropriate. [cite: 751] In these examples, the initializations work regardless of the values of `Enone`, `Eio`, and `Einval`, as long as they are distinct. [cite: 752]
```go
a := [...]string   {Enone: "no error", Eio: "Eio", Einval: "invalid argument"}
s := []string      {Enone: "no error", Eio: "Eio", Einval: "invalid argument"}
m := map[int]string{Enone: "no error", Eio: "Eio", Einval: "invalid argument"}
```

## Allocation with `make` [cite: 753]

Back to allocation. [cite: 753] The built-in function `make(T, args)` serves a purpose different from `new(T)`. [cite: 754] It creates slices, maps, and channels only, and it returns an `initialized` (not `zeroed`) value of type `T` (not `*T`). [cite: 755] The reason for the distinction is that these three types represent, under the covers, references to data structures that must be initialized before use. [cite: 756] A slice, for example, is a three-item descriptor containing a pointer to the data (inside an array), the length, and the capacity, and until those items are initialized, the slice is `nil`. [cite: 757] For slices, maps, and channels, `make` initializes the internal data structure and prepares the value for use. [cite: 758] For instance, [cite: 758]
```go
make([]int, 10, 100)
```
allocates an array of 100 ints and then creates a slice structure with length 10 and a capacity of 100 pointing at the first 10 elements of the array. [cite: 176, 758] (When making a slice, the capacity can be omitted; see the section on slices for more information.) [cite: 177, 759] In contrast, `new([]int)` returns a pointer to a newly allocated, zeroed slice structure, that is, a pointer to a `nil` slice value. [cite: 177, 759]

These examples illustrate the difference between `new` and `make`. [cite: 178, 760]
```go
var p *[]int = new([]int)       // allocates slice structure; *p == nil; rarely useful [cite: 179]
var v  []int = make([]int, 100) // the slice v now refers to a new array of 100 ints [cite: 179]

// Unnecessarily complex:
var p *[]int = new([]int)
*p = make([]int, 100, 100)

// Idiomatic:
v := make([]int, 100)
```
Remember that `make` applies only to maps, slices and channels and does not return a pointer. [cite: 180, 763] To obtain an explicit pointer allocate with `new` or take the address of a variable explicitly. [cite: 180, 763]

## Arrays [cite: 181, 764]

Arrays are useful when planning the detailed layout of memory and sometimes can help avoid allocation, but primarily they are a building block for slices, the subject of the next section. [cite: 181, 764] To lay the foundation for that topic, here are a few words about arrays. [cite: 182, 765]

There are major differences between the ways arrays work in Go and C. In Go, [cite: 183, 766]
* Arrays are values. [cite: 183, 766] Assigning one array to another copies all the elements. [cite: 184, 767] In particular, if you pass an array to a function, it will receive a `copy` of the array, not a pointer to it. [cite: 184, 767]
* The size of an array is part of its type. [cite: 185, 768] The types `[10]int` and `[20]int` are distinct. [cite: 185, 769]

The value property can be useful but also expensive; [cite: 186, 770] if you want C-like behavior and efficiency, you can pass a pointer to the array. [cite: 186, 771]
```go
func Sum(a *[3]float64) (sum float64) {
    for _, v := range *a {
        sum += v
    }
    return
}

array := [...]float64{7.0, 8.5, 9.1}
x := Sum(&array)  // Note the explicit address-of operator
```
But even this style isn't idiomatic Go. [cite: 772] Use slices instead. [cite: 772]

## Slices [cite: 773]

Slices wrap arrays to give a more general, powerful, and convenient interface to sequences of data. [cite: 773] Except for items with explicit dimension such as transformation matrices, most array programming in Go is done with slices rather than simple arrays. [cite: 774]

Slices hold references to an underlying array, and if you assign one slice to another, both refer to the same array. [cite: 775] If a function takes a slice argument, changes it makes to the elements of the slice will be visible to the caller, analogous to passing a pointer to the underlying array. [cite: 776] A `Read` function can therefore accept a slice argument rather than a pointer and a count; [cite: 777] the length within the slice sets an upper limit of how much data to read. [cite: 778] Here is the signature of the `Read` method of the `File` type in package `os`: [cite: 778]
```go
func (f *File) Read(buf []byte) (n int, err error)
```
The method returns the number of bytes read and an error value, if any. [cite: 779] To read into the first 32 bytes of a larger buffer `buf`, `slice` (here used as a verb) the buffer. [cite: 780]
```go
n, err := f.Read(buf[0:32])
```
Such slicing is common and efficient. [cite: 781] In fact, leaving efficiency aside for the moment, the following snippet would also read the first 32 bytes of the buffer. [cite: 781]
```go
var n int
var err error
for i := 0; i < 32; i++ {
    nbytes, e := f.Read(buf[i:i+1])  // Read one byte.
    n += nbytes
    if nbytes == 0 || e != nil {
        err = e
        break
    }
}
```
The length of a slice may be changed as long as it still fits within the limits of the underlying array; [cite: 785] just assign it to a slice of itself. [cite: 785] The `capacity` of a slice, accessible by the built-in function `cap`, reports the maximum length the slice may assume. [cite: 786] Here is a function to append data to a slice. If the data... [cite: 786]

---

# বাংলায় অনুবাদ (Translation in Bengali)

## ভূমিকা [cite: 1]

গো একটি নতুন ভাষা। যদিও এটি বিদ্যমান ভাষাগুলি থেকে ধারণা ধার করেছে, তবে এর কিছু অস্বাভাবিক বৈশিষ্ট্য রয়েছে যা কার্যকর গো প্রোগ্রামগুলিকে এর আত্মীয়দের থেকে ভিন্ন করে তোলে। [cite: 1] একটি C++ বা জাভা প্রোগ্রামকে সরাসরি গো-তে অনুবাদ করলে সন্তোষজনক ফলাফল নাও আসতে পারে—জাভা প্রোগ্রাম জাভাতে লেখা হয়, গো-তে নয়। [cite: 2] অন্যদিকে, গো-এর দৃষ্টিকোণ থেকে সমস্যাটি নিয়ে ভাবলে একটি সফল কিন্তু বেশ ভিন্ন প্রোগ্রাম তৈরি হতে পারে। [cite: 3] অন্য কথায়, গো ভালোভাবে লিখতে হলে, এর বৈশিষ্ট্য এবং রীতিনীতি বোঝা গুরুত্বপূর্ণ। [cite: 4] গো-তে প্রোগ্রামিংয়ের প্রতিষ্ঠিত নিয়মাবলী, যেমন নামকরণ, ফরম্যাটিং, প্রোগ্রাম নির্মাণ ইত্যাদি সম্পর্কে জানাটাও গুরুত্বপূর্ণ, যাতে আপনার লেখা প্রোগ্রামগুলি অন্যান্য গো প্রোগ্রামারদের বুঝতে সহজ হয়। [cite: 5]

এই নথিটি স্পষ্ট, প্রচলিত গো কোড লেখার জন্য টিপস দেয়। [cite: 6] এটি ভাষা স্পেসিফিকেশন, ট্যুর অফ গো, এবং হাউ টু রাইট গো কোড-কে বাড়িয়ে তোলে, যার সবগুলোই আপনার প্রথমে পড়া উচিত। [cite: 7]

জানুয়ারী, ২০২২-এ যোগ করা দ্রষ্টব্য: এই নথিটি ২০০৯ সালে গো-এর প্রকাশের জন্য লেখা হয়েছিল এবং তারপর থেকে উল্লেখযোগ্যভাবে আপডেট করা হয়নি। [cite: 8] যদিও ভাষাটি কীভাবে ব্যবহার করতে হয় তা বোঝার জন্য এটি একটি ভাল নির্দেশিকা, ভাষার স্থিতিশীলতার কারণে, এটি লাইব্রেরিগুলি সম্পর্কে খুব কমই বলে এবং লেখার পর থেকে গো ইকোসিস্টেমের উল্লেখযোগ্য পরিবর্তনগুলি, যেমন বিল্ড সিস্টেম, টেস্টিং, মডিউল, এবং পলিমরফিজম সম্পর্কে কিছুই বলে না। [cite: 9] এটি আপডেট করার কোনো পরিকল্পনা নেই, কারণ অনেক কিছু ঘটেছে এবং নথি, ব্লগ, এবং বইয়ের একটি বৃহৎ এবং ক্রমবর্ধমান সেট আধুনিক গো ব্যবহার চমৎকারভাবে বর্ণনা করে। [cite: 10] কার্যকরী গো এখনও দরকারী, কিন্তু পাঠককে বুঝতে হবে যে এটি একটি সম্পূর্ণ নির্দেশিকা থেকে অনেক দূরে। [cite: 11] প্রাসঙ্গিকতার জন্য ইস্যু ২৮৭৮২ দেখুন। [cite: 12]

## উদাহরণ [cite: 12]

গো প্যাকেজ সোর্সগুলি কেবল কোর লাইব্রেরি হিসেবে নয়, ভাষাটি কীভাবে ব্যবহার করতে হয় তার উদাহরণ হিসেবেও কাজ করার উদ্দেশ্যে তৈরি। [cite: 12] উপরন্তু, অনেক প্যাকেজে কার্যকরী, স্ব-নিহিত এক্সিকিউটেবল উদাহরণ রয়েছে যা আপনি সরাসরি go.dev ওয়েবসাইট থেকে চালাতে পারবেন, যেমন এটি (প্রয়োজনে, এটি খুলতে "Example" শব্দটিতে ক্লিক করুন)। [cite: 14] যদি আপনার কোনো সমস্যা কীভাবে সমাধান করা যায় বা কীভাবে কিছু প্রয়োগ করা যায় সে সম্পর্কে প্রশ্ন থাকে, তাহলে লাইব্রেরির ডকুমেন্টেশন, কোড এবং উদাহরণগুলি উত্তর, ধারণা এবং পটভূমি সরবরাহ করতে পারে। [cite: 15]

## ফরম্যাটিং [cite: 16]

ফরম্যাটিং সংক্রান্ত সমস্যাগুলি সবচেয়ে বিতর্কিত তবে কম গুরুত্বপূর্ণ। [cite: 16] লোকেরা বিভিন্ন ফরম্যাটিং শৈলীতে মানিয়ে নিতে পারে তবে যদি তাদের মানিয়ে নিতে না হয় তবে তা আরও ভাল, এবং যদি সবাই একই শৈলী মেনে চলে তবে এই বিষয়ে কম সময় ব্যয় হয়। [cite: 17] সমস্যা হল একটি দীর্ঘ প্রেসক্রিপটিভ স্টাইল গাইড ছাড়া এই ইউটোপিয়ায় কীভাবে পৌঁছানো যায়। [cite: 18] গো-এর ক্ষেত্রে আমরা একটি অস্বাভাবিক পদ্ধতি গ্রহণ করি এবং বেশিরভাগ ফরম্যাটিং সমস্যা মেশিনকে দেখতে দিই। [cite: 19] `gofmt` প্রোগ্রাম (যা `go fmt` হিসেবেও উপলব্ধ, যা উৎস ফাইল স্তরের পরিবর্তে প্যাকেজ স্তরে কাজ করে) একটি গো প্রোগ্রাম পড়ে এবং ইনডেন্টেশন ও উল্লম্ব সারিবদ্ধকরণের একটি স্ট্যান্ডার্ড শৈলীতে উৎস কোড নির্গত করে, মন্তব্যগুলি ধরে রাখে এবং প্রয়োজনে সেগুলিকে পুনরায় ফরম্যাট করে। [cite: 20] যদি আপনি কোনো নতুন বিন্যাস পরিস্থিতি কীভাবে পরিচালনা করতে হয় তা জানতে চান, তাহলে `gofmt` চালান; [cite: 21] যদি উত্তরটি সঠিক বলে মনে না হয়, তাহলে আপনার প্রোগ্রাম পুনর্বিন্যাস করুন (অথবা `gofmt` সম্পর্কে একটি বাগ ফাইল করুন), এটিকে পাশ কাটিয়ে যাবেন না। [cite: 22] উদাহরণস্বরূপ, একটি কাঠামোর ক্ষেত্রগুলিতে মন্তব্যগুলি সারিবদ্ধ করার জন্য সময় ব্যয় করার প্রয়োজন নেই। [cite: 23] `Gofmt` আপনার জন্য এটি করবে। [cite: 24] ঘোষণার পরিপ্রেক্ষিতে:
```go
type T struct {
    name string // বস্তুর নাম
    value int // এর মান
}
```
`gofmt` কলামগুলিকে সারিবদ্ধ করবে:
```go
type T struct {
    name    string // বস্তুর নাম
    value   int    // এর মান
}
```
স্ট্যান্ডার্ড প্যাকেজগুলিতে সমস্ত গো কোড `gofmt` দ্বারা ফরম্যাট করা হয়েছে। [cite: 24]

কিছু ফরম্যাটিং বিবরণ অবশিষ্ট আছে। খুব সংক্ষেপে:
* **ইনডেন্টেশন** [cite: 25]
    আমরা ইনডেন্টেশনের জন্য ট্যাব ব্যবহার করি এবং `gofmt` ডিফল্টভাবে সেগুলি নির্গত করে। [cite: 25] শুধুমাত্র যদি প্রয়োজন হয় তবেই স্পেস ব্যবহার করুন। [cite: 26]
* **লাইনের দৈর্ঘ্য** [cite: 26]
    গো-এর কোনো লাইনের দৈর্ঘ্যের সীমা নেই। [cite: 26] পাঞ্চ করা কার্ড উপচে পড়ার বিষয়ে চিন্তা করবেন না। [cite: 27] যদি একটি লাইন খুব দীর্ঘ মনে হয়, তাহলে এটিকে ভেঙে একটি অতিরিক্ত ট্যাব দিয়ে ইনডেন্ট করুন। [cite: 27]
* **বন্ধনী** [cite: 28]
    গো-এর C এবং জাভার চেয়ে কম বন্ধনীর প্রয়োজন হয়: নিয়ন্ত্রণ কাঠামো (`if`, `for`, `switch`) তাদের সিনট্যাক্সে বন্ধনী থাকে না। [cite: 28] এছাড়াও, অপারেটরের অগ্রাধিকার ক্রম ছোট এবং স্পষ্ট, তাই
    `x<<8 + y<<16`
    অন্যান্য ভাষার মতো নয়, স্পেসিং যা বোঝায় তাই বোঝায়। [cite: 29]

## মন্তব্য [cite: 30]

গো C-স্টাইলের `/* */` ব্লক কমেন্ট এবং C++-স্টাইলের `//` লাইন কমেন্ট সরবরাহ করে। [cite: 30] লাইন কমেন্টগুলি স্বাভাবিক; [cite: 30] ব্লক কমেন্টগুলি বেশিরভাগ প্যাকেজ কমেন্ট হিসেবে দেখা যায়, তবে একটি এক্সপ্রেশনের মধ্যে বা কোডের বড় অংশ নিষ্ক্রিয় করতে দরকারী। [cite: 31] টপ-লেভেল ঘোষণার আগে, কোনো নতুন লাইন ছাড়াই যে মন্তব্যগুলি প্রদর্শিত হয়, সেগুলিকে ঘোষণাটিকেই ডকুমেন্ট করার জন্য বিবেচনা করা হয়। [cite: 32] এই "ডক কমেন্টগুলি" একটি নির্দিষ্ট গো প্যাকেজ বা কমান্ডের প্রাথমিক ডকুমেন্টেশন। [cite: 33] ডক কমেন্ট সম্পর্কে আরও জানতে, "গো ডক কমেন্ট" দেখুন। [cite: 34]

## নাম [cite: 34]

অন্যান্য ভাষার মতোই গো-তে নাম গুরুত্বপূর্ণ। [cite: 34] এমনকি তাদের শব্দার্থিক প্রভাবও রয়েছে: একটি প্যাকেজের বাইরে একটি নামের দৃশ্যমানতা নির্ধারিত হয় তার প্রথম অক্ষরটি বড় হাতের কিনা তার উপর ভিত্তি করে। [cite: 35] তাই গো প্রোগ্রামগুলিতে নামকরণের নিয়মাবলী নিয়ে কিছুটা সময় ব্যয় করা মূল্যবান। [cite: 36]

### প্যাকেজের নাম [cite: 37]

যখন একটি প্যাকেজ আমদানি করা হয়, তখন প্যাকেজের নামটি বিষয়বস্তুর জন্য একটি অ্যাক্সেসর হয়ে ওঠে। [cite: 37]
```go
import "bytes"
```
এর পর আমদানি করা প্যাকেজ `bytes.Buffer` সম্পর্কে কথা বলতে পারে। [cite: 38] প্যাকেজ ব্যবহারকারী প্রত্যেকের জন্য এর বিষয়বস্তু উল্লেখ করতে একই নাম ব্যবহার করা সহায়ক, যা বোঝায় যে প্যাকেজের নামটি ভালো হওয়া উচিত: সংক্ষিপ্ত, সুনির্দিষ্ট, উদ্দীপক। [cite: 39] প্রচলিতভাবে, প্যাকেজগুলিকে ছোট হাতের, একক-শব্দের নাম দেওয়া হয়; আন্ডারস্কোর বা মিক্সডক্যাপসের কোনো প্রয়োজন থাকা উচিত নয়। [cite: 40] সংক্ষিপ্ততার দিকে ঝোঁক দিন, কারণ আপনার প্যাকেজ ব্যবহারকারী প্রত্যেকেই সেই নামটি টাইপ করবে। [cite: 41] এবং `a priori` সংঘর্ষের বিষয়ে চিন্তা করবেন না। [cite: 42] প্যাকেজের নামটি কেবল আমদানির জন্য ডিফল্ট নাম; [cite: 42] এটি সমস্ত উৎস কোড জুড়ে অনন্য হওয়ার প্রয়োজন নেই, এবং সংঘর্ষের বিরল ক্ষেত্রে আমদানি করা প্যাকেজ স্থানীয়ভাবে ব্যবহার করার জন্য একটি ভিন্ন নাম বেছে নিতে পারে। [cite: 43] যাই হোক না কেন, বিভ্রান্তি বিরল কারণ আমদানি করা ফাইলের নামটি ঠিক কোন প্যাকেজটি ব্যবহার করা হচ্ছে তা নির্ধারণ করে। [cite: 44]

অন্য একটি প্রথা হল প্যাকেজের নামটি তার উৎস ডিরেক্টরির বেস নাম; [cite: 45] `src/encoding/base64`-এর প্যাকেজটি `"encoding/base64"` হিসাবে আমদানি করা হয় কিন্তু এর নাম `base64`, `encoding_base64` নয় এবং `encodingBase64` নয়। [cite: 46] একটি প্যাকেজের আমদানিকারক তার বিষয়বস্তু উল্লেখ করার জন্য নামটি ব্যবহার করবে, তাই প্যাকেজের এক্সপোর্ট করা নামগুলি পুনরাবৃত্তি এড়াতে সেই সত্যটি ব্যবহার করতে পারে। [cite: 47] (`import .` নোটেশন ব্যবহার করবেন না, যা যে প্যাকেজগুলি পরীক্ষা করা হচ্ছে তার বাইরে চালানো পরীক্ষাগুলিকে সহজ করতে পারে, তবে অন্যথায় এড়ানো উচিত।) [cite: 48] উদাহরণস্বরূপ, `bufio` প্যাকেজের বাফারড রিডার টাইপটিকে `Reader` বলা হয়, `BufReader` নয়, কারণ ব্যবহারকারীরা এটিকে `bufio.Reader` হিসাবে দেখে, যা একটি স্পষ্ট, সংক্ষিপ্ত নাম। [cite: 48] উপরন্তু, যেহেতু আমদানি করা সত্তাগুলি সর্বদা তাদের প্যাকেজের নাম দিয়ে সম্বোধন করা হয়, `bufio.Reader` `io.Reader`-এর সাথে সাংঘর্ষিক নয়। [cite: 49] একইভাবে, `ring.Ring`-এর নতুন উদাহরণ তৈরি করার ফাংশন—যা গো-তে একটি `constructor`-এর সংজ্ঞা—সাধারণত `NewRing` বলা হবে, কিন্তু যেহেতু `Ring` প্যাকেজ দ্বারা এক্সপোর্ট করা একমাত্র টাইপ, এবং যেহেতু প্যাকেজটির নাম `ring`, তাই এটিকে কেবল `New` বলা হয়, যা প্যাকেজের ক্লায়েন্টরা `ring.New` হিসাবে দেখে। [cite: 50] ভালো নাম বেছে নিতে আপনাকে প্যাকেজ কাঠামো ব্যবহার করতে সাহায্য করুন। [cite: 51]

আরেকটি সংক্ষিপ্ত উদাহরণ হল `once.Do`; [cite: 51] `once.Do(setup)` ভালোভাবে পড়া যায় এবং `once.DoOrWaitUntilDone(setup)` লিখে এটিকে উন্নত করা যাবে না। [cite: 52] দীর্ঘ নাম স্বয়ংক্রিয়ভাবে জিনিসগুলিকে আরও পঠনযোগ্য করে না। [cite: 52] একটি সহায়ক ডক কমেন্ট প্রায়শই একটি অতিরিক্ত দীর্ঘ নামের চেয়ে বেশি মূল্যবান হতে পারে। [cite: 53]

### গেটার [cite: 54]

গো গেটার এবং সেটারদের জন্য স্বয়ংক্রিয় সমর্থন সরবরাহ করে না। [cite: 54] নিজেরা গেটার এবং সেটার সরবরাহ করার ক্ষেত্রে কোনো সমস্যা নেই, এবং এটি প্রায়শই উপযুক্ত হয়, তবে গেটারের নামে `Get` রাখা প্রচলিতও নয় বা প্রয়োজনীয়ও নয়। [cite: 55] যদি আপনার একটি ক্ষেত্র `owner` (ছোট হাতের, আন-এক্সপোর্ট করা) থাকে, তাহলে গেটার পদ্ধতিটিকে `Owner` (বড় হাতের, এক্সপোর্ট করা) বলা উচিত, `GetOwner` নয়। [cite: 56] এক্সপোর্টের জন্য বড় হাতের নামের ব্যবহার ক্ষেত্রটিকে পদ্ধতি থেকে আলাদা করার সুযোগ দেয়। [cite: 57] একটি সেটার ফাংশন, যদি প্রয়োজন হয়, সম্ভবত `SetOwner` বলা হবে। [cite: 58] উভয় নামই বাস্তবে ভালোভাবে পড়া যায়: [cite: 59]
```go
owner := obj.Owner()
if owner != user {
    obj.SetOwner(user)
}
```

### ইন্টারফেসের নাম [cite: 59]

প্রচলিতভাবে, এক-পদ্ধতি ইন্টারফেসগুলির নামকরণ করা হয় পদ্ধতির নামের সাথে একটি `-er` প্রত্যয় বা একটি এজেন্ট বিশেষ্য তৈরি করার জন্য অনুরূপ পরিবর্তন সহ: `Reader`, `Writer`, `Formatter`, `CloseNotifier` ইত্যাদি। [cite: 59] এই ধরনের বেশ কয়েকটি নাম রয়েছে এবং সেগুলিকে এবং তারা যে ফাংশন নামগুলি ধারণ করে সেগুলিকে সম্মান করা ফলপ্রসূ। [cite: 59] `Read`, `Write`, `Close`, `Flush`, `String` ইত্যাদির ক্যানোনিকাল স্বাক্ষর এবং অর্থ রয়েছে। [cite: 60] বিভ্রান্তি এড়াতে, আপনার পদ্ধতিকে এই নামগুলির মধ্যে একটি দেবেন না যদি না এটির একই স্বাক্ষর এবং অর্থ থাকে। [cite: 61] বিপরীতভাবে, যদি আপনার প্রকারটি একটি সুপরিচিত প্রকারের একটি পদ্ধতির মতো একই অর্থ সহ একটি পদ্ধতি প্রয়োগ করে, তবে এটিকে একই নাম এবং স্বাক্ষর দিন; [cite: 62] আপনার স্ট্রিং-রূপান্তরকারী পদ্ধতিকে `ToString` না বলে `String` বলুন। [cite: 63]

### মিক্সডক্যাপস [cite: 63]

পরিশেষে, গো-এর প্রথা হল বহু-শব্দের নাম লেখার জন্য আন্ডারস্কোর ব্যবহার না করে `MixedCaps` বা `mixedCaps` ব্যবহার করা। [cite: 63]

## সেমিকোলন [cite: 64]

C-এর মতো, গো-এর আনুষ্ঠানিক ব্যাকরণে স্টেটমেন্ট শেষ করতে সেমিকোলন ব্যবহার করা হয়, কিন্তু C-এর মতো নয়, সেই সেমিকোলনগুলি সোর্সে দেখা যায় না। [cite: 64] পরিবর্তে লেক্সার স্ক্যান করার সময় স্বয়ংক্রিয়ভাবে সেমিকোলন ঢোকাতে একটি সাধারণ নিয়ম ব্যবহার করে, তাই ইনপুট টেক্সট বেশিরভাগই সেমিকোলন মুক্ত থাকে। [cite: 65] নিয়মটি হল এটি। যদি একটি নতুন লাইনের আগের শেষ টোকেনটি একটি শনাক্তকারী (যার মধ্যে `int` এবং `float64`-এর মতো শব্দ অন্তর্ভুক্ত), একটি মৌলিক লিটারাল যেমন একটি সংখ্যা বা স্ট্রিং কনস্ট্যান্ট, বা নিম্নলিখিত টোকেনগুলির মধ্যে একটি হয়:
`break continue fallthrough return ++ -- ) }`
তাহলে লেক্সার সর্বদা টোকেনের পরে একটি সেমিকোলন ঢোকায়। [cite: 66] এটিকে এভাবে সংক্ষিপ্ত করা যেতে পারে, "যদি নতুন লাইন এমন একটি টোকেনের পরে আসে যা একটি স্টেটমেন্ট শেষ করতে পারে, তবে একটি সেমিকোলন ঢোকান"। [cite: 67] একটি ক্লোজিং ব্রেসের ঠিক আগে একটি সেমিকোলন বাদ দেওয়া যেতে পারে, তাই একটি স্টেটমেন্ট যেমন:
```go
go func() { for { dst <- <-src } }()
```
কোনো সেমিকোলনের প্রয়োজন হয় না। [cite: 68]

প্রচলিত গো প্রোগ্রামগুলিতে সেমিকোলন শুধুমাত্র `for` লুপের ক্লজগুলিতে ব্যবহৃত হয়, ইনিশিয়ালাইজার, কন্ডিশন এবং কন্টিনিউয়েশন উপাদানগুলিকে আলাদা করতে। [cite: 69] আপনি যদি সেইভাবে কোড লেখেন তবে একই লাইনে একাধিক স্টেটমেন্ট আলাদা করার জন্যও সেগুলি প্রয়োজনীয়। [cite: 70]

সেমিকোলন ইনসারশন নিয়মের একটি পরিণতি হল যে আপনি একটি নিয়ন্ত্রণ কাঠামোর (`if`, `for`, `switch`, বা `select`) প্রারম্ভিক ব্রেসটি পরের লাইনে রাখতে পারবেন না। [cite: 71] যদি আপনি তা করেন, তাহলে ব্রেসের আগে একটি সেমিকোলন ঢোকানো হবে, যা অবাঞ্ছিত প্রভাব ফেলতে পারে। [cite: 72] এগুলি এভাবে লিখুন:
```go
if i < f() {
    g()
}
```
এভাবে নয়:
```go
if i < f()  // ভুল!
{           // ভুল!
    g()
}
```

## নিয়ন্ত্রণ কাঠামো [cite: 74]

গো-এর নিয়ন্ত্রণ কাঠামো C-এর সাথে সম্পর্কিত হলেও গুরুত্বপূর্ণ দিক থেকে ভিন্ন। [cite: 74] কোনো `do` বা `while` লুপ নেই, শুধুমাত্র কিছুটা সাধারণীকৃত `for`; [cite: 75] `switch` আরও নমনীয়; [cite: 75] `if` এবং `switch` `for`-এর মতো একটি ঐচ্ছিক ইনিশিয়ালাইজেশন স্টেটমেন্ট গ্রহণ করে; [cite: 76] `break` এবং `continue` স্টেটমেন্টগুলি কোনটিকে ভাঙতে হবে বা চালিয়ে যেতে হবে তা সনাক্ত করতে একটি ঐচ্ছিক লেবেল নেয়; [cite: 77] এবং একটি টাইপ সুইচ এবং একটি বহু-পথ যোগাযোগ মাল্টিপ্লেক্সার `select`-সহ নতুন নিয়ন্ত্রণ কাঠামো রয়েছে। [cite: 78] সিনট্যাক্সটিও কিছুটা ভিন্ন: কোনো বন্ধনী নেই এবং বডিগুলি সর্বদা ব্রেস-সীমাবদ্ধ হতে হবে। [cite: 79]

### If [cite: 80]

গো-তে একটি সাধারণ `if` এরকম দেখায়:
```go
if x > 0 {
    return y
}
```
বাধ্যতামূলক ব্রেসগুলি একাধিক লাইনে সাধারণ `if` স্টেটমেন্ট লিখতে উৎসাহিত করে। [cite: 80] এটি যেকোনো উপায়ে ভালো শৈলী, বিশেষ করে যখন বডিতে `return` বা `break`-এর মতো একটি নিয়ন্ত্রণ স্টেটমেন্ট থাকে। [cite: 81]

যেহেতু `if` এবং `switch` একটি ইনিশিয়ালাইজেশন স্টেটমেন্ট গ্রহণ করে, তাই স্থানীয় ভেরিয়েবল সেট আপ করতে এটি ব্যবহার করা সাধারণ। [cite: 82]
```go
if err := file.Chmod(0664); err != nil {
    log.Print(err)
    return err
}
```
গো লাইব্রেরিগুলিতে, আপনি দেখতে পাবেন যে যখন একটি `if` স্টেটমেন্ট পরবর্তী স্টেটমেন্টে প্রবাহিত হয় না — অর্থাৎ, বডিটি `break`, `continue`, `goto`, বা `return`-এ শেষ হয় — তখন অপ্রয়োজনীয় `else` বাদ দেওয়া হয়। [cite: 83]
```go
f, err := os.Open(name)
if err != nil {
    return err
}
codeUsing(f)
```
এটি একটি সাধারণ পরিস্থিতির উদাহরণ যেখানে কোডকে ত্রুটির শর্তগুলির একটি ক্রম থেকে রক্ষা করতে হবে। [cite: 84] কোডটি ভালোভাবে পড়া যায় যদি নিয়ন্ত্রণের সফল প্রবাহ পৃষ্ঠা বরাবর চলে, ত্রুটির ক্ষেত্রেগুলি যখনই উদ্ভূত হয় তখনই তা বাদ দিয়ে। [cite: 85] যেহেতু ত্রুটির ক্ষেত্রেগুলি `return` স্টেটমেন্টগুলিতে শেষ হতে থাকে, তাই ফলস্বরূপ কোডে কোনো `else` স্টেটমেন্টের প্রয়োজন হয় না। [cite: 85]
```go
f, err := os.Open(name)
if err != nil {
    return err
}
d, err := f.Stat()
if err != nil {
    f.Close()
    return err
}
codeUsing(f, d)
```

## পুনঃঘোষণা এবং পুনঃঅর্পণ [cite: 654]

একটি পার্শ্বকথা: পূর্ববর্তী অংশের শেষ উদাহরণটি `:=` শর্ট ডিক্লারেশন ফর্ম কীভাবে কাজ করে তার একটি বিস্তারিত ব্যাখ্যা করে। [cite: 654] `os.Open` কল করে যে ডিক্লারেশনটি পড়ে, [cite: 655]
```go
f, err := os.Open(name)
```
এই স্টেটমেন্ট দুটি ভেরিয়েবল ঘোষণা করে, `f` এবং `err`। [cite: 655] কয়েক লাইন পরে, `f.Stat` কলটি পড়ে, [cite: 656]
```go
d, err := f.Stat()
```
যা দেখে মনে হয় এটি `d` এবং `err` ঘোষণা করে। [cite: 657] তবে লক্ষ্য করুন যে `err` উভয় স্টেটমেন্টেই দেখা যায়। [cite: 657] এই পুনরাবৃত্তি বৈধ: `err` প্রথম স্টেটমেন্ট দ্বারা ঘোষিত হয়েছে, কিন্তু দ্বিতীয়টিতে কেবল `পুনরায় অর্পণ` করা হয়েছে। [cite: 658] এর অর্থ হল `f.Stat` কলটি উপরে ঘোষিত বিদ্যমান `err` ভেরিয়েবলটি ব্যবহার করে এবং কেবল এটিকে একটি নতুন মান দেয়। [cite: 659] একটি `:=` ঘোষণায় একটি ভেরিয়েবল `v` উপস্থিত হতে পারে এমনকি যদি এটি ইতিমধ্যেই ঘোষিত হয়ে থাকে, তবে শর্ত হল: [cite: 660]
* এই ঘোষণাটি `v`-এর বিদ্যমান ঘোষণার মতো একই স্কোপে রয়েছে (যদি `v` ইতিমধ্যেই একটি বাইরের স্কোপে ঘোষিত হয়ে থাকে, তাহলে ঘোষণাটি একটি নতুন ভেরিয়েবল তৈরি করবে §), [cite: 660]
* ইনিশিয়ালাইজেশনের সংশ্লিষ্ট মান `v`-এর জন্য অর্পণযোগ্য, এবং [cite: 660]
* ঘোষণা দ্বারা অন্তত একটি অন্য ভেরিয়েবল তৈরি করা হয়েছে। [cite: 660]

এই অস্বাভাবিক বৈশিষ্ট্যটি সম্পূর্ণ বাস্তববাদিতা, যা একক `err` মান ব্যবহার করা সহজ করে তোলে, উদাহরণস্বরূপ, একটি দীর্ঘ `if-else` চেইনে। [cite: 661] আপনি এটি প্রায়শই ব্যবহৃত হতে দেখবেন। [cite: 662]
§ এখানে উল্লেখ করা উচিত যে গো-তে ফাংশন প্যারামিটার এবং রিটার্ন মানের স্কোপ ফাংশন বডির মতোই, যদিও তারা ব্যাকরণগতভাবে বডিকে আবদ্ধ করা ব্রেসগুলির বাইরে প্রদর্শিত হয়। [cite: 663]

## For [cite: 664]

গো-এর `for` লুপ C-এর মতোই—তবে একই নয়। [cite: 664] এটি `for` এবং `while`-কে একত্রিত করে এবং কোনো `do-while` নেই। [cite: 665] তিনটি ফর্ম রয়েছে, যার মধ্যে শুধুমাত্র একটিতে সেমিকোলন রয়েছে। [cite: 665]
```go
// C-এর for লুপের মতো
for init; condition; post { }

// C-এর while লুপের মতো
for condition { }

// C-এর for(;;) লুপের মতো
for { }
```
শর্ট ডিক্লারেশনগুলি লুপের মধ্যেই ইনডেক্স ভেরিয়েবল ঘোষণা করা সহজ করে তোলে। [cite: 667]
```go
sum := 0
for i := 0; i < 10; i++ {
    sum += i
}
```
আপনি যদি একটি অ্যারে, স্লাইস, স্ট্রিং বা ম্যাপে লুপ করেন, অথবা একটি চ্যানেল থেকে পড়েন, তাহলে একটি `range` ক্লজ লুপটি পরিচালনা করতে পারে। [cite: 668]
```go
for key, value := range oldMap {
    newMap[key] = value
}
```
যদি আপনার রেঞ্জের শুধুমাত্র প্রথম আইটেমটি (কী বা সূচক) প্রয়োজন হয়, তাহলে দ্বিতীয়টি বাদ দিন:
```go
for key := range m {
    if key.expired() {
        delete(m, key)
    }
}
```
যদি আপনার রেঞ্জের শুধুমাত্র দ্বিতীয় আইটেমটি (মান) প্রয়োজন হয়, তাহলে প্রথমটি বাতিল করার জন্য `ব্ল্যাঙ্ক আইডেন্টিফায়ার`, একটি আন্ডারস্কোর ব্যবহার করুন:
```go
sum := 0
for _, value := range array {
    sum += value
}
```
ব্ল্যাঙ্ক আইডেন্টিফায়ারের অনেক ব্যবহার রয়েছে, যা পরবর্তী একটি অংশে বর্ণিত হয়েছে। [cite: 669]

স্ট্রিংগুলির জন্য, `range` আপনার জন্য আরও কাজ করে, UTF-8 পার্স করে পৃথক ইউনিকোড কোড পয়েন্ট বের করে। [cite: 670] ত্রুটিপূর্ণ এনকোডিংগুলি এক বাইট ব্যবহার করে এবং প্রতিস্থাপন রুন U+FFFD তৈরি করে। [cite: 671] (`rune` নামটি (সম্পর্কিত বিল্টইন টাইপ সহ) একটি একক ইউনিকোড কোড পয়েন্টের জন্য গো টার্মিনোলজি। বিস্তারিত জানতে ভাষার স্পেসিফিকেশন দেখুন।) লুপ
```go
for pos, char := range "日本\x80語" { // \x80 একটি অবৈধ UTF-8 এনকোডিং
    fmt.Printf("character %#U starts at byte position %d\n", char, pos)
}
```
প্রিন্ট করে
```
character U+65E5 '日' starts at byte position 0
character U+672C '本' starts at byte position 3
character U+FFFD '�' starts at byte position 6
character U+8A9E '語' starts at byte position 7
```
অবশেষে, গো-এর কোনো কমা অপারেটর নেই এবং `++` এবং `--` স্টেটমেন্ট, এক্সপ্রেশন নয়। [cite: 672] সুতরাং যদি আপনি একটি `for`-এ একাধিক ভেরিয়েবল চালাতে চান তবে আপনার সমান্তরাল অ্যাসাইনমেন্ট ব্যবহার করা উচিত (যদিও এটি `++` এবং `--` বাদ দেয়)। [cite: 673]
```go
// একটি অ্যারে উল্টান
for i, j := 0, len(a)-1; i < j; i, j = i+1, j-1 {
    a[i], a[j] = a[j], a[i]
}
```

## Switch [cite: 675]

গো-এর `switch` C-এর চেয়ে বেশি সাধারণ। [cite: 675] এক্সপ্রেশনগুলিকে ধ্রুবক বা এমনকি পূর্ণসংখ্যা হতে হবে না, কেসগুলি উপর থেকে নীচে মূল্যায়ন করা হয় যতক্ষণ না একটি মিল পাওয়া যায়, এবং যদি `switch`-এর কোনো এক্সপ্রেশন না থাকে তবে এটি `true`-এর উপর স্যুইচ করে। [cite: 676] অতএব এটি সম্ভব—এবং প্রচলিত—একটি `if-else-if-else` চেইনকে একটি `switch` হিসাবে লেখা। [cite: 677]
```go
func unhex(c byte) byte {
    switch {
    case '0' <= c && c <= '9':
        return c - '0'
    case 'a' <= c && c <= 'f':
        return c - 'a' + 10
    case 'A' <= c && c <= 'F':
        return c - 'A' + 10
    }
    return 0
}
```
কোনো স্বয়ংক্রিয় ফল-থ্রু নেই, তবে কেসগুলি কমা-আলাদা তালিকায় উপস্থাপন করা যেতে পারে। [cite: 678]
```go
func shouldEscape(c byte) bool {
    switch c {
    case ' ', '?', '&', '=', '#', '+', '%':
        return true
    }
    return false
}
```
যদিও গো-তে অন্যান্য C-সদৃশ ভাষার মতো `break` স্টেটমেন্টগুলি ততটা সাধারণ নয়, তবে একটি `switch` দ্রুত শেষ করতে `break` স্টেটমেন্ট ব্যবহার করা যেতে পারে। [cite: 679] তবে মাঝে মাঝে, সুইচ নয়, বরং একটি পার্শ্ববর্তী লুপ থেকে বের হওয়া প্রয়োজন হয়, এবং গো-তে এটি লুপে একটি লেবেল রেখে এবং সেই লেবেলে "ব্রেক" করে অর্জন করা যেতে পারে। [cite: 680] এই উদাহরণটি উভয় ব্যবহারই দেখায়। [cite: 680]
```go
Loop:
    for n := 0; n < len(src); n += size {
        switch {
        case src[n] < sizeOne:
            if validateOnly {
                break
            }
            size = 1
            update(src[n])

        case src[n] < sizeTwo:
            if n+1 >= len(src) {
                err = errShortInput
                break Loop
            }
            if validateOnly {
                break
            }
            size = 2
            update(src[n] + src[n+1]<<shift)
        }
    }
```
অবশ্যই, `continue` স্টেটমেন্টও একটি ঐচ্ছিক লেবেল গ্রহণ করে তবে এটি কেবল লুপগুলিতে প্রযোজ্য। [cite: 684]

এই অংশটি শেষ করার জন্য, এখানে বাইট স্লাইসের জন্য একটি তুলনা রুটিন রয়েছে যা দুটি `switch` স্টেটমেন্ট ব্যবহার করে:
```go
// Compare returns an integer comparing the two byte slices,
// lexicographically.
// The result will be 0 if a == b, -1 if a < b, and +1 if a > b
func Compare(a, b []byte) int {
    for i := 0; i < len(a) && i < len(b); i++ {
        switch {
        case a[i] > b[i]:
            return 1
        case a[i] < b[i]:
            return -1
        }
    }
    switch {
    case len(a) > len(b):
        return 1
    case len(a) < len(b):
        return -1
    }
    return 0
}
```

## টাইপ সুইচ [cite: 688]

একটি `switch` একটি ইন্টারফেস ভেরিয়েবলের ডাইনামিক টাইপ আবিষ্কার করতেও ব্যবহার করা যেতে পারে। [cite: 688] এই ধরনের একটি `টাইপ সুইচ` বন্ধনীর ভিতরে `type` কীওয়ার্ড সহ একটি টাইপ অ্যাসোসিয়েশনের সিনট্যাক্স ব্যবহার করে। [cite: 689] যদি `switch` এক্সপ্রেশনে একটি ভেরিয়েবল ঘোষণা করে, তাহলে ভেরিয়েবলটি প্রতিটি ক্লজে সংশ্লিষ্ট টাইপ পাবে। [cite: 690] এই ধরনের ক্ষেত্রে নামটি পুনরায় ব্যবহার করাও প্রচলিত, কার্যকরভাবে একই নাম কিন্তু প্রতিটি ক্ষেত্রে ভিন্ন টাইপ সহ একটি নতুন ভেরিয়েবল ঘোষণা করা। [cite: 691]
```go
var t interface{}
t = functionOfSomeType()
switch t := t.(type) {
default:
    fmt.Printf("unexpected type %T\n", t)     // %T t-এর যে কোনো টাইপ প্রিন্ট করে
case bool:
    fmt.Printf("boolean %t\n", t)             // t-এর টাইপ bool
case int:
    fmt.Printf("integer %d\n", t)             // t-এর টাইপ int
case *bool:
    fmt.Printf("pointer to boolean %t\n", *t) // t-এর টাইপ *bool
case *int:
    fmt.Printf("pointer to integer %d\n", *t) // t-এর টাইপ *int
}
```

## ফাংশন [cite: 692]

### একাধিক রিটার্ন মান [cite: 693]

গো-এর একটি অস্বাভাবিক বৈশিষ্ট্য হল যে ফাংশন এবং পদ্ধতিগুলি একাধিক মান ফেরত দিতে পারে। [cite: 693] এই ফর্মটি C প্রোগ্রামগুলিতে কয়েকটি আনাড়ি রীতি উন্নত করতে ব্যবহার করা যেতে পারে: `EOF`-এর জন্য `-1`-এর মতো ইন-ব্যান্ড ত্রুটি রিটার্ন এবং ঠিকানা দ্বারা পাস করা একটি আর্গুমেন্ট পরিবর্তন করা। [cite: 694]

সি-তে, একটি লেখার ত্রুটি একটি ঋণাত্মক গণনা দ্বারা সংকেত দেওয়া হয় এবং ত্রুটি কোডটি একটি অস্থির স্থানে লুকানো থাকে। [cite: 695] গো-তে, `Write` একটি গণনা `এবং` একটি ত্রুটি ফেরত দিতে পারে: "হ্যাঁ, আপনি কিছু বাইট লিখেছেন কিন্তু সবগুলি লেখেননি কারণ আপনি ডিভাইসটি পূর্ণ করেছেন"। [cite: 696] `os` প্যাকেজ থেকে ফাইলগুলিতে `Write` পদ্ধতির স্বাক্ষর হল: [cite: 697]
```go
func (file *File) Write(b []byte) (n int, err error)
```
এবং ডকুমেন্টেশন অনুযায়ী, এটি লেখা বাইটের সংখ্যা এবং একটি নন-নিল `error` ফেরত দেয় যখন `n != len(b)`। [cite: 697] এটি একটি সাধারণ শৈলী; আরও উদাহরণের জন্য ত্রুটি হ্যান্ডলিং সংক্রান্ত অংশটি দেখুন। [cite: 698]

একটি অনুরূপ পদ্ধতি একটি রেফারেন্স প্যারামিটার অনুকরণ করার জন্য রিটার্ন মানের একটি পয়েন্টার পাস করার প্রয়োজনীয়তা দূর করে। [cite: 699] এখানে একটি বাইট স্লাইসের একটি অবস্থান থেকে একটি সংখ্যা নেওয়ার জন্য একটি সহজ-সরল ফাংশন রয়েছে, যা সংখ্যা এবং পরবর্তী অবস্থান উভয়ই ফেরত দেয়। [cite: 700]
```go
func nextInt(b []byte, i int) (int, int) {
    for ; i < len(b) && !isDigit(b[i]); i++ {
    }
    x := 0
    for ; i < len(b) && isDigit(b[i]); i++ {
        x = x*10 + int(b[i]) - '0'
    }
    return x, i
}
```
আপনি ইনপুট স্লাইস `b`-এর সংখ্যাগুলি স্ক্যান করতে এটি ব্যবহার করতে পারেন: [cite: 703]
```go
for i := 0; i < len(b); {
    x, i = nextInt(b, i)
    fmt.Println(x)
}
```

### নামযুক্ত ফলাফল প্যারামিটার [cite: 704]

একটি গো ফাংশনের রিটার্ন বা ফলাফল "প্যারামিটার"গুলিকে নাম দেওয়া যেতে পারে এবং আগত প্যারামিটারগুলির মতোই নিয়মিত ভেরিয়েবল হিসাবে ব্যবহার করা যেতে পারে। [cite: 704] যখন নাম দেওয়া হয়, তখন ফাংশন শুরু হওয়ার সময় তাদের টাইপের শূন্য মানগুলিতে তারা ইনিশিয়ালাইজ করা হয়; [cite: 705] যদি ফাংশনটি কোনো আর্গুমেন্ট ছাড়া একটি `return` স্টেটমেন্ট এক্সিকিউট করে, তাহলে ফলাফল প্যারামিটারগুলির বর্তমান মানগুলি ফেরত মান হিসাবে ব্যবহৃত হয়। [cite: 706] নামগুলি বাধ্যতামূলক নয় তবে তারা কোডকে সংক্ষিপ্ত এবং স্পষ্ট করতে পারে: তারা ডকুমেন্টেশন। [cite: 707] যদি আমরা `nextInt`-এর ফলাফলগুলির নাম দিই তবে কোন ফেরত দেওয়া `int` কোনটি তা স্পষ্ট হয়ে যায়। [cite: 708]
```go
func nextInt(b []byte, pos int) (value, nextPos int) {
```
যেহেতু নামযুক্ত ফলাফলগুলি ইনিশিয়ালাইজ করা হয় এবং একটি অলঙ্কৃত রিটার্নের সাথে আবদ্ধ থাকে, তাই তারা সহজ এবং স্পষ্ট উভয়ই করতে পারে। [cite: 709] এখানে `io.ReadFull`-এর একটি সংস্করণ রয়েছে যা সেগুলিকে ভালোভাবে ব্যবহার করে: [cite: 709]
```go
func ReadFull(r Reader, buf []byte) (n int, err error) {
    for len(buf) > 0 && err == nil {
        var nr int
        nr, err = r.Read(buf)
        n += nr
        buf = buf[nr:]
    }
    return
}
```

### Defer [cite: 710]

গো-এর `defer` স্টেটমেন্ট একটি ফাংশন কলকে (`deferred` ফাংশন) `defer` এক্সিকিউট করা ফাংশন ফেরত আসার ঠিক আগে চালানোর জন্য নির্ধারিত করে। [cite: 710] এটি অস্বাভাবিক কিন্তু কার্যকর উপায় এমন পরিস্থিতি মোকাবেলা করার জন্য যেখানে একটি ফাংশন ফেরত আসার জন্য যে পথই অবলম্বন করুক না কেন রিসোর্সগুলি অবশ্যই মুক্তি দিতে হবে। [cite: 711] ক্যানোনিকাল উদাহরণগুলি হল একটি মিউটেক্স আনলক করা বা একটি ফাইল বন্ধ করা। [cite: 711]
```go
// Contents একটি ফাইলের বিষয়বস্তু স্ট্রিং হিসাবে ফেরত দেয়।
func Contents(filename string) (string, error) {
    f, err := os.Open(filename)
    if err != nil {
        return "", err
    }
    defer f.Close()  // আমরা শেষ হলে f.Close চলবে।
    var result []byte
    buf := make([]byte, 100)
    for {
        n, err := f.Read(buf[0:])
        result = append(result, buf[0:n]...) // append নিয়ে পরে আলোচনা করা হবে।
        if err != nil {
            if err == io.EOF {
                break
            }
            return "", err  // আমরা এখানে ফেরত দিলে f বন্ধ হয়ে যাবে।
        }
    }
    return string(result), nil // আমরা এখানে ফেরত দিলে f বন্ধ হয়ে যাবে।
}
```
`Close`-এর মতো একটি ফাংশন কলকে স্থগিত করার দুটি সুবিধা রয়েছে। [cite: 717] প্রথমত, এটি গ্যারান্টি দেয় যে আপনি ফাইল বন্ধ করতে ভুলবেন না, যা একটি নতুন রিটার্ন পাথ যোগ করার জন্য ফাংশনটি পরে সম্পাদনা করলে সহজেই ভুল হয়ে যেতে পারে। [cite: 717] দ্বিতীয়ত, এর অর্থ হল ক্লোজটি ওপেনের কাছাকাছি থাকে, যা ফাংশনের শেষে এটি স্থাপন করার চেয়ে অনেক বেশি স্পষ্ট। [cite: 718]

স্থগিত ফাংশনের আর্গুমেন্টগুলি (যার মধ্যে ফাংশনটি একটি পদ্ধতি হলে রিসিভারও অন্তর্ভুক্ত) `defer` কার্যকর হওয়ার সময় মূল্যায়ন করা হয়, `call` কার্যকর হওয়ার সময় নয়। [cite: 719] ফাংশন কার্যকর হওয়ার সাথে সাথে ভেরিয়েবলগুলির মান পরিবর্তন হওয়ার বিষয়ে চিন্তা এড়ানো ছাড়াও, এর অর্থ হল একটি একক স্থগিত কল সাইট একাধিক ফাংশন এক্সিকিউশনকে স্থগিত করতে পারে। [cite: 720] এখানে একটি মজার উদাহরণ। [cite: 721]
```go
for i := 0; i < 5; i++ {
    defer fmt.Printf("%d ", i)
}
```
স্থগিত ফাংশনগুলি LIFO ক্রমে কার্যকর হয়, তাই ফাংশনটি ফেরত এলে এই কোডটি `4 3 2 1 0` প্রিন্ট করবে। [cite: 722]

একটি আরও সম্ভাব্য উদাহরণ হল প্রোগ্রামের মাধ্যমে ফাংশন এক্সিকিউশন ট্রেস করার একটি সহজ উপায়। [cite: 723] আমরা এইরকম কয়েকটি সহজ ট্রেসিং রুটিন লিখতে পারি: [cite: 724]
```go
func trace(s string)   { fmt.Println("entering:", s) }
func untrace(s string) { fmt.Println("leaving:", s) }

// এগুলো এভাবে ব্যবহার করুন:
func a() {
    trace("a")
    defer untrace("a")
    // কিছু করুন...
}
```
আমরা আরও ভালো করতে পারি এই সত্যটি কাজে লাগিয়ে যে স্থগিত ফাংশনগুলির আর্গুমেন্টগুলি `defer` কার্যকর হওয়ার সময় মূল্যায়ন করা হয়। [cite: 725] ট্রেসিং রুটিনটি আনট্রেসিং রুটিনের জন্য আর্গুমেন্ট সেট আপ করতে পারে। [cite: 726] এই উদাহরণ: [cite: 726]
```go
func trace(s string) string {
    fmt.Println("entering:", s)
    return s
}

func un(s string) {
    fmt.Println("leaving:", s)
}

func a() {
    defer un(trace("a"))
    fmt.Println("in a")
}

func b() {
    defer un(trace("b"))
    fmt.Println("in b")
    a()
}

func main() {
    b()
}
```
প্রিন্ট করে
```
entering: b
in b
entering: a
in a
leaving: a
leaving: b
```
অন্যান্য ভাষা থেকে ব্লক-স্তরের রিসোর্স ম্যানেজমেন্টে অভ্যস্ত প্রোগ্রামারদের কাছে `defer` অদ্ভুত লাগতে পারে, তবে এর সবচেয়ে আকর্ষণীয় এবং শক্তিশালী অ্যাপ্লিকেশনগুলি ঠিক এই সত্য থেকে আসে যে এটি ব্লক-ভিত্তিক নয় বরং ফাংশন-ভিত্তিক। [cite: 727] `panic` এবং `recover` অংশে আমরা এর সম্ভাবনার আরেকটি উদাহরণ দেখব। [cite: 728]

## ডেটা [cite: 728]

### `new` দিয়ে বরাদ্দকরণ [cite: 729]

গো-তে দুটি বরাদ্দকরণ প্রমিটিভ রয়েছে, বিল্ট-ইন ফাংশন `new` এবং `make`। [cite: 729] তারা ভিন্ন কাজ করে এবং বিভিন্ন প্রকারের জন্য প্রযোজ্য, যা বিভ্রান্তিকর হতে পারে, তবে নিয়মগুলি সহজ। [cite: 730] প্রথমে `new` নিয়ে কথা বলি। এটি একটি বিল্ট-ইন ফাংশন যা মেমরি বরাদ্দ করে, তবে অন্যান্য ভাষার এর সমনামগুলির মতো এটি মেমরি `ইনিশিয়ালাইজ` করে না, এটি কেবল `জিরো` করে। [cite: 730] অর্থাৎ, `new(T)` টাইপ `T`-এর একটি নতুন আইটেমের জন্য জিরো করা স্টোরেজ বরাদ্দ করে এবং এর ঠিকানা, `*T` টাইপের একটি মান ফেরত দেয়। [cite: 731] গো পরিভাষায়, এটি `T` টাইপের একটি নতুন বরাদ্দকৃত শূন্য মানের একটি পয়েন্টার ফেরত দেয়। [cite: 732]

যেহেতু `new` দ্বারা ফেরত দেওয়া মেমরি জিরো করা হয়, তাই আপনার ডেটা কাঠামো ডিজাইন করার সময় প্রতিটি টাইপের শূন্য মানকে আরও ইনিশিয়ালাইজেশন ছাড়াই ব্যবহার করা যেতে পারে এমনভাবে সাজানো সহায়ক। [cite: 733] এর অর্থ হল ডেটা কাঠামোর একজন ব্যবহারকারী `new` দিয়ে একটি তৈরি করতে পারেন এবং সরাসরি কাজ শুরু করতে পারেন। [cite: 734] উদাহরণস্বরূপ, `bytes.Buffer`-এর ডকুমেন্টেশনে বলা হয়েছে যে "Buffer-এর শূন্য মান হল একটি খালি বাফার যা ব্যবহারের জন্য প্রস্তুত।" [cite: 735] একইভাবে, `sync.Mutex`-এর কোনো সুস্পষ্ট কনস্ট্রাক্টর বা `Init` পদ্ধতি নেই। [cite: 736] পরিবর্তে, একটি `sync.Mutex`-এর শূন্য মান একটি আনলক করা মিউটেক্স হিসাবে সংজ্ঞায়িত করা হয়। [cite: 737]

জিরো-ভ্যালু-ইজ-ইউজফুল বৈশিষ্ট্যটি ট্রানজিটিভভাবে কাজ করে। এই টাইপ ঘোষণাটি বিবেচনা করুন। [cite: 738]
```go
type SyncedBuffer struct {
    lock    sync.Mutex
    buffer  bytes.Buffer
}
```
`SyncedBuffer` টাইপের মানগুলিও বরাদ্দ বা ঘোষণার পরপরই ব্যবহারের জন্য প্রস্তুত থাকে। [cite: 739] পরের স্নিপেটে, `p` এবং `v` উভয়ই আরও কোনো ব্যবস্থা ছাড়াই সঠিকভাবে কাজ করবে। [cite: 740]
```go
p := new(SyncedBuffer)  // *SyncedBuffer টাইপ
var v SyncedBuffer      // SyncedBuffer টাইপ
```

### কনস্ট্রাক্টর এবং কম্পোজিট লিটারেল [cite: 741]

কখনও কখনও শূন্য মান যথেষ্ট হয় না এবং একটি ইনিশিয়ালাইজিং কনস্ট্রাক্টর প্রয়োজন হয়, যেমন `os` প্যাকেজ থেকে প্রাপ্ত এই উদাহরণে। [cite: 741]
```go
func NewFile(fd int, name string) *File {
    if fd < 0 {
        return nil
    }
    f := new(File)
    f.fd = fd
    f.name = name
    f.dirinfo = nil
    f.nepipe = 0
    return f
}
```
এখানে অনেক বয়লারপ্লেট আছে। [cite: 742] আমরা এটিকে একটি `কম্পোজিট লিটারেল` ব্যবহার করে সরল করতে পারি, যা একটি এক্সপ্রেশন যা প্রতিটি মূল্যায়নের সময় একটি নতুন দৃষ্টান্ত তৈরি করে। [cite: 743]
```go
func NewFile(fd int, name string) *File {
    if fd < 0 {
        return nil
    }
    f := File{fd, name, nil, 0}
    return &f
}
```
লক্ষ্য করুন যে, C-এর মতো নয়, একটি স্থানীয় ভেরিয়েবলের ঠিকানা ফেরত দেওয়া সম্পূর্ণরূপে ঠিক আছে; [cite: 744] ভেরিয়েবলের সাথে যুক্ত স্টোরেজ ফাংশনটি ফেরত আসার পরেও টিকে থাকে। [cite: 745] প্রকৃতপক্ষে, একটি কম্পোজিট লিটারেলের ঠিকানা নিলে প্রতিটি মূল্যায়নের সময় একটি নতুন দৃষ্টান্ত বরাদ্দ হয়, তাই আমরা এই শেষ দুটি লাইনকে একত্রিত করতে পারি। [cite: 746]
```go
return &File{fd, name, nil, 0}
```
একটি কম্পোজিট লিটারেলের ক্ষেত্রগুলি ক্রমানুসারে সাজানো থাকে এবং সবগুলিই উপস্থিত থাকতে হবে। [cite: 747] তবে, উপাদানগুলিকে স্পষ্টভাবে `ক্ষেত্র: মান` জোড়া হিসাবে লেবেল করে, ইনিশিয়ালাইজারগুলি যেকোনো ক্রমে প্রদর্শিত হতে পারে, অনুপস্থিতগুলি তাদের নিজ নিজ শূন্য মান হিসাবে রেখে দেওয়া হয়। [cite: 748] এইভাবে আমরা বলতে পারি
```go
return &File{fd: fd, name: name}
```
একটি সীমাবদ্ধ ক্ষেত্রে, যদি একটি কম্পোজিট লিটারালে কোনো ক্ষেত্রই না থাকে, তবে এটি টাইপের জন্য একটি শূন্য মান তৈরি করে। [cite: 749] `new(File)` এবং `&File{}` এক্সপ্রেশনগুলি সমতুল্য। [cite: 750]

কম্পোজিট লিটারেল অ্যারে, স্লাইস এবং ম্যাপের জন্যও তৈরি করা যেতে পারে, ক্ষেত্র লেবেলগুলি উপযুক্ত হিসাবে সূচক বা ম্যাপ কী হিসাবে কাজ করে। [cite: 751] এই উদাহরণগুলিতে, ইনিশিয়ালাইজেশনগুলি `Enone`, `Eio`, এবং `Einval`-এর মান নির্বিশেষে কাজ করে, যতক্ষণ না তারা স্বতন্ত্র। [cite: 752]
```go
a := [...]string   {Enone: "no error", Eio: "Eio", Einval: "invalid argument"}
s := []string      {Enone: "no error", Eio: "Eio", Einval: "invalid argument"}
m := map[int]string{Enone: "no error", Eio: "Eio", Einval: "invalid argument"}
```

### `make` দিয়ে বরাদ্দকরণ [cite: 753]

বরাদ্দকরণে ফিরে আসি। [cite: 753] বিল্ট-ইন ফাংশন `make(T, args)` `new(T)` থেকে ভিন্ন উদ্দেশ্যে কাজ করে। [cite: 754] এটি শুধুমাত্র স্লাইস, ম্যাপ এবং চ্যানেল তৈরি করে, এবং এটি `T` টাইপের একটি `ইনিশিয়ালাইজড` (`জিরো` করা নয়) মান (এবং `*T` নয়) ফেরত দেয়। [cite: 755] এই পার্থক্যের কারণ হল এই তিনটি টাইপ, আন্ডারকভারে, ডেটা স্ট্রাকচারের রেফারেন্সগুলি উপস্থাপন করে যা ব্যবহারের আগে অবশ্যই ইনিশিয়ালাইজ করতে হবে। [cite: 756] একটি স্লাইস, উদাহরণস্বরূপ, একটি তিন-আইটেমের বর্ণনাকারী যা ডেটার একটি পয়েন্টার (একটি অ্যারের ভিতরে), দৈর্ঘ্য এবং ক্ষমতা ধারণ করে, এবং যতক্ষণ না এই আইটেমগুলি ইনিশিয়ালাইজ করা হয়, স্লাইসটি `nil` থাকে। [cite: 757] স্লাইস, ম্যাপ এবং চ্যানেলের জন্য, `make` অভ্যন্তরীণ ডেটা কাঠামো ইনিশিয়ালাইজ করে এবং মানকে ব্যবহারের জন্য প্রস্তুত করে। [cite: 758] উদাহরণস্বরূপ, [cite: 758]
```go
make([]int, 10, 100)
```
১০০টি ইন্টের একটি অ্যারে বরাদ্দ করে এবং তারপরে দৈর্ঘ্য ১০ এবং ক্ষমতা ১০০ সহ একটি স্লাইস কাঠামো তৈরি করে যা অ্যারের প্রথম ১০টি উপাদানের দিকে নির্দেশ করে। [cite: 176, 758] (একটি স্লাইস তৈরি করার সময়, ক্ষমতা বাদ দেওয়া যেতে পারে; আরও তথ্যের জন্য স্লাইস সংক্রান্ত অংশটি দেখুন।) [cite: 177, 759] এর বিপরীতে, `new([]int)` একটি নতুন বরাদ্দকৃত, জিরো করা স্লাইস কাঠামোর একটি পয়েন্টার ফেরত দেয়, অর্থাৎ, একটি `nil` স্লাইস মানের একটি পয়েন্টার। [cite: 177, 759]

এই উদাহরণগুলি `new` এবং `make`-এর মধ্যে পার্থক্য তুলে ধরে। [cite: 178, 760]
```go
var p *[]int = new([]int)       // স্লাইস কাঠামো বরাদ্দ করে; *p == nil; খুব কমই দরকারী [cite: 179]
var v  []int = make([]int, 100) // স্লাইস v এখন 100টি ইন্টের একটি নতুন অ্যারে উল্লেখ করে [cite: 179]

// অপ্রয়োজনীয়ভাবে জটিল:
var p *[]int = new([]int)
*p = make([]int, 100, 100)

// প্রচলিত:
v := make([]int, 100)
```
মনে রাখবেন যে `make` শুধুমাত্র ম্যাপ, স্লাইস এবং চ্যানেলগুলিতে প্রযোজ্য এবং একটি পয়েন্টার ফেরত দেয় না। [cite: 180, 763] একটি সুস্পষ্ট পয়েন্টার পেতে `new` দিয়ে বরাদ্দ করুন বা স্পষ্টভাবে একটি ভেরিয়েবলের ঠিকানা নিন। [cite: 180, 763]

### অ্যারে [cite: 181, 764]

মেমরির বিস্তারিত বিন্যাস পরিকল্পনা করার সময় অ্যারেগুলি দরকারী এবং কখনও কখনও বরাদ্দ এড়াতে সাহায্য করতে পারে, তবে প্রাথমিকভাবে তারা স্লাইসগুলির জন্য একটি বিল্ডিং ব্লক, যা পরবর্তী অংশের বিষয়। [cite: 181, 764] সেই বিষয়টির ভিত্তি স্থাপন করার জন্য, এখানে অ্যারে সম্পর্কে কয়েকটি কথা বলা হল। [cite: 182, 765]

গো এবং C-তে অ্যারেগুলি যেভাবে কাজ করে তার মধ্যে প্রধান পার্থক্য রয়েছে। গো-তে, [cite: 183, 766]
* অ্যারেগুলি মান। [cite: 183, 766] একটি অ্যারে অন্যটিতে অর্পণ করলে সমস্ত উপাদান কপি হয়। [cite: 184, 767] বিশেষ করে, যদি আপনি একটি ফাংশনে একটি অ্যারে পাস করেন, তাহলে এটি অ্যারেটির একটি `কপি` পাবে, এর একটি পয়েন্টার নয়। [cite: 184, 767]
* একটি অ্যারের আকার তার প্রকারের অংশ। [cite: 185, 768] `[10]int` এবং `[20]int` প্রকারগুলি স্বতন্ত্র। [cite: 185, 769]

মানের বৈশিষ্ট্য দরকারী হতে পারে তবে ব্যয়বহুলও; [cite: 186, 770] যদি আপনি C-এর মতো আচরণ এবং দক্ষতা চান, তাহলে আপনি অ্যারেটির একটি পয়েন্টার পাস করতে পারেন। [cite: 186, 771]
```go
func Sum(a *[3]float64) (sum float64) {
    for _, v := range *a {
        sum += v
    }
    return
}

array := [...]float64{7.0, 8.5, 9.1}
x := Sum(&array)  // এক্সপ্লিসিট অ্যাড্রেস-অফ অপারেটর লক্ষ্য করুন
```
তবে এই শৈলীও প্রচলিত গো নয়। [cite: 772] এর পরিবর্তে স্লাইস ব্যবহার করুন। [cite: 772]

### স্লাইস [cite: 773]

স্লাইসগুলি ডেটার ক্রমগুলির জন্য একটি আরও সাধারণ, শক্তিশালী এবং সুবিধাজনক ইন্টারফেস দেওয়ার জন্য অ্যারেগুলিকে মোড়ানো হয়। [cite: 773] রূপান্তর ম্যাট্রিক্সের মতো সুস্পষ্ট মাত্রা সহ আইটেমগুলি ছাড়া, গো-তে বেশিরভাগ অ্যারে প্রোগ্রামিং সাধারণ অ্যারেগুলির পরিবর্তে স্লাইসগুলি দিয়ে করা হয়। [cite: 774]

স্লাইসগুলি একটি অন্তর্নিহিত অ্যারেতে রেফারেন্স রাখে, এবং যদি আপনি একটি স্লাইসকে অন্যটিতে অর্পণ করেন, তবে উভয়ই একই অ্যারে উল্লেখ করে। [cite: 775] যদি একটি ফাংশন একটি স্লাইস আর্গুমেন্ট গ্রহণ করে, তবে এটি স্লাইসের উপাদানগুলিতে যে পরিবর্তনগুলি করে তা কলকারী দেখতে পাবে, যা অন্তর্নিহিত অ্যারেতে একটি পয়েন্টার পাস করার অনুরূপ। [cite: 776] একটি `Read` ফাংশন তাই একটি পয়েন্টার এবং একটি গণনার পরিবর্তে একটি স্লাইস আর্গুমেন্ট গ্রহণ করতে পারে; [cite: 777] স্লাইসের মধ্যে দৈর্ঘ্য কতটুকু ডেটা পড়তে হবে তার একটি উপরের সীমা নির্ধারণ করে। [cite: 778] এখানে `os` প্যাকেজে `File` টাইপের `Read` পদ্ধতির স্বাক্ষর দেওয়া হল: [cite: 778]
```go
func (f *File) Read(buf []byte) (n int, err error)
```
পদ্ধতিটি পঠিত বাইটের সংখ্যা এবং কোনো ত্রুটির মান, যদি থাকে, ফেরত দেয়। [cite: 779] একটি বড় বাফার `buf`-এর প্রথম ৩২ বাইটে পড়ার জন্য, বাফারটিকে `স্লাইস` (এখানে একটি ক্রিয়া হিসাবে ব্যবহৃত) করুন। [cite: 780]
```go
n, err := f.Read(buf[0:32])
```
এই ধরনের স্লাইসিং সাধারণ এবং কার্যকর। [cite: 781] প্রকৃতপক্ষে, আপাতত কার্যকারিতা বাদ দিয়ে, নিম্নলিখিত স্নিপেটটিও বাফারের প্রথম ৩২ বাইট পড়বে। [cite: 781]
```go
var n int
var err error
for i := 0; i < 32; i++ {
    nbytes, e := f.Read(buf[i:i+1])  // এক বাইট পড়ুন।
    n += nbytes
    if nbytes == 0 || e != nil {
        err = e
        break
    }
}
```
একটি স্লাইসের দৈর্ঘ্য পরিবর্তন করা যেতে পারে যতক্ষণ না এটি অন্তর্নিহিত অ্যারের সীমার মধ্যে থাকে; [cite: 785] কেবল এটিকে নিজের একটি স্লাইসে অর্পণ করুন। [cite: 785] একটি স্লাইসের `ক্ষমতা`, যা বিল্ট-ইন ফাংশন `cap` দ্বারা অ্যাক্সেসযোগ্য, স্লাইসটি যে সর্বাধিক দৈর্ঘ্য গ্রহণ করতে পারে তা রিপোর্ট করে। [cite: 786] এখানে একটি স্লাইসে ডেটা যোগ করার জন্য একটি ফাংশন রয়েছে। যদি ডেটা... [cite: 786]

```
