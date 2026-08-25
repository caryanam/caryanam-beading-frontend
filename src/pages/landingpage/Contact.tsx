import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Headset, Building2, ShieldCheck, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/public/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Enquiry submitted successfully!');
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
      } else {
        toast.error(data.message || 'Failed to submit enquiry');
      }
    } catch (err) {
      toast.error('Network error, please try again later');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-10 sm:py-16 bg-background animate-rise relative overflow-hidden text-foreground">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#FFC700]/10 dark:bg-[#FFC700]/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        
        <div className="text-center mb-8 sm:mb-12">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          <div className="space-y-6">
            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFC700] via-amber-400 to-[#FFD633]" />
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-[#FFC700]/15 border border-[#FFC700]/30 flex items-center justify-center text-[#FFC700] shrink-0">
                  <Building2 className="size-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground tracking-tight mb-1.5">
                    Caryanam India Pvt. Ltd.
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    Reach out to our dedicated support helpline and operations management for dealer onboarding, inspection telemetry, or auction room queries.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border/70 pb-4 mb-4">
                <span className="flex items-center justify-center size-8 rounded-lg bg-[#FFC700]/15 text-[#FFC700] border border-[#FFC700]/30">
                  <ShieldCheck className="size-4" />
                </span>
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
                  Official Contact Directory
                </h3>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-4 group">
                  <div className="size-11 rounded-full bg-secondary/80 flex items-center justify-center shrink-0 border border-border/50 group-hover:bg-[#FFC700]/10 group-hover:border-[#FFC700]/30 group-hover:text-[#FFC700] transition-colors">
                    <MapPin className="size-5 text-muted-foreground group-hover:text-[#FFC700] transition-colors" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Office Address</span>
                    <span className="font-bold text-foreground text-sm">Pune, Maharashtra 411014</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="size-11 rounded-full bg-secondary/80 flex items-center justify-center shrink-0 border border-border/50 group-hover:bg-[#FFC700]/10 group-hover:border-[#FFC700]/30 group-hover:text-[#FFC700] transition-colors">
                    <Phone className="size-5 text-muted-foreground group-hover:text-[#FFC700] transition-colors" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Helpline Number</span>
                    <span className="font-black text-[#FFC700] text-base">+91 7755994123</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="size-11 rounded-full bg-secondary/80 flex items-center justify-center shrink-0 border border-border/50 group-hover:bg-[#FFC700]/10 group-hover:border-[#FFC700]/30 group-hover:text-[#FFC700] transition-colors">
                    <Mail className="size-5 text-muted-foreground group-hover:text-[#FFC700] transition-colors" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Email Support</span>
                    <span className="font-bold text-foreground text-sm">support@caryanamlive.com</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="size-11 rounded-full bg-secondary/80 flex items-center justify-center shrink-0 border border-border/50 group-hover:bg-[#FFC700]/10 group-hover:border-[#FFC700]/30 group-hover:text-[#FFC700] transition-colors">
                    <Clock className="size-5 text-muted-foreground group-hover:text-[#FFC700] transition-colors" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Working Hours</span>
                    <span className="font-bold text-foreground text-sm">Mon - Sat (9:30 AM - 6:30 PM IST)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border/70 pb-4 mb-5">
              <span className="flex items-center justify-center size-8 rounded-lg bg-[#FFC700]/15 text-[#FFC700] border border-[#FFC700]/30">
                <MessageSquare className="size-4" />
              </span>
              <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
                Send us an Enquiry
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-11 px-4 py-2 rounded-xl bg-secondary/30 border border-border/60 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[#FFC700]/50 focus:border-[#FFC700]/50 placeholder:text-muted-foreground/50 transition-all"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-11 px-4 py-2 rounded-xl bg-secondary/30 border border-border/60 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[#FFC700]/50 focus:border-[#FFC700]/50 placeholder:text-muted-foreground/50 transition-all"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={phone}
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, ''); // strip non-numeric
                    if (val.length > 0 && !/^[6-9]/.test(val)) {
                      val = val.substring(1); // remove first char if it's not 6-9
                    }
                    if (val.length > 10) {
                      val = val.substring(0, 10); // cap at 10 digits
                    }
                    setPhone(val);
                  }}
                  className="w-full h-11 px-4 py-2 rounded-xl bg-secondary/30 border border-border/60 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[#FFC700]/50 focus:border-[#FFC700]/50 placeholder:text-muted-foreground/50 transition-all"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Message</label>
                <textarea
                  placeholder="How can we help you?"
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/60 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[#FFC700]/50 focus:border-[#FFC700]/50 placeholder:text-muted-foreground/50 transition-all resize-none"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-[#FFC700] hover:bg-[#FFD633] text-black font-extrabold text-sm uppercase tracking-wide transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none mt-2"
              >
                {loading ? (
                  <span className="opacity-80">Submitting...</span>
                ) : (
                  <>
                    Submit Enquiry <Send className="size-4" />
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
