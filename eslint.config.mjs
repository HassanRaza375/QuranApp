// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  { ignores: ["components/ui/**", "app/components/ui/**", ".output/**", "playwright-report/**", "test-results/**"] },
  {
    rules: {
      // Prettier-style formatting is not enforced; correctness rules are.
      "vue/html-self-closing": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/max-attributes-per-line": "off",
      "vue/multi-word-component-names": "off",
    },
  },
);
