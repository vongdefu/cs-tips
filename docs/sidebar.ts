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
        link: "/README",
        collapsed: false,
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
        collapsed: false,
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
      text: "java基础",
      base: "/02-java/java基础",
      collapsed: false,
      items: [
        { text: "基础概念", link: "/基础概念" },
        { text: "集合", link: "/集合" },
        { text: "注解", link: "/注解" },
        { text: "泛型", link: "/泛型" },
        { text: "异常", link: "/异常" },
        { text: "IO", link: "/io" },
        { text: "Java8新特性", link: "/java8新特性" },
      ],
    },
    {
      text: "java并发编程",
      base: "/02-java/java并发编程",
      collapsed: false,
      items: [
        { text: "背景知识", link: "/背景知识" },
        {
          text: "关键字与线程本地缓存",
          base: "/02-java/java并发编程/关键字与线程本地缓存",
          items: [
            { text: "final", link: "/final" },
            { text: "synchronized", link: "/synchronized" },
            { text: "volatile", link: "/volatile" },
            { text: "ThreadLocal", link: "/ThreadLocal" },
          ],
        },
        {
          text: "线程与线程池",
          base: "/02-java/java并发编程/线程与线程池",
          link: "/README",
          items: [
            { text: "线程", link: "/线程" },
            { text: "线程池", link: "/线程池" },
          ],
        },
        { text: "锁", link: "/锁" },
        { text: "unsafe工具类", link: "/unsafe工具类" },
        { text: "locksupport", link: "/locksupport" },
        { text: "aqs", link: "/aqs" },
        { text: "Java8新特性", link: "/Java8新特性" },
        { text: "JUC2", link: "/JUC2" },
      ],
    },
    {
      text: "java虚拟机",
      base: "/02-java/java虚拟机",
      link: "/README",
      collapsed: false,
      items: [
        { text: "1. 概述", link: "/ch01-overview" },
        {
          text: "2. 前端编译阶段及字节码文件",
          link: "/ch02-compileandbytecode",
        },
        { text: "3. 类加载", link: "/ch03-classload" },
        { text: "4. 线程模型", link: "/ch04-threadmode" },
        { text: "5. 运行时内存结构", link: "/ch05-runtime" },
        { text: "6. 执行引擎", link: "/ch06-engine" },
        { text: "7. 垃圾回收理论", link: "/ch07-garbagecollection" },
        { text: "8. Hotspot 虚拟机 & 配置 Hotspot", link: "/ch08-hotspot" },
        { text: "9. 工具包", link: "/ch09-tools" },
        { text: "10. 调优", link: "/ch10-promote" },
        // { text: "11. 出错", link: "/锁" },
        // { text: "12. 停顿", link: "/锁" },
        // { text: "13. 参考", link: "/锁" },
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
      collapsed: false,
      items: [],
    },
  ],
};
