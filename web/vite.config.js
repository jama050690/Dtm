import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3003",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        home: "home.html",
        admin: "admin.html",
        login: "login.html",
        signup: "signup.html",
      },
    },
  },
  plugins: [
    {
      name: "spa-clean-urls",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url.split("?")[0];
          // Static files, API, Vite internal - skip
          if (
            url.includes(".") ||
            url.startsWith("/api") ||
            url.startsWith("/@") ||
            url.startsWith("/node_modules") ||
            url.startsWith("/src")
          ) {
            return next();
          }
          // Route mapping
          if (url === "/login") {
            req.url = "/login.html";
          } else if (url === "/signup") {
            req.url = "/signup.html";
          } else if (url === "/admin") {
            req.url = "/admin.html";
          } else if (url === "/" || url === "") {
            // index.html - default
          } else {
            // All app routes -> home.html
            req.url = "/home.html";
          }
          next();
        });
      },
    },
  ],
});
