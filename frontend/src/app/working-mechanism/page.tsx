import { RoutePage } from "@/components/RoutePage";
import { pages } from "@/constants/site";

export const metadata = {
  title: `${pages["working-mechanism"].eyebrow} | KoreData`,
  description: pages["working-mechanism"].description
};

export default function WorkingMechanismPage() {
  return <RoutePage slug="working-mechanism" />;
}
