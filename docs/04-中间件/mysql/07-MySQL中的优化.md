

## 基准测试

数据库部署的时候常选用的机器配置最低在8核16G以上，正常在16核32G，推荐16核以及以上的配置。8核16G，按一两千的请求来配置，再高可能有危险，因为数据库的cpu、磁盘、io、内存负载都会很高，数据库压力过大就会宕机。16核32G，按两三千的请求来配置，甚至三四千也是有可能，再高的话，cpu、磁盘、io、内存、网络负载都会很高，数据库也有可能会扛不住宕机。如果是ssd磁盘，能抗的并发可能会更高一点，数据库最大的复杂就在于磁盘的io，需要大量的读写磁盘文件。

8C16G 平均一两千并发； 16C32G 平均两三千，甚至三四千都是有可能；


## 监控


## 配置优化


## 使用优化

show profiles;


## explain

**少了两个图片**

![](./images/2023-10-24-18-14-23.png#id=Zhycc&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)





![](./images/2023-10-24-18-14-24.png#id=TUxIt&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

可以模拟优化器执行SQL语句，主要用来查看优化器是如何执行SQL语句的，用法是 explain + [你的SQL] ，结果是一个表。

MySQL.5.7 后，默认 explain 结果多了两列：  partitions 和 filtered 。




### id

表示查询中子查询的顺序或者操作的顺序。

根据id的值分成不同的组，一个id代表一个组：

- id值越大的组优先级越高，越先执行；
- id值越小的组的优先级越低，越后执行；
- id相同的组内，按照从上往下的顺序执行；
- id=null最后执行，一般为临时表，临时表在SQL是不存在的；


### select_type

表示查询的类型。主要用于区别 普通查询、联合查询、子查询等的复杂查询。

有如下的值：

- SIMPLE ： 简单的select查询，查询中不包含子查询或者UNION
- PRIMARY ： 查询中若包含任何复杂的子部分，最外层查询则被标记为 PRIMARY
- SUBQUERY ： 在SELECT或者WHERE列表中包含的子查询
- DERIVED ： 在FROM列表中包含的子查询被标记为DERIVED（衍生） MySQL会递归执行这些子查询，把结果放在临时表里。
- UNION ： 若第二个SELECT出现在UNION之后，则被标记为UNION; 若UNION包含在FROM子句的子查询中，外层SELECT将被标记为：DERIVED
- UNION RESULT : 从UNION表获取结果的SELECT


### table

对应行查询的表。并不一定是真实存在的表，有别名显示别名，也可能为临时表。

- 当 from 子句中有子查询时，table 列为是 `<derivenN>` 的格式，表示这一行的执行的是 id = N 行的查询。
- 当有 union 时，table 的数据为 `<union M,N>` 的格式，M 和 N 表示参与 union 的 select 行id。


### partitions

MySQL提供一种机制，这种机制会把一张表中的数据放到不同的数据库文件中，这些文件可以放到同一块磁盘上，也可以放到不同的磁盘上。这一列表示查询的是哪个分区上的文件。

Null表示没有分区。


### type

查询的类型。

- system ： 表里面只有一条记录，连一个页都占不满；
- const ： 单表查询中使用了唯一索引（包括主键索引和unique索引），只匹配到一行数据；
- eq_ref ： 链表查询中使用了唯一索引（包括主键索引和unique索引），最多只匹配到一行数据；
- ref ： 使用了非唯一索引，会返回匹配某个单独值的所有行；
- ref or null ： 同样是使用了非唯一索引，但是可以搜索值为NULL的行；
- index_merge
- range ：
- index ： 使用了覆盖索引，直接匹配到覆盖索引的节点数据；
- all

