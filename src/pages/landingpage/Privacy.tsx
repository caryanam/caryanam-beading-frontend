import { Link } from "react-router-dom";
import {
  Shield,
  FileText,
  Mail,
  Phone,
  Building2,
  Lock,
  UserCheck,
  Share2,
  Database,
  Layers,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  Trash2,
} from "lucide-react";

export function Privacy() {
  return (
    <section className="py-10 sm:py-16 bg-background animate-rise relative overflow-hidden text-foreground">
      {/* Decorative Ambient Lighting Spheres */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#FFC700]/10 dark:bg-[#FFC700]/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 relative z-10">
        
        {/* Section Hero Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FFC700]/40 bg-[#FFC700]/15 text-xs font-extrabold text-[#FFC700] mb-3 shadow-sm uppercase tracking-wider">
            <Shield className="size-3.5" /> Legal & Compliance
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            Privacy Policy
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
                Caryanam India Pvt. Ltd. ("Caryanam", "we", "our") operates the Caryanam Bidding App. This Privacy Policy explains how we collect and use information when you use our App.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Sections List */}
        <div className="space-y-4">

          {/* Section 1: Information We Collect */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                01
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="size-4 text-[#FFC700]" /> 1. Information We Collect
              </h3>
            </div>

            <p className="text-xs font-bold text-foreground mb-3">
              We may collect:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 bg-secondary/40 border border-border/50 p-2.5 rounded-xl font-medium text-foreground">
                <CheckCircle2 className="size-3.5 text-[#FFC700] shrink-0" />
                <span>Name, mobile number and email address</span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/40 border border-border/50 p-2.5 rounded-xl font-medium text-foreground">
                <CheckCircle2 className="size-3.5 text-[#FFC700] shrink-0" />
                <span>Company/dealer registration details</span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/40 border border-border/50 p-2.5 rounded-xl font-medium text-foreground">
                <CheckCircle2 className="size-3.5 text-[#FFC700] shrink-0" />
                <span>Vehicle details, photos and inspection information</span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/40 border border-border/50 p-2.5 rounded-xl font-medium text-foreground">
                <CheckCircle2 className="size-3.5 text-[#FFC700] shrink-0" />
                <span>Bidding and auction activity</span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/40 border border-border/50 p-2.5 rounded-xl font-medium text-foreground">
                <CheckCircle2 className="size-3.5 text-[#FFC700] shrink-0" />
                <span>Device, network and technical information</span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/40 border border-border/50 p-2.5 rounded-xl font-medium text-foreground">
                <CheckCircle2 className="size-3.5 text-[#FFC700] shrink-0" />
                <span>Login, security and usage information</span>
              </div>
            </div>
          </div>

          {/* Section 2: How We Use Information */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                02
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="size-4 text-[#FFC700]" /> 2. How We Use Information
              </h3>
            </div>

            <p className="text-xs font-bold text-foreground mb-3">
              We use this information to:
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-muted-foreground">
              {[
                "Create and manage user accounts",
                "Verify dealers and businesses",
                "Provide vehicle auction and bidding services",
                "Process and record bids",
                "Send OTPs, notifications and service updates",
                "Prevent fraud and unauthorized activity",
                "Maintain security and audit records",
                "Provide customer support",
                "Comply with applicable laws",
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 bg-background/60 p-2 rounded-lg border border-border/40">
                  <div className="size-1.5 rounded-full bg-[#FFC700] shrink-0" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: Data Sharing */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                03
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Share2 className="size-4 text-[#FFC700]" /> 3. Data Sharing
              </h3>
            </div>

            <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-3">
              We may share information with authorized service providers, business partners, technology infrastructure providers, legal authorities, or other parties where required to provide our services or comply with applicable law.
            </p>

            <div className="bg-[#FFC700]/10 border border-[#FFC700]/25 rounded-xl p-3 flex items-center gap-2.5 text-xs font-bold text-foreground">
              <ShieldAlert className="size-4 text-[#FFC700] shrink-0" />
              <span>We do not sell personal information as a commercial product.</span>
            </div>
          </div>

          {/* Section 4: Data Security */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                04
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Lock className="size-4 text-[#FFC700]" /> 4. Data Security
              </h3>
            </div>

            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              We use reasonable technical and organizational measures to protect user information. However, no electronic system can be guaranteed to be completely secure.
            </p>
          </div>

          {/* Section 5: Data Retention & Deletion */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                05
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Database className="size-4 text-[#FFC700]" /> 5. Data Retention & Deletion
              </h3>
            </div>

            <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-3">
              We retain information as necessary to provide our services, maintain business records, prevent fraud, resolve disputes and comply with legal requirements.
            </p>

            <div className="bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/25 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-foreground">
                Users may request account/data deletion by contacting us.
              </span>
              <Link
                to="/delete-account"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shrink-0 shadow-sm"
              >
                <Trash2 className="size-3" /> Delete My Account
              </Link>
            </div>
          </div>

          {/* Section 6: Third-Party Services */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                06
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Layers className="size-4 text-[#FFC700]" /> 6. Third-Party Services
              </h3>
            </div>

            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              The App may use third-party services for hosting, authentication, notifications, analytics, communication and other operational purposes.
            </p>
          </div>

          {/* Section 7: Changes to This Policy */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3 mb-4 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                07
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <RefreshCw className="size-4 text-[#FFC700]" /> 7. Changes to This Policy
              </h3>
            </div>

            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              We may update this Privacy Policy from time to time. Updated policies will be made available through the App or our website.
            </p>
          </div>

          {/* Section 8: Contact Us */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFC700] via-amber-400 to-[#FFD633]" />

            <div className="flex items-center gap-3 mb-5 border-b border-border/70 pb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
                08
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Phone className="size-4 text-[#FFC700]" /> 8. Contact Us
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






