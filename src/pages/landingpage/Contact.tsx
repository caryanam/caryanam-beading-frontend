import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export function Contact() {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) {
      toast.error("All contact form fields are required.");
      return;
    }
    setContactSubmitting(true);
    setTimeout(() => {
      toast.success(
        "Thank you! Your message has been routed to Caryanam support.",
      );
      setContactName("");
      setContactEmail("");
      setContactMsg("");
      setContactSubmitting(false);
    }, 1200);
  };

  return (
    <section className="py-20 bg-background animate-rise">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            Contact Support
          </h1>
          <p className="mt-3 text-xs font-bold text-[#FFC700] tracking-widest uppercase">
            Reach out to Caryanam Enterprise operations
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-5 items-start">
          {/* Contact Info Sidebar */}
          <div className="md:col-span-2 space-y-4">
            <div className="p-5 border border-border bg-card rounded-2xl space-y-3.5">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                Caryanam Corporate HQ
              </h3>

              <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                <MapPin className="size-4.5 text-[#FFC700] shrink-0 mt-0.5" />
                <span>
                  Caryanam House, G-Block Area, Bandra Kurla Complex, Mumbai,
                  Maharashtra 400051
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Phone className="size-4.5 text-[#FFC700] shrink-0" />
                <span>+91 22 4900 1200</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Mail className="size-4.5 text-[#FFC700] shrink-0" />
                <span>operations@caryanam.com</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Clock className="size-4.5 text-[#FFC700] shrink-0" />
                <span>Mon - Sat (10:00 AM - 6:00 PM IST)</span>
              </div>
            </div>
          </div>

          {/* Form Area */}
          <div className="md:col-span-3">
            <form
              onSubmit={handleContactSubmit}
              className="p-6 border border-border bg-card rounded-2xl space-y-4 shadow-soft"
            >
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider mb-2">
                Send Message
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-foreground">
                  Your Name
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full mt-1.5 rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-xs font-medium text-foreground outline-none focus:border-[#FFC700] transition-colors"
                  />
                </label>

                <label className="block text-xs font-bold text-foreground">
                  Work Email
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="name@dealership.com"
                    className="w-full mt-1.5 rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-xs font-medium text-foreground outline-none focus:border-[#FFC700] transition-colors"
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-foreground">
                Message / Request Details
                <textarea
                  rows={5}
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder="State your registration query or dealership support request here..."
                  className="w-full mt-1.5 rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-xs font-medium text-foreground outline-none focus:border-[#FFC700] transition-colors resize-none"
                />
              </label>

              <button
                type="submit"
                disabled={contactSubmitting}
                className="w-full rounded-xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] py-3 text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {contactSubmitting ? "Routing..." : "Submit Ticket"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
