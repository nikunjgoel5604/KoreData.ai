import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = {
  title: "Forgot Password | KoreData",
  description: "Recover your KoreData Login ID and reset your password using an email OTP."
};

export default function ForgotPasswordPage() {
  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="eyebrow"><span className="live-dot" /> Account Recovery</div>
        <h1>Forgot your password or Login ID?</h1>
        <p>Enter your registered email. We&apos;ll send your Login ID and a one-time code so you can set a new password.</p>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
