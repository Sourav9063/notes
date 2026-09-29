package main

import (
	"fmt"
	"math/rand/v2"
	"reflect"
)

// Number is a custom constraint that includes all of Go's built-in
// integer and floating-point types. The `~` tilde token allows
// the constraint to be satisfied by user-defined types whose
// underlying type is one of the listed types (e.g., type MyInt int).
type Number interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
		~float32 | ~float64
}

// RandomNumber generates a random number of a generic type T.
// T must satisfy the Number constraint.
// The function can be called in three ways:
//   - RandomNumber[T]() -> returns a random number in [0, 1)
//   - RandomNumber[T](max) -> returns a random number in [0, max)
//   - RandomNumber[T](min, max) -> returns a random number in [min, max)
//
// It returns the generated number and an error if the arguments are invalid.
// Note: For integer types, the range is exclusive of `max`.
func RandomNumber[T Number](args ...T) (T, error) {
	var min, max T

	// Parse variadic arguments to determine min and max
	switch len(args) {
	case 0:
		// Default case: min=0, max=1
		min = T(0)
		max = T(1)
	case 1:
		// One argument: min=0, max=arg[0]
		min = T(0)
		max = args[0]
	case 2:
		// Two arguments: min=arg[0], max=arg[1]
		min = args[0]
		max = args[1]
	default:
		var zero T
		return zero, fmt.Errorf("invalid number of arguments: expected 0, 1, or 2, but got %d", len(args))
	}

	// Validate that min is less than max
	if min >= max {
		var zero T
		return zero, fmt.Errorf("validation failed: max (%v) must be strictly greater than min (%v)", max, min)
	}

	// Go's rand functions are not generic, so dispatch on the kind of T.
	// Kind (unlike a type switch on any(min)) also matches user-defined types
	// such as `type PlayerLevel uint8`.
	var result T
	switch reflect.TypeFor[T]().Kind() {
	case reflect.Float32, reflect.Float64:
		result = T(float64(min) + rand.Float64()*(float64(max)-float64(min)))

	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		// Compute the span in uint64 so ranges wider than MaxInt64 do not overflow.
		// rand.Uint64N generates a random number in [0, n).
		span := uint64(int64(max) - int64(min))
		result = T(int64(min) + int64(rand.Uint64N(span)))

	default: // unsigned integers
		result = T(uint64(min) + rand.Uint64N(uint64(max)-uint64(min)))
	}

	return result, nil
}

func main() {
	fmt.Println("--- Demonstrating RandomNumber function ---")

	// --- Floating Point Examples ---
	fmt.Println("\n[float64]")
	// No args: default range [0, 1)
	f1, _ := RandomNumber[float64]()
	fmt.Printf("RandomNumber[float64](): %f\n", f1)
	// One arg: range [0, 100)
	f2, _ := RandomNumber[float64](100)
	fmt.Printf("RandomNumber[float64](100): %f\n", f2)
	// Two args: range [-50, 50)
	f3, _ := RandomNumber[float64](-50, 50)
	fmt.Printf("RandomNumber[float64](-50, 50): %f\n", f3)

	// --- Integer Examples ---
	fmt.Println("\n[int]")
	// No args: will produce 0, because the range [0, 1) contains no integers.
	i1, _ := RandomNumber[int]()
	fmt.Printf("RandomNumber[int](): %d\n", i1)
	// One arg: range [0, 1000)
	i2, _ := RandomNumber[int](1000)
	fmt.Printf("RandomNumber[int](1000): %d\n", i2)
	// Two args: range [10, 20)
	i3, _ := RandomNumber[int](10, 20)
	fmt.Printf("RandomNumber[int](10, 20): %d\n", i3)

	// --- Custom Type Example ---
	type PlayerLevel uint8
	fmt.Println("\n[Custom Type: PlayerLevel (underlying uint8)]")
	level, _ := RandomNumber[PlayerLevel](5, 25)
	fmt.Printf("RandomNumber[PlayerLevel](5, 25): %d\n", level)

	// --- Error Handling Example ---
	fmt.Println("\n[Error Handling]")
	_, err := RandomNumber[int](10, 5) // Invalid range where min >= max
	if err != nil {
		fmt.Printf("Successfully caught expected error: %v\n", err)
	}
}
