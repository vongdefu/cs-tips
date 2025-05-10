
# 附录 01 本地缓存与分布式缓存示例

## 本地缓存

### Spring Boot 本地缓存示例

使用 Spring Boot 和 `@Cacheable` 注解来实现本地缓存，可以使用如 `ConcurrentHashMap` 作为本地缓存存储。


#### 依赖配置

确保在 `pom.xml` 中引入 Spring 缓存依赖：


```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>

```


#### 配置类

启用缓存功能：


```java
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {
}

```


#### 服务类

示例服务类使用 `@Cacheable` 注解来缓存方法的返回值：


```java
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class LocalCacheService {

    @Cacheable("localCache")
    public String getData(String key) {
        // 模拟耗时操作
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return "Data for key: " + key;
    }
}

```


#### 主应用类


```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LocalCacheApplication {

    public static void main(String[] args) {
        SpringApplication.run(LocalCacheApplication.class, args);
    }
}

```



### SpringBoot+Guaua


- [ ] todo 



### SpringBoot+Ehcache

- [ ] todo 


## 分布式缓存 

### Spring Boot 分布式缓存示例

使用 Spring Boot 和 Redis 实现分布式缓存。


#### 依赖配置

确保在 `pom.xml` 中引入 Spring Data Redis 和 Lettuce 依赖：


```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>io.lettuce.core</groupId>
    <artifactId>lettuce-core</artifactId>
</dependency>

```


#### 配置类

配置 Redis 连接：


```java
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
}

```


#### 服务类

示例服务类使用 `@Cacheable` 注解来缓存方法的返回值：


```java
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class DistributedCacheService {

    @Cacheable("distributedCache")
    public String getData(String key) {
        // 模拟耗时操作
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return "Data for key: " + key;
    }
}

```


#### 配置文件

在 `application.properties` 中配置 Redis 连接信息：


```properties
spring.redis.host=localhost
spring.redis.port=6379

```


#### 主应用类


```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DistributedCacheApplication {

    public static void main(String[] args) {
        SpringApplication.run(DistributedCacheApplication.class, args);
    }
}

```


## 总结

通过上述示例，可以看到本地缓存和分布式缓存的实现有明显的区别。使用本地缓存时，数据存储在应用程序的内存中，而分布式缓存则依赖外部缓存服务器如 Redis。在实际应用中，选择哪种缓存方式取决于具体的应用需求和系统架构。

