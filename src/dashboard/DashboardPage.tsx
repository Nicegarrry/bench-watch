import { useAuth } from "wasp/client/auth";

export function DashboardPage() {
  const { data: user } = useAuth();

  const username = user?.getFirstProviderUserId() ?? "there";

  return (
    <div className="mx-auto w-full max-w-screen-lg px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-neutral-900">
          Welcome back, {username} 👋
        </h1>
        <p className="mt-1 text-neutral-500">
          Here's what's happening with your projects.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Projects" value="0" />
        <StatCard label="Benchmarks" value="0" />
        <StatCard label="Alerts fired" value="0" />
        <StatCard label="Plan" value="Free" highlight />
      </div>

      {/* Empty state */}
      <div className="card flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 text-5xl">🚀</div>
        <h2 className="mb-2 text-xl font-semibold text-neutral-900">
          No projects yet
        </h2>
        <p className="mb-6 max-w-sm text-neutral-500">
          Create your first project to start tracking benchmark performance
          across your codebase.
        </p>
        <button
          className="rounded-lg bg-primary-500 px-5 py-2.5 font-semibold text-neutral-900 hover:bg-primary-600 transition-colors"
          onClick={() => alert("Coming soon!")}
        >
          Create project
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`card p-6 ${highlight ? "border-primary-300 bg-primary-50" : ""}`}>
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}
