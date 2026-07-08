// My Hub self-service Profile — re-exports the profile page so the route
// lives under /my-hub. This keeps the active module as MY_HUB (not HRMS)
// when a regular employee reaches their profile via My Hub.
export { default } from "@/app/profile/page";
