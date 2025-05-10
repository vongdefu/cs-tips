// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style.css";
import GiscusComment from "./components/GiscusComment.vue";
import wechat from "./components/wechat.vue";
import heatmap from "./components/heatmap.vue";

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      "doc-after": () => h(GiscusComment),
      "aside-top": () => h(wechat),
      // "home-features-after": () => h(heatmap),
    });
  },
  enhanceApp({ app, router, siteData }) {
    // ...
  },
} satisfies Theme;
