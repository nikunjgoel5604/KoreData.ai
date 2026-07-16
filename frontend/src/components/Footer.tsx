import Link from "next/link";
import { footerGroups } from "@/constants/site";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <Link href="/" className="logo">
            <span className="logo-mark">K∂</span>
            <span>Kore<span>Data</span></span>
          </Link>
          <p>
            Transform raw data into intelligent business decisions using AI, machine learning,
            LLM assistants, RAG search, and modern analytics workflows.
          </p>
        </div>

        <div className="footer-grid">
          {footerGroups.map(([title, links]) => (
            <div key={title as string}>
              <h4>{title as string}</h4>
              {(links as string[][]).map(([label, href]) => (
                <Link href={href} key={href}>{label}</Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
