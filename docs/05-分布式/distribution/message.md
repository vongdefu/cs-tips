# 分布式消息

### 1. 分布式消息常见问题

> 互联网技术的产生无非就是系统中遇到了某种问题，而针对这些问题需要得到处理，应运而生就产生了一系列的技术。
>
> 因此，我们在研究一种技术的时候，就要先研究在现有系统中到底遇到了什么问题？解决问题的办法就是这种技术的重要关注点。即问题和解决方案。
>
> 这就是我们学习技术的方法论。下面的学习内容，也是围绕着“问题+解决方案”这个观点去布局和构思的，以后我会不断重申这种观点，以加强记忆和理解。

- 目前软件系统中遇到了什么困难？
- 引入消息中间件后解决了什么问题？
  - 解耦
  - 异步
  - 削峰
- 引入消息中间件之后同时引入了哪些问题？
  - 增加了系统的复杂度
  - 如果消息中间件整体宕机？
  - 如果消息重复发送？
  - 如果消息顺序不对？
  - 如果结果不一致？（服务 a 调用 b、c、d，依次处理后才算整个操作成功，但是引入消息中间件之后，发现 b 和 c 成功了，但是 d 没有成功，那整个操作应该算是成功能还是失败呢？怎么解决可能出现的这种情况呢？）
- 消息中间件的选型标准？
  - 吞吐量和 topic 数量
  - 开源社区活跃度
  - 消息的实效性、分布式可用性、消息可靠性（不会丢失消息）
  - 功能支持是否齐全
  - 结论总结：rabbitmq 和 kafka
- rabbitmq 和 kafka
  - Rabbitmq 的高可用实现方式？三种方式的区别？
  - Kafka 的高可用原理？

---

- 生产者消费者模型

---

- 消息中间件的使用示例
  - rabbitmq+SpringBoot 使用案例
    - 相关概念
    - 部署过程
    - 生产者代码
    - 消费者代码
  - kafka+SpringBoot 使用案例
    - 相关概念
    - 部署过程
    - 生产者代码
    - 消费者代码

---

- MQ 中如何保证消息不被重复消费？（如何保证消息的幂等性）
  - 问题的描述
    - `生产者`生产了多条消息，导致消息有多条
    - `消息中间件`直接断电了，导致 offset 没有来得及提交，没有提交但是已经被消费的消息就可能再次被消费
    - `消费者`中间的多台主机可能会取到同一条数据，单个消息被多个消费者消费
  - 解决方案
    - 视业务而定，如果业务是写 redis，使用 set，天然幂等性
    - 如果是常规业务操作，可以在生产消息时使用全局唯一 id，使用这个 id 作为消息的标识，每次消费时，先去 redis 中查一下是否有这个 id，如果有就说明已经被消费过了，直接丢弃，如果没有，就说明没有被消费过

---

- MQ 中如何保证消息的可靠性？（如何保证消息不丢失）
  - 问题描述
    - `生产者导致消息丢失`：生产者组装完消息，发送给 MQ，紧接着就去处理其他事物了，发送给 MQ 没有，具体不知道，但是生产者并接着去处理其他事物了，这就造成了到底发送消息了没有这个问题不清楚。这其中可能有网络抖动？生产者处组装完消息正要发送消息时突然宕机？
    - `消息中间件导致消息丢失`：
      - 针对 rabbitmq 来说，可能的原因是消息中间件没有开启持久化机制，或者是开启持久化了，但是在开始持久化时，消息中间件宕机了，导致部分消息没有被消费，也没有持久化到磁盘中，那消息中间件再次启动时，就会导致部分消息丢失；此外，如果开启了消息的过期时间，这也会造成消息没有来得及消费，就被废弃，导致消息丢失
      - 针对 kafka 来说，可能的原因是某一个 broker 宕机，重新选举 partition 的 leader 时，其他 follower 还有些数据没有完成同步，此时 leader 挂掉，在某一个 follower 成为 leader 后，就会发现消息丢失
    - `消费者导致消息丢失`：消费者刚取到消息正准备消费时，还没来得及处理消息，突然进程挂掉了或者重启了，这就导致这条消息丢失了（对于 kafka 来说，具体的表现就是取到消息后自动提交了 offset，kafka 认为消费者已经消费过这个消息，但是消费者正要消费时，此时消费者自己挂了，这就会导致这条消息丢失）
  - 解决方案
    - `生产者导致消息丢失`
      - 针对 rabbitmq，可以使用`事务机制`和`确认机制`，区别就是`事务机制`是同步处理的，这就会导致 rabbitmq 的吞吐量的下降；`确认机制`是异步处理的，所以优先选择，确保消息一定会发送给 rabbitmq
      - 针对 kafka，同样`开启确认机制`，当 leader 收到消息，并把消息同步到所有的 follower 中后，才认为消息写入成功，否则就进行无限重试
    - `消息中间件导致消息丢失`
      - 针对 rabbitmq，需要开`启持久化机`制。除了需要`关闭过期时间`外，还需要两步走，`第一步开启queue的持久化`，这样可以保证 rabbitmq 持久化 queue 的元数据，当重启时，可以根据持久化文件自动创建 queue；`第二步开启消息的持久化`，消息发送到 queue 中之后自动会定期持久化到本地磁盘中。这还需要结合确认机制，即当消息确定持久化到本地硬盘后才进行生产者的确认。
      - ![](https://gw.alipayobjects.com/os/lib/twemoji/11.2.0/2/svg/2b50.svg#height=18&id=Ptc8x&originHeight=150&originWidth=150&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=&width=18)
      - ![](https://gw.alipayobjects.com/os/lib/twemoji/11.2.0/2/svg/2b50.svg#height=18&id=b03Aa&originHeight=150&originWidth=150&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=&width=18)
      - ![](https://gw.alipayobjects.com/os/lib/twemoji/11.2.0/2/svg/2b50.svg#height=18&id=YEEr5&originHeight=150&originWidth=150&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=&width=18)针对 kafka，第一步设置 topic 的参数`replication.factor`参数的值大于 1，要求每一个 partition 必须有至少 2 个副本；第二步设置`min.insync.replicas`参数，即要求 leader 感知到至少一个 follower 还跟自己保持联系，这样才能确保 leader 挂掉之后还有至少一个 follower；第三步设置`acks=all`，即要求每条消息，必须在写入所有的 replicas 后才能认为写入成功；第四步设置`retries=MAX`，即一旦写入失败，就进行无限重试（此时可能会造成阻塞）；`（这也是kafka消息零丢失的实现原理）`
    - `消费者导致消息丢失`
      - 针对 rabbitmq，就是`采取确认机制`，即消费完消息后调用 rabbitmq 的确认接口，手动确认消息消费完成，rabbitmq 才会把这条消息标记为已消费；
      - 针对 kafka，就是`关闭自动提交offset的开关`，在处理完消息后`手动提交offset`

---

- 如何保证消息的顺序性？
  - 问题描述
    - 以消息能可靠传入 MQ 中，并且生产者生产的消息是有序的为前提；又由于存储消息的 queue 本身就具有先进先出的特性；因此问题主要出现在消费者身上，多是因为：多个消费者同时消费同一个 queue，或者是一个消费者多线程消费同一个 queue
  - 解决方案
    - rabbitmq：一个消费者对应一个 queue
    - kafka： 内部单线程消费

---

- 如何解决消息积压？
  - 问题描述
    - `消息积压`：由于消费者故障或者由于消费者调用的外围组件异常（如某一消息要求消费者更新数据库，但是此时数据库发生宕机事故）导致消费者消费消息特别慢，而生产者那边却是按照正常速度进行生产，这就会导致 MQ 中积压很多的消息；
    - `消息丢失`：由于消息积压过多，但是又没有来得及处理，并且消息中间件还设置了过期时间，这还会造成消息丢失的问题；
  - 解决方案
    - 中心思想是分三步走
      - 第一步，要求`快速把生产机器上的空间腾出来`。可以先临时征用 10 倍机器，然后写一个用来分发数据的消费者程序，一边接生产环境，一边接临时机器，消费者程序只做消息换手，即从生产环境接到消息，立马放入临时机器；
      - 第二步，要求`快速把腾出来的消息消费掉`。可以临时征用其他机器，写一些专门用来消费这些消息的消费者程序，再接上上一步的临时机器进行实打实的消费；
      - 第三步，`进行补偿`。如果遇到消息丢失的问题，就要写一个补偿程序，在业务量少的时间（如凌晨三四点时）针对白天的业务数据，重新生成消息

---

- （开放题）如何设计一个 MQ？
  - 考官目的
    - 主要考察候选人的架构设计能力
  - 回答提示
    - 需要考虑 MQ 得支持可伸缩
    - 需要考虑 MQ 得支持可持久化
    - 需要考虑 MQ 得支持高可用
    - 需要考虑 MQ 消息零丢失

---

- 总结-方法论
  - 考虑问题可能出现的地方时，主要从生产者消费模型的三个角色来考虑：`生产者`、`消息中间件`、`消费者`
  - 各个角色可能出现的问题无非就是下面的几种情况的组合：
    - 软件非正常中断，比如：程序突然卡死、应用程序重启、超过超时时间
    - 网络不稳定，比如：网络抖动
    - 硬件设备非正常中断，比如：硬盘突然失效、服务器设备突然断电、网卡设备损坏
  - 考虑解决方案时，就可以从以上各角色可能出现的问题分别考虑

### 2. 企业级消息队列

#### 2.1. rabbitmq

> 来自: [详细讲解！RabbitMQ 防止数据丢失](https://mp.weixin.qq.com/s/KGCER3TWLT6Yk_UwsYJZyA)
> 来自: [超详细的 RabbitMQ 入门](https://mp.weixin.qq.com/s/RhXe3cF_B3p78I2mEXY9EQ)

#### 2.2. rocketmq

#### 2.3. kafka

### 3. 生产实践——设备云基于 Rabbit MQ 的消息模型

#### 3.1. 消息处理流程

![](https://cdn.nlark.com/yuque/0/2023/jpeg/29433025/1681705506216-047835a4-66c2-485b-b80e-3bc2b26170d0.jpeg)

![](https://cdn.nlark.com/yuque/0/2023/jpeg/29433025/1681705689399-d00fef9d-5602-405a-9b86-66df9c716e1d.jpeg)

#### 3.2. 消息丢失

1. 后端没有发送成功： 开启生产者确认机制，当 MQ 接收到消息后，给后端一个确认信息；
2. MQ 丢失消息： 开启队列的持久化机制
3. 主站接收到消息后还没来得及处理消息就宕机了，导致丢失消息： 开启消费者确认机制，后端处理接收到消息，完成业务逻辑处理之后，发送确认信息给 MQ，MQ 移除消息；

#### 3.3. 消息重复消费

1. 在消费消息时，先去 db 或 redis 中查询一下是否存在这个消息的 id：
   1. 如果存在则证明已经消费过了，之后直接抛弃这条消息，并发确认信息给 MQ，让 MQ 移除这条消息；
   2. 如果不存在，就处理这条消息，之后发送确认信息给 MQ，让 MQ 移除这条消息，再之后把这条消息的 id 记录到 db 或 redis 中；

#### 3.4. 消息积压

1. 事前，预估系统消息容量，架设足够服务器资源，尽量避免消息积压情况的发生；
2. 事中，紧急扩容后端服务器资源，让后端尽快处理掉积压的消息；
3. 事后，反思总结经验教训；
   1. 定位消息积压问题，查看是否是业务正常逻辑导致；若是，则需要再次评估后端服务器资源与 MQ 服务器资源是否需要扩容；若不是，则需要定位消息积压原因，并进行修复；

#### 3.5. 实时命令时序图

![](https://cdn.nlark.com/yuque/__puml/f037c59bd9e2b978827bd3e0de6c1f80.svg#lake_card_v2=eyJ0eXBlIjoicHVtbCIsImNvZGUiOiJAc3RhcnR1bWxcblxuYXV0b251bWJlclxuXG5hY3RvciBcIueUqOaIt1wiIGFzIFVzZXJcbnBhcnRpY2lwYW50IFwiYmFja2VuZFwiIGFzIGJhY2tlbmQgI3JlZFxucGFydGljaXBhbnQgXCJyZWRpc1wiIGFzIHJlZGlzICN5ZWxsb3dcbnBhcnRpY2lwYW50IFwiZGJcIiBhcyBkYiAjZ3JlZW5cbnBhcnRpY2lwYW50IFwicmFiYml0bXFcIiBhcyByYWJiaXRtcSAjcGlua1xucGFydGljaXBhbnQgXCJpcGNcIiBhcyBpcGMgI29yYW5nZVxucGFydGljaXBhbnQgXCJtYWNoaW5lXCIgYXMgbWFjaGluZSAjb2xpdmVcblxuYWN0aXZhdGUgVXNlclxuXG5Vc2VyIC0-IGJhY2tlbmQ6IOS4i-WPkeaKhOihqOWRveS7pFxuXG5hY3RpdmF0ZSBiYWNrZW5kXG5hY3RpdmF0ZSBkYlxuYmFja2VuZCAtPiBkYjog6I635Y-W6K6-5aSH5L-h5oGvXG5kZWFjdGl2YXRlIGRiXG5iYWNrZW5kIC0-IGJhY2tlbmQ6IOe7hOijheWRveS7pOS_oeaBr1xuXG5hY3RpdmF0ZSByYWJiaXRtcVxuYmFja2VuZCAtPiByYWJiaXRtcTog5Y-R6YCB5oqE6KGo5ZG95Luk5raI5oGv5Yiw6Zif5YiXXG5kZWFjdGl2YXRlIHJhYmJpdG1xXG5cbmFjdGl2YXRlIHJlZGlzXG5iYWNrZW5kIC0-IHJlZGlzOiDnlJ_miJDlkb3ku6RrZXlcbmFjdGl2YXRlIGRiXG5iYWNrZW5kIC0-IGRiOiDlubborrDlvZXmioTooajmk43kvZzkv6Hmga_liLBkYlxuZGVhY3RpdmF0ZSBkYlxuXG5ub3RlIHJpZ2h0IG9mIHJlZGlzOiDku6VoYXNo57uT5p6E77yM6K6-5aSHaWTkvZzkuLrlgLzlr7nosaHnmoRrZXnlrZjlhaVyZWRpc1xuZGVhY3RpdmF0ZSByZWRpc1xuYmFja2VuZCAtPiBVc2VyOiDlj5HpgIHlm57osIPmjqXlj6PvvIzov5vooYzph43lrprkvY1cbmRlYWN0aXZhdGUgYmFja2VuZFxuZGVhY3RpdmF0ZSBVc2VyXG5cblxuYWN0aXZhdGUgcmFiYml0bXFcbmFjdGl2YXRlIGlwY1xuaXBjIC0-IHJhYmJpdG1xOiDnm5HlkKznm7jlhbPpmJ_liJdcbmlwYyAtPiBpcGM6IOino-aekOa2iOaBr-W5tuino-aekOivt-axgumTvui3r1xuYWN0aXZhdGUgbWFjaGluZVxuaXBjIC0-IG1hY2hpbmU6IOWPkemAgeaKhOihqOWRveS7pFxubWFjaGluZSAtPiBpcGM6IOaOpeaUtuaKhOihqOe7k-aenFxuXG5kZWFjdGl2YXRlIG1hY2hpbmVcblxuaXBjIC0-IHJhYmJpdG1xOiDlj5HpgIHmioTooajnu5Pmnpzmtojmga9cbmRlYWN0aXZhdGUgaXBjXG5cblxuXG5hY3RpdmF0ZSBiYWNrZW5kXG5cbmJhY2tlbmQgLT4gcmFiYml0bXE6IOebkeWQrOWIsOaKhOihqOe7k-aenOS_oeaBr1xuXG5kZWFjdGl2YXRlIHJhYmJpdG1xXG5cbmFjdGl2YXRlIHJlZGlzXG5cbmJhY2tlbmQgLT4gcmVkaXM6IOWbnuafpeiuvuWkh-S_oeaBr--8jOW5tuWwhuiuvuWkh-S_oeaBr-S4juaKhOihqOS_oeaBr-S4gOS4gOe7hOijhVxuYWN0aXZhdGUgZGJcbmJhY2tlbmQgLT4gZGI6IOW5tuiusOW9leaKhOihqOiusOW9lee7k-aenOS_oeaBr1xuZGVhY3RpdmF0ZSBkYlxuZGVhY3RpdmF0ZSByZWRpc1xuZGVhY3RpdmF0ZSBiYWNrZW5kXG5cbmFjdGl2YXRlIFVzZXJcblVzZXIgLT4gYmFja2VuZDog6L2u6K6t5Zue6LCD5o6l5Y-jXG5cbmFjdGl2YXRlIGJhY2tlbmRcbmJhY2tlbmQgLT4gcmVkaXM6IOafpeivouaKhOihqOe7k-aenFxuXG5iYWNrZW5kIC0-IFVzZXI6IOWPkemAgeWTjeW6lOe7k-aenFxuZGVhY3RpdmF0ZSBiYWNrZW5kXG5kZWFjdGl2YXRlIFVzZXJcblxuQGVuZHVtbCIsInVybCI6Imh0dHBzOi8vY2RuLm5sYXJrLmNvbS95dXF1ZS9fX3B1bWwvZjAzN2M1OWJkOWUyYjk3ODgyN2JkM2UwZGU2YzFmODAuc3ZnIiwiaWQiOiJKZ2thQyIsIm1hcmdpbiI6eyJ0b3AiOnRydWUsImJvdHRvbSI6dHJ1ZX0sImNhcmQiOiJkaWFncmFtIn0=)

1. redis 的存在的目的在于把抄表结果与设备信息对应起来，所以使用 hash 的数据结构更为妥当，让设备 id 作为值对象的 key
2. 第 12 步之后，由后端监听程序获取抄表结果，并把抄表结果存入 redis，之后把抄表动作信息记录到 db 中
3. 轮训频率为 1s 一次

#### 3.6. 异步抄表时序图

![](https://cdn.nlark.com/yuque/__puml/dda8c4bbdc1959a30934dd2a9cabee10.svg#lake_card_v2=eyJ0eXBlIjoicHVtbCIsImNvZGUiOiJAc3RhcnR1bWxcblxuYXV0b251bWJlclxuXG5hY3RvciBcIueUqOaIt1wiIGFzIFVzZXJcbnBhcnRpY2lwYW50IFwiYmFja2VuZFwiIGFzIGJhY2tlbmQgI2dvbGRcbnBhcnRpY2lwYW50IFwicmVkaXNcIiBhcyByZWRpcyAjb3JhbmdlXG5wYXJ0aWNpcGFudCBcInJhYmJpdG1xXCIgYXMgcmFiYml0bXEgI3llbGxvd1xuXG5hY3RpdmF0ZSBVc2VyXG5cblVzZXIgLT4gYmFja2VuZDog5Y-R6YCB5oqE6KGo5ZG95LukXG5cbmFjdGl2YXRlIGJhY2tlbmQgXG5iYWNrZW5kIC0-IGJhY2tlbmQ6IOafpeivouaVsOaNruW6k-iuvuWkh-S_oeaBr1xuYmFja2VuZCAtPiBiYWNrZW5kOiDnu4Too4Xlkb3ku6Tkv6Hmga9cblxuYWN0aXZhdGUgcmFiYml0bXFcbmJhY2tlbmQgLT4gcmFiYml0bXE6IOWPkemAgeWRveS7pOa2iOaBr1xuZGVhY3RpdmF0ZSByYWJiaXRtcVxuXG5hY3RpdmF0ZSByZWRpc1xuYmFja2VuZCAtPiByZWRpczog57yT5a2Y6K6-5aSH5L-h5oGv77yM562J5b6F57uT5p6cXG5ub3RlIHJpZ2h0IG9mIHJlZGlzOiDkvb_nlKhoYXNo77yM5Lul6K6-5aSHaWTkvZzkuLrlgLzlr7nosaFrZXlcbmRlYWN0aXZhdGUgcmVkaXNcblxuYmFja2VuZCAtPiBVc2VyOiDov5Tlm57lk43lupTkv6Hmga9cbmRlYWN0aXZhdGUgYmFja2VuZFxuXG5cbmRlYWN0aXZhdGUgVXNlclxuXG5cblxuQGVuZHVtbCIsInVybCI6Imh0dHBzOi8vY2RuLm5sYXJrLmNvbS95dXF1ZS9fX3B1bWwvZGRhOGM0YmJkYzE5NTlhMzA5MzRkZDJhOWNhYmVlMTAuc3ZnIiwiaWQiOiJyeW81QyIsIm1hcmdpbiI6eyJ0b3AiOnRydWUsImJvdHRvbSI6dHJ1ZX0sImNhcmQiOiJkaWFncmFtIn0=)

1. 这里的响应结果为操作成功，只是代表发送抄表命令的动作是成功的，并不代表抄表结果成功返回；
2. 要想查询抄表动作是否成功，需要去操作中心再次调用接口去查询；
