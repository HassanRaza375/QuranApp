// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

// Node 20 (this machine: 20.19) has no Object.groupBy, which the current ESLint config utilities use.
// Node 22 LTS does not need this; remove it after upgrading Node.
if (typeof Object.groupBy !== "function") {
  Object.groupBy = (items, fn) => {
    const out = Object.create(null);
    let i = 0;
    for (const item of items) (out[fn(item, i++)] ??= []).push(item);
    return out;
  };
}

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
