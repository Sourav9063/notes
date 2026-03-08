Here is the complete, combined architecture. This setup uses the **Repository-Service Pattern** alongside a **production-ready PostgreSQL connection pool** that supports transactions and handles serverless edge cases safely.

Here is how your directory structure will look:

```text
├── lib/
│   ├── db.ts                 # Database client and pool configuration
│   └── auth.ts               # (Mock) Authentication module
├── repositories/
│   └── user.repository.ts    # Strict database interaction (SQL only)
├── services/
│   └── user.service.ts       # Business logic and validation (Zod)
├── actions/
│   └── user.actions.ts       # Next.js Server Action (Form transport)
└── app/api/users/route.ts    # Next.js API Route (REST transport)

```

---

### 1. The Database Client (`lib/db.ts`)

This is the foundational layer. It sets up the connection pool, catches background errors to prevent server crashes, and provides helpers for standard queries and atomic transactions.

```typescript
import { Pool, PoolClient } from 'pg';

const globalForPg = global as unknown as { pgPool: Pool };

export const pool =
  globalForPg.pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.NODE_ENV === 'production' ? 10 : 2, 
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;

// CRITICAL: Catch errors on idle clients to prevent server crashes
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

/**
 * Standard query execution for simple SELECT, INSERT, UPDATE, DELETE.
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  
  if (duration > 500) {
    console.warn('Slow query detected:', { text, duration, rows: res.rowCount });
  }
  
  return res;
}

/**
 * Transaction helper.
 * Use this to execute multiple queries atomically on the same connection.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

```

### 2. The Repository (`repositories/user.repository.ts`)

This layer handles all SQL. To demonstrate the power of the `withTransaction` helper we just built, let's make this repository create a user *and* a default user profile atomically. If the profile creation fails, the user creation is rolled back.

```typescript
import { withTransaction } from '@/lib/db';

export interface UserInsertData {
  name: string;
  email: string;
}

export const UserRepository = {
  /**
   * Inserts a new user and a default profile inside an atomic transaction.
   */
  async createWithProfile(data: UserInsertData) {
    try {
      return await withTransaction(async (client) => {
        // 1. Create the user
        const userSql = `
          INSERT INTO users (name, email)
          VALUES ($1, $2)
          RETURNING id, name, email, created_at;
        `;
        const userResult = await client.query(userSql, [data.name, data.email]);
        const newUser = userResult.rows[0];

        // 2. Create their default profile
        const profileSql = `
          INSERT INTO user_profiles (user_id, bio)
          VALUES ($1, $2);
        `;
        await client.query(profileSql, [newUser.id, 'Hello, I am new here!']);

        return newUser;
      });
    } catch (error: any) {
      // Postgres unique_violation code
      if (error.code === '23505') {
        throw new Error('EMAIL_EXISTS');
      }
      throw error;
    }
  }
};

```

### 3. The Service (`services/user.service.ts`)

The orchestrator. It knows nothing about HTTP requests or databases. It only cares about data validation, business rules, and returning a predictable object.

```typescript
import { z } from 'zod';
import { UserRepository } from '@/repositories/user.repository';

const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
});

export const UserService = {
  async createUser(rawData: unknown) {
    // 1. Validate inputs
    const validatedFields = CreateUserSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid data provided.',
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // 2. Execute Business Logic via Repository
    try {
      const newUser = await UserRepository.createWithProfile(validatedFields.data);
      
      return { 
        success: true, 
        data: newUser 
      };

    } catch (error: any) {
      // 3. Graceful domain error handling
      if (error.message === 'EMAIL_EXISTS') {
        return { 
          success: false, 
          error: 'A user with this email address already exists.' 
        };
      }

      console.error('UserService.createUser error:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred while processing the request.' 
      };
    }
  }
};

```

### 4. Transport A: Server Action (`actions/user.actions.ts`)

Used directly by your React components (e.g., `<form action={createUserAction}>`). It handles authorization, extracts the form data, calls the service, and invalidates the Next.js cache.

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { UserService } from '@/services/user.service';
import { verifySession } from '@/lib/auth'; // Hypothetical auth

export async function createUserAction(prevState: any, formData: FormData) {
  // 1. Authorize
  const session = await verifySession();
  if (!session?.user?.isAdmin) {
    return { success: false, error: 'Unauthorized. Admin access required.' };
  }

  // 2. Extract
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
  };

  // 3. Execute
  const result = await UserService.createUser(rawData);

  // 4. Transport side-effects
  if (result.success) {
    revalidatePath('/dashboard/users');
    return { ...result, message: 'User created successfully.' };
  }

  return result; 
}

```

### 5. Transport B: API Route (`app/api/users/route.ts`)

Used if you need to expose this functionality to external clients, mobile apps, or webhooks. Notice how it reuses the exact same `UserService`.

```typescript
import { NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';
import { verifySession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await UserService.createUser(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 }); 
    }

    return NextResponse.json(result.data, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
}

```

---

With this setup, your application is highly decoupled, secure against SQL injection, resilient to connection drops, and perfectly structured to grow without turning into spaghetti code.

Here is how you wire the `createUserAction` to a React 19 Client Component.

React 19 simplifies form handling immensely with the `useActionState` hook. It manages the form's state (success, errors, field validation) and natively provides an `isPending` flag, meaning you no longer need complex state management just to show a loading spinner.

### The Client Component (`components/CreateUserForm.tsx`)

```tsx
'use client';

import { useActionState } from 'react';
import { createUserAction } from '@/actions/user.actions';

// Define the initial state matching our Server Action's return type
const initialState = {
  success: false,
  message: '',
  error: '',
  fieldErrors: {},
};

export default function CreateUserForm() {
  // React 19's useActionState gives us the current state, the action to pass to the form,
  // and an isPending boolean we can use for loading states.
  const [state, formAction, isPending] = useActionState(createUserAction, initialState);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create New User</h2>

      {/* 1. Global Success Message */}
      {state?.success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-200">
          {state.message}
        </div>
      )}

      {/* 2. Global Error Message (e.g., 'EMAIL_EXISTS' or 'Unauthorized') */}
      {!state?.success && state?.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
          {state.error}
        </div>
      )}

      {/* 3. The Form */}
      <form action={formAction} className="space-y-4">
        
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            disabled={isPending}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
          />
          {/* Field-level error from Zod */}
          {state?.fieldErrors?.name && (
            <p className="mt-1 text-sm text-red-600">
              {state.fieldErrors.name[0]}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            disabled={isPending}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
          />
          {/* Field-level error from Zod */}
          {state?.fieldErrors?.email && (
            <p className="mt-1 text-sm text-red-600">
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>

        {/* 4. Submit Button with Pending State */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isPending ? 'Creating User...' : 'Create User'}
        </button>
      </form>
    </div>
  );
}

```

### Why this approach is robust:

* **Progressive Enhancement:** Because we pass `formAction` directly to the `<form action={...}>` attribute, the form can theoretically still work even if JavaScript hasn't fully loaded on the client yet (though Next.js optimizes this heavily).
* **Built-in Loading States:** By destructuring `isPending` directly from `useActionState`, we instantly get a clean way to disable our inputs and buttons, preventing users from double-clicking and submitting the form twice.
* **Predictable Error Mapping:** Because our Next.js Server Action returns a consistent object (`{ success, error, fieldErrors }`), we can cleanly route Zod validation errors directly under their respective input fields, and database errors (like unique constraint violations) to the top-level error banner.

---
