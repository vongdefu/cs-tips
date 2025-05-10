
```
# 拉取镜像
docker pull mysql:5.7

# 把镜像中的配置文件拷贝到本地
docker cp mysql:/etc/mysql/my.cnf /mydata/mysql/conf/my.cnf

# 启动
docker run -p 3306:3306 --name mysql \
--restart always \
-v /mydata/mysql/log:/var/log/mysql \
-v /mydata/mysql/data:/var/lib/mysql \
-v /mydata/mysql/conf/my.cnf:/etc/mysql/my.cnf \
-v /etc/localtime:/etc/localtime \
-e MYSQL_ROOT_PASSWORD=root \
-d mysql:5.7


// 拉取镜像
[root@home docker]# docker pull mysql:5.7

5.7: Pulling from library/mysql
72a69066d2fe: Pull complete 
93619dbc5b36: Pull complete 
99da31dd6142: Pull complete 
626033c43d70: Pull complete 
37d5d7efb64e: Pull complete 
ac563158d721: Pull complete 
d2ba16033dad: Pull complete 
0ceb82207cd7: Pull complete 
37f2405cae96: Pull complete 
e2482e017e53: Pull complete 
70deed891d42: Pull complete 
Digest: sha256:f2ad209efe9c67104167fc609cca6973c8422939491c9345270175a300419f94
Status: Downloaded newer image for mysql:5.7
docker.io/library/mysql:5.7

// 安装 
[root@home docker]# docker run -p 3306:3306 --name mysql \
> -v /mnt/doc/docker/mysql/log:/var/log/mysql \
> -v /mnt/doc/docker/mysql/data:/var/lib/mysql \
> -v /mnt/doc/docker/mysql/conf:/etc/mysql \
> -e MYSQL_ROOT_PASSWORD=root \
> -d mysql:5.7
0a4457b1eac5dbfdba0f483db94aeb4fd42652d9f893094cf34daa0f4877116d
[root@home docker]# docker ps -a
CONTAINER ID   IMAGE       COMMAND                   CREATED         STATUS         PORTS                                                  NAMES
0a4457b1eac5   mysql:5.7   "docker-entrypoint.s…"   6 seconds ago   Up 5 seconds   0.0.0.0:3306->3306/tcp, :::3306->3306/tcp, 33060/tcp   mysql
[root@home docker]# cd /mnt/doc/docker/
[root@home mysql]# cd conf/
[root@home conf]# ll
总用量 0

// 创建配置文件
[root@home conf]# vi my.cnf

[client]
default-character-set=utf8mb4
[mysql]
default-character-set=utf8mb4
[mysqld]
init_connect='SET collation_connection = utf8mb4_unicode_ci'
init_connect='SET NAMES utf8mb4'
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
skip-character-set-client-handshake
skip-name-resolve

// 重启mysql
[root@home conf]# docker restart mysql
mysql
[root@home conf]# docker ps
CONTAINER ID   IMAGE       COMMAND                   CREATED         STATUS          PORTS                                                  NAMES
0a4457b1eac5   mysql:5.7   "docker-entrypoint.s…"   6 minutes ago   Up 10 seconds   0.0.0.0:3306->3306/tcp, :::3306->3306/tcp, 33060/tcp   mysql

// 设置开机自启
[root@home conf]# docker update mysql --restart=always
mysql

// 解决时间问题
[root@home conf]# docker exec -it mysql bash
root@0a4457b1eac5:/# date
Sat Oct  7 12:58:45 UTC 2023
root@0a4457b1eac5:/# ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
root@0a4457b1eac5:/# date
Sat Oct  7 20:58:57 CST 2023
root@0a4457b1eac5:/# exit
exit

// 最后重启
[root@home conf]# docker restart mysql
mysql

```

解决时间差8小时的问题

1. 在客户端输入 select now(); 发现查了8小时
2. 进入 mysql 服务端： docker exec -it mysql bash
3. 查看mysql服务端当前时间： date ，发现差了8小时
4. 直接修改时区为上海： ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime ，再次输入 date，发现时间已经正常
5. 重启mysql服务端

#### 5.2.2. 主从分离

> 说明：
> 由于实验过程要求创建千万级别的数据，为了避免在主从同步的过程中出现问题。我们采用现在单例数据库上面上创建一个千万级数据，之后备份下来。再搭建三个数据库实例，之后把数据依次恢复到三个实例上，然后再建立主从关系，最后开启主从复制的过程。
> **当然如果不需要关注千万级数据，那么我们只需要依次创建三个实例，之后建立主从关系，最后开启主从复制过程即可。也就是只需要执行「执行创建过程」、「开启主从复制过程」两个步骤即可。**

##### 5.2.2.1. 生成千万级数据的备份SQL

```bash
// 把之前的单例mysql中已经生成的千万级数据备份成sql语句
docker exec mysql sh -c 'exec mysqldump --databases monomer_order -uroot -proot' > /mydata/backupsqls/mysql/monomer_order.sql

```

##### 5.2.2.2. 三个单例mysql的搭建过程

###### 5.2.2.2.1. master搭建过程

> 让主机的3307端口映射出去。注意： binlog_format 推荐使用row，具体参考【[这里](https://help.aliyun.com/document_detail/67809.html)】。

```bash
// 创建容器
docker run -p 3307:3306 --name mysql-master \
-v /mydata/mysql-master/log:/var/log/mysql \
-v /mydata/mysql-master/data:/var/lib/mysql \
-v /mydata/mysql-master/conf:/etc/mysql \
-e MYSQL_ROOT_PASSWORD=root \
-d mysql:5.7

// 创建配置文件
vi /mydata/mysql-master/conf/my.cnf

[client]
default-character-set=utf8mb4
[mysql]
default-character-set=utf8mb4
[mysqld]
character-set-server=utf8mb4
default-time_zone='+8:00'
server_id=100
log_bin=master-bin
binlog_format=ROW
slow-query-log-file=/var/log/mysql/slow-query.log
long_query_time=1

// 设置开机自启动，并重启
docker update mysql-master --restart=always
docker restart mysql-master

// 创建主从复制的用户信息
docker exec -it mysql-master /bin/bash
mysql -uroot -proot
CREATE USER 'slave'@'%' IDENTIFIED BY '123456';

GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'slave'@'%';

flush privileges;


```

###### 5.2.2.2.2. slave01搭建过程

> 让主机的3308端口映射出去。

```bash
// 创建容器
docker run -p 3308:3306 --name mysql-slave01 \
-v /mydata/mysql-slave01/log:/var/log/mysql \
-v /mydata/mysql-slave01/data:/var/lib/mysql \
-v /mydata/mysql-slave01/conf:/etc/mysql \
-e MYSQL_ROOT_PASSWORD=root \
-d mysql:5.7

// 创建配置文件
vi /mydata/mysql-slave01/conf/my.cnf

[client]
default-character-set=utf8mb4
[mysql]
default-character-set=utf8mb4
[mysqld]
character-set-server=utf8mb4
default-time_zone='+8:00'
server_id=101
log_bin=slave01-bin
relay_log=mysql-relay-bin

// 设置开机自启动，并重启
docker update mysql-slave01 --restart=always
docker restart mysql-slave01

```

###### 5.2.2.2.3. slave02搭建过程

> 让主机的3309端口映射出去。

```bash
// 创建容器
docker run -p 3309:3306 --name mysql-slave02 \
-v /mydata/mysql-slave02/log:/var/log/mysql \
-v /mydata/mysql-slave02/data:/var/lib/mysql \
-v /mydata/mysql-slave02/conf:/etc/mysql \
-e MYSQL_ROOT_PASSWORD=root \
-d mysql:5.7

// 创建配置文件
vi /mydata/mysql-slave02/conf/my.cnf

[client]
default-character-set=utf8mb4
[mysql]
default-character-set=utf8mb4
[mysqld]
character-set-server=utf8mb4
default-time_zone='+8:00'
server_id=102
log_bin=slave01-bin
relay_log=mysql-relay-bin

// 设置开机自启动，并重启
docker update mysql-slave02 --restart=always
docker restart mysql-slave02

```

##### 5.2.2.3. 恢复数据到三个实例中

> 由于数据量很大，我们采用先恢复数据到库里面的方式，让三个数据库实例的数据保持一致，之后再进行主从复制。

```bash
docker exec -i mysql-master sh -c 'exec mysql -uroot -proot' < /mydata/backupsqls/mysql/monomer_order.sql
docker exec -i mysql-slave01 sh -c 'exec mysql -uroot -proot' < /mydata/backupsqls/mysql/monomer_order.sql
docker exec -i mysql-slave02 sh -c 'exec mysql -uroot -proot' < /mydata/backupsqls/mysql/monomer_order.sql

```

##### 5.2.2.4. 开启从数据库实例的主从复制过程
>
> 主要分两个步骤：
>
> 1. 记录主库的位置信息；
> 2. 设置从库与主库的通信的相关信息，并在主库中开启主从复制过程；

```bash

////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// 1. 获取master的数据位置
////////////////////////////////////////////////////////////////////////////////////////////////////
docker exec -it mysql-master /bin/bash
mysql -uroot -proot
show master status;


////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// 2. 配置slave01
////////////////////////////////////////////////////////////////////////////////////////////////////
// 1. 进入slave01内部命令行
docker exec -it mysql-slave01 /bin/bash
mysql -uroot -proot

// 2. 设置主从复制的起始位置
CHANGE MASTER TO MASTER_HOST='192.168.1.150',MASTER_USER='slave',MASTER_PASSWORD='123456', \
MASTER_PORT=3307,MASTER_LOG_FILE='master-bin.000005',MASTER_LOG_POS=145291152;

// 3. 开始主从复制，并查看主从复制的状态
start slave;
show slave status\G

////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// 3. 配置slave02
////////////////////////////////////////////////////////////////////////////////////////////////////
// 1. 进入slave02内部命令行
docker exec -it mysql-slave02 /bin/bash
mysql -uroot -proot


// 2. 设置主从复制的起始位置
CHANGE MASTER TO MASTER_HOST='192.168.1.150',MASTER_USER='slave',MASTER_PASSWORD='123456', \
MASTER_PORT=3307,MASTER_LOG_FILE='master-bin.000005',MASTER_LOG_POS=145291152;

// 3. 开始主从复制，并查看主从复制的状态
start slave;
show slave status\G

////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// 4. 测试并验证
////////////////////////////////////////////////////////////////////////////////////////////////////
// 成功！！！done！！！

```
