import AuthForm from "@/components/AuthForm";
import { pages } from "@/constants/site";

export const metadata = {
  title: `${pages.login.eyebrow} | KoreData`,
  description: pages.login.description
};

export default function LoginPage() {
  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="eyebrow"><span className="live-dot" /> Login</div>
        <h1>Welcome back to KoreData.</h1>
        <p>Use the Login ID or email and password created during registration.</p>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
