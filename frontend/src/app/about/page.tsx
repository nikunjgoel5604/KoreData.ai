import { RoutePage } from "@/components/RoutePage";
import { pages } from "@/constants/site";

export const metadata = {
  title: `${pages.about.eyebrow} | KoreData`,
  description: pages.about.description
};

export default function AboutPage() {
  return <RoutePage slug="about" />;
}
