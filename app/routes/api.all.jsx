

export function loader({ request }) {
  const url = new URL(request.url);
  const path = url.pathname;

  return new Response(`Received request for: ${path}\nQuery parameters: ${url.search}`, {
    status: 200,
    headers: {
      "Content-Type": "text/plain"
    }
  });
}
