import { defineConfig } from "vitepress";
import { nav } from "./nav";
import { sidebar } from "./sidebar";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/cs-tips/",
  title: "cs-tips",
  description: "cs 面试 提示",
  lang: "zh-Hans",
  markdown: {
    lineNumbers: true,
    codeCopyButtonTitle: "复制代码",
  },
  themeConfig: {
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
      text: "最后更新于",
      formatOptions: {
        dateStyle: "full",
        timeStyle: "medium",
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
