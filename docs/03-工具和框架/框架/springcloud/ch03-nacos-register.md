# 3. nacos 服务注册

服务治理包括主要包括`服务的注册与发现`、`服务监控`、`服务管控`等功能，是目前微服务架构中必不可少的基础组件。其中服务注册与发现是服务治理组件的功能特性，而服务的监控、服务的管控等则是服务治理组件的较为高阶的功能特性。本文中，笔者主要介绍服务的`注册与发现功能`。

### 1. 为什么需要服务治理

> 一种技术不会平白无故的产生，它的产生一定是为了解决某个问题。而要想了解具体是解决了什么问题，就必须要从技术迭代的过程中去发现。

微服务架构中，由于有众多的微服务模块，而服务模块与服务模块中大多有相互调用的关系。传统的 SOA 或 ESB 类型的项目中的模块之间的调用关系是通过以下两种方式进行调用：

1. `项目中硬编码`。比如 a 模块需要调用 b 模块，那就在 a 模块中的配置文件中添加一个配置项，配置上 b 模块的服务地址。这种方式有一个问题，那就是当一个 b 模块的地址发生改变时，就需要改变 a 模块中的配置项，还需要重新部署 a 模块。这种方式违背了“开闭原则”，并且如果不同团队分别负责 a、b 模块，修改 b 模块，要引起 a 模块的修改，也会导致不同团队的相互“扯皮”。
2. `使用nginx代理`。b 模块的服务地址由 nginx 进行代理，对外暴露的是一个域名地址。但这种方案势必要求每次 b 模块修改地址，运维人员就要修改 nginx 的配置，也同样会违背广义上的“开闭原则”，也同样会导致开发团队与运维团队的相互“扯皮”。

从上面的两中传统调用方式来看，所谓的服务注册与发现功能，就是`服务提供者通过某种机制把自身信息提供出去，再使用某种机制提供给服务消费者`——这就是服务注册与发现的核心概念。

### 2. 前置知识

要想了解服务治理的相关内容，还需要了解到分布式系统的相关概念，如 `CAP原理` 、 `Paxos算法` 、 `Raft算法` 等，可以参考《`从PAXOS到ZOOKEEPER 分布式一致性原理与实践》`一书。此处不再赘述。

### 3. 注册中心选型

关于如何做技术选型，参见《[你真的会做技术选型吗？](https://mp.weixin.qq.com/s/AUHY3nKZqDbAhkfebOPWCg)》。

在 Java 领域中大概有这么几种服务治理中心：Zookeeper 、 Eureka 、 Consul 、 Nacos 。下面简单介绍一下这几种服务治理的相关组件。

#### 3.1. Zookeeper

Zookeeper（以下简称： ZK）是分布式应用中一个非常重要的组件，主要是实现了 Paxos 算法，也是因为它实现了分布式系统中这一重要的算法，所以它的应用很广，不但可以利用它作为服务的注册中心，也可以用它作为服务的配置中心。此外，它是一个独立的第三方组件，可以像 mysql 一样安装在服务器上，然后业务程序通过不同实现的客户端组件来操作 ZK 的 API，这也使得它能够应用于多种编程语言。

ZK 中的节点的角色：

- `Leader` ：启动时集群环境中会选择某一个节点作为 Leader 节点，并由这个 Leader 节点负责发起投票和决议，还负责维护其余各节点的心跳信息。此外，客户端的写操作信息也由 Leader 节点通过广播的形式向其他节点进行传播
- `Follower` ：集群启动时，Leader 选定之后，剩余的节点为 Follower 节点，这些节点可以响应 Leader 节点的心跳，还可以响应客户端的读请求，同时要把客户端的写请求转发给 Leader。此外，当 Leader 节点发生异常不能对外提供服务时，Follower 节点会参与投票选举，从而产生新的 Leader 节点
- `Observer` ： 不参与投票过程，可以响应读请求，但写请求依然会转发给 Leader；

ZK 中的节点类型：

- `持久节点`：一旦创建之后就一直存在，直到被删除；
- `临时节点`：只能作为叶子节点，生命周期与客户端会话进行绑定，会话结束后消失；
- `持久顺序节点`：除了具有持久节点的特性外，还具有顺序性，如： /node1/app000001 、 /node1/app000002 ；
- `临时顺序节点`：除了具有临时节点的特性外，还具备顺序性；

ZK 中的 Watch 机制：

- 这种机制有点类似于轻量级的发布订阅机制，之所以说是轻量级的，是因为 ZK 一旦感知到存储的数据发生改变，ZK 服务端便会发送包括事件类型和节点信息的给到相关的客户端，当客户端接收到后，主动请求 ZK 来读取变更的数据。

ZK 作为注册中心：

![](./ch03-nacos-register/image/1699933266972.png)

举个例子，假如 a 服务调用 b 服务，b 服务在启动时就会通过客户端软件，把自身信息写到 ZK 中去（如上图中 8080 端口的节点数据），当 a 服务执行调用过程时，就会通过客户端软件，读取到 ZK 中的 b 服务的相关节点信息，然后完成调用过程。

需要注意的是：

1. a、b 服务在调用过程中，都是通过客户端软件与 ZK 进行通信的；服务注册时，服务提供者把自身信息写到 ZK 中；服务发现时，服务消费者从 ZK 中读取信息；
2. ZK 中读取数据的流程就是树形节点的遍历过程，因此服务消费者读取到的服务提供者的数据大概是这样的：`/myOrgGroup/product/providers/192.1681.1.100:8080`， `/myOrgGroup/product/providers/192.1681.1.101:8080`，...
3. 叶子节点作为服务具体信息的存储节点，也是临时节点，由于是临时节点，因此当服务提供者因会话超时或发生异常无法响应时，这个临时节点就会被 ZK 剔除，剔除后 ZK 又通过 Watch 机制通知到相关的服务消费者，这样就做到了服务消费者信息的及时更新；
4. ZK 并不保证可用性，因为在设计之初，就遵循 CP 原则，也就是任意时刻访问 ZK，响应结果都是一致的。但当 ZK 集群中 Leader 发生异常无法对外提供服务，或者，整个 ZK 集群中超过半数以上的服务节点不可用，那么整个集群就无法对外提供服务了。

#### 3.2. Eureka

在 SpringCloud 的 Netflix 的早期版本中，Eureka 主要承担服务注册与发现的功能。目前好像在憋什么大招，更新频率较低。

Eureka 的业务架构中把 Eureka 的客户端和服务端分成三种角色信息，主要包括 Server 、 Provider 、 Consumer 三个角色。

1. Server ： 主要提供服务的注册与发现功能，也就是 Eureka 的服务端；
2. Provider ： Eureka 的客户端，主要负责服务的注册功能，把自身的服务信息注册到 Eureka 的服务端；
3. Consumer ： Eureka 的客户端，从 Eureka 的服务端获取服务提供者的服务信息；

![](./ch03-nacos-register/image/1699933267180.png)

Server 服务端通过设计多个实例彼此相互注册，形成一个去中心的架构，由于注册方式是通过 p2p 的通信协议进行的，因此节点与节点之间的身份相同，没有主从之分；节点与节点之间通过心跳契约的方式检查集群节点的健康状况，默认情况下，集群在一定时间内没有收到某一个节点的心跳信息，就会自动注销该节点；当新的节点启动时，会先从集群中获取所有的其他节点信息，然后再把应用服务节点的注册信息同步过来，之后对外提供服务；在应用服务进行注册时， Provider 应用和 Consumer 应用会把注册信息写入 Eureka 集群中某一节点，之后 Eureka 会把信息同步复制到其他所有节点，达到所有节点中数据的同步一致；应用服务进行消费时， Consumer 应用会从集群中任一节点中读取到 Consumer 应用的注册信息，然后进行远程调用。

由于在 Eureka 设计之初，就遵循 AP 原则，也就是保证高可用。这样设计的结果就是 Eureka 集群中，只要有一个节点存活，就可以对外提供服务。这种方式得益于 Eureka 的自我保护机制。如果 15 分钟内，85%的集群节点都没有正常的心跳，此时可以认为客户端与 Eureka 出现了网络故障，Eureka 集群就会进入自我保护机制；之后 Eureka 不再剔除因为长时间没有收到心跳的服务，但是仍然可以接受新服务的注册与发现，但是不会再同步给其他 Eureka 节点，当网络稳定后，在把应用服务的注册信息同步复制给其他节点。

#### 3.3. Consul

Consul 是一种基于服务网格的分布式服务治理方案，提供服务注册与发现、分布式配置、健康检查和负载均衡的功能。此外，它还支持多个数据中心的高可用方案。

Consul 的所有节点都称为 Agent 节点，这些节点根据功能分为 Client 和 Server 两类。其中 Server 节点负责保存数据和响应 Client 的请求，分为 Leader 节点和 Follower 节点，当 Consul 集群启动时，所有节点启动成功后，会通过 Gossip 协议进行通信，同时也会选举产生一个 Leader 节点；当有应用服务注册到集群时，当 Leader 节点收到注册信息之后会把数据同步给其他 Follower 节点，当 Follower 节点收到注册信息时，会通过 RPC 转发给集群中 Leader 节点，再有 Leader 节同步给其他 Follower 节点；当 Leader 节点发生异常无法对外提供服务时，Follower 节点会重新选举产生一个 Leader 节点。

#### 3.4. Nacos

Nacos 是阿里巴巴开源的一个分布式组件，也是本篇文章的主要内容。它具有很多的优良特性：

- 服务注册与发现与服务的健康检测： 支持基于 DNS 和基于 RPC 的服务发现，同时能够对服务提供实时的健康监测，阻止向不健康的服务实例发送请求；
- 动态配置管理： 能够以中心化、外部化和动态化的方式管理所有环境的应用配置和服务配置；
- 动态 DNS 服务： 支持权重路由，更便捷的实现中间层的负载均衡、更灵活的路由配置策略、流量控制以及数据中心内网的简单 DNS 解析；
- 服务的元数据管理： 支持管理所有服务及其元数据，包括服务描述、生命周期、静态依赖分析、健康监测、流量控制、路由策略、metrics 统计数据等；

此外，Nacos 还配备有易用的控制台页面、权限控制系统及 AP/CP 的切换。Nacos 还具有良好的生态系统：

![](./ch03-nacos-register/image/1699933267257.png)

### 4. 实战演练

> 微信扫码关注“天晴小猪”（ID： it-come-true），回复“springcloud”，获取本章节实战源码。

创建两个服务，一个是服务提供者（provider），一个是服务消费者（consumer），让两个服务都注册到 nacos 服务器上，然后让服务消费者调用服务提供者的接口。

第一步，我们要先搭建 nacos 的服务；第二步，我们创建两个服务，并配置好注册的 nacso 的服务地址；第三步，在服务提供者服务中提供一个接口供服务消费者进行调用，之后再在服务消费者服务中提供一个接口来调用服务提供者提供的接口。下面我们开始进行实战。

#### 4.1. 安装 nacos 服务

> nacos 服务依赖 jdk 开发环境，请先行安装 jdk 的环境。

CentOS7.9 安装过程如下：

```shell
// 下载
# wget https://github.com/alibaba/nacos/releases/download/1.2.1/nacos-server-1.2.1.tar.gz

// 解压到安装目录
# tar zxvf nacos-server-1.2.1.tar.gz -C /usr/setup/
// 进入bin目录，启动
# ./startup.sh -m standalone

// 开放端口
# firewall-cmd --zone=public --add-port=8848/tcp --permanent
# firewall-cmd --reload


// <---- start 配置开机自启动
// 在 /usr/lib/systemd/system 目录下创建 nacos.service ，并添加以下内容

[Unit]
Description=nacos
After=network.target

[Service]
Type=forking
ExecStart=/usr/setup/nacos/bin/startup.sh -m standalone
ExecReload=/usr/setup/nacos/bin/shutdown.sh
ExecStop=/usr/setup/nacos/bin/shutdown.sh
PrivateTmp=true

[Install]
WantedBy=multi-user.target

// 开启自启动服务
# systemctl enable nacos.service

// 重新加载自启动服务
# systemctl daemon-reload
// 配置开机自启动 end ---->

```

浏览器打开： [http://192.168.1.150:8848/nacos](http://192.168.1.150:8848/nacos) 出现管理台页面，输入用户名密码： nacos/nacos ，登录成功。

#### 4.2. 创建 provider 模块

使用 springinital 工具进行创建项目模块。

1. 修改 pom

```xml
<!-- 修改SpringBoot的版本 -->
<parent>
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-parent</artifactId>
   <version>2.2.5.RELEASE</version>
   <relativePath/> <!-- lookup parent from repository -->
</parent>

<!-- 添加dependencyManagement版本管理 -->
<dependencyManagement>
   <dependencies>
      <!--springcloud-->
      <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
      </dependency>

      <!--springcloud alibaba-->
      <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>${spring-cloud-alibaba-version}</version>
            <type>pom</type>
            <scope>import</scope>
      </dependency>
   </dependencies>
</dependencyManagement>

<!-- 添加web依赖 -->
<dependency>
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- 添加nacos依赖 -->
<dependency>
   <groupId>com.alibaba.cloud</groupId>
   <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>

```

2. 创建配置文件 application.yml

```yaml
# 端口号
server:
  port: 10000

spring:
  application:
    # 注册到nacos上的服务名称，也是服务发现的名称，必写
    name: nacos-provider
  cloud:
    nacos:
      discovery:
        # nacos的注册地址
        server-addr: 192.168.1.150:8848

management:
  endpoints:
    web:
      exposure:
        # yml文件中存在特殊字符，必须用单引号包含，否则启动报错
        include: "*"
```

3. 开启服务注册与发现

![](./ch03-nacos-register/image/1699933267360.png)

4. 编写测试类

![](./ch03-nacos-register/image/1699933267437.png)

浏览器中输入： `http://localhost:10000/provider/hello` ，访问成功。

#### 4.3. 创建 consumer 模块

1. 修改 pom

```xml
<!-- 修改SpringBoot的版本 -->
<parent>
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-parent</artifactId>
   <version>2.2.5.RELEASE</version>
   <relativePath/> <!-- lookup parent from repository -->
</parent>

<!-- 添加dependencyManagement版本管理 -->
<dependencyManagement>
   <dependencies>
      <!--springcloud-->
      <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
      </dependency>

      <!--springcloud alibaba-->
      <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>${spring-cloud-alibaba-version}</version>
            <type>pom</type>
            <scope>import</scope>
      </dependency>
   </dependencies>
</dependencyManagement>

<!-- 添加web依赖 -->
<dependency>
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- 添加nacos依赖 -->
<dependency>
   <groupId>com.alibaba.cloud</groupId>
   <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>

```

2. 创建配置文件

```yaml
# 端口号
server:
  port: 10000

spring:
  application:
    # 注册到nacos上的服务名称，也是服务发现的名称，必写
    name: nacos-provider
  cloud:
    nacos:
      discovery:
        # nacos的注册地址
        server-addr: 192.168.1.150:8848

management:
  endpoints:
    web:
      exposure:
        # yml文件中存在特殊字符，必须用单引号包含，否则启动报错
        include: "*"
```

3. 开启服务注册与发现

![](./ch03-nacos-register/image/1699933267517.png)

4. 编写测试类

![](./ch03-nacos-register/image/1699933267595.png)

浏览器中输入： `http://localhost:11000/consumer/hello` ，访问成功。

#### 4.4. 实现远程调用

我们这里采用两种不同的客户端来完成远程调用。

1. 使用 RestTemplate 访问 provider 接口

- 添加配置项

![](./ch03-nacos-register/image/1699933267677.png)

- 添加配置文件

![](./ch03-nacos-register/image/1699933267759.png)

- 添加调用过程

![](./ch03-nacos-register/image/1699933267833.png)

浏览器中输入： `http://localhost:11000/consumer/hello1` ，访问成功。

2. 使用 OpenFeign 访问 provider 接口

- 修改 pom

```xml
<!-- pom中添加openfeign依赖 -->
<dependency>
   <groupId>org.springframework.cloud</groupId>
   <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>

```

- 开启 openfeign 客户端

![](./ch03-nacos-register/image/1699933267924.png)

- 编写 service

![](./ch03-nacos-register/image/1699933268008.png)

- 执行调用过程

![](./ch03-nacos-register/image/1699933268105.png)

浏览器中输入： `http://localhost:11000/consumer/hello2` ，访问成功。

### 5. Nacos 开发实践

当项目在实际开发过程中会有很多的环境，如 dev、sit、uat、prd 等环境。在不同的环境中，可以通过配置多套 nacos 服务，并在不同的配置文件中配置上相应的 nacos 服务地址，实现环境隔离。

但是在同一套环境下进行代码联调时，就会出现问题。比如在开发过程中，A 和 C 两位开发需要联调，A 成员启动了 provider 项目并注册到 dev 环境的 nacos 中，B 成员也启动了 provider 项目并注册到 dev 环境的 nacos 中，那么如果 C 成员启动了 consumer 项目注册到 dev 环境的 nacos 中调用 provider 时，就会出现 C 成员的请求，可能会转发到 B 成员的 provider 项目中。

可以使用 nacos 中的命名空间和命名分组的方式进行界定。

1. 在 nacos 中创建 dev 的命名空间

![](./ch03-nacos-register/image/1699933268185.png)

2. 在 A 代码中添加命名空间和命名分组的配置

![](./ch03-nacos-register/image/1699933268274.png)

3. 在 B 代码中也添加命名空间和命名分组的配置

![](./ch03-nacos-register/image/1699933268353.png)

4. 验证

浏览器中分别输入： `http://localhost:11000/consumer/hello1` 、 `http://localhost:11000/consumer/hello2` ，均访问成功。

### 6. 特别说明

读者在实践过程中要特别组件之间版本的选择，最好跟笔者的版本保持一致，不然会出现意想不到的问题，读者可以像笔者一样自定义一个 starter 统一管理组件的版本。

### 7. 总结

1. 介绍了分布式服务治理技术的产生背景及相关内容；
2. 介绍了分布式服务治理的相关技术选型；
3. Nacos 的服务注册与发现的两种 RPC 调用过程及开发过程中的最佳实践；
