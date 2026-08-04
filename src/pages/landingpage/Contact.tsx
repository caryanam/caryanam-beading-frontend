import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock, Send, Headset, MessageSquare } from "lucide-react";

export function Contact() {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMsg.trim()) {
      toast.error("Please fill in all contact form fields.");
      return;
    }
    setContactSubmitting(true);
    setTimeout(() => {
      toast.success(
        "Thank you! Your message has been sent to Caryanam Bidding Support.",
      );
      setContactName("");
      setContactEmail("");
      setContactMsg("");
      setContactSubmitting(false);
    }, 1200);
  };

  return (
    <section className="py-14 sm:py-20 bg-background animate-rise">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FFC700]/40 bg-[#FFC700]/15 text-sm font-black text-[#FFC700] mb-3 shadow-sm">
            <Headset className="size-4" /> 24/7 Dealer Support & Operations
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Contact Support & Operations
          </h1>
          <p className="mt-2 text-sm font-extrabold text-muted-foreground tracking-wider uppercase">
            Get in Touch with the Caryanam Bidding Team
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-5 items-start">

          {/* Contact Info Sidebar */}
          <div className="md:col-span-2 space-y-4">
            <div className="p-6 border border-border bg-card rounded-2xl space-y-5 shadow-soft">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
                <MapPin className="size-4.5 text-[#FFC700]" /> Corporate Headquarters
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#FFC700]/15 text-[#FFC700] shrink-0 border border-[#FFC700]/30">
                    <MapPin className="size-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block uppercase">Address</span>
                    <span className="font-semibold text-foreground leading-relaxed block">
                      Caryanam Bidding HQ, Commercial Complex, Bandra Kurla Complex, Mumbai, Maharashtra 400051
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#FFC700]/15 text-[#FFC700] shrink-0 border border-[#FFC700]/30">
                    <Phone className="size-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block uppercase">Helpline</span>
                    <span className="font-mono font-bold text-foreground text-base">+91 22 4900 1200</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#FFC700]/15 text-[#FFC700] shrink-0 border border-[#FFC700]/30">
                    <Mail className="size-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block uppercase">Email Support</span>
                    <span className="font-bold text-foreground">support@caryanam.com</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#FFC700]/15 text-[#FFC700] shrink-0 border border-[#FFC700]/30">
                    <Clock className="size-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block uppercase">Working Hours</span>
                    <span className="font-semibold text-foreground">Mon - Sat (9:30 AM - 6:30 PM IST)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Area */}
          <div className="md:col-span-3">
            <form
              onSubmit={handleContactSubmit}
              className="p-6 sm:p-8 border border-border bg-card rounded-2xl space-y-5 shadow-soft"
            >
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
                <MessageSquare className="size-4.5 text-[#FFC700]" /> Send Support Inquiry Ticket
              </h3>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-bold text-foreground">
                  Your Full Name
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="w-full mt-2 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-[#FFC700] transition-all"
                  />
                </label>

                <label className="block text-sm font-bold text-foreground">
                  Work / Business Email
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="name@dealership.com"
                    required
                    className="w-full mt-2 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-[#FFC700] transition-all"
                  />
                </label>
              </div>

              <label className="block text-sm font-bold text-foreground">
                Inquiry Details
                <textarea
                  rows={4}
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder="Describe your dealer registration query, inspection evaluation request, or support requirement..."
                  required
                  className="w-full mt-2 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-[#FFC700] transition-all resize-none"
                />
              </label>

              <button
                type="submit"
                disabled={contactSubmitting}
                className="w-full rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] py-3.5 text-sm font-black transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(255,199,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,199,0,0.45)] cursor-pointer"
              >
                <Send className="size-4.5" />
                <span>{contactSubmitting ? "Sending Ticket..." : "Submit Support Request"}</span>
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
