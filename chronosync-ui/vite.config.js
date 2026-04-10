import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "21st.dev/r/magicui/number-ticker": path.resolve(__dirname, "src/vendor/21st/magicui/number-ticker.jsx"),
      "21st.dev/r/animate-ui/circular-progress": path.resolve(
        __dirname,
        "src/vendor/21st/animate-ui/circular-progress.jsx",
      ),
    },
  },
})
