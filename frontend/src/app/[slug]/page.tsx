import { notFound } from "next/navigation";
import Link from "next/link";
import { features, pages, solutions } from "@/constants/site";

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

type SlugParams = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: SlugParams }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) return {};
  return {
    title: `${page.eyebrow} | KoreData`,
    description: page.description
  };
}

export default async function Page({ params }: { params: SlugParams }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();

  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="eyebrow"><span className="live-dot" /> {page.eyebrow}</div>
        <h1>{page.title}</h1>
        <p>{page.description}</p>

        {slug === "contact" ? <Contact /> : slug === "pricing" ? <Pricing /> : <Generic slug={slug} />}
      </section>
    </main>
  );
}

function Generic({ slug }: { slug: string }) {
  const items = slug === "solutions" ? solutions : features.map(([title]) => title as string);

  return (
    <div className="page-grid">
      {items.slice(0, 9).map((item) => (
        <article className="page-card cornered" key={item}>
          <h2>{item}</h2>
          <p>
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
    <div className="pricing-grid" style={{ marginTop: 52 }}>
      {["Starter", "Professional", "Enterprise"].map((plan, i) => (
        <article className="card pricing-card cornered" key={plan}>
          <h3>{plan}</h3>
          <div className="price">{i === 2 ? "Custom" : `$${i === 0 ? 29 : 99}`}</div>
          <p>{i === 2 ? "Advanced controls for enterprise teams." : "Per user / month."}</p>
          <ul>
            <li>AI data analysis</li>
            <li>Interactive dashboards</li>
            <li>LLM assistant</li>
            <li>RAG search</li>
            <li>API access</li>
          </ul>
        </article>
      ))}
    </div>
  );
}

function Contact() {
  return (
    <div className="contact-form">
      <form className="form-panel card cornered">
        <input placeholder="Name" aria-label="Name" />
        <input placeholder="Email" aria-label="Email" />
        <input placeholder="Company" aria-label="Company" />
        <textarea placeholder="Tell us about your data workflow" aria-label="Message" />
        <button className="btn btn-primary" type="button">Send Message</button>
      </form>

      <div className="card cornered">
        <h3>Book a KoreData demo</h3>
        <p>
          Speak with our team about enterprise AI analytics, deployment, pricing, security,
          dashboards, integrations, and custom workflows.
        </p>
        <div className="map-placeholder">Google Map Placeholder</div>
        <Link href="/register" className="btn btn-primary" style={{ marginTop: 20 }}>Get Started</Link>
      </div>
    </div>
  );
}
