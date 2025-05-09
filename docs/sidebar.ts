import { DefaultTheme } from "vitepress";

export const sidebar: DefaultTheme.Config["sidebar"] = {
  "/01-CS基础/": {
    base: "/01-CS基础",
    items: [
      { text: "前端", link: "/前端" },
      { text: "数据结构与算法", link: "/数据结构与算法" },
      {
        text: "计算机网络",
        base: "/01-CS基础/计算机网络",
        link: "/01-CS基础/计算机网络/README",
        collapsed: true,
        items: [
          { text: "应用层", link: "/应用层" },
          { text: "传输层", link: "/传输层" },
          { text: "网络层", link: "/网络层" },
          { text: "网络接口层", link: "/网络接口层" },
          { text: "实验", link: "/实验" },
          { text: "面试题", link: "/面试题" },
        ],
      },
      {
        text: "设计模式",
        base: "/01-CS基础/设计模式",
        collapsed: true,
        items: [
          { text: "设计原则", link: "/设计原则" },
          { text: "单例", link: "/单例" },
          { text: "建造者", link: "/建造者模式" },
          { text: "策略模式", link: "/策略模式" },
          { text: "模板方法", link: "/模板方法" },
          { text: "责任链模式", link: "/责任链模式" },
        ],
      },
    ],
  },

  "/02-java/": [
    {
      base: "/02-java",
      text: "java",
      collapsed: true,
      items: [
        { text: "IO", link: "/io" },
        { text: "集合", link: "/集合" },
        { text: "注解", link: "/注解" },
        { text: "Java8新特性", link: "/java8新特性" },
        {
          text: "java并发编程",
          base: "/02-java/并发编程",
          collapsed: true,
          items: [
            { text: "基础知识", link: "/基础知识" },
            { text: "线程池", link: "/线程池" },
            { text: "锁", link: "/锁" },
          ],
        },
      ],
    },
  ],

  "/03-框架/": {
    base: "/03-框架",
    items: [
      { text: "Spring", link: "/Spring" },
      { text: "Mybatis", link: "/Mybatis" },
    ],
  },

  "/04-中间件/": {
    base: "/04-中间件",
    items: [
      { text: "MySQL", link: "/MySQL" },
      { text: "Redis", link: "/Redis" },
      { text: "MQ", link: "/MQ" },
      { text: "ES", link: "/ES" },
      { text: "Nginx", link: "/Nginx" },
    ],
  },

  "/05-分布式/": {
    base: "/05-分布式",
    items: [
      { text: "接口风格", link: "/mysql" },
      { text: "分布式理论", link: "/分布式理论" },
      { text: "分布式ID", link: "/分布式ID" },
      { text: "分布式事务", link: "/分布式ID" },
      { text: "分布式锁", link: "/分布式ID" },
      { text: "分布式存储", link: "/分布式ID" },
      { text: "分布式会话", link: "/分布式ID" },
      { text: "分布式任务", link: "/分布式ID" },
    ],
  },

  "/06-软件质量管理/": {
    base: "/06-软件质量管理",
    items: [
      { text: "代码协作", link: "/mysql" },
      { text: "领域模型设计", link: "/netty" },
      { text: "敏捷开发模式", link: "/network" },
      { text: "服务器性能指标与基准测试", link: "/network" },
    ],
  },
  "/07-工程设计/": [
    {
      base: "/07-工程设计",
      text: "分布式",
      collapsed: true,
      items: [],
    },
  ],
};
