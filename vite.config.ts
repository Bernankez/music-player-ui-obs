import path from "node:path";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { defineConfig } from "vite";
import VueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    AutoImport({
      dirs: [
        {
          glob: "./composables/**",
          types: true,
        },
        {
          glob: "./lib/**",
          types: true,
        },
        {
          glob: "./utils/**",
          types: true,
        },
      ],
      // targets to transform
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
      ],
      imports: [
        "vue",
        "vue-router",
        "@vueuse/core",
        "pinia",
      ],
      vueTemplate: true,
    }),
    Components({
      dirs: ["src/components"],
      extensions: ["vue"],
      directoryAsNamespace: false,
      types: [{
        from: "vue-router",
        names: ["RouterLink", "RouterView"],
      }],
    }),
    VueDevTools(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "~": path.resolve(__dirname, "."),
    },
  },
});
