import { notFound } from "next/navigation";
import Link from "next/link";
import { features, pages, solutions } from "@/constants/site";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import PricingCard from "@/components/ui/PricingCard";

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const page = pages[params.slug];
  if (!page) return {};
  return {
    title: `${page.eyebrow} | KoreData`,
    description: page.description
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const page = pages[params.slug];
  if (!page) notFound();

  return (
    <main className="min-h-screen pt-[calc(var(--nav-h)+70px)] px-5 pb-10">
      <section className="w-full max-w-[1240px] mx-auto">
        <Eyebrow>{page.eyebrow}</Eyebrow>
        <h1 className="max-w-[850px] mt-[18px] mb-0 font-display text-[clamp(44px,6vw,78px)] leading-[0.98] tracking-[-0.04em]">
          {page.title}
        </h1>
        <p className="max-w-[740px] mt-4 text-kore-muted font-mono leading-[1.8]">{page.description}</p>

        {params.slug === "contact" ? <Contact /> : params.slug === "pricing" ? <Pricing /> : <Generic slug={params.slug} />}
      </section>
    </main>
  );
}

function Generic({ slug }: { slug: string }) {
  const items = slug === "solutions" ? solutions : features.map(([title]) => title as string);

  return (
    <div className="grid grid-cols-3 gap-4 mt-[52px] max-md:grid-cols-2 max-sm:grid-cols-1">
      {items.slice(0, 9).map((item) => (
        <article className="cornered border border-kore-border bg-kore-surface rounded-kore p-6" key={item}>
          <h2 className="m-0 mb-2.5 text-kore-accent font-mono text-sm tracking-[1.4px] uppercase">{item}</h2>
          <p className="m-0 text-kore-muted leading-[1.7]">
            Premium AI workflows with secure automation, modern visualization, explainable insights,
            and enterprise-ready performance.
          </p>
        </article>
      ))}
    </div>
  );
}

function Pricing() {
  return (
    <div className="grid grid-cols-3 gap-4 mt-[52px] max-md:grid-cols-2 max-sm:grid-cols-1">
      {[
        { plan: "Starter", price: "$29", description: "Per user / month.", features: ["AI data analysis", "Interactive dashboards", "LLM assistant", "RAG search", "API access"] },
        { plan: "Professional", price: "$99", description: "Per user / month.", features: ["AI data analysis", "Interactive dashboards", "LLM assistant", "RAG search", "API access"] },
        { plan: "Enterprise", price: "Custom", description: "Advanced controls for enterprise teams.", features: ["AI data analysis", "Interactive dashboards", "LLM assistant", "RAG search", "API access"] },
      ].map((item) => (
        <PricingCard key={item.plan} {...item} />
      ))}
    </div>
  );
}

function Contact() {
  return (
    <div className="grid grid-cols-2 gap-6 mt-[52px] max-md:grid-cols-1">
      <form className="cornered grid gap-3.5 border border-kore-border bg-kore-surface rounded-kore p-6">
        <input className="w-full border border-kore-border bg-[rgba(0,212,255,0.045)] text-kore-text rounded-md p-3.5 outline-none focus:border-kore-accent focus:shadow-[0_0_18px_rgba(0,212,255,0.12)]" placeholder="Name" aria-label="Name" />
        <input className="w-full border border-kore-border bg-[rgba(0,212,255,0.045)] text-kore-text rounded-md p-3.5 outline-none focus:border-kore-accent focus:shadow-[0_0_18px_rgba(0,212,255,0.12)]" placeholder="Email" aria-label="Email" />
        <input className="w-full border border-kore-border bg-[rgba(0,212,255,0.045)] text-kore-text rounded-md p-3.5 outline-none focus:border-kore-accent focus:shadow-[0_0_18px_rgba(0,212,255,0.12)]" placeholder="Company" aria-label="Company" />
        <textarea className="w-full border border-kore-border bg-[rgba(0,212,255,0.045)] text-kore-text rounded-md p-3.5 outline-none min-h-[160px] resize-y focus:border-kore-accent focus:shadow-[0_0_18px_rgba(0,212,255,0.12)]" placeholder="Tell us about your data workflow" aria-label="Message" />
        <Button variant="primary" type="button">Send Message</Button>
      </form>

      <div className="cornered border border-kore-border bg-kore-surface rounded-kore p-6">
        <h3 className="mt-[18px] mb-2 font-mono text-sm tracking-[1.5px] uppercase text-kore-accent">Book a KoreData demo</h3>
        <p className="m-0 text-kore-muted leading-[1.7]">
          Speak with our team about enterprise AI analytics, deployment, pricing, security,
          dashboards, integrations, and custom workflows.
        </p>
        <div
          className="min-h-[360px] grid place-items-center text-kore-dim font-mono border border-kore-border rounded-kore mt-5"
          style={{
            background: "linear-gradient(rgba(0,212,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.08) 1px, transparent 1px), rgba(0,18,36,0.5)",
            backgroundSize: "32px 32px",
          }}
        >
          Google Map Placeholder
        </div>
        <Button variant="primary" href="/register" className="mt-5">Get Started</Button>
      </div>
    </div>
  );
}
