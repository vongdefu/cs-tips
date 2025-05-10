## ~~自动生成目录~~

原来的侧边栏配置：

```

    // sidebar: {
    //   "/examples": {
    //     base: "/examples",
    //     items: [
    //       { text: "Markdown Examples", link: "/markdown-examples" },
    //       { text: "Runtime API Examples", link: "/api-examples" },
    //     ],
    //   },
    //   "/面渣/": {
    //     base: "/面渣",
    //     items: [
    //       { text: "MySQL", link: "/mysql" },
    //       { text: "Netty", link: "/netty" },
    //       { text: "计算机网络", link: "/network" },
    //     ],
    //   },
    //   "/分布式/": [
    //     {
    //       base: "/分布式",
    //       text: "分布式",
    //       collapsed: true,
    //       items: [
    //         { text: "分布式锁", link: "/分布式锁" },
    //         { text: "分布式事务", link: "/分布式事务" },
    //         { text: "分布式id", link: "/分布式id" },
    //       ],
    //     },
    //   ],
    // },
```

1. 参考[这里](https://juejin.cn/post/7214805603449339963)

## 修改一些样式

## 广告联盟

https://www.carbonads.net/join
申请后，gmail 中说不符合要求，该广告商主要针对英语用户和程序员领域；

> Your site generates a minimum of 10,000 page-views per month.

参考[这里](https://blog.forte.love/2024/04/29/vitepress%E5%B9%BF%E5%91%8A)配置 Google AdSense。

依然失败。原因是：AdSense 不会验证 https://yourusername.github.io/blog/ 这样的子路径，也不会验证你不拥有的域名（如 github.io）。

后续，如果买了个人域名之后再说。

## 工作流

1. 直接使用 action 部署到 gh-pages 分支上即可；
2. 私有仓库中添加一个工作流用来把私有仓库中的文档同步到本仓库特定文件夹即可；

## 制作 logo

## 修改布局

> https://vitepress.dev/guide/extending-default-theme#layout-slots

1. 在 theme/components 下添加 xx.vue ;
2. 在 theme/index.ts 中：
   1. 添加引入： import GiscusComment from "./components/GiscusComment.vue";
   2. 添加配置： "doc-after": () => h(GiscusComment),

扩展阅读 [本篇文章](https://blog.charles7c.top/admin/backend/extra/dynamic-datasource.html) 的布局。

### 添加评论

参考[这里](https://site.quteam.com/technology/front-end/vitepress-comment/)。

```vue
<Giscus
  id="comments"
  repo="vongdefu/cs-tips"
  repoid="R_kgDOOnFHUQ"
  category="Announcements"
  categoryid="DIC_kwDOOnFHUc4Cp8qg"
  mapping="pathname"
  term="Welcome to giscus!"
  reactionsenabled="1"
  emitmetadata="0"
  inputposition="top"
  loading="lazy"
  :theme="isDark ? 'dark' : 'light'"
  :key="route.path"
></Giscus>
```

### 在目录上方添加公众号头像等引流图片

TODO；

## 隐藏文档用于导流到微信公众号

TODO；

## 添加热力图

https://yqqy.top/blog/2024/vitepress-blog-2

做到 数据来源 部分了，思考一下是否可以把 数据来源直接替换掉文件。

https://vitepress.dev/zh/guide/data-loading

## 有没有其它炫酷的组件？

## 比较好看的博客

https://ti.bi/
