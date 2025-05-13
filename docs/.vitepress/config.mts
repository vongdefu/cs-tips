import { defineConfig } from "vitepress";
import { nav } from "./nav.ts";
import { sidebar } from "./sidebar.ts";
import { fileURLToPath, URL } from "node:url";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/cs-tips/",
  title: "cs-tips",
  description: "cs 面试 提示",
  lang: "zh-Hans",
  markdown: {
    lineNumbers: true,
    codeCopyButtonTitle: "复制",
  },
  // 重写内部组件： https://vitepress.dev/zh/guide/extending-default-theme#overriding-internal-components
  vite: {
    resolve: {
      alias: [
        {
          find: /^.*\/VPDocOutlineItem\.vue$/,
          replacement: fileURLToPath(
            new URL("./theme/components/VPDocOutlineItem.vue", import.meta.url)
          ),
        },
      ],
    },
  },

  // https://vitepress.dev/zh/reference/site-config#head
  head: [
    // https://search.google.com/search-console?resource_id=https%3A%2F%2Fvongdefu.github.io%2Fcs-tips%2F
    [
      "meta",
      {
        name: "google-site-verification",
        content: "L_J6NdO2Lr3dLMkAm5eh-8_7lmggcG1zAzl11qXwFaE", // 你从 Google 获取的值
      },
    ],

    // Google adsense
    // https://www.google.com/adsense/new/u/0/pub-9669365665800712/onboarding
    // AdSense 不会验证 https://yourusername.github.io/blog/ 这样的子路径，也不会验证你不拥有的域名（如 github.io）。
    // [
    //   "script",
    //   {
    //     async: "async",
    //     // 记得替换成你的真正的 src
    //     src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9669365665800712",
    //     crossorigin: "anonymous",
    //   },
    // ],
    // ...
  ],
  themeConfig: {
    // https://vitepress.dev/zh/reference/default-theme-config#outline
    outline: {
      level: [2, 4],
      label: "目录",
    },
    // https://vitepress.dev/reference/default-theme-config
    nav,
    sidebar,

    socialLinks: [
      { icon: "github", link: "https://github.com/vongdefu/cs-tips" },
    ],

    footer: {
      message: "make it come true",
      copyright: "Copyright © 2019-present vongdefu",
    },

    lastUpdated: {
      text: "更新于",
      formatOptions: {
        dateStyle: "short",
        timeStyle: "short",
      },
    },

    // carbonAds: {
    //   code: "your-carbon-code",
    //   placement: "your-carbon-placement",
    // },

    docFooter: {
      prev: "上一页",
      next: "下一页",
    },
    returnToTopLabel: "回到顶部",
    sidebarMenuLabel: "菜单",
    darkModeSwitchLabel: "主题",
    lightModeSwitchTitle: "切换到浅色模式",
    darkModeSwitchTitle: "切换到深色模式",
    skipToContentLabel: "跳转到内容",
    search: {
      provider: "local",
    },
  },
});
