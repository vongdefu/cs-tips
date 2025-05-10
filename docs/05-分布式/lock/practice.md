# 分布式锁实践

## 基于 MySQL 表的方式

```sql
// 1. 建表
CREATE TABLE database_lock (
   `id` BIGINT NOT NULL AUTO_INCREMENT,
   `resource` int NOT NULL COMMENT '锁定的资源',
   `description` varchar(1024) NOT NULL DEFAULT "" COMMENT '描述',
   PRIMARY KEY (id),
   UNIQUE KEY uiq_idx_resource (resource)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据库分布式锁表';

// 2. 加锁过程
INSERT INTO database_lock(resource, description) VALUES (1, 'lock');

// 3. 解锁过程
DELETE FROM database_lock WHERE resource=1;
```

## 基于 MySQL 悲观锁的方式

```sql
// 0. 开始事务
begin;/begin work;/start transaction; (三者选一就可以)
// 1. 查询出商品信息
select status from t_goods where id=1 for update;
// 2. 根据商品信息生成订单
insert into t_orders (id,goods_id) values (null,1);
// 3. 修改商品status为2
update t_goods set status=2;
// 4. 提交事务
commit;/commit work;
```

## 基于 MySQL 乐观锁+应用层事务管理机制的方式

```sql
// 1. 查询出商品信息
select (status,status,version) from t_goods where id=#{id}
// 2. 根据商品信息生成订单
// 3. 修改商品status为2
update t_goods
set status=2,version=version+1
where id=#{id} and version=#{version};
```

## 基于 zk + curator 客户端实现

首先添加 Maven 依赖：

```xml
<dependency>
    <groupId>org.apache.curator</groupId>
    <artifactId>curator-framework</artifactId>
    <version>4.3.0</version>
</dependency>
<dependency>
    <groupId>org.apache.curator</groupId>
    <artifactId>curator-recipes</artifactId>
    <version>4.3.0</version>
</dependency>
```

在需要加锁的地方进行加锁：

```java
@PostMapping("/purchase")
public boolean purchaseCommodityInfo(
   @RequestParam(name = "commodityId") String commodityId,
   @RequestParam(name = "number") Integer number
) throws Exception {
   boolean bool = false;

   //设置重试策略
   RetryPolicy retryPolicy = new ExponentialBackoffRetry(1000, 3);
   CuratorFramework client = CuratorFrameworkFactory.newClient("127.0.0.1:2181", retryPolicy);
   // 启动客户端
   client.start();
   InterProcessMutex mutex = new InterProcessMutex(client, "/locks");
   try {
      //加锁
      if (mutex.acquire(3, TimeUnit.SECONDS)) {
         //调用抢购秒杀service方法
         bool = commodityInfoService.purchaseCommodityInfo(commodityId, number);
      }
   } catch (Exception e) {
      e.printStackTrace();
   } finally {
      //解锁
      mutex.release();
      client.close();
   }
   return bool;
}

```

## 基于 redis 集群+redisson 客户端的方式实现

redis 集群： 3 主+3 从

```xml
<dependency>
   <groupId>org.redisson</groupId>
   <artifactId>redisson</artifactId>
   <version>3.8.1</version>
</dependency>
```

```java
public class Application {
  public static void main(String[] args) throws Exception {
    //1.配置Redis-Cluster集群节点的ip和port
    Config config = new Config();
    config.useClusterServers()
      .addNodeAddress("redis://192.168.43.159:7001")
      .addNodeAddress("redis://192.168.43.159:7002")
      .addNodeAddress("redis://192.168.43.159:7003")
      .addNodeAddress("redis://192.168.43.114:7001")
      .addNodeAddress("redis://192.168.43.114:7002")
      .addNodeAddress("redis://192.168.43.114:7003");

    //2.通过以上配置创建Redisson的客户端
    RedissonClient redisson = Redisson.create(config);

    //3.测试Redisson可重⼊锁的加锁、释放锁等功能
    testRedissonSimpleLock(redisson);
  }
  private static void testRedissonSimpleLock(RedissonClient redisson) throws InterruptedException {

    //1.获取key为"anyLock"的锁对象
    RLock lock = redisson.getLock("anyLock");

    //2.1：加阻塞锁或可重入锁
    lock.lock();

    //2.2：加非阻塞锁，设置尝试获取锁超时时间30s、锁超时⾃动释放的时间10s
    //    超时时间30s： 即如果尝试获取锁时，尝试了30s还是无法获取锁，那么就不再尝试了，直接返回；
    //    锁超时自动释放时间10s： 假如说加锁成功，锁维持的时间最多也就10s，超过10s，锁自动释放；
    //lock.tryLock(30, 10, TimeUnit.MILLISECONDS);
    Thread.sleep(10 * 1000);

    //3.释放锁
    lock.unlock();
  }
}
```

源码解读参考
