import { RoutePage } from "@/components/RoutePage";
import { pages } from "@/constants/site";

export const metadata = {
  title: `${pages.faq.eyebrow} | KoreData`,
  description: pages.faq.description
};

export default function FaqPage() {
  return <RoutePage slug="faq" />;
}
