"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type ContactStatus = {
  kind: "idle" | "success" | "error";
  message: string;
};

export function ContactSection() {
  const [status, setStatus] = useState<ContactStatus>({ kind: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setIsSubmitting(true);
    setStatus({ kind: "idle", message: "" });

    const form = new FormData(formElement);
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      company: String(form.get("company") || ""),
      message: String(form.get("message") || "")
    };

    try {
      const response = await fetch(`${API_BASE}/contact/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok === false) {
        throw new Error(data.error || data.detail || "Message could not be sent.");
      }

      formElement.reset();
      setStatus({
        kind: "success",
        message: data.message || "Thank you! We'll get back to you within 24 hours."
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Backend not reachable. Start the API and try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="contact-form">
      <form className="form-panel card cornered" onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" aria-label="Name" required />
        <input name="email" type="email" placeholder="Email" aria-label="Email" required />
        <input name="company" placeholder="Company" aria-label="Company" />
        <textarea name="message" placeholder="Tell us about your data workflow" aria-label="Message" required />
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
        {status.kind !== "idle" ? (
          <p className={`form-status form-status-${status.kind}`}>{status.message}</p>
        ) : null}
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
