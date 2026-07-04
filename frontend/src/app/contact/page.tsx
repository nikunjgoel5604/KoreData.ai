"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mail, MapPin, Phone, Calendar, MessageSquare, Zap } from "lucide-react";
import { useState } from "react";
import PageHero from "@/components/ui/PageHero";
import Section from "@/components/ui/Section";
import Card, { CardIcon } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const contactChannels = [
  {
    icon: Mail,
    title: "Email Us",
    value: "hello@koredata.ai",
    desc: "For general enquiries, partnerships, and media requests.",
    color: "#00d4ff"
  },
  {
    icon: Phone,
    title: "Talk to Sales",
    value: "+1 (888) 567-DATA",
    desc: "Mon–Fri, 9am–6pm EST. For enterprise pricing and deployment.",
    color: "#00ff88"
  },
  {
    icon: MapPin,
    title: "Headquarters",
    value: "San Francisco, CA",
    desc: "450 Brannan Street, Suite 300, San Francisco, CA 94107",
    color: "#7c3aed"
  }
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <main className="min-h-screen pt-[calc(var(--nav-h)+70px)] px-5 pb-10">
      {/* Hero */}
      <PageHero
        eyebrow="Contact KoreData"
        title={<>Let&apos;s talk about your{" "}<span className="text-transparent bg-[linear-gradient(100deg,#ffffff,var(--accent),var(--accent-2))] bg-clip-text [-webkit-background-clip:text]">data challenges.</span></>}
        description="Whether you want a live demo, have enterprise deployment questions, or just want to explore whether KoreData is right for your team — we'd love to hear from you."
      />

      {/* Contact Channels */}
      <section className="py-16 px-5" style={{ paddingTop: 32 }}>
        <div className="w-full max-w-[1240px] mx-auto">
          <div className="grid grid-cols-3 gap-5 mb-14 max-md:grid-cols-1">
            {contactChannels.map(({ icon: Icon, title, value, desc, color }, i) => (
              <motion.div
                key={title}
                className="cornered border border-kore-border bg-kore-surface backdrop-blur-[16px] rounded-kore p-6 transition-all duration-[220ms] hover:-translate-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <CardIcon style={{ color, borderColor: `${color}33`, background: `${color}10` }}>
                  <Icon size={20} />
                </CardIcon>
                <h3 className="mt-[18px] mb-2 font-mono text-sm tracking-[1.5px] uppercase" style={{ color }}>{title}</h3>
                <strong className="block font-mono text-[13px] text-kore-text my-2">{value}</strong>
                <p className="m-0 text-kore-muted leading-[1.7]">{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Form + Book Demo */}
          <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-kore-accent font-mono text-xs tracking-[3px] uppercase mb-3.5">// Send a Message</div>
              {!sent ? (
                <form
                  className="cornered grid gap-3.5 border border-kore-border bg-kore-surface backdrop-blur-[16px] rounded-kore p-6"
                  onSubmit={e => { e.preventDefault(); setSent(true); }}
                >
                  <div className="grid grid-cols-2 gap-3.5">
                    <input className="w-full border border-kore-border bg-[rgba(0,212,255,0.045)] text-kore-text rounded-md p-3.5 outline-none focus:border-kore-accent focus:shadow-[0_0_18px_rgba(0,212,255,0.12)]" placeholder="First Name" aria-label="First Name" required />
                    <input className="w-full border border-kore-border bg-[rgba(0,212,255,0.045)] text-kore-text rounded-md p-3.5 outline-none focus:border-kore-accent focus:shadow-[0_0_18px_rgba(0,212,255,0.12)]" placeholder="Last Name" aria-label="Last Name" required />
                  </div>
                  <input className="w-full border border-kore-border bg-[rgba(0,212,255,0.045)] text-kore-text rounded-md p-3.5 outline-none focus:border-kore-accent focus:shadow-[0_0_18px_rgba(0,212,255,0.12)]" placeholder="Work Email" aria-label="Email" type="email" required />
                  <input className="w-full border border-kore-border bg-[rgba(0,212,255,0.045)] text-kore-text rounded-md p-3.5 outline-none focus:border-kore-accent focus:shadow-[0_0_18px_rgba(0,212,255,0.12)]" placeholder="Company Name" aria-label="Company" />
                  <input className="w-full border border-kore-border bg-[rgba(0,212,255,0.045)] text-kore-text rounded-md p-3.5 outline-none focus:border-kore-accent focus:shadow-[0_0_18px_rgba(0,212,255,0.12)]" placeholder="Job Title" aria-label="Job Title" />
                  <select
                    aria-label="Enquiry Type"
                    className="w-full border border-kore-border bg-[rgba(0,212,255,0.045)] text-kore-muted rounded-md p-3.5 outline-none font-[inherit]"
                  >
                    <option value="">Enquiry Type</option>
                    <option>Book a Demo</option>
                    <option>Enterprise Pricing</option>
                    <option>Technical Support</option>
                    <option>Partnership</option>
                    <option>General Question</option>
                  </select>
                  <textarea className="w-full border border-kore-border bg-[rgba(0,212,255,0.045)] text-kore-text rounded-md p-3.5 outline-none min-h-[160px] resize-y focus:border-kore-accent focus:shadow-[0_0_18px_rgba(0,212,255,0.12)]" placeholder="Tell us about your data workflow and what you're trying to achieve..." aria-label="Message" required />
                  <Button variant="primary" type="submit" className="w-full justify-center">
                    <MessageSquare size={16} /> Send Message
                  </Button>
                </form>
              ) : (
                <div className="cornered border border-kore-border bg-kore-surface rounded-kore text-center p-12">
                  <div className="text-[48px] mb-5">✅</div>
                  <h3 className="text-xl mb-3 text-kore-accent2">Message Received!</h3>
                  <p className="text-kore-muted mb-6">
                    Thanks for reaching out. A member of our team will respond within one business day.
                  </p>
                  <Button onClick={() => setSent(false)}>Send Another</Button>
                </div>
              )}
            </motion.div>

            {/* Book Demo + Map */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-5"
            >
              <div>
                <div className="text-kore-accent font-mono text-xs tracking-[3px] uppercase mb-3.5">// Book a Demo</div>
                <div className="cornered border border-kore-border bg-kore-surface rounded-kore p-6">
                  <CardIcon style={{ color: "var(--accent-2)", borderColor: "rgba(0,255,136,0.25)", background: "rgba(0,255,136,0.05)" }}>
                    <Calendar size={20} />
                  </CardIcon>
                  <h3 className="mt-[18px] mb-2 font-mono text-sm tracking-[1.4px] uppercase text-kore-accent">See KoreData Live</h3>
                  <p className="m-0 text-kore-muted leading-[1.7] mb-5">
                    Schedule a 30-minute personalised walkthrough with our team. We'll show you exactly how
                    KoreData handles your specific data use case, industry, and team size.
                  </p>
                  <ul className="p-0 m-0 mb-6 list-none grid gap-2.5">
                    {["30-minute live demo", "Your specific use case", "Pricing & deployment Q&A", "Same-week availability"].map(item => (
                      <li key={item} className="flex items-center gap-2 text-kore-muted font-mono text-xs">
                        <Zap size={12} className="text-kore-accent2" /> {item}
                      </li>
                    ))}
                  </ul>
                  <Button variant="primary" href="/register" className="w-full justify-center">
                    <Calendar size={16} /> Schedule Demo <ArrowRight size={16} />
                  </Button>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="cornered border border-kore-border rounded-kore p-0 overflow-hidden">
                <div
                  className="min-h-[220px] grid place-items-center text-kore-dim font-mono"
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    background: "linear-gradient(rgba(0,212,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.08) 1px, transparent 1px), rgba(0,18,36,0.5)",
                    backgroundSize: "32px 32px",
                  }}
                >
                  <div className="text-center">
                    <MapPin size={28} className="text-kore-accent mb-2 mx-auto" />
                    <p className="m-0 font-mono text-xs text-kore-dim">
                      450 Brannan St, San Francisco, CA
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
