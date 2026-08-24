import { MapPin, Phone, Mail, Clock, Headset, Building2, ShieldCheck } from "lucide-react";

export function Contact() {
  return (
    <section className="py-10 sm:py-16 bg-background animate-rise relative overflow-hidden text-foreground">
      {/* Decorative Ambient Lighting Spheres */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#FFC700]/10 dark:bg-[#FFC700]/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 relative z-10">
        
        {/* Section Hero Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FFC700]/40 bg-[#FFC700]/15 text-xs font-extrabold text-[#FFC700] mb-3 shadow-sm uppercase tracking-wider">
            <Headset className="size-3.5" /> 24/7 Operations Desk
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            Contact Us
          </h1>
          
          <p className="mt-2 text-xs font-bold text-muted-foreground tracking-widest uppercase">
            Get in Touch with the Caryanam Bidding Team
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
                Reach out to our dedicated support helpline and operations management for dealer onboarding, inspection telemetry, or auction room queries.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden space-y-6">
          <div className="flex items-center gap-3 border-b border-border/70 pb-3">
            <span className="flex items-center justify-center size-7 rounded-lg bg-[#FFC700]/15 text-[#FFC700] font-black text-[11px] border border-[#FFC700]/30">
              <ShieldCheck className="size-4" />
            </span>
            <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">
              Official Contact Directory
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            {/* Office Address Card */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 flex items-start gap-3.5 hover:border-[#FFC700]/40 transition-colors">
              <div className="size-10 rounded-lg bg-[#FFC700]/15 text-[#FFC700] flex items-center justify-center shrink-0 border border-[#FFC700]/30 mt-0.5">
                <MapPin className="size-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">Office Address</span>
                <span className="font-extrabold text-foreground text-xs sm:text-sm block mt-1 leading-relaxed">
                  Pune, Maharashtra 411014
                </span>
              </div>
            </div>

            {/* Mobile Contact Number Card */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 flex items-start gap-3.5 hover:border-[#FFC700]/40 transition-colors">
              <div className="size-10 rounded-lg bg-[#FFC700]/15 text-[#FFC700] flex items-center justify-center shrink-0 border border-[#FFC700]/30 mt-0.5">
                <Phone className="size-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">Mobile Contact Number</span>
                <span className="font-extrabold text-foreground text-xs sm:text-sm block mt-1">
                  +91 7755994123
                </span>
              </div>
            </div>

            {/* Email Support Card */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 flex items-start gap-3.5 hover:border-[#FFC700]/40 transition-colors">
              <div className="size-10 rounded-lg bg-[#FFC700]/15 text-[#FFC700] flex items-center justify-center shrink-0 border border-[#FFC700]/30 mt-0.5">
                <Mail className="size-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">Email Address</span>
                <span className="font-extrabold text-foreground text-xs sm:text-sm block mt-1">
                  support@caryanamlive.com
                </span>
              </div>
            </div>

            {/* Working Hours Card */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 flex items-start gap-3.5 hover:border-[#FFC700]/40 transition-colors">
              <div className="size-10 rounded-lg bg-[#FFC700]/15 text-[#FFC700] flex items-center justify-center shrink-0 border border-[#FFC700]/30 mt-0.5">
                <Clock className="size-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">Working Hours</span>
                <span className="font-extrabold text-foreground text-xs sm:text-sm block mt-1 leading-relaxed">
                  Monday – Saturday (9:30 AM – 6:30 PM IST)
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

