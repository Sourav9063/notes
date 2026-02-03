"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDataContext, createStateContext } from "@/utils/context";

// --- 1. Define Types ---
interface TriggerConfig {
  mode: "sandbox" | "production";
  region: string;
}

interface TriggerFormState {
  name: string;
  description: string;
  isActive: boolean;
}

// --- 2. Create Contexts ---

// Data Context (Static)
const [TriggerConfigProvider, useTriggerConfig] = createDataContext<TriggerConfig>({
  name: "TriggerConfig",
});

// State Context (Primitive)
const [TriggerCounterProvider, useTriggerCounter] = createStateContext<number>({
  name: "TriggerCounter",
});

// State Context (Object) - Demonstrating complex state
const [TriggerFormProvider, useTriggerForm] = createStateContext<TriggerFormState>({
  name: "TriggerForm",
});

// --- 3. Nested Components ---

function TriggerStatus() {
  const config = useTriggerConfig();
  const [count] = useTriggerCounter();
  const [form] = useTriggerForm(); // Accessing object state

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm space-y-4">
      <div>
        <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase">Static Data</h3>
        <p className="text-sm">Region: <span className="font-mono">{config.region}</span></p>
      </div>
      
      <div>
        <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase">Live Preview (Object State)</h3>
        <div className="bg-muted p-3 rounded text-xs font-mono">
          <pre>{JSON.stringify(form, null, 2)}</pre>
        </div>
      </div>

      <div className="pt-2 border-t">
        <p className="text-sm font-medium">Global Counter: {count}</p>
      </div>
    </div>
  );
}

function TriggerFormFields() {
  const [form, setForm] = useTriggerForm();

  // Helper for object state updates
  const updateField = (field: keyof TriggerFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm space-y-4">
      <h3 className="font-semibold">Object State Controls</h3>
      
      <div className="space-y-2">
        <Label htmlFor="name">Trigger Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Enter name..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Description</Label>
        <Input
          id="desc"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Enter description..."
        />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <Button 
          variant={form.isActive ? "default" : "outline"}
          onClick={() => updateField("isActive", !form.isActive)}
        >
          {form.isActive ? "Active" : "Inactive"}
        </Button>
        
        <TriggerCounterIncrement />
      </div>
    </div>
  );
}

// Separate component to show deep nesting consumption
function TriggerCounterIncrement() {
  const [, setCount] = useTriggerCounter();
  return (
    <Button variant="secondary" onClick={() => setCount(c => c + 1)}>
      +1 Global
    </Button>
  );
}

// --- 4. Parent Component ---

export default function Page() {
  const config: TriggerConfig = {
    mode: "sandbox",
    region: "ap-southeast-1",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full space-y-8 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Context Utility Demo</h1>
        <p className="text-muted-foreground">
          Demonstrating <code>createDataContext</code> and <code>createStateContext</code> with Objects
        </p>
      </div>

      <TriggerConfigProvider value={config}>
        <TriggerCounterProvider value={0}>
          <TriggerFormProvider 
            value={{ name: "New Trigger", description: "", isActive: true }}
          >
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
              <TriggerFormFields />
              <TriggerStatus />
            </div>

          </TriggerFormProvider>
        </TriggerCounterProvider>
      </TriggerConfigProvider>
    </div>
  );
}
