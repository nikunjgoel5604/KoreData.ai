import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="eyebrow"><span className="live-dot" /> 404</div>
        <h1>Page not found.</h1>
        <p>The page you are looking for does not exist or has been moved.</p>
        <Link className="btn btn-primary" href="/">Back Home</Link>
      </section>
    </main>
  );
}
