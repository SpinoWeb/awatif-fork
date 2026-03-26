import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  server: {
    port: 4600,
    open: "vivienda-crucita/index.html",
  },
  base: "./", // to resolve assets
  root: "./src",
  build: {
    outDir: "../../website/src/examples",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        "3d-structure": "src/3d-structure/index.html",
        "advanced-truss": "src/advanced-truss/index.html",
        beams: "src/beams/index.html",
        curves: "src/curves/index.html",
        "1d-mesh": "src/1d-mesh/index.html",
        truss: "src/truss/index.html",
        tables: "src/tables/index.html",
        "2d-mesh": "src/2d-mesh/index.html",
        drawing: "src/drawing/index.html",
        report: "src/report/index.html",
        plate: "src/plate/index.html",
        building: "src/building/index.html",
        "slab-designer": "src/slab-designer/index.html",
        "color-map": "src/color-map/index.html",
        "modal-analysis": "src/modal-analysis/index.html",
        "quad4-test": "src/quad4-test/index.html",
        "frames-shells": "src/frames-shells/index.html",
        "nave-industrial": "src/nave-industrial/index.html",
        zapata: "src/zapata/index.html",
        "vivienda-crucita": "src/vivienda-crucita/index.html",
      },
    },
  },
  plugins: [topLevelAwait()], // used by awatif-fem & awatif-mesh to load wasm at top level
});
