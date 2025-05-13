---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "cs 面试 提示"
  tagline: make it come true
  actions:
    - theme: brand
      text: 面试提示-开始
      link: /00-面试/os
    - theme: alt
      text: 体系化知识
      link: /01-CS基础/前端

features:
  - title: 面试总结
    details: 面试知识点总结，Java程序员面试宝典，面试要点提示卡片
  - title: 项目实战
    details: SpringCloud-alibaba项目实战、常见业务场景解决方案、分布式架构、多种组件、大型互联网应用实战……
  - title: 体系化
    details: 知识库成体系化、简介、一库在手，天下我有、
---

## TODO

### 2025-05-13 使用密码访问

> 还需要完善

1. 私有仓库推送 markdown 文件时，会先把 markdown 文件拉到 GitHub 的服务器上，之后进行构建，然后再发布到公有仓库中去；
2. 修改构建过程，遇到要进行加密的 markdown 文件时，【最好是配置在 markdown 文件中的 fontmatter 中】，就对文档内容进行加密构建；构建完成之后，要删除原 markdown 文件；
3. 要考虑几个问题：
   1. 要求解密之后的内容跟之前没有加密的内容保持一致，有些方案会包裹一个 div 标签，这就导致不一致了；这里说的一致，包括样式和内容，即 html 完全相同；
   2. 文档的目录结构不要变更，就是说不管加密还是不加密，都要能够看到整个文档的目录；
   3. 输入密码之后，其它加密后的文档也可以自动解密，过一段时间后，还要重新输入密码；

实现：

1. 使用 chatgpt 已经基本完成开发阶段的功能，已经可以输入密码之后显示加密内容了；
2. 思路是：

   1. yarn add crypto-js gray-matter markdown-it ；
   2. 创建一个组件 encrypt-md.js ，这个组件能够读取所有的 markdown 文件，然后判断 fontmatter 中是否存在 encrypted: true 的配置，如果存在，就对该 markdown 文件执行下面操作：
      1. 只展示前 50 行；
      2. 对剩下的 markdown 文件进行加密，形成加密的密文，然后放到一个<EncryptedContent /> 组件中；

3. 实现过程是：

   1. node encrypt-md.js 执行这个组件；
   2. 在 index.ts 文件中注册 EncryptedContent 组件；
   3. 之后就正常启动即可；

### 2025-05-11

- 已基本完成 cs-tips 文件夹的迁移，在 defu 文件夹内还有部分文档等待删除；
- 在 cs-tips 项目中，
  - 修复 markdown 渲染错误的问题；
  - 对文档进行精简，**只记录重要的内容**；不使用过于复杂的 markdown 语法；
  - 非必要不添加图片，之后要把图片删除；
- 修改 GitHub 工作流；
- 把每一个主题都整理成单独的 markdown 文件；要求尽量精简；
- 把 nav 和 sidebar 迁移到 cs-tips 项目中，目的： 为了不变更；
