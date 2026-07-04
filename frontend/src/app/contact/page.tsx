import { RoutePage } from "@/components/RoutePage";
import { pages } from "@/constants/site";

export const metadata = {
  title: `${pages.contact.eyebrow} | KoreData`,
  description: pages.contact.description
};

export default function ContactPage() {
  return <RoutePage slug="contact" />;
}
