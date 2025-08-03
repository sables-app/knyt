import homepage from "../pages/index.html";

const server = Bun.serve({
  development: {
    // Disable Bun's HMR, because it's currently unstable,
    // and doesn't work with the Knyt plugin.
    hmr: false,
  },
  routes: {
    "/": homepage,
  },
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
