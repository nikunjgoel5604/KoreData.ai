"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, KeyRound, Loader2, MailCheck, ShieldCheck } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type Step = "email" | "otp" | "reset" | "done";

type ApiMessage = {
  detail?: string;
  message?: string;
  ok?: boolean;
  sent_to?: string;
  login_id?: string;
  demo_otp?: string;
  demo_login_id?: string;
};

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [recoveredLoginId, setRecoveredLoginId] = useState("");

  const readResponse = async (res: Response): Promise<ApiMessage> => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  // ── Step 1: send OTP + Login ID reminder to the person's email ───────────
  const handleSendOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const enteredEmail = String(form.get("email") || "").trim();

    try {
      const res = await fetch(`${API_BASE}/auth/forgot/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: enteredEmail })
      });
      const data = await readResponse(res);

      if (!res.ok) {
        setError(data.detail || "Could not find an account with that email.");
        return;
      }

      setEmail(enteredEmail);
      setOtpCode(data.demo_otp || "");
      setSuccess(
        data.message ||
          `We sent your Login ID and a reset code to ${data.sent_to || enteredEmail}. Check your inbox.`
      );
      setStep("otp");
    } catch {
      setError("Could not reach the backend. Start FastAPI on http://127.0.0.1:8000.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP — reveals the recovered Login ID ───────────────────
  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const code = String(form.get("otp_code") || "").trim();

    try {
      const res = await fetch(`${API_BASE}/auth/forgot/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: code })
      });
      const data = await readResponse(res);

      if (!res.ok) {
        setError(data.detail || "Invalid or expired OTP. Please try again.");
        return;
      }

      setOtpCode(code);
      setRecoveredLoginId(data.login_id || "");
      setSuccess(data.message || "OTP verified. You can now set a new password.");
      setStep("reset");
    } catch {
      setError("Could not reach the backend. Start FastAPI on http://127.0.0.1:8000.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: set the new password ──────────────────────────────────────────
  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("new_password") || "");
    const confirmPassword = String(form.get("confirm_password") || "");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/forgot/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword })
      });
      const data = await readResponse(res);

      if (!res.ok) {
        setError(data.detail || "Could not reset your password. Please restart the process.");
        return;
      }

      setSuccess(data.message || "Password reset successfully.");
      setStep("done");
    } catch {
      setError("Could not reach the backend. Start FastAPI on http://127.0.0.1:8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || resending) return;
    setResending(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/forgot/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await readResponse(res);

      if (!res.ok) {
        setError(data.detail || "Could not resend the code. Please try again.");
        return;
      }

      setSuccess(`A new Login ID reminder and reset code were sent to ${email}.`);
    } catch {
      setError("Could not reach the backend. Start FastAPI on http://127.0.0.1:8000.");
    } finally {
      setResending(false);
    }
  };

  const icon =
    step === "email" ? <KeyRound size={22} /> :
    step === "otp"   ? <MailCheck size={22} /> :
                       <ShieldCheck size={22} />;

  const title =
    step === "email" ? "Forgot Password or Login ID?" :
    step === "otp"    ? "Verify your email" :
    step === "reset"  ? "Set a new password" :
                        "All set";

  const subtitle =
    step === "email"
      ? "Enter the email you registered with. We'll email your Login ID along with a reset code."
      : step === "otp"
        ? `Enter the 6-digit code we sent to ${email}.`
        : step === "reset"
          ? "Choose a new password for your account."
          : "Your password has been updated.";

  return (
    <div className="auth-shell">
      <div className="auth-panel cornered">
        <div className="auth-icon">{icon}</div>

        <h2>{title}</h2>
        <p>{subtitle}</p>

        {error && <div className="auth-alert auth-error">{error}</div>}
        {success && (
          <div className="auth-alert auth-success">
            <CheckCircle2 size={17} />
            <span>{success}</span>
          </div>
        )}

        {recoveredLoginId && (
          <div className="login-id-box">
            <span>Your Login ID</span>
            <strong>{recoveredLoginId}</strong>
          </div>
        )}

        {step === "email" && (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <label>
              Registered Email
              <input name="email" type="email" placeholder="you@example.com" required autoFocus />
            </label>

            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <Loader2 className="spin" size={16} /> : null}
              Send Reset Code
              {!loading ? <ArrowRight size={16} /> : null}
            </button>

            <div className="auth-switch">
              Remembered your details? <Link href="/login">Back to Login</Link>
            </div>
          </form>
        )}

        {step === "otp" && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <label>
              Verification Code
              <input
                name="otp_code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="6-digit code"
                defaultValue={otpCode}
                required
                autoFocus
              />
            </label>

            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <Loader2 className="spin" size={16} /> : null}
              Verify OTP
              {!loading ? <ArrowRight size={16} /> : null}
            </button>

            <div className="auth-switch">
              Didn&apos;t get the code?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleResendOtp();
                }}
              >
                {resending ? "Resending..." : "Resend OTP"}
              </a>
            </div>
          </form>
        )}

        {step === "reset" && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <label>
              New Password
              <input name="new_password" type="password" minLength={8} placeholder="Minimum 8 characters" required autoFocus />
            </label>
            <label>
              Confirm New Password
              <input name="confirm_password" type="password" minLength={8} placeholder="Re-enter new password" required />
            </label>

            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <Loader2 className="spin" size={16} /> : null}
              Reset Password
              {!loading ? <ArrowRight size={16} /> : null}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="auth-switch">
            <Link href="/login">Continue to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
