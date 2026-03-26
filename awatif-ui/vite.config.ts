import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 4600,
    //open: "tables/index.html",
    open: "viewer/index.html",
  },
  root: "./src",
});
