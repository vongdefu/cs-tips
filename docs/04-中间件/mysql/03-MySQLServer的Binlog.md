
- 作用
- 开启及配置参数
- 适用场景 
   - 故障恢复
   - 主从同步
- 文件查看示例




## 作用

Server层的操作日志。记录表结构变更和表数据变更的日志。


## 配置

查看binlog日志是否开启，默认是不开启的，需要手动开启：

![image.png](./image/03-MySQLServer的Binlog/1699923601449.png)

也可以查看my.cnf中的配置，如果没有开启，就需要先开启，并设置好Binlog的格式： 


![image.png](./image/03-MySQLServer的Binlog/1699923639140.png)

也可以单独查看binlog的格式：


![image.png](./image/03-MySQLServer的Binlog/1699923675510.png)

生成的文件： 


![image.png](./image/03-MySQLServer的Binlog/1699923682953.png)
配置参数， my.cnf文件中的mysqld节的配置：

- `log_bin` ： 设置 binlog 文件的存放路径及binlog文件的名称，如上图，只配置了binlog的文件名，则默认路径是 /data 目录，也可以加上路径
- `binlog_format` ： 设置binlog的保存格式， STATEMENT、ROW、MIXED， 也可以通过 `set global binlog_format='STATEMENT';` 进行修改，但是重启后修改丢失； 
   - `Statement 格式` 
      - 保存的内容： 记录操作的步骤，也就是SQL语句，比如对表结构中的A列进行修改，对id=10的那一行数据中的B列的值修改成xxx；
      - 缺点： 但是SQL中的函数前后两次执行的结果可能不一致，比如随机函数；
   - `Row 格式` 
      - 保存的内容： 记录操作的结果，比如表结构修改后的结果或数据行的修改后的结果
      - 缺点： 但是批量插入的过程可能会产生大量的binlog日志，但是在Statement格式中可能就一行SQL语句；
   - `Mixed 格式`： 混合格式，汲取两者优点。
- `expire_logs_days` ：清理策略，定期清理，如 expire_logs_days=5 表示5天清理一次；如果没有配置，就是不清理binlog文件；
- `max_binlog_size` ： 滚动binlog文件的大小，如 max_binlog_size=500m 表示 master-bin.00001 超过 500m 之后就会生成 master-bin.00002
- `binlog_cache_size` ： binlog cache 的大小， 如 binlog_cache_size=4m 表示 binlog cache 的大小为 4m ；
- `max_binlog_cache_size` ： binlog cache 最大值，如 max_binlog_cache_size=10m 表示 binlog cache 最大为10m；


## 故障恢复

- `单行恢复`： 只恢复部分数据 
   - `delete`：row 格式下，当我们执⾏ delete 命令时，如果 binlog_row_image 设置了 'FULL'，那么 Delete_rows ⾥⾯，包含了删掉的⾏的所有字段的值。如果误删了，因为 binlog 记录了所有字段的值，反向执⾏ insert 就可以了；当 binlog_row_image 设置为 MINIMAL ，只记录关键信息，⽐如 id=80；
   - `insert`：row 格式下，binlog 会 记录 insert 的所有字段值。如果误操作，只需要根据这些值找到对应的⾏，再执⾏ delete 操作即可；
   - `update`：row 格式下，binlog 会 记录 update 修改前、修改后的整⾏数据。如果误操作，只需要⽤修改前的数据覆盖即可；
- `整库恢复`： 使用binlog文件恢复数据： `mysqlbinlog mysql-bin.000001 --start-position=1 --stop-position=3000 | mysql - h192.168.0.1 -P3306 -u$user -p$pwd;`， 将 mysql-bin.000001 ⽂件位置从 1到3000 的 binlog 在 192.168.0.1 机器的数据库上回放，还原。


## 主从同步

- 主从同步配置过程（一主两从） 
   - 略
- 原理 
   - MySQL 主库在收到客户端提交事务的请求之后，会先写入 binlog，再提交事务，更新存储引擎中的数据，事务提交完成后，返回给客户端“操作成功”的响应。
   - 从库会创建一个专门的 I/O 线程，连接主库的 log dump 线程，来接收主库的 binlog 日志，再把 binlog 信息写入 relay log 的中继日志里，再返回给主库“复制成功”的响应。
   - 从库会创建一个用于回放 binlog 的线程，去读 relay log 中继日志，然后回放 binlog 更新存储引擎中的数据，最终实现主从的数据一致性。
- 主从复制模式 
   - `同步复制`：MySQL 主库提交事务的线程要等待所有从库的复制成功响应，才返回客户端结果。这种方式在实际项目中，基本上没法用，原因有两个：一是性能很差，因为要复制到所有节点才返回响应；二是可用性也很差，主库和所有从库任何一个数据库出问题，都会影响业务。
   - `异步复制（默认模型）`：MySQL 主库提交事务的线程并不会等待 binlog 同步到各从库，就返回客户端结果。这种模式一旦主库宕机，数据就会发生丢失。
   - `半同步复制`：MySQL 5.7 版本之后增加的一种复制方式，介于两者之间，事务线程不用等待所有的从库复制成功响应，只要一部分复制成功响应回来就行，比如一主二从的集群，只要数据成功复制到任意一个从库上，主库的事务线程就可以返回给客户端。这种半同步复制的方式，兼顾了异步复制和同步复制的优点，即使出现主库宕机，至少还有一个从库有最新的数据，不存在数据丢失的风险。
- 是不是从节点越多越好？ 
   - 不是的。因为从库数量增加，从库连接上来的 I/O 线程也比较多，主库也要创建同样多的 log dump 线程来处理复制的请求，对主库资源消耗比较高，同时还受限于主库的网络带宽。实际上，一主两从就行。
- relay log 
   - 中继日志，会在Slave节点上产生；是Slave节点读取到Master节点的binlog之后产生的日志，用来在本地进行重放数据；


## Binlog刷盘

MySQLServer层有一块专门的区域，用来放置缓存的信息，这部分被称为Cache。对MySQL进行操作时，MySQLServer会根据会话创建多个线程，每一个线程都有自己的Binlog-Cache，Binlog-Cache达到设置的阈值后，会把Binlog—Cache中的数据保存到磁盘上。



![image.png](./image/03-MySQLServer的Binlog/1699923725062.png)


其中，write 指的是 把 Binlog-Cache 中的内容写到文件系统中的  page cache 里，此时并没有落到磁盘上，这个阶段不涉及IO； fsync 才是持久化到磁盘上，这个阶段才会产生IO。

MySQL提供了一个 sync_binlog 参数用来控制binlog-cache刷到磁盘上的频率：

- `sync_binlog = 0`， 表示每次提交事务都只 write ， 不 fsync ， 具体何时刷到磁盘上，由操作系统来决定；这种方式风险较大，一旦主机重启，没有刷到磁盘上的binlog就会丢失；
- `sync_binlog = 1` ， 表示每次提交事务都会 write，然后马上执行 fsync； 这种方式虽然最多只会丢失一个事务操作，但是会导致并发度下降；
- `sync_binlog = N (N>1)`  ， 表示每次提交事务都 write，但累积 N 个事务后才 fsync； 这种方式最恰当，最多只会丢失 N 个事务操作；




## [不重要]BinLog 查看


### 方式一

- 查看的语法


```
mysql> show binlog events [IN 'log_name'] [FROM pos] [LIMIT [offset,] row_count];
 
选项解析：
  IN 'log_name' 指定要查询的binlog文件名(不指定就是第一个binlog文件)
  FROM pos 指定从哪个pos起始点开始查起(不指定就是从整个文件首个pos点开始算)
  LIMIT [offset,] 偏移量(不指定就是0)
  row_count 查询总条数(不指定就是所有行)

```

- 结果分析： 结果是一张表 
   - Log_name： binlog 文件名
   - Pos： 起始位置
   - Event_type： 记录的事件类型
   - Server_id： 服务器id
   - End_log_pos： 结束位置
   - Info： 具体信息


### 方式二

也可以使用 MySQL 提供的binlog查看工具直接查看binlog文件内容，如：

> mysqlbinlog -vv mysql-bin.000001 --start-position=2986;



### 查询示例

- binlog格式为row的查询示例


![image.png](./image/03-MySQLServer的Binlog/1699923767159.png)


```
mysql> show binlog events in 'master-bin.000001' from 1 limit 20\G
*************************** 1. row ***************************
   Log_name: master-bin.000001
        Pos: 4
 Event_type: Format_desc
  Server_id: 100
End_log_pos: 123
       Info: Server ver: 5.7.36-log, Binlog ver: 4
*************************** 2. row ***************************
   Log_name: master-bin.000001
        Pos: 123
 Event_type: Previous_gtids
  Server_id: 100
End_log_pos: 154
       Info: 
*************************** 3. row ***************************
   Log_name: master-bin.000001
        Pos: 154
 Event_type: Anonymous_Gtid
  Server_id: 100
End_log_pos: 219
       Info: SET @@SESSION.GTID_NEXT= 'ANONYMOUS'
*************************** 4. row ***************************
   Log_name: master-bin.000001
        Pos: 219
 Event_type: Query
  Server_id: 100
End_log_pos: 400
       Info: CREATE USER 'slave'@'%' IDENTIFIED WITH 'mysql_native_password' AS '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
*************************** 5. row ***************************
   Log_name: master-bin.000001
        Pos: 400
 Event_type: Anonymous_Gtid
  Server_id: 100
End_log_pos: 465
       Info: SET @@SESSION.GTID_NEXT= 'ANONYMOUS'
*************************** 6. row ***************************
   Log_name: master-bin.000001
        Pos: 465
 Event_type: Query
  Server_id: 100
End_log_pos: 617
       Info: GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'slave'@'%'
*************************** 7. row ***************************
   Log_name: master-bin.000001
        Pos: 617
 Event_type: Anonymous_Gtid
  Server_id: 100
End_log_pos: 682
       Info: SET @@SESSION.GTID_NEXT= 'ANONYMOUS'
*************************** 8. row ***************************
   Log_name: master-bin.000001
        Pos: 682
 Event_type: Query
  Server_id: 100
End_log_pos: 769
       Info: flush privileges
*************************** 9. row ***************************
   Log_name: master-bin.000001
        Pos: 769
 Event_type: Anonymous_Gtid
  Server_id: 100
End_log_pos: 834
       Info: SET @@SESSION.GTID_NEXT= 'ANONYMOUS'
*************************** 10. row ***************************
   Log_name: master-bin.000001
        Pos: 834
 Event_type: Query
  Server_id: 100
End_log_pos: 1024
       Info: CREATE DATABASE /*!32312 IF NOT EXISTS*/ `monomer_order` /*!40100 DEFAULT CHARACTER SET utf8mb4 */
*************************** 11. row ***************************
   Log_name: master-bin.000001
        Pos: 1024
 Event_type: Anonymous_Gtid
  Server_id: 100
End_log_pos: 1089
       Info: SET @@SESSION.GTID_NEXT= 'ANONYMOUS'
*************************** 12. row ***************************
   Log_name: master-bin.000001
        Pos: 1089
 Event_type: Query
  Server_id: 100
End_log_pos: 1240
       Info: use `monomer_order`; DROP TABLE IF EXISTS `order_info` /* generated by server */
*************************** 13. row ***************************
   Log_name: master-bin.000001
        Pos: 1240
 Event_type: Anonymous_Gtid
  Server_id: 100
End_log_pos: 1305
       Info: SET @@SESSION.GTID_NEXT= 'ANONYMOUS'
*************************** 14. row ***************************
   Log_name: master-bin.000001
        Pos: 1305
 Event_type: Query
  Server_id: 100
End_log_pos: 3967
       Info: use `monomer_order`; CREATE TABLE `order_info` (
  `id` bigint(32) NOT NULL AUTO_INCREMENT,
  `order_no` varchar(32) NOT NULL COMMENT '订单号',
  `order_amount` decimal(8,2) NOT NULL COMMENT '订单金额',
  `merchant_id` bigint(32) NOT NULL COMMENT '商户ID',
  `user_id` bigint(32) NOT NULL COMMENT '用户ID',
  `order_freight` decimal(8,2) NOT NULL DEFAULT '0.00' COMMENT '运费',
  `order_status` tinyint(3) NOT NULL DEFAULT '0' COMMENT '订单状态,10待付款，20待接单，30已接单，40配送中，50已完成，55部分退款，60全部退款，70取消订单',
  `trans_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '交易时间',
  `pay_status` tinyint(3) NOT NULL DEFAULT '2' COMMENT '支付状态,1待支付,2支付成功,3支付失败',
  `recharge_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '支付完成时间',
  `pay_amount` decimal(8,2) NOT NULL DEFAULT '0.00' COMMENT '实际支付金额',
  `pay_discount_amount` decimal(8,2) NOT NULL DEFAULT '0.00' COMMENT '支付优惠金额',
  `address_id` bigint(32) NOT NULL COMMENT '收货地址ID',
  `delivery_type` tinyint(3) NOT NULL DEFAULT '2' COMMENT '配送方式，1自提。2配送',
  `delivery_status` tinyint(3) DEFAULT '0' COMMENT '配送状态，0 配送中，2已送达，3待收货，4已送达',
  `delivery_expect_time` timestamp NULL DEFAULT NULL COMMENT '配送预计送达时间',
  `delivery_complete_time` timestamp NULL DEFAULT NULL COMMENT '配送送达时间',
  `delivery_amount` decimal(8,2) NOT NULL DEFAULT '0.00' COMMENT '配送运费',
  `coupon_id` bigint(32) DEFAULT NULL COMMENT '优惠券id',
  `cancel_time` timestamp NULL DEFAULT NULL COMMENT '订单取消时间',
  `confirm_time` timestamp NULL DEFAULT NULL COMMENT '订单确认时间',
  `remark` varchar(512) DEFAULT NULL COMMENT '订单备注留言',
  `create_user` bigint(32) DEFAULT NULL COMMENT '创建用户',
  `update_user` bigint(32) DEFAULT NULL COMMENT '更新用户',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `delete_flag` tinyint(4) NOT NULL DEFAULT '0' COMMENT '逻辑删除标记',
  PRIMARY KEY (`id`,`order_no`),
  KEY `inx_merchant_id_update_time` (`merchant_id`,`update_time`),
  KEY `inx_create_time` (`create_time`,`order_no`),
  KEY `inx_trans_time` (`trans_time`),
  KEY `inx_order_no` (`order_no`)
) ENGINE=InnoDB AUTO_INCREMENT=96311264 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='订单表'
*************************** 15. row ***************************
   Log_name: master-bin.000001
        Pos: 3967
 Event_type: Anonymous_Gtid
  Server_id: 100
End_log_pos: 4032
       Info: SET @@SESSION.GTID_NEXT= 'ANONYMOUS'
*************************** 16. row ***************************
   Log_name: master-bin.000001
        Pos: 4032
 Event_type: Query
  Server_id: 100
End_log_pos: 4173
       Info: use `monomer_order`; /*!40000 ALTER TABLE `order_info` DISABLE KEYS */
*************************** 17. row ***************************
   Log_name: master-bin.000001
        Pos: 4173
 Event_type: Anonymous_Gtid
  Server_id: 100
End_log_pos: 4238
       Info: SET @@SESSION.GTID_NEXT= 'ANONYMOUS'
*************************** 18. row ***************************
   Log_name: master-bin.000001
        Pos: 4238
 Event_type: Query
  Server_id: 100
End_log_pos: 4327
       Info: BEGIN
*************************** 19. row ***************************
   Log_name: master-bin.000001
        Pos: 4327
 Event_type: Table_map
  Server_id: 100
End_log_pos: 4440
       Info: table_id: 108 (monomer_order.order_info)
*************************** 20. row ***************************
   Log_name: master-bin.000001
        Pos: 4440
 Event_type: Write_rows
  Server_id: 100
End_log_pos: 12626
       Info: table_id: 108
20 rows in set (0.00 sec)

```

> mysqlbinlog -vv mysql-bin.000001 --start-position=2986;



![image.png](./image/03-MySQLServer的Binlog/1699923804050.png)


- binlog格式为Statement的查询示例


![image.png](./image/03-MySQLServer的Binlog/1699923828532.png)

















