
## 1. Basic Primitives

These are the building blocks of any schema.

| Type | Zod Schema | Notes |
| --- | --- | --- |
| **String** | `z.string()` | `.email()`, `.url()`, `.min(5)`, `.datetime()` |
| **Number** | `z.number()` | `.gt(0)`, `.int()`, `.positive()`, `.finite()` |
| **Boolean** | `z.boolean()` | Only `true` or `false` |
| **BigInt** | `z.bigint()` | For `BigInt` types |
| **Date** | `z.date()` | Validates a JS `Date` instance |
| **Enum** | `z.enum(["A", "B"])` | Enforces specific string literal values |
| **Optional** | `z.string().optional()` | Allows `undefined` |
| **Nullable** | `z.string().nullable()` | Allows `null` |

---

## 2. Objects and Arrays

Handling complex data structures.

### Objects

```typescript
const UserSchema = z.object({
  username: z.string(),
  age: z.number().optional(),
}).strict(); // .strict() disallows unknown keys

```

### Arrays

```typescript
const StringArray = z.array(z.string()).nonempty(); // Must have at least one element

```

### Tuples

```typescript
const Point = z.tuple([z.number(), z.number()]); // Exactly two numbers

```

---

## 3. Advanced Validation & Logic

Complex logic using Zod's built-in methods.

* **`.coerce`**: Forces a type conversion before validation.
* `z.coerce.number().parse("123")` // Result: `123` (number)


* **`.refine()`**: Custom logic that returns a boolean.
* `z.string().refine((val) => val.length % 2 === 0, "Must be even length")`


* **`.transform()`**: Change the data after validation.
* `z.string().transform((val) => val.length)` // Turns string into its length (number)


* **`.pipe()`**: Pass the output of one schema into another.
* `z.string().transform(val => val.length).pipe(z.number().min(5))`



---

## 4. Logical Operators

* **Union**: Value must match one of the schemas.
* `z.union([z.string(), z.number()])` or `z.string().or(z.number())`


* **Intersection**: Value must match *all* schemas.
* `z.intersection(SchemaA, SchemaB)` or `SchemaA.and(SchemaB)`


* **Discriminated Union**: Best for handling "Result" or "Event" patterns (high performance).
```typescript
z.discriminatedUnion("type", [
  z.object({ type: z.literal("success"), data: z.string() }),
  z.object({ type: z.literal("error"), error: z.instanceof(Error) }),
]);

```



---

## 5. TypeScript Integration

The killer feature of Zod is "Single Source of Truth."

```typescript
const ProfileSchema = z.object({
  name: z.string(),
  bio: z.string().max(160),
});

// Extract the TypeScript type from the schema automatically
type Profile = z.infer<typeof ProfileSchema>;

/* Resulting type:
type Profile = {
  name: string;
  bio: string;
}
*/

```

---

## 6. Parsing & Error Handling

| Method | Behavior |
| --- | --- |
| `.parse(data)` | Returns data or **throws** a `ZodError` |
| `.safeParse(data)` | Returns an object: `{ success: true, data: ... }` or `{ success: false, error: ... }` |
| `.parseAsync(data)` | Use this if you have asynchronous `.refine` logic |

### Formatting Errors

Zod errors are deeply nested. Use `.flatten()` for simple forms:

```typescript
const result = UserSchema.safeParse(input);
if (!result.success) {
  console.log(result.error.flatten().fieldErrors); 
  // { username: ['Required'], age: ['Expected number, received string'] }
}

```

---

## 7. Common Use Cases (Next.js Context)

### Validating Environment Variables

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
});

export const env = envSchema.parse(process.env);

```

### Form Action Validation

```typescript
export async function myAction(formData: FormData) {
  const schema = z.object({
    email: z.string().email(),
  });
  
  const data = schema.safeParse(Object.fromEntries(formData));
  if (!data.success) return { errors: data.error.flatten() };
  
  // Proceed with validated data.data.email
}

```
