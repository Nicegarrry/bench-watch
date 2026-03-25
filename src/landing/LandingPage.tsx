import { Link } from "wasp/client/router";
import type { ComponentProps } from "react";
import { useAuth } from "wasp/client/auth";
import { ButtonLink } from "../shared/components/Button";

type To = ComponentProps<typeof Link>["to"];

export function LandingPage() {
  const { data: user } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-32 text-center">
        <span className="mb-4 rounded-full bg-primary-100 px-4 py-1 text-sm font-semibold text-primary-700">
          Now in beta
        </span>
        <h1 className="mb-6 max-w-3xl text-5xl font-bold leading-tight text-neutral-900">
          The smarter way to{" "}
          <span className="text-primary-500">watch your benchmarks</span>
        </h1>
        <p className="mb-10 max-w-xl text-lg text-neutral-500">
          Track, compare, and get alerted on performance regressions before they
          ship. Built for engineering teams who care about speed.
        </p>
        <div className="flex gap-4">
          {user ? (
            <ButtonLink to="/dashboard">Go to Dashboard</ButtonLink>
          ) : (
            <>
              <ButtonLink to="/signup">Get started free</ButtonLink>
              <ButtonLink to="/login" variant="ghost">
                Sign in
              </ButtonLink>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-neutral-200 bg-white py-24">
        <div className="mx-auto max-w-screen-lg px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-neutral-900">
            Everything you need to stay fast
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon="⚡"
              title="Real-time tracking"
              description="Benchmark results synced automatically on every CI run. No manual uploads."
            />
            <FeatureCard
              icon="📊"
              title="Visual comparisons"
              description="Side-by-side charts across branches, commits, and time ranges."
            />
            <FeatureCard
              icon="🔔"
              title="Smart alerts"
              description="Get notified on Slack or email when a metric regresses beyond your threshold."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="mx-auto max-w-screen-lg px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-neutral-900">
            Simple pricing
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <PricingCard
              name="Free"
              price="$0"
              description="For individuals and small projects."
              features={[
                "Up to 3 projects",
                "30-day history",
                "Email alerts",
              ]}
              cta="Get started"
              ctaTo="/signup"
            />
            <PricingCard
              name="Pro"
              price="$29/mo"
              description="For teams shipping production software."
              features={[
                "Unlimited projects",
                "1-year history",
                "Slack + email alerts",
                "Team members",
                "Priority support",
              ]}
              cta="Start free trial"
              ctaTo="/signup"
              highlighted
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-neutral-200 bg-white py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold text-neutral-900">
          Ready to ship faster?
        </h2>
        <p className="mb-8 text-neutral-500">
          Join teams already using Bench Watch to catch regressions early.
        </p>
        <ButtonLink to="/signup">Create your free account</ButtonLink>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-6">
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="text-neutral-500">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  cta,
  ctaTo,
  highlighted = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  ctaTo: To;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`card p-8 ${highlighted ? "border-primary-400 ring-2 ring-primary-300" : ""}`}
    >
      <h3 className="mb-1 text-xl font-bold text-neutral-900">{name}</h3>
      <div className="mb-2 text-4xl font-bold text-neutral-900">{price}</div>
      <p className="mb-6 text-neutral-500">{description}</p>
      <ul className="mb-8 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-neutral-700">
            <span className="text-primary-500">✓</span> {f}
          </li>
        ))}
      </ul>
      <ButtonLink to={ctaTo} variant={highlighted ? "primary" : "ghost"}>
        {cta}
      </ButtonLink>
    </div>
  );
}
