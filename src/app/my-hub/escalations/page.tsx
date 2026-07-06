// My Hub self-service Escalations. Re-exports the escalations page so the route
// lives under /my-hub — the page detects that prefix and locks itself to the
// personal view: escalations where I'm a targeted member (excluding ones I
// raised), with the view switcher hidden. Keeps the nav on MY_HUB (no flip to
// WORK). The full escalations module stays in WORK.
export { default } from "@/app/escalations/page";
