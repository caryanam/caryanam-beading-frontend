export function About() {
  return (
    <section className="py-20 bg-background animate-rise">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            About Caryanam
          </h1>
          <p className="mt-3 text-xs font-bold text-[#FFC700] tracking-widest uppercase">
            Established Vehicle Remarketing Infrastructure
          </p>
        </div>

        <div className="prose prose-zinc max-w-none text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium space-y-6">
          <p>
            Caryanam is India's leading digital remarketing partner for
            commercial fleets, passenger vehicles, and industrial logistics
            equipment. We act as the technical infrastructure that connects
            insurance companies, corporate leasing firms, and rental aggregators
            with a verified network of multi-brand vehicle dealers.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 py-6">
            <div className="p-5 border border-border bg-card rounded-2xl flex flex-col gap-2">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                Our Core Vision
              </h3>
              <p className="text-xs text-muted-foreground">
                To eliminate friction, information gaps, and local database
                dependencies in regional auto bidding by implementing verifiable
                real-time digital inspection telemetry.
              </p>
            </div>
            <div className="p-5 border border-border bg-card rounded-2xl flex flex-col gap-2">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                Verified Operations
              </h3>
              <p className="text-xs text-muted-foreground">
                Operating in major logistics hubs across metropolitan areas, our
                inspector wizard verifies structural paint anomalies,
                transmission checks, and records actual base price valuations.
              </p>
            </div>
          </div>
          <p>
            Built by auto bidding experts and engineers, our stack relies on
            robust WebSockets to sync live room states, persistent database logs
            to ensure trace audits on refresh, and standardized Excel bulk data
            processing models to scale operations.
          </p>
        </div>
      </div>
    </section>
  );
}
