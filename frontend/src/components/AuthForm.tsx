"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, KeyRound, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type AuthMode = "login" | "register";

type ApiMessage = {
  detail?: string;
  message?: string;
  login_id?: string;
  token?: string;
  full_name?: string;
  email?: string;
};

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdLoginId, setCreatedLoginId] = useState("");

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
      setSuccess("Account created. Save your Login ID and use it with your password.");
    } catch {
      setError("Could not reach the backend. Start FastAPI on http://127.0.0.1:8000.");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="auth-shell">
      <div className="auth-panel cornered">
        <div className="auth-icon"><KeyRound size={22} /></div>
        <h2>{isLogin ? "Login to KoreData" : "Create your KoreData account"}</h2>
        <p>
          {isLogin
            ? "Enter the Login ID or email and password you created during registration."
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

        <form className="auth-form" onSubmit={isLogin ? handleLogin : handleRegister}>
          {isLogin ? (
            <>
              <label>
                Login ID or Email
                <input name="identifier" placeholder="KD123456 or you@example.com" required />
              </label>
              <label>
                Password
                <input name="password" type="password" placeholder="Enter password" required />
              </label>
            </>
          ) : (
            <>
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
            </>
          )}

          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={16} /> : null}
            {isLogin ? "Login" : "Register"}
            {!loading ? <ArrowRight size={16} /> : null}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? (
            <>New to KoreData? <Link href="/register">Create account</Link></>
          ) : (
            <>Already registered? <Link href="/login">Login</Link></>
          )}
        </div>
      </div>
    </div>
  );
}
