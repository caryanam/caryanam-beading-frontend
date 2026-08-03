import { CheckCircle2 } from "lucide-react";

export function WhyChoose() {
  return (
    <section className="py-20 bg-background animate-rise">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            Why Choose Caryanam
          </h1>
          <p className="mt-3 text-xs font-bold text-[#FFC700] tracking-widest uppercase">
            Engineered For High-Fidelity Bidding
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              title: "200-Point Inspection Integrity",
              desc: "Every listed car has passed rigorous inspector evaluation. Structural paint condition, sheet metal panel damages, engine status, and tyre tread details are stored along with high-res photos.",
            },
            {
              title: "Sub-Second WebSocket Bids",
              desc: "Our real-time bidding server notifies all active participants immediately on bid placement, updating highest bids and decrementing 10-minute timers without refreshing.",
            },
            {
              title: "Actual Valuations",
              desc: "We display true base starting price thresholds directly mapped from verified databases, eliminating inflated mock prices or formula approximations.",
            },
            {
              title: "100% Server Persisted Wishlists",
              desc: "We do not store preferences inside browser local storage. Your favorites list, bid values, and purchase outcomes are secured on backend databases.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-6 border border-border bg-card rounded-2xl flex flex-col gap-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-[#FFC700] flex-shrink-0">
                  <CheckCircle2 className="size-4" />
                </span>
                <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wide">
                  {item.title}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
