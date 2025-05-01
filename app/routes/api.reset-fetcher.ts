import { json } from "@remix-run/node";

export async function action() {
  // This route exists only to reset fetcher state
  // It doesn't need to do anything except return an empty response
  return json({ reset: true });
}
