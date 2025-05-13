import { DefaultTheme } from "vitepress";

export const nav: DefaultTheme.Config["nav"] = [
  { text: "Home", link: "/" },
  { text: "面试", link: "/00-面试/os" },
  { text: "CS基础", link: "/01-CS基础/前端" },
  { text: "java", link: "/02-java/java基础/基础概念" },
  {
    text: "工具和框架",
    items: [
      { text: "工具", link: "/03-工具和框架/工具/git" },
      { text: "框架", link: "/03-工具和框架/框架/mybatis" },
    ],
  },
  { text: "中间件", link: "/04-中间件/redis/README" },
  { text: "分布式", link: "/05-分布式/README" },
  { text: "软件质量管理", link: "/06-软件质量管理/README" },
  { text: "工程设计", link: "/07-工程设计/README" },
];
