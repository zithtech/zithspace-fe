import { redirect } from "next/navigation";

export default function SettingsRedirect() {
  // Scope option lists moved to QA Space → Settings, alongside the bug
  // definitions. Anyone landing on the old route is taken there.
  redirect("/qa-workspace/settings");
}
