# 使用 Thread 配置多数据源

使用 **`ThreadLocal` + 注解** 实现多数据源切换，是一种非常常见的做法，通常会结合 **Spring AOP（切面）** 来动态设置当前线程使用哪个数据源。

下面是一个**完整、可运行、详细**的 Spring Boot 实现案例：

---

## 🎯 实现目标

- 使用 `@DataSource("xxx")` 注解在方法或类上标记使用的数据源。
- 利用 `ThreadLocal` 保存当前线程的数据源标识。
- 配合 Spring AOP 拦截注解并切换数据源。

---

## 🔧 1. 添加依赖（pom.xml）

```xml
<dependencies>
    <!-- Spring Boot JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- H2数据库（测试用） -->
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
    </dependency>

    <!-- AOP -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-aop</artifactId>
    </dependency>
</dependencies>
```

---

## 🧾 2. 配置数据源（application.yml）

```yaml
spring:
  datasource:
    dynamic:
      primary: master
      datasource:
        master:
          url: jdbc:h2:mem:masterdb
          driver-class-name: org.h2.Driver
          username: sa
        slave:
          url: jdbc:h2:mem:slavedb
          driver-class-name: org.h2.Driver
          username: sa
  jpa:
    show-sql: true
    hibernate:
      ddl-auto: update
```

---

## ⚙️ 3. 多数据源配置（DynamicDataSource）

### 3.1 `DataSourceContextHolder.java`

```java
public class DataSourceContextHolder {
    private static final ThreadLocal<String> CONTEXT = new ThreadLocal<>();

    public static void set(String ds) {
        CONTEXT.set(ds);
    }

    public static String get() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
```

---

### 3.2 `DynamicDataSource.java`

```java
public class DynamicDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        return DataSourceContextHolder.get();
    }
}
```

---

### 3.3 配置 Bean：`DataSourceConfig.java`

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @ConfigurationProperties("spring.datasource.dynamic.datasource.master")
    public DataSource masterDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @ConfigurationProperties("spring.datasource.dynamic.datasource.slave")
    public DataSource slaveDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Primary
    @Bean
    public DataSource dataSource(
            @Qualifier("masterDataSource") DataSource master,
            @Qualifier("slaveDataSource") DataSource slave) {

        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put("master", master);
        targetDataSources.put("slave", slave);

        DynamicDataSource dataSource = new DynamicDataSource();
        dataSource.setDefaultTargetDataSource(master);
        dataSource.setTargetDataSources(targetDataSources);
        return dataSource;
    }
}
```

---

## 🏷️ 4. 自定义注解

```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DataSource {
    String value() default "master";
}
```

---

## 🌀 5. AOP 切面

```java
@Aspect
@Component
public class DataSourceAspect {

    @Pointcut("@annotation(com.example.annotation.DataSource) || @within(com.example.annotation.DataSource)")
    public void pointcut() {}

    @Around("pointcut()")
    public Object around(ProceedingJoinPoint point) throws Throwable {
        MethodSignature signature = (MethodSignature) point.getSignature();
        Method method = signature.getMethod();
        DataSource ds = method.getAnnotation(DataSource.class);

        if (ds == null) {
            ds = point.getTarget().getClass().getAnnotation(DataSource.class);
        }

        if (ds != null) {
            DataSourceContextHolder.set(ds.value());
        }

        try {
            return point.proceed();
        } finally {
            DataSourceContextHolder.clear();
        }
    }
}
```

---

## 💾 6. 实体与仓库

```java
@Entity
public class User {
    @Id @GeneratedValue
    private Long id;
    private String name;

    // getter/setter
}
```

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {}
```

---

## 🚀 7. 示例使用

```java
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @DataSource("slave") // 切换到 slave 数据源
    public List<User> listFromSlave() {
        return userRepository.findAll();
    }

    @DataSource("master")
    public void saveToMaster(String name) {
        User user = new User();
        user.setName(name);
        userRepository.save(user);
    }
}
```

---

## 🔚 8. 启动类

```java
@SpringBootApplication
public class MultiDsApplication implements CommandLineRunner {

    @Autowired
    private UserService userService;

    public static void main(String[] args) {
        SpringApplication.run(MultiDsApplication.class, args);
    }

    @Override
    public void run(String... args) {
        userService.saveToMaster("Alice");
        System.out.println("From slave: " + userService.listFromSlave());
    }
}
```

---

## ✅ 总结

| 技术                | 作用                               |
| ------------------- | ---------------------------------- |
| `@DataSource` 注解  | 标记方法或类使用哪个数据源         |
| `ThreadLocal`       | 每个线程持有自己的数据源上下文     |
| `DynamicDataSource` | 实现动态路由逻辑                   |
| `AOP` 切面          | 在执行方法前设置数据源，执行后清理 |

---

这个实现适合绝大多数 Spring Boot + JPA 项目。如果你使用的是 MyBatis，也可以通过类似方式自定义 `SqlSessionFactory` 实现切换。

需要我补充一个 MyBatis 的版本或者扩展事务支持吗？
