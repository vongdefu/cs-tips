# 6. gateway 分布式网关

### 1. 背景知识

我们知道，假如一个组织内，有 3 个微服务，并且微服务与微服务之间可以相互调用，那么调用关系就有 8 种，此时我们需要在每一个微服务中配置好另外其他所有的微服务的信息，假设其中某一个服务的信息需要修改呢？再假设每一个服务都需要对其他服务调用接口时进行身份认证和权限校验呢？事实上，人们正是因为在实际的开发过程中遇到了上述的那些问题，所以才开发出了网关组件。

### 2. 网关的必要性

![](./ch06-gateway/image/1699933274421.png)

上面是一个互联网应用典型的部署视图，从上面我们可以看到，一般情况下，我们会把应用部署划分成几个网络区域：

- `互联网`： 所有用户和应用都可以访问的网络区域
- `外联网关`： 是同属于一个企业内所有组织的所有应用的出口。
- `内联网关`： 是同属于一个组织内的所有应用对外的出口。
- `HOST ZONE`： 应用服务区域，也就是我们常说的后端服务所部署的区域。在组织架构中，它属于单个组织架构，在应用中，它属于同一个应用。

需要注意的是，外联网关、內联网关和 HOST ZONE 区域，是层层嵌套的，内联网关包含 HOST ZONE，外联网关又包含内联网关。例如，在一个企业内有成百上千的微服务应用，每个业务团队负责不同的微服务应用，那么内联网关的作用就是用来隔`离每个业务团队的不同微服务之间的网络通信`；而外联网关的作用就是把`企业内的所有业务团队所负责的微服务`与`企业外部的用户或者业务相关的其他企业的应用`进行隔离.

微服务架构中，网关服务是独立存在的，它也称为逻辑网关，与 SLB/Nginx/OpenResty 的物理网关在部署形式上是不同的，网关服务的存在形式是一个独立的微服务，一般是需要进行代码的定制化开发的，而 SLB/Nginx/OpenResty 的物理网关的存在形式可能是 n 台独立的服务器（一般情况下是具有高性能的网络通信能力的服务器），也有可能是具有高性能网关硬件的虚拟服务器。

内联网关除了具备最基本的网络隔离功能外，一般还具备：

1. 身份认证、鉴权：为下游服务发送来的请求提供身份认证及相关鉴权功能。
2. 限流、熔断、降级、流量监控：保护上游提供响应的服务及监控上游各个微服务的健康状况。
3. 协议转换：由于上游各个微服务所使用的通信协议有可能不同，因此网关还承担着协议转换的功能。
4. ......

### 3. 技术选型

物理网关我们暂且不表，后端服务中常见的可以作为网关服务的组件，主要根据所使用的编程语言不同进行区分。常见的有 Go 的 etcd，Java 中的 Zuul、Gateway 等。这里我们不再详细描述技术选型，有兴趣的可以查阅《[你真的会做技术选型吗？](https://mp.weixin.qq.com/s/AUHY3nKZqDbAhkfebOPWCg)》。

### 4. Spring Cloud Gateway

#### 4.1. 版本关系

由于我们已经规定了 SpringCloud 及 SpringCloud-Alibaba 的版本，因此我们直接在 pom 文件中引入 Gateway 的坐标，不需要带版本号，SpringCloud 及 SpringCloud-Alibaba 会自动帮我们选择版本号。

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>

```

#### 4.2. 相关概念

- 路由： 是由 ID、目标 URI、断言集合和过滤器集合构成，表示如果实际请求的路由满足断言集合的条件，就执行过滤器集合规定的相关动作；
- 断言： 就是对应的路由判断条件；
- 过滤器： 满足断言后执行的动作；

需要注意的是：断言和过滤器都是一个集合，由二者组成的路由也是一个集合。

### 5. 框架搭建

> 微信扫码关注“天晴小猪”（ID： it-come-true），回复“springcloud”，获取本章节实战源码。

搭建网关工程很简单，使用 spring initial 工具生成工程代码后，引入 gateway 依赖，再添加配置文件和启动类即可，引入的依赖如下：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>

```

### 6. 实战

下面根据不同的使用场景来分别进行实践操作。

#### 6.1. 请求转发

假如有一个业务场景，要求所有带了 "green" 参数的路由都转发到百度网站。实践过程如下：

- 配置文件中添加路由

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: query_router # 路由规则的名称，可以自定义
          predicates: # 断言
            - Query=green # 参数
          uri: https://baidu.com # 执行跳转的URI
```

- 测试

浏览器中输入： [http://localhost:15000?green](http://localhost:15000?green) ，点击回车后，浏览器会跳转到百度网站，

![](./ch06-gateway/image/1699933274532.png)

#### 6.2. 重写路由

假设有一个业务场景，要求所有 `/test` 下的请求，都转发到 provider 服务的对应请求，如网关的 `/test/hello`就需要转发到`provider`服务的 `/providerbygateway/hello`。由于需要转发给对应的 provider 微服务，因此还需要把网关服务注册到注册中心，同样的 provider 服务也需要注册到注册中心，实践过程如下：

- 网关服务添加 nacos 注册中心的依赖

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>

```

- 配置文件中配置 nacos 注册中心的地址

```yaml
spring:
  application:
    name: gateway-demo
  cloud:
    nacos:
      discovery:
        server-addr: 192.168.1.150:8848
        namespace: deeaeca6-bed9-4fb1-b5b7-9c79278561ca
```

- 启动类上添加注册发现的开关注解

```java
@EnableDiscoveryClient  // 添加服务注册与发现的注解
@SpringBootApplication
public class GatewayDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayDemoApplication.class, args);
    }

}

```

- 在网关的配置文件添加路由规则

```yaml
spring:
  cloud:
    gateway:
      routes:
        # provider
        - id: provider_router
          predicates:
            - Path=/test/**
          filters:
            - RewritePath=/test/(?<segment>.*),/providerbygateway/$\{segment}
          uri: lb://nacos-provider
```

根据官方文档， filters 的配置项中重写路径 RewritePath 的的值有两部分，第一部分 /test/ 后面的 `(?<segment>.*)`   表示任意一段请求路径，第二部分后面的 `$\{segment}` 表示与第一部分一样的一段请求路径。 uri 配置项中的 lb 表示转发到的服务使用负载均衡。

- 在 nacos-provider 中添加转发的目的接口

```java
@RestController
@RequestMapping("providerbygateway")
public class GatewayController {

    @GetMapping("/hello")
    public String hello(){
        return "hello, provider!!!";
    }
}

```

- 启动两个服务，进行测试

![](./ch06-gateway/image/1699933274639.png)

#### 6.3. 其他基础功能

由上面两个实战示例可以看出，网关的开发很简单，只需要在配置文件中配置上路由、断言和过滤器即可，几乎不需要有其他额外的代码。

网关根据断言的不同以及过滤器的不同，通过组合使用来适用不同的应用场景。有兴趣的读者可以阅读[官方文档](https://docs.spring.io/spring-cloud-gateway/docs/2.2.x/reference/html/#gateway-request-predicates-factories)动手实践一下。

#### 6.4. 路由规则可配置化

上述的两种方式都是把路由写到 application.yml 中，即然我们已经学习过 nacos 作为配置中心，何不利用起来呢？我们的目标是：让路由规则可配置化，下面我们进行实践操作。

- 在 gateway-demo 模块的 pom 文件中添加 nacos 的配置依赖

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>

```

- 把 application.yml 文件修改成 bootstrap.yml，并配置 config 项

我们使用 nacos 的共享配置文件的方式进行配置。

```yaml
spring:
  application:
    name: gateway-demo
  cloud:
    nacos:
      config:
        server-addr: 192.168.1.150:8848
        namespace: deeaeca6-bed9-4fb1-b5b7-9c79278561ca
        file-extension: yaml
        shared-configs:
          # 日志
          - dataId: log.yml
            refresh: true
            group: COMMON

          # 路由规则
          - dataId: routerule.yml
            refresh: true
            group: GATEWAY
```

- 在 nacos 的控制台配置上路由规则

![](./ch06-gateway/image/1699933274724.png)

- 重新启动，测试运行结果

成功，无异常。

#### 6.5. 集成 swagger

在微服务框架中，由于会有很多个微服务，每一个微服务都有自己的一组 API，虽然 Spring 团队为我们提供了每一个微服务自己的 API 展示组件——swagger，我们在使用时，只需要找到不同服务的 ip 和端口即可，但是在实际的开发场景中，我们希望网关上游的所有微服务的 API 能够聚合到一起。这样我们就需要记住网关的服务地址即可。

要想把单个微服务的 API 文档聚合到一起，最主要的任务是要解决不同微服务的路由地址的转发不一致问题。我们这里使用[Knife4j](https://doc.xiaominfo.com/docs/action/springcloud-gateway)。

> 微信扫码关注“天晴小猪”（ID： it-come-true），回复“springcloud”，获取本章节实战源码。

- 创建 gateway-swagger 模块

pom.xml 引入 gateway、alibaba-nacos-discovery、knife4j-spring-boot-starter 三个依赖：

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>

<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>

<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-spring-boot-starter</artifactId>
    <version>2.0.4</version>
</dependency>

```

application.yml 中主要配置 nacos 的服务发现地址及网关的路由规则：

```yaml
server:
  port: 10800
spring:
  application:
    name: gateway-swagger
  cloud:
    nacos:
      discovery:
        server-addr: 192.168.1.150:8848
    gateway:
      routes: #配置路由路径
        - id: user-service
          uri: lb://swagger-user
          predicates:
            - Path=/swagger-user/**
          filters:
            - StripPrefix=1
        - id: order-service
          uri: lb://swagger-order
          predicates:
            - Path=/swagger-order/**
          filters:
            - StripPrefix=1
      discovery:
        locator:
          enabled: true #开启从注册中心动态创建路由的功能
          lower-case-service-id: true #使用小写服务名，默认是大写
```

启动类上添加服务注册与发现的注解 `@EnableDiscoveryClient` 。

添加 swagger 信息的资源配置：

```java
@Slf4j
@Component
@Primary
@AllArgsConstructor
public class SwaggerResourceConfig implements SwaggerResourcesProvider {

    private final RouteLocator routeLocator;
    private final GatewayProperties gatewayProperties;

    @Override
    public List<SwaggerResource> get() {
        List<SwaggerResource> resources = new ArrayList<>();
        List<String> routes = new ArrayList<>();
        //获取所有路由的ID
        routeLocator.getRoutes().subscribe(route -> routes.add(route.getId()));
        //过滤出配置文件中定义的路由->过滤出Path Route Predicate->根据路径拼接成api-docs路径->生成SwaggerResource
        gatewayProperties.getRoutes().stream().filter(routeDefinition -> routes.contains(routeDefinition.getId())).forEach(route -> {
            route.getPredicates().stream()
                    .filter(predicateDefinition -> ("Path").equalsIgnoreCase(predicateDefinition.getName()))
                    .forEach(predicateDefinition -> resources.add(swaggerResource(route.getId(),
                            predicateDefinition.getArgs().get(NameUtils.GENERATED_NAME_PREFIX + "0")
                                    .replace("**", "v2/api-docs"))));
        });

        return resources;
    }

    private SwaggerResource swaggerResource(String name, String location) {
        log.info("name:{},location:{}", name, location);
        SwaggerResource swaggerResource = new SwaggerResource();
        swaggerResource.setName(name);
        swaggerResource.setLocation(location);
        swaggerResource.setSwaggerVersion("2.0");
        return swaggerResource;
    }
}

```

最后一步配置服务资源的转发配置：

```java
/**
 * 服务转发的请求处理
 */
@RestController
public class SwaggerHandler {

    @Autowired(required = false)
    private SecurityConfiguration securityConfiguration;

    @Autowired(required = false)
    private UiConfiguration uiConfiguration;

    private final SwaggerResourcesProvider swaggerResources;

    @Autowired
    public SwaggerHandler(SwaggerResourcesProvider swaggerResources) {
        this.swaggerResources = swaggerResources;
    }

    /**
     * Swagger资源配置，微服务中这各个服务的api-docs信息
     */
    @GetMapping("/swagger-resources")
    public Mono<ResponseEntity> swaggerResources() {
        return Mono.just((new ResponseEntity<>(swaggerResources.get(), HttpStatus.OK)));
    }

    /**
     * Swagger安全配置，支持oauth和apiKey设置
     */
    @GetMapping("/swagger-resources/configuration/security")
    public Mono<ResponseEntity<SecurityConfiguration>> securityConfiguration() {
        return Mono.just(new ResponseEntity<>(
                Optional.ofNullable(securityConfiguration).orElse(SecurityConfigurationBuilder.builder().build()), HttpStatus.OK));
    }

    /**
     * Swagger UI配置
     */
    @GetMapping("/swagger-resources/configuration/ui")
    public Mono<ResponseEntity<UiConfiguration>> uiConfiguration() {
        return Mono.just(new ResponseEntity<>(
                Optional.ofNullable(uiConfiguration).orElse(UiConfigurationBuilder.builder().build()), HttpStatus.OK));
    }
}

```

- 创建 swagger-user 模块

pom 文件中引入 knife4j 的依赖：

```yaml
<dependency>
<groupId>com.github.xiaoymin</groupId>
<artifactId>knife4j-micro-spring-boot-starter</artifactId>
<version>2.0.4</version>
</dependency>
```

配置文件中把服务注册到 nacos 上：

```yaml
server:
  port: 10600

spring:
  application:
    name: swagger-user
  cloud:
    nacos:
      discovery:
        server-addr: 192.168.1.150:8848

management:
  endpoints:
    web:
      exposure:
        include: "*"
```

添加 swagger 的配置：

```java
@Configuration
@EnableSwagger2
@EnableKnife4j
public class Swagger2Config {
    @Bean
    public Docket createRestApi(){
        return new Docket(DocumentationType.SWAGGER_2)
                .apiInfo(apiInfo())
                .select()
                .apis(RequestHandlerSelectors.basePackage("com.tianqingxiaozhu.swaggeruser.controller"))
                .paths(PathSelectors.any())
                .build();
    }

    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
                .title("swagger-user")
                .description("用户服务API文档")
                .contact("tianqingxiaozhu")
                .version("1.0")
                .build();
    }
}

```

最后编写几个测试类即可。

- 创建 swagger-order 模块

swagger-order 模块的搭建步骤与 swagger-user 模块的搭建步骤一致。不再赘述。

- 测试

分别启动 swagger-user、swagger-order 和 gateway-swagger 模块，浏览器中输入： [http://localhost:10800/doc.html](http:_localhost:10800_doc) ，然后在服务选择框中选择想要展示的服务接口即可。

![](./ch06-gateway/image/1699933274803.png)

#### 6.6. 其他

由于篇幅原因，网关还有很多在实际生产环境下的应用场景没有实践，这里我们先罗列一下，后续有时间再进行分享。

1. https 的使用： 一般情况下服务都是放到内网里面的，相互之间的调用使用 http 即可完成，但是有些 api 接口需要暴露到外网，而暴露给外网，https 更为安全，此时又想所有的服务通过网关进行暴露，此时就涉及到 https 到 http 的转化。
2. 在实际生产环境下，实际的实践过程是通过把路由规则配置到配置中心来完成每一步骤的调用的。在 springcloud-alibaba 的框架中，我们可以把路由规则配置到 nacos 中，使用样例如上文所示。
3. 网关需要扛住几乎所有应该到达后端微服务的流量，那么如何保证网关上游的微服务的安全呢？此时我们就需要 Sentinel 的帮助了。
4. 灰度发布有很多种实践方案，其中有一种是基于网关的实现方案。
5. 网关+Oauth2.0 进行权限认证
6. 网关的 CROS 方案。

后续有时间会统一进行分享。

### 7. 总结

1. 微服务的发展过程中势必会遇到很多问题，某种意义上讲，网关的出现最早是为了解决不同组织内巨量微服务相互隔离的问题，但在后续的发展过程中，网关又逐渐有了一些新的特性。
2. 实践了网关的基本功能——服务转发、重写路由、路由规则可配置化，以及网关的一些生产实践——集成 swagger 的使用等。
3. 列举了一些生产的应用场景，后续有时间再进行分享。

### SCG 性能优化

1. [SpringCloud 网关组件 Gateway 原理深度解析](https://zhuanlan.zhihu.com/p/614977890)
2. [spring-cloud gateway 网关调优](https://cloud.tencent.com/developer/article/1926643)
3. [SpringCloud Gateway 路由转发性能优化](https://blog.csdn.net/dongjia9/article/details/129624365)
   1. 通过文章中的源码链接，找到其他文章，确认性能测试工具为 JMH 。猜测 测试结果章节中的图应该是在 Excel 中生成的；
   2. 可以下载文章中的这两个仓库进行研究；主要是性能优化及动态路由；
   3. [几种性能测试工具的总结](https://insights.thoughtworks.cn/performance-testing-tools/)
   4. [SpringCloud Gateway 路由数量对性能的影响研究](https://xie.infoq.cn/article/d39fde1ce527ec2c3c6750c4c)
   5. [SpringCloud Gateway 路由转发性能优化](https://xie.infoq.cn/article/bebacc42bad0712638ba3231e)
   6. [SpringCloud Gateway 动态路由](https://xie.infoq.cn/article/0ae4f61ce6c67a651d94678a8)
   7. [https://gitee.com/eblog/scgw-benchmark-all](https://gitee.com/eblog/scgw-benchmark-all)
4. [CPU 性能优化干货总结](https://heapdump.cn/article/4436607)
5. [大厂里一直讲的 p99,p95 到底是什么？](https://juejin.cn/post/7057415444109459487)
   1. 可以研究一下美团的 cat 监控平台
6. [Spring Cloud Gateway 之踩坑日记](https://blog.csdn.net/manzhizhen/article/details/115386684)
7. [Spring Cloud Gateway 压测(wrk、k8s、nginx）](https://blog.csdn.net/lizz861109/article/details/103972775)

- scg 原理
- 编写简单使用样例，之后进行压测
- 进行优化，之后再次进行压测
- scg 路由规则动态可配置化

扩展阅读：

1. [10Wqps 超高并发 API 网关 架构演进之路](https://mp.weixin.qq.com/s/hMhKFszDKFswmGEEOtzDWQ)
2. [建设微服务 API 网关的一些实践](https://mp.weixin.qq.com/s/Xbi5YCEyJUjZXCV8NZg17A)
