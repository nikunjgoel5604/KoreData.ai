import AuthForm from "@/components/AuthForm";
import { pages } from "@/constants/site";

export const metadata = {
  title: `${pages.register.eyebrow} | KoreData`,
  description: pages.register.description
};

export default function RegisterPage() {
  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="eyebrow"><span className="live-dot" /> Register</div>
        <h1>Create your KoreData workspace.</h1>
        <p>Set your password during registration. KoreData will generate your Login ID.</p>
        <AuthForm mode="register" />
      </section>
    </main>
  );
}
