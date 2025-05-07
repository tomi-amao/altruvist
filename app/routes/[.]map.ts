/**
 * This is a catch-all route for source map requests from development tools.
 * It prevents React Router from attempting to match these URLs and showing errors.
 */
export function loader() {
  // Return a 404 status with an empty response
  return new Response(null, { status: 404 });
}