import { RoutePage } from "@/components/RoutePage";
import { pages } from "@/constants/site";

export const metadata = {
  title: `${pages.services.eyebrow} | KoreData`,
  description: pages.services.description
};

export default function ServicesPage() {
  return <RoutePage slug="services" />;
}
