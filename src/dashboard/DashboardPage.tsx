import { useState } from "react";
import { useAuth } from "wasp/client/auth";
import { triggerDiscovery, triggerTriage, triggerDigests, setupTestUser } from "wasp/client/operations";

type StageStatus = "idle" | "running" | "done" | "error";

interface StageState {
  status: StageStatus;
  log: string | null;
}

const initial: StageState = { status: "idle", log: null };

export function DashboardPage() {
  const { data: user } = useAuth();
  const username = user?.getFirstProviderUserId() ?? "there";

  const [discovery, setDiscovery] = useState<StageState>(initial);
  const [triage, setTriage] = useState<StageState>(initial);
  const [digests, setDigests] = useState<StageState>(initial);
  const [testSetup, setTestSetup] = useState<StageState>(initial);

  async function run(
    fn: () => Promise<unknown>,
    setState: React.Dispatch<React.SetStateAction<StageState>>,
    doneMsg: string
  ) {
    setState({ status: "running", log: null });
    try {
      await fn();
      setState({ status: "done", log: doneMsg });
    } catch (err: any) {
      setState({ status: "error", log: err?.message ?? "Unknown error" });
    }
  }

  return (
    <div className="mx-auto w-full max-w-screen-lg px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-neutral-900">
          Pipeline Dev Console
        </h1>
        <p className="mt-1 text-neutral-500">
          Trigger pipeline stages manually for testing. Run in order: Discovery → Triage → Digests.
        </p>
      </div>

      {/* Test account setup */}
      <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-amber-900">Dev: Setup Test Account</p>
            <p className="text-sm text-amber-700">
              Promotes your account to Pro, marks onboarded, adds all 15 law areas. Run once before testing.
            </p>
            {testSetup.log && (
              <p className={`mt-1 text-sm font-mono ${testSetup.status === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                {testSetup.log}
              </p>
            )}
          </div>
          <button
            onClick={() => run(() => setupTestUser({}), setTestSetup, 'Done — account is now Pro with all areas.')}
            disabled={testSetup.status === 'running'}
            className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {testSetup.status === 'running' ? 'Setting up…' : testSetup.status === 'done' ? '✓ Done' : 'Setup'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <PipelineStage
          number="1"
          title="RSS Discovery"
          description="Poll all 13 JADE feeds, extract cases from the last 7 days, upsert into cases table. ~60 seconds."
          state={discovery}
          onRun={() =>
            run(
              () => triggerDiscovery({}),
              setDiscovery,
              "Discovery complete — check Supabase cases table."
            )
          }
        />

        <PipelineStage
          number="2"
          title="AI Triage + Analysis"
          description="Batch all cases to Claude for significance scoring and area tagging, fetch judgment text for 7+ cases, generate full analyses. ~3–5 minutes."
          state={triage}
          onRun={() =>
            run(
              () => triggerTriage({}),
              setTriage,
              "Triage complete — check case_area_tags and case_analyses tables."
            )
          }
        />

        <PipelineStage
          number="3"
          title="User Digests"
          description="Generate personalised digests for all onboarded users with selected areas. Requires onboarding to be complete."
          state={digests}
          onRun={() =>
            run(
              () => triggerDigests({}),
              setDigests,
              "Digests complete — check user_digests table."
            )
          }
        />
      </div>
    </div>
  );
}

function PipelineStage({
  number,
  title,
  description,
  state,
  onRun,
}: {
  number: string;
  title: string;
  description: string;
  state: StageState;
  onRun: () => void;
}) {
  const isRunning = state.status === "running";

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
            {state.status === "done" ? "✓" : state.status === "error" ? "✗" : number}
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900">Phase {number} — {title}</h2>
            <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
          </div>
        </div>
        <button
          onClick={onRun}
          disabled={isRunning}
          className="shrink-0 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {isRunning ? "Running…" : "Run"}
        </button>
      </div>

      {state.log && (
        <div
          className={`mt-4 rounded-lg p-3 font-mono text-xs whitespace-pre-wrap ${
            state.status === "error"
              ? "bg-red-50 text-red-700"
              : "bg-neutral-50 text-neutral-600"
          }`}
        >
          {state.log}
        </div>
      )}

      {isRunning && (
        <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary-400" />
          Running — check terminal for live logs
        </div>
      )}
    </div>
  );
}
