"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, KeyRound, Loader2, MailCheck } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type AuthMode = "login" | "register";
type RegisterStep = "form" | "otp";

type ApiMessage = {
  detail?: string;
  message?: string;
  login_id?: string;
  token?: string;
  full_name?: string;
  email?: string;
  sent_to?: string;
  requires_otp?: boolean;
  demo_otp?: string;
};

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdLoginId, setCreatedLoginId] = useState("");

  // ── OTP verification step (registration only) ───────────────────────────
  const [step, setStep] = useState<RegisterStep>("form");
  const [otpLoginId, setOtpLoginId] = useState("");
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resending, setResending] = useState(false);

  const readResponse = async (res: Response): Promise<ApiMessage> => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const identifier = String(form.get("identifier") || "").trim();
    const password = String(form.get("password") || "");

    try {
      const res = await fetch(`${API_BASE}/auth/password-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });
      const data = await readResponse(res);

      if (!res.ok) {
        setError(data.detail || "Login failed. Please check your Login ID and password.");
        return;
      }

      if (data.token) {
        window.localStorage.setItem("koredata-token", data.token);
        window.localStorage.setItem("koredata-login-id", data.login_id || identifier);
      }

      setSuccess(`Welcome back${data.full_name ? `, ${data.full_name}` : ""}. Redirecting...`);
      window.setTimeout(() => {
        window.location.href = "/dashboard";
      }, 700);
    } catch {
      setError("Could not reach the backend. Start FastAPI on http://127.0.0.1:8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setCreatedLoginId("");

    const form = new FormData(event.currentTarget);
    const firstName = String(form.get("first_name") || "").trim();
    const lastName = String(form.get("last_name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const password = String(form.get("password") || "");

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          password,
          otp_method: "email"
        })
      });
      const data = await readResponse(res);

      if (!res.ok) {
        setError(data.detail || "Registration failed. Please check the entered details.");
        return;
      }

      setCreatedLoginId(data.login_id || "");
      setOtpLoginId(data.login_id || "");
      setOtpSentTo(data.sent_to || email);
      setOtpCode(data.demo_otp || "");
      setSuccess(
        `Account created. We sent a verification code to ${data.sent_to || email}. ` +
        `Save your Login ID and enter the OTP below to activate your account.`
      );
      setStep("otp");
    } catch {
      setError("Could not reach the backend. Start FastAPI on http://127.0.0.1:8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const code = String(form.get("otp_code") || "").trim();

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_id: otpLoginId, otp_code: code })
      });
      const data = await readResponse(res);

      if (!res.ok) {
        setError(data.detail || "Invalid or expired OTP. Please try again.");
        return;
      }

      if (data.token) {
        window.localStorage.setItem("koredata-token", data.token);
        window.localStorage.setItem("koredata-login-id", data.login_id || otpLoginId);
      }

      setSuccess(`Email verified${data.full_name ? `, welcome ${data.full_name}` : ""}. Redirecting...`);
      window.setTimeout(() => {
        window.location.href = "/dashboard";
      }, 700);
    } catch {
      setError("Could not reach the backend. Start FastAPI on http://127.0.0.1:8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpLoginId || resending) return;
    setResending(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_id: otpLoginId })
      });
      const data = await readResponse(res);

      if (!res.ok) {
        setError(data.detail || "Could not resend OTP. Please try again.");
        return;
      }

      setSuccess(`A new verification code was sent to ${otpSentTo}.`);
    } catch {
      setError("Could not reach the backend. Start FastAPI on http://127.0.0.1:8000.");
    } finally {
      setResending(false);
    }
  };

  const isLogin = mode === "login";
  const showOtpStep = !isLogin && step === "otp";

  return (
    <div className="auth-shell">
      <div className="auth-panel cornered">
        <div className="auth-icon">
          {showOtpStep ? <MailCheck size={22} /> : <KeyRound size={22} />}
        </div>

        <h2>
          {isLogin
            ? "Login to KoreData"
            : showOtpStep
              ? "Verify your email"
              : "Create your KoreData account"}
        </h2>

        <p>
          {isLogin
            ? "Enter the Login ID or email and password you created during registration."
            : showOtpStep
              ? `Enter the 6-digit verification code we sent to ${otpSentTo || "your email"}.`
              : "Register once, save your generated Login ID, and use it with this password next time."}
        </p>

        {error && <div className="auth-alert auth-error">{error}</div>}
        {success && (
          <div className="auth-alert auth-success">
            <CheckCircle2 size={17} />
            <span>{success}</span>
          </div>
        )}

        {createdLoginId && (
          <div className="login-id-box">
            <span>Your Login ID</span>
            <strong>{createdLoginId}</strong>
          </div>
        )}

        {isLogin && (
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              Login ID or Email
              <input name="identifier" placeholder="KD123456 or you@example.com" required />
            </label>
            <label>
              Password
              <input name="password" type="password" placeholder="Enter password" required />
            </label>

            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <Loader2 className="spin" size={16} /> : null}
              Login
              {!loading ? <ArrowRight size={16} /> : null}
            </button>

            <div className="auth-switch">
              Forgot your password or Login ID? <Link href="/forgot-password">Reset it</Link>
            </div>
          </form>
        )}

        {!isLogin && step === "form" && (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-row">
              <label>
                First Name
                <input name="first_name" placeholder="First name" required />
              </label>
              <label>
                Last Name
                <input name="last_name" placeholder="Last name" />
              </label>
            </div>
            <label>
              Email
              <input name="email" type="email" placeholder="you@example.com" required />
            </label>
            <label>
              Phone
              <input name="phone" placeholder="+91 9876543210" required />
            </label>
            <label>
              Create Password
              <input name="password" type="password" minLength={8} placeholder="Minimum 8 characters" required />
            </label>

            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <Loader2 className="spin" size={16} /> : null}
              Register
              {!loading ? <ArrowRight size={16} /> : null}
            </button>
          </form>
        )}

        {showOtpStep && (
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

        {!showOtpStep && (
          <div className="auth-switch">
            {isLogin ? (
              <>New to KoreData? <Link href="/register">Create account</Link></>
            ) : (
              <>Already registered? <Link href="/login">Login</Link></>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
