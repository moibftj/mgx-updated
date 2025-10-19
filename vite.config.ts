import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    base: "/", // Ensure relative paths for assets
    server: {
      port: 5174,
      strictPort: true,
      host: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    define: {
      // Ensure environment variables are available at build time
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        process.env.VITE_SUPABASE_URL,
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        process.env.VITE_SUPABASE_ANON_KEY,
      ),
      "import.meta.env.VITE_API_URL": JSON.stringify(process.env.VITE_API_URL),
    },
    build: {
      target: "es2015",
      minify: "terser",
      sourcemap: true, // Enable source maps for debugging
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            supabase: ["@supabase/supabase-js"],
          },
          // Add hash to filenames for better cache busting
          entryFileNames: "assets/[name].[hash].js",
          chunkFileNames: "assets/[name].[hash].js",
          assetFileNames: "assets/[name].[hash].[ext]",
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});
