import Link from "next/link";
import { features, pages, solutions } from "@/constants/site";

type RoutePageProps = {
  slug: keyof typeof pages;
};

export function RoutePage({ slug }: RoutePageProps) {
  const page = pages[slug];

  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="eyebrow"><span className="live-dot" /> {page.eyebrow}</div>
        <h1>{page.title}</h1>
        <p>{page.description}</p>

        {slug === "contact" ? <Contact /> : slug === "faq" ? <Faq /> : <Generic slug={slug} />}
      </section>
    </main>
  );
}

function Generic({ slug }: { slug: string }) {
  const items =
    slug === "services"
      ? features.map(([title]) => title as string)
      : slug === "working-mechanism"
        ? ["Connect Data", "Clean & Validate", "Analyze", "Ask AI", "Forecast", "Export Reports"]
        : slug === "about"
          ? ["Mission", "AI Expertise", "Enterprise Focus", "Reliable Insights", "Secure Workflows", "Decision Intelligence"]
          : solutions;

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

function Faq() {
  const faqs = [
    ["Can I upload CSV or Excel data?", "Yes. KoreData is designed for structured datasets, dashboards, and AI analysis workflows."],
    ["Does KoreData support AI chat?", "Yes. The platform supports LLM assistants and secure RAG-style search across business knowledge."],
    ["Can teams use it securely?", "Yes. The experience is built around access control, data isolation, and audit-ready workflows."],
    ["Can I export reports?", "Yes. KoreData can turn insights, charts, and forecasts into decision-ready reports."]
  ];

  return (
    <div className="page-grid">
      {faqs.map(([question, answer]) => (
        <article className="page-card cornered" key={question}>
          <h2>{question}</h2>
          <p>{answer}</p>
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
