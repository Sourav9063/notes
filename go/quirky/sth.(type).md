In Go, `sth.(type)` and `type()` are not directly comparable constructs, as `type()` is not a valid Go syntax for type checking or conversion. It seems there might be a misunderstanding or a typo in `type()`.

Let's break down `sth.(type)` and discuss what you might be intending with `type()`.

### `sth.(type)`: Type Assertion in Type Switch

The expression `sth.(type)` is **only** used within a `switch` statement, specifically in a **type switch**. It allows you to dynamically check the underlying type of an interface value and perform different actions based on that type.

Here's how it works:

```go
package main

import "fmt"

func describe(i interface{}) {
	switch v := i.(type) { // This is where sth.(type) is used (here, i.(type))
	case int:
		fmt.Printf("Type is int, value is %d\n", v)
	case string:
		fmt.Printf("Type is string, value is %s\n", v)
	case bool:
		fmt.Printf("Type is bool, value is %t\n", v)
	default:
		fmt.Printf("Unknown type: %T\n", v) // %T prints the type of the value
	}
}

func main() {
	describe(10)
	describe("hello")
	describe(true)
	describe(3.14)
}
```

**Explanation:**

* `i.(type)` is used in the `switch` statement's expression. It tells the `switch` to consider the dynamic type of the interface `i`.
* Each `case` then specifies a concrete type.
* Inside each `case` block, the variable `v` (which is assigned `i` in `v := i.(type)`) will have the concrete type specified in that `case`. This means you can safely perform operations specific to that type.

### What about `type()`?

As mentioned, `type()` is **not** a valid Go function or operator for type introspection. If you're coming from other languages that might have a similar construct (like `type()` in Python), it's important to note that Go handles type information differently.

**Possible Intentions for "type()" and their Go equivalents:**

1.  **Getting the type of a variable at runtime (for debugging/logging):**
    You would use the `fmt` package's `%T` verb in `Printf` or `Sprintf`.

    ```go
    package main

    import "fmt"

    func main() {
        var myInt int = 42
        var myString string = "Go Lang"
        var myFloat float64 = 3.14

        fmt.Printf("Type of myInt: %T\n", myInt)
        fmt.Printf("Type of myString: %T\n", myString)
        fmt.Printf("Type of myFloat: %T\n", myFloat)
    }
    ```

2.  **Checking if an interface value is of a specific type (outside a type switch):**
    You would use a **type assertion** with a comma-ok idiom.

    ```go
    package main

    import "fmt"

    func main() {
        var i interface{}
        i = "hello Go"

        // Check if 'i' is a string
        s, ok := i.(string)
        if ok {
            fmt.Printf("i is a string: %s\n", s)
        } else {
            fmt.Printf("i is not a string\n")
        }

        i = 123

        // Check if 'i' is an int
        j, ok := i.(int)
        if ok {
            fmt.Printf("i is an int: %d\n", j)
        } else {
            fmt.Printf("i is not an int\n")
        }
    }
    ```
    In `value, ok := i.(Type)`, if `i` holds a value of `Type`, `value` will be that value asserted to `Type`, and `ok` will be `true`. Otherwise, `ok` will be `false`, and `value` will be the zero value for `Type`.

### Summary:

* **`sth.(type)`:** **Exclusively** used within a `switch` statement for a type switch to branch logic based on the dynamic type of an interface.
* **`type()`:** **Not valid Go syntax.** If you want to:
    * Get the runtime type for printing, use `fmt.Printf("%T", myVar)`.
    * Check if an interface holds a specific type, use a type assertion with the comma-ok idiom: `value, ok := interfaceVar.(Type)`.

Understanding these distinctions is crucial for correctly handling types and interfaces in Go.
