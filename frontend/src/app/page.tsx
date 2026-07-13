import { ArrowRight, CheckCircle2, Database, FileText, Network, ShieldCheck, Users } from "lucide-react";
import { clientSteps, platformLayers } from "@/constants/site";

const metrics = [
  ["Clients", "24"],
  ["Datasets", "128K"],
  ["Reports", "318"],
  ["API Health", "99.9%"]
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Next Step: Client Management</p>
          <h1>Frontend architecture for a clean AI data platform.</h1>
          <p className="hero-copy">
            This screen moves the product from a plain landing page into an application-style
            architecture view with client onboarding, protected workflows, API layers, and support tooling.
          </p>
        </div>

        <div className="metric-grid">
          {metrics.map(([label, value]) => (
            <article className="metric-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="architecture-section" id="architecture">
        <div className="section-head">
          <p className="eyebrow">Layered Design</p>
          <h2>Application structure mapped like the reference diagram.</h2>
        </div>

        <div className="architecture-board">
          <aside className="side-labels">
            {platformLayers.map((layer) => (
              <span key={layer.label}>{layer.label}</span>
            ))}
          </aside>

          <div className="layer-stack">
            {platformLayers.map((layer) => (
              <div className={`layer layer-${layer.tone}`} key={layer.label}>
                <div className="layer-title">{layer.label}</div>
                <div className="layer-items">
                  {layer.items.map((item) => (
                    <div className="layer-box" key={item}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <aside className="tool-rail">
            <div>Permission Control</div>
            <div>Function Tools</div>
          </aside>
        </div>
      </section>

      <section className="split-section" id="client-management">
        <div className="panel">
          <div className="panel-title">
            <Users size={22} />
            <span>Client Management Module</span>
          </div>
          <h2>Move from foundation to real customer operations.</h2>
          <p>
            The next product step is client management: create client records, connect admins,
            register datasets, and track each client through the analytics workflow.
          </p>

          <div className="step-list">
            {clientSteps.map((step, index) => (
              <div key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
                <CheckCircle2 size={18} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel workflow-panel" id="workflow">
          <div className="panel-title">
            <Network size={22} />
            <span>Request Flow</span>
          </div>
          {[
            ["Frontend Form", "React validates client data"],
            ["API Service", "Request interceptor adds session token"],
            ["Backend", "FastAPI validates and stores records"],
            ["Database", "Client profile is linked to activity data"]
          ].map(([title, text]) => (
            <div className="flow-row" key={title}>
              <Database size={18} />
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
              <ArrowRight size={16} />
            </div>
          ))}
        </div>
      </section>

      <section className="run-section" id="run">
        <div>
          <p className="eyebrow">Run Locally</p>
          <h2>Use these commands after saving the frontend source.</h2>
        </div>
        <div className="command-grid">
          <code>cd E:\KoreData.ai\frontend</code>
          <code>npm install</code>
          <code>npm run dev</code>
        </div>
      </section>

      <section className="feature-row">
        <article>
          <ShieldCheck size={24} />
          <strong>Protected workflows</strong>
          <p>Prepared for role-based access and session-aware API calls.</p>
        </article>
        <article>
          <FileText size={24} />
          <strong>Report-ready structure</strong>
          <p>Reports, alerts, analytics, and dashboards can sit inside the same shell.</p>
        </article>
        <article>
          <Database size={24} />
          <strong>Backend aligned</strong>
          <p>The frontend flow matches the existing Python backend direction.</p>
        </article>
      </section>
    </main>
  );
}
