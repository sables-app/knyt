import routes from "../routes";

const server = Bun.serve({
  routes,
  error: (error) => {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  },
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.info(`Server running at ${server.url}`);
console.info("Press Ctrl+C to stop the server");
