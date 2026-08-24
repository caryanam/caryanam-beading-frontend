import { Link } from "react-router-dom";
import {
  Scale,
  Building2,
  UserCheck,
  Gavel,
  ShieldAlert,
  CreditCard,
  AlertTriangle,
  Car,
  Activity,
  Shield,
  Phone,
  Mail,
} from "lucide-react";

export function Terms() {
  return (
    <section className="py-10 sm:py-16 bg-background animate-rise relative overflow-hidden text-foreground">
      {/* Decorative Ambient Lighting Spheres */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#FFC700]/10 dark:bg-[#FFC700]/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 relative z-10">
        
        {/* Section Hero Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FFC700]/40 bg-[#FFC700]/15 text-xs font-extrabold text-[#FFC700] mb-3 shadow-sm uppercase tracking-wider">
            <Scale className="size-3.5" /> Legal & Terms Agreement
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            Terms & Conditions
          </h1>
          
          <p className="mt-2 text-xs font-bold text-muted-foreground tracking-widest uppercase">
            Last Updated: 24 August 2026
          </p>
        </div>

        {/* Company Overview Hero Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFC700] via-amber-400 to-[#FFD633]" />
          
          <div className="flex items-start gap-4">
            <div className="size-11 rounded-xl bg-[#FFC700]/15 border border-[#FFC700]/30 flex items-center justify-center text-[#FFC700] shrink-0 mt-0.5">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight mb-1">
                Caryanam India Pvt. Ltd.
              </h2>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Caryanam India Pvt. Ltd. operates the Caryanam Bidding App. By using the App, you agree to these Terms.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Sections List */}
        <div className="space-y-4">

          {/* Section 1: Account */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                01
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="size-4 text-[#FFC700]" /> 1. Account
              </h3>
            </div>

            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Users must provide accurate registration and business information and keep their account credentials secure.
            </p>
          </div>

          {/* Section 2: Bidding */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                02
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Gavel className="size-4 text-[#FFC700]" /> 2. Bidding
              </h3>
            </div>

            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              All bids submitted through the App are binding and may not be cancelled or withdrawn. Users are responsible for reviewing vehicle details before placing a bid.
            </p>
          </div>

          {/* Section 3: Auction Rules */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                03
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="size-4 text-[#FFC700]" /> 3. Auction Rules
              </h3>
            </div>

            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Users must not manipulate auctions, collude with other users, use fake accounts, or engage in fraudulent or unauthorized activities.
            </p>
          </div>

          {/* Section 4: Payment & Offline Settlement */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                04
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="size-4 text-[#FFC700]" /> 4. Payment & Offline Settlement
              </h3>
            </div>

            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              The App is strictly an auction bidding platform and does not process online payments. All vehicle payments, financial settlements, and physical handovers are handled separately and offline between the parties. The winning bidder remains responsible for completing physical settlement within the agreed timeframe.
            </p>
          </div>

          {/* Section 5: Account Suspension */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                05
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="size-4 text-rose-500" /> 5. Account Suspension
              </h3>
            </div>

            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Caryanam may suspend or terminate accounts involved in fraud, auction manipulation, payment default, misuse, or violation of these Terms.
            </p>
          </div>

          {/* Section 6: Vehicle Information */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                06
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Car className="size-4 text-[#FFC700]" /> 6. Vehicle Information
              </h3>
            </div>

            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Users should review available vehicle details, inspection reports and documents before bidding.
            </p>
          </div>

          {/* Section 7: Service Availability */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                07
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="size-4 text-[#FFC700]" /> 7. Service Availability
              </h3>
            </div>

            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Caryanam aims to provide continuous service but does not guarantee uninterrupted or error-free operation due to technical or network issues.
            </p>
          </div>

          {/* Section 8: Privacy */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                08
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Shield className="size-4 text-[#FFC700]" /> 8. Privacy
              </h3>
            </div>

            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Use of the App is also subject to our{" "}
              <Link to="/privacy" className="text-[#FFC700] font-bold hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </div>

          {/* Section 9: Contact Us */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFC700] via-amber-400 to-[#FFD633]" />

            <div className="flex items-center gap-3 mb-5 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                09
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Phone className="size-4 text-[#FFC700]" /> 9. Contact Us
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mobile Contact Box */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 flex items-center gap-3">
                <div className="size-10 rounded-lg bg-[#FFC700]/15 text-[#FFC700] flex items-center justify-center shrink-0 border border-[#FFC700]/30">
                  <Phone className="size-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">
                    Mobile Helpline
                  </span>
                  <span className="font-extrabold text-foreground text-xs sm:text-sm block truncate">
                    +91 7755994123
                  </span>
                </div>
              </div>

              {/* Email Support Box */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 flex items-center gap-3">
                <div className="size-10 rounded-lg bg-[#FFC700]/15 text-[#FFC700] flex items-center justify-center shrink-0 border border-[#FFC700]/30">
                  <Mail className="size-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">
                    Support Email
                  </span>
                  <span className="font-extrabold text-foreground text-xs sm:text-sm block truncate">
                    support@caryanamlive.com
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

