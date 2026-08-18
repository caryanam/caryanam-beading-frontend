import { MapPin, Phone, Mail, Clock, Headset, Building2 } from "lucide-react";

export function Contact() {
  return (
    <section className="py-14 sm:py-20 bg-background animate-rise">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FFC700]/40 bg-[#FFC700]/15 text-sm font-black text-[#FFC700] mb-3 shadow-sm">
            <Headset className="size-4" /> 24/7 Support & Operations
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Contact Us
          </h1>
          <p className="mt-2 text-sm font-extrabold text-muted-foreground tracking-wider uppercase">
            Get in Touch with the Caryanam Bidding Team
          </p>
        </div>

        {/* Contact Information Card */}
        <div className="p-6 sm:p-10 border border-border bg-card rounded-3xl space-y-8 shadow-soft">
          <h3 className="text-lg font-black text-foreground uppercase tracking-wider border-b border-border pb-4 flex items-center gap-3">
            <Building2 className="size-6 text-[#FFC700]" /> Contact Information
          </h3>

          <div className="space-y-6 text-sm sm:text-base">
            {/* Address */}
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#FFC700]/15 text-[#FFC700] shrink-0 border border-[#FFC700]/30 mt-0.5">
                <MapPin className="size-5 sm:size-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground block uppercase tracking-wider">Office Address</span>
                <span className="font-semibold text-foreground leading-relaxed block mt-1">
                  Kharadi, Pune, 411014
                </span>
              </div>
            </div>

            {/* Mobile / Helpline */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#FFC700]/15 text-[#FFC700] shrink-0 border border-[#FFC700]/30">
                <Phone className="size-5 sm:size-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground block uppercase tracking-wider">Mobile Contact Number</span>
                <span className="font-mono font-black text-foreground text-lg sm:text-xl block mt-1">+91 7755994123</span>
              </div>
            </div>

            {/* Email Support */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#FFC700]/15 text-[#FFC700] shrink-0 border border-[#FFC700]/30">
                <Mail className="size-5 sm:size-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground block uppercase tracking-wider">Email Address</span>
                <span className="font-bold text-foreground text-base sm:text-lg block mt-1">support@caryanamlive.com</span>
              </div>
            </div>

            {/* Working Hours */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#FFC700]/15 text-[#FFC700] shrink-0 border border-[#FFC700]/30">
                <Clock className="size-5 sm:size-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground block uppercase tracking-wider">Working Hours</span>
                <span className="font-semibold text-foreground block mt-1">Monday - Saturday (9:30 AM - 6:30 PM IST)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
