# Zod Cheatsheet

Examples use Zod 4 (`import { z } from "zod"`). Zod 3 equivalents are noted where the API changed.

## 1. Basic Primitives

These are the building blocks of any schema.

| Type | Zod Schema | Notes |
| --- | --- | --- |
| **String** | `z.string()` | `.min(5)`, `.max(160)`, `.regex(/.../)`, `.trim()` |
| **String formats** | `z.email()`, `z.url()`, `z.uuid()`, `z.iso.datetime()` | Zod 3: `z.string().email()`, `.url()`, `.uuid()`, `.datetime()` (deprecated in 4) |
| **Number** | `z.number()` | `.gt(0)`, `.int()`, `.positive()`; rejects `Infinity` in Zod 4 |
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
const UserSchema = z.strictObject({
  username: z.string(),
  age: z.number().optional(),
}); // strictObject rejects unknown keys (Zod 3: z.object({...}).strict())
```

`z.object()` strips unknown keys; `z.looseObject()` keeps them (Zod 3: `.passthrough()`).

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

- **`z.coerce`**: Converts input with the JS constructor before validation.
  - `z.coerce.number().parse("123")` // `123` (number)
  - Beware: `z.coerce.boolean().parse("false")` is `true` (`Boolean("false")`). Use `z.stringbool()` for env-style strings.
- **`.refine()`**: Custom logic that returns a boolean.
  - `z.string().refine((val) => val.length % 2 === 0, "Must be even length")`
- **`.transform()`**: Change the data after validation.
  - `z.string().transform((val) => val.length)` // Turns string into its length (number)
- **`.pipe()`**: Pass the output of one schema into another.
  - `z.string().transform((val) => val.length).pipe(z.number().min(5))`

---

## 4. Logical Operators

- **Union**: Value must match one of the schemas.
  - `z.union([z.string(), z.number()])` or `z.string().or(z.number())`
- **Intersection**: Value must match *all* schemas.
  - `z.intersection(SchemaA, SchemaB)` or `SchemaA.and(SchemaB)`
  - For objects prefer `SchemaA.extend(SchemaB.shape)`: it returns an object schema you can keep extending.
- **Discriminated Union**: Best for "Result" or "Event" patterns; checks the discriminator key first.

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

Use `z.input<typeof Schema>` for the pre-transform type and `z.output` (same as `z.infer`) for the parsed type.

---

## 6. Parsing & Error Handling

| Method | Behavior |
| --- | --- |
| `.parse(data)` | Returns data or **throws** a `ZodError` |
| `.safeParse(data)` | Returns an object: `{ success: true, data: ... }` or `{ success: false, error: ... }` |
| `.parseAsync(data)` / `.safeParseAsync(data)` | Required if the schema has async `.refine` / `.transform` |

### Formatting Errors

Zod errors are deeply nested. Flatten them for simple forms:

```typescript
const result = UserSchema.safeParse(input);
if (!result.success) {
  console.log(z.flattenError(result.error).fieldErrors); // Zod 3: result.error.flatten()
  // { username: ['Invalid input: expected string, received undefined'], age: [...] }
}
```

For nested objects use `z.treeifyError(result.error)`; for a readable string use `z.prettifyError(result.error)`.

---

## 7. Common Use Cases (Next.js Context)

### Validating Environment Variables

```typescript
const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().default(3000),
});

export const env = envSchema.parse(process.env);
```

### Form Action Validation

```typescript
export async function myAction(formData: FormData) {
  const schema = z.object({
    email: z.email(),
  });

  const data = schema.safeParse(Object.fromEntries(formData));
  if (!data.success) return { errors: z.flattenError(data.error).fieldErrors };

  // Proceed with validated data.data.email
}
```
