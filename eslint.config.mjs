import antfu from "@antfu/eslint-config";

export default antfu({
  vue: {
    overrides: {
      "vue/html-self-closing": ["error", {
        html: {
          void: "never",
          normal: "never",
          component: "always",
        },
      }],
    },
  },
  unocss: true,
  formatters: true,
  stylistic: {
    semi: true,
    quotes: "double",
  },
});
