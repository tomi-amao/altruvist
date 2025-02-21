import { json } from "@remix-run/node";

export async function loader() {
  return json({
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
    apiKey: process.env.GOOGLE_DRIVE_API_KEY,
  });
}
