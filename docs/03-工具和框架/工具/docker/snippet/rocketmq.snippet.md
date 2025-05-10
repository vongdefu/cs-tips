```shsh
https://blog.csdn.net/qq_28410283/article/details/115855940
https://juejin.cn/post/7045944869642043422

# 使用docker安装
https://github.com/apache/rocketmq-docker


## 在mac上下载
git clone https://github.com/apache/rocketmq-docker.git

## 上传到服务器上
scp -r rocketmq-docker root@192.168.1.150:/home/resource


## 在服务器上打开，并执行
cd image-build
sh build-image.sh 4.5.0 centos
sh build-image-dashboard.sh 1.0.0 centos


## 创建docker挂载的卷
mkdir -p /mydata/rocketmq/data/namesrv/logs \
/mydata/rocketmq/data/namesrv/store \
/mydata/rocketmq/data/broker/logs \
/mydata/rocketmq/data/broker/store \
/mydata/rocketmq/etc/broker

## 创建配置文件
vi /mydata/rocketmq/etc/broker/broker.conf

brokerClusterName = DefaultCluster
brokerName = broker-a
brokerId = 0
deleteWhen = 04
fileReservedTime = 48
brokerRole = ASYNC_MASTER
flushDiskType = ASYNC_FLUSH
# Docker环境需要设置成宿主机IP
#brokerIP1 = {docker宿主机IP}
brokerIP1 = 192.168.56.10

## 创建compose构建文件的目录
mkdir /mydata/rocketmq/docker-compose

## 创建compose文件，【注意】，创建之前需要先查看一下上面操作步骤构建的镜像及其版本，不同时期的版本不一样，需要保持compose文件中的镜像版本与自己构建的版本的一致性；
vi docker-compose.yml

version: '3'
services:
  #Service for nameserver
  namesrv:
    image: apache/rocketmq:4.5.0
    container_name: rmqnamesrv
    restart: always
    ports:
      - 9876:9876
    volumes:
      - /mydata/rocketmq/data/namesrv/logs:/root/logs
    command: sh mqnamesrv

  #Service for broker
  broker:
    image: apache/rocketmq:4.5.0
    container_name: rmqbroker
    restart: always
    links:
      - namesrv
    depends_on:
      - namesrv
    ports:
      - 10909:10909
      - 10911:10911
      - 10912:10912
    volumes:
      - /mydata/rocketmq/data/broker/logs:/home/rocketmq/logs
      - /mydata/rocketmq/data/broker/store:/home/rocketmq/store
      - /mydata/rocketmq/etc/broker/broker.conf:/home/rocketmq/conf/broker.conf
    command: sh mqbroker -c /home/rocketmq/conf/broker.conf

  #Service for rocketmq-dashboard
  dashboard:
    image: apache/rocketmq-dashboard:1.0.0-centos
    container_name: rmqdashboard
    restart: always
    ports:
      - 8080:8080
    links:
      - namesrv
    depends_on:
      - namesrv
    environment:
      - NAMESRV_ADDR=namesrv:9876

## 启动
cd /mydata/rocketmq/docker-compose
docker-compose up -d

## 验证

http://192.168.1.150:8080/#/
```
