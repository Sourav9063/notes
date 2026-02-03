"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  createDataContext, 
  createReducerContext, 
  createStateContext 
} from "@/utils/context";

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

// Reducer Types
interface ActivityItem {
  id: string;
  message: string;
  timestamp: string;
}

type ActivityAction = 
  | { type: "LOG_EVENT"; message: string }
  | { type: "CLEAR_LOGS" };

// --- 2. Reducer Function ---
const activityReducer = (state: ActivityItem[], action: ActivityAction): ActivityItem[] => {
  switch (action.type) {
    case "LOG_EVENT":
      return [
        { 
          id: Math.random().toString(36).slice(2, 9), 
          message: action.message, 
          timestamp: new Date().toLocaleTimeString() 
        },
        ...state
      ].slice(0, 50); // Keep last 50 logs
    case "CLEAR_LOGS":
      return [];
    default:
      return state;
  }
};

// --- 3. Create Contexts ---

// Data Context (Static)
const [TriggerConfigProvider, useTriggerConfig] = createDataContext<TriggerConfig>({
  name: "TriggerConfig",
});

// State Context (Primitive)
const [TriggerCounterProvider, useTriggerCounter] = createStateContext<number>({
  name: "TriggerCounter",
});

// State Context (Object)
const [TriggerFormProvider, useTriggerForm] = createStateContext<TriggerFormState>({
  name: "TriggerForm",
});

// Reducer Context (Complex Logic)
const [ActivityProvider, useActivity] = createReducerContext(activityReducer, {
  name: "Activity",
});

// --- 4. Nested Components ---

function TriggerStatus() {
  const config = useTriggerConfig();
  const [count] = useTriggerCounter();
  const [form] = useTriggerForm();

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm space-y-4 h-full">
      <div>
        <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase">
          1. Data Context (Static)
        </h3>
        <div className="text-sm grid grid-cols-2 gap-2">
          <span className="text-muted-foreground">Region:</span>
          <span className="font-mono">{config.region}</span>
          <span className="text-muted-foreground">Mode:</span>
          <span className="font-mono">{config.mode}</span>
        </div>
      </div>
      
      <Separator />

      <div>
        <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase">
          2. State Context (Object)
        </h3>
        <div className="bg-muted p-3 rounded text-xs font-mono overflow-hidden">
          <pre>{JSON.stringify(form, null, 2)}</pre>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase">
          State Context (Primitive)
        </h3>
        <p className="text-sm font-medium">Global Counter: {count}</p>
      </div>
    </div>
  );
}

function TriggerFormFields() {
  const [form, setForm] = useTriggerForm();
  const [, dispatchActivity] = useActivity();

  const updateField = (field: keyof TriggerFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    dispatchActivity({ 
      type: "LOG_EVENT", 
      message: `Updated ${field} to "${value}"` 
    });
  };

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm space-y-4">
      <h3 className="font-semibold">Interactive Controls</h3>
      
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
          className="w-full"
        >
          {form.isActive ? "Active" : "Inactive"}
        </Button>
      </div>

      <Separator />
      
      <TriggerCounterIncrement />
    </div>
  );
}

function TriggerCounterIncrement() {
  const [, setCount] = useTriggerCounter();
  const [, dispatchActivity] = useActivity();

  const handleClick = () => {
    setCount((c) => c + 1);
    dispatchActivity({ type: "LOG_EVENT", message: "Incremented Global Counter" });
  };

  return (
    <Button variant="secondary" onClick={handleClick} className="w-full">
      +1 Global Counter
    </Button>
  );
}

function ActivityFeed() {
  const [logs, dispatch] = useActivity();

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase">
          3. Reducer Context (Logs)
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => dispatch({ type: "CLEAR_LOGS" })}
          disabled={logs.length === 0}
        >
          Clear
        </Button>
      </div>
      
      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-3">
          {logs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
          )}
          {logs.map((log) => (
            <div key={log.id} className="text-sm flex flex-col gap-1 pb-3 border-b last:border-0">
              <span className="font-medium">{log.message}</span>
              <span className="text-xs text-muted-foreground">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// --- 5. Parent Component ---

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
          Demonstrating <code>Data</code>, <code>State</code>, and <code>Reducer</code> contexts working together.
        </p>
      </div>

      <TriggerConfigProvider value={config}>
        <TriggerCounterProvider value={0}>
          <TriggerFormProvider 
            value={{ name: "New Trigger", description: "", isActive: true }}
          >
            <ActivityProvider value={[]}>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl items-start">
                {/* Column 1: Controls */}
                <TriggerFormFields />
                
                {/* Column 2: State Visualization */}
                <TriggerStatus />

                {/* Column 3: Event Log (Reducer) */}
                <ActivityFeed />
              </div>

            </ActivityProvider>
          </TriggerFormProvider>
        </TriggerCounterProvider>
      </TriggerConfigProvider>
    </div>
  );
}
