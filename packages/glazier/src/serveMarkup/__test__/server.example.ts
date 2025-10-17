import { serveMarkup } from "../serveMarkup.ts";

Bun.serve({
  routes: {
    '/home': (req, server) => {
      return Response.redirect('/home');
    },
    '/': serveMarkup<'/'>(import('./index.html')),
  }
});

Bun.serve({
  websocket: {
    message(ws, message) {
      ws.send(`Echo: ${message}`);
    }
  },
  routes: {
    // "/": a,
    '/': async (req, server) => {
      return Response.redirect('/home');
    },
    '/home': serveMarkup(import('./index.html')),
  }
});
