import { redirect } from "next/navigation";

export default function SettingsRedirect() {
  // If the user navigates directly to this old route, 
  // automatically redirect them to the native settings tab
  redirect("/qa-workspace/test-scope?tab=settings");
}
