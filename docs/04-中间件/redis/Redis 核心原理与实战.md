# Redis 核心原理与实战

- 线程模型与内存模型
- 支持的数据结构与各自使用方式、场景
- 持久化
  - RDB： 原理、配置过程及参数、优缺点
  - AOF： 原理、配置过程及参数、优缺点
  - 混合方式： 原理、配置过程及参数、优缺点
- rewrite 机制
- 事务（使用方式、特性）
- 主从复制
  - 部署方式
  - 基本原理
- 集群配置
  - 部署方式
  - 分片原理
- 哨兵模式
  - 部署方式
  - 原理
- 读写分离
  - 实现过程
- key 过期策略
- 经典缓存问题
  - key 竞争
  - db 与缓存双写一致性问题
  - 缓存穿透
  - 缓存击穿
  - 缓存雪崩
  - 缓存预热
  - 缓存降级
  - 热点数据
  - 大 key 打满网卡
  - 单节点负载过高
  - QPS 统计

---

## 01 Redis 是如何执行的

- socket 基础知识
- IO 多路复用
- redis 执行过程

## 02 Redis 快速搭建与使用

- redis 特性
  - 支持多种数据存储类型
  - 功能完善
  - 支持多种语言
  - 高性能
  - 社区活跃度高
- 安装过程（Linux 平台）
  - 下载安装包，然后解压后，进行 make install 即可；
  - 启动时： redis-server redis.conf
- 使用
  - `redis-server` 启动 Redis
  - `redis-cli` Redis 命令行工具
  - `redis-benchmark` 基准测试工具
  - `redis-check-aof` AOF 持久化文件检测工具和修复工具
  - `redis-check-dump` RDB 持久化文件检测工具和修复工具
  - `redis-sentinel` 启动 redis-sentinel
- 启动
  - 使用 `redis-server` 直接启动 redis 的服务端
- 连接 redis
  - 使用 `redis-cli` 进行连接
  - 使用可视化客户端进行连接

[redis 安装包的下载地址](https://download.redis.io/releases/)
此教程使用的版本： redis-5.0.7
redis 是 c 语言编写的软件，在此之前可以先了解一下 c 语言在 Linux 上的构建过程：[Linux 下 C 语言开发](https://blog.csdn.net/first_bug/article/details/122540557)

## 03 Redis 持久化——RDB

解压安装包之后，可以在其中找到名为【redis.conf】的配置文件，文件内容如下：

```
# Redis configuration file example.
#
# Note that in order to read the configuration file, Redis must be
# started with the file path as first argument:
#
# ./redis-server /path/to/redis.conf

# Note on units: when memory size is needed, it is possible to specify
# it in the usual form of 1k 5GB 4M and so forth:
#
# 1k => 1000 bytes
# 1kb => 1024 bytes
# 1m => 1000000 bytes
# 1mb => 1024*1024 bytes
# 1g => 1000000000 bytes
# 1gb => 1024*1024*1024 bytes
#
# units are case insensitive so 1GB 1Gb 1gB are all the same.

################################## INCLUDES ###################################

# Include one or more other config files here.  This is useful if you
# have a standard template that goes to all Redis servers but also need
# to customize a few per-server settings.  Include files can include
# other files, so use this wisely.
#
# Notice option "include" won't be rewritten by command "CONFIG REWRITE"
# from admin or Redis Sentinel. Since Redis always uses the last processed
# line as value of a configuration directive, you'd better put includes
# at the beginning of this file to avoid overwriting config change at runtime.
#
# If instead you are interested in using includes to override configuration
# options, it is better to use include as the last line.
#
# include /path/to/local.conf
# include /path/to/other.conf

################################## MODULES #####################################

# Load modules at startup. If the server is not able to load modules
# it will abort. It is possible to use multiple loadmodule directives.
#
# loadmodule /path/to/my_module.so
# loadmodule /path/to/other_module.so

################################## NETWORK #####################################

# By default, if no "bind" configuration directive is specified, Redis listens
# for connections from all the network interfaces available on the server.
# It is possible to listen to just one or multiple selected interfaces using
# the "bind" configuration directive, followed by one or more IP addresses.
#
# Examples:
#
# bind 192.168.1.100 10.0.0.1
# bind 127.0.0.1 ::1
#
# ~~~ WARNING ~~~ If the computer running Redis is directly exposed to the
# internet, binding to all the interfaces is dangerous and will expose the
# instance to everybody on the internet. So by default we uncomment the
# following bind directive, that will force Redis to listen only into
# the IPv4 loopback interface address (this means Redis will be able to
# accept connections only from clients running into the same computer it
# is running).
#
# IF YOU ARE SURE YOU WANT YOUR INSTANCE TO LISTEN TO ALL THE INTERFACES
# JUST COMMENT THE FOLLOWING LINE.
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
bind 127.0.0.1

# Protected mode is a layer of security protection, in order to avoid that
# Redis instances left open on the internet are accessed and exploited.
#
# When protected mode is on and if:
#
# 1) The server is not binding explicitly to a set of addresses using the
#    "bind" directive.
# 2) No password is configured.
#
# The server only accepts connections from clients connecting from the
# IPv4 and IPv6 loopback addresses 127.0.0.1 and ::1, and from Unix domain
# sockets.
#
# By default protected mode is enabled. You should disable it only if
# you are sure you want clients from other hosts to connect to Redis
# even if no authentication is configured, nor a specific set of interfaces
# are explicitly listed using the "bind" directive.
protected-mode yes

# Accept connections on the specified port, default is 6379 (IANA #815344).
# If port 0 is specified Redis will not listen on a TCP socket.
port 6379

# TCP listen() backlog.
#
# In high requests-per-second environments you need an high backlog in order
# to avoid slow clients connections issues. Note that the Linux kernel
# will silently truncate it to the value of /proc/sys/net/core/somaxconn so
# make sure to raise both the value of somaxconn and tcp_max_syn_backlog
# in order to get the desired effect.
tcp-backlog 511

# Unix socket.
#
# Specify the path for the Unix socket that will be used to listen for
# incoming connections. There is no default, so Redis will not listen
# on a unix socket when not specified.
#
# unixsocket /tmp/redis.sock
# unixsocketperm 700

# Close the connection after a client is idle for N seconds (0 to disable)
timeout 0

# TCP keepalive.
#
# If non-zero, use SO_KEEPALIVE to send TCP ACKs to clients in absence
# of communication. This is useful for two reasons:
#
# 1) Detect dead peers.
# 2) Take the connection alive from the point of view of network
#    equipment in the middle.
#
# On Linux, the specified value (in seconds) is the period used to send ACKs.
# Note that to close the connection the double of the time is needed.
# On other kernels the period depends on the kernel configuration.
#
# A reasonable value for this option is 300 seconds, which is the new
# Redis default starting with Redis 3.2.1.
tcp-keepalive 300

################################# GENERAL #####################################

# By default Redis does not run as a daemon. Use 'yes' if you need it.
# Note that Redis will write a pid file in /var/run/redis.pid when daemonized.
daemonize no

# If you run Redis from upstart or systemd, Redis can interact with your
# supervision tree. Options:
#   supervised no      - no supervision interaction
#   supervised upstart - signal upstart by putting Redis into SIGSTOP mode
#   supervised systemd - signal systemd by writing READY=1 to $NOTIFY_SOCKET
#   supervised auto    - detect upstart or systemd method based on
#                        UPSTART_JOB or NOTIFY_SOCKET environment variables
# Note: these supervision methods only signal "process is ready."
#       They do not enable continuous liveness pings back to your supervisor.
supervised no

# If a pid file is specified, Redis writes it where specified at startup
# and removes it at exit.
#
# When the server runs non daemonized, no pid file is created if none is
# specified in the configuration. When the server is daemonized, the pid file
# is used even if not specified, defaulting to "/var/run/redis.pid".
#
# Creating a pid file is best effort: if Redis is not able to create it
# nothing bad happens, the server will start and run normally.
pidfile /var/run/redis_6379.pid

# Specify the server verbosity level.
# This can be one of:
# debug (a lot of information, useful for development/testing)
# verbose (many rarely useful info, but not a mess like the debug level)
# notice (moderately verbose, what you want in production probably)
# warning (only very important / critical messages are logged)
loglevel notice

# Specify the log file name. Also the empty string can be used to force
# Redis to log on the standard output. Note that if you use standard
# output for logging but daemonize, logs will be sent to /dev/null
logfile ""

# To enable logging to the system logger, just set 'syslog-enabled' to yes,
# and optionally update the other syslog parameters to suit your needs.
# syslog-enabled no

# Specify the syslog identity.
# syslog-ident redis

# Specify the syslog facility. Must be USER or between LOCAL0-LOCAL7.
# syslog-facility local0

# Set the number of databases. The default database is DB 0, you can select
# a different one on a per-connection basis using SELECT <dbid> where
# dbid is a number between 0 and 'databases'-1
databases 16

# By default Redis shows an ASCII art logo only when started to log to the
# standard output and if the standard output is a TTY. Basically this means
# that normally a logo is displayed only in interactive sessions.
#
# However it is possible to force the pre-4.0 behavior and always show a
# ASCII art logo in startup logs by setting the following option to yes.
always-show-logo yes

################################ SNAPSHOTTING  ################################
#
# Save the DB on disk:
#
#   save <seconds> <changes>
#
#   Will save the DB if both the given number of seconds and the given
#   number of write operations against the DB occurred.
#
#   In the example below the behaviour will be to save:
#   after 900 sec (15 min) if at least 1 key changed
#   after 300 sec (5 min) if at least 10 keys changed
#   after 60 sec if at least 10000 keys changed
#
#   Note: you can disable saving completely by commenting out all "save" lines.
#
#   It is also possible to remove all the previously configured save
#   points by adding a save directive with a single empty string argument
#   like in the following example:
#
#   save ""

save 900 1
save 300 10
save 60 10000

# By default Redis will stop accepting writes if RDB snapshots are enabled
# (at least one save point) and the latest background save failed.
# This will make the user aware (in a hard way) that data is not persisting
# on disk properly, otherwise chances are that no one will notice and some
# disaster will happen.
#
# If the background saving process will start working again Redis will
# automatically allow writes again.
#
# However if you have setup your proper monitoring of the Redis server
# and persistence, you may want to disable this feature so that Redis will
# continue to work as usual even if there are problems with disk,
# permissions, and so forth.
stop-writes-on-bgsave-error yes

# Compress string objects using LZF when dump .rdb databases?
# For default that's set to 'yes' as it's almost always a win.
# If you want to save some CPU in the saving child set it to 'no' but
# the dataset will likely be bigger if you have compressible values or keys.
rdbcompression yes

# Since version 5 of RDB a CRC64 checksum is placed at the end of the file.
# This makes the format more resistant to corruption but there is a performance
# hit to pay (around 10%) when saving and loading RDB files, so you can disable it
# for maximum performances.
#
# RDB files created with checksum disabled have a checksum of zero that will
# tell the loading code to skip the check.
rdbchecksum yes

# The filename where to dump the DB
dbfilename dump.rdb

# The working directory.
#
# The DB will be written inside this directory, with the filename specified
# above using the 'dbfilename' configuration directive.
#
# The Append Only File will also be created inside this directory.
#
# Note that you must specify a directory here, not a file name.
dir ./

################################# REPLICATION #################################

# Master-Replica replication. Use replicaof to make a Redis instance a copy of
# another Redis server. A few things to understand ASAP about Redis replication.
#
#   +------------------+      +---------------+
#   |      Master      | ---> |    Replica    |
#   | (receive writes) |      |  (exact copy) |
#   +------------------+      +---------------+
#
# 1) Redis replication is asynchronous, but you can configure a master to
#    stop accepting writes if it appears to be not connected with at least
#    a given number of replicas.
# 2) Redis replicas are able to perform a partial resynchronization with the
#    master if the replication link is lost for a relatively small amount of
#    time. You may want to configure the replication backlog size (see the next
#    sections of this file) with a sensible value depending on your needs.
# 3) Replication is automatic and does not need user intervention. After a
#    network partition replicas automatically try to reconnect to masters
#    and resynchronize with them.
#
# replicaof <masterip> <masterport>

# If the master is password protected (using the "requirepass" configuration
# directive below) it is possible to tell the replica to authenticate before
# starting the replication synchronization process, otherwise the master will
# refuse the replica request.
#
# masterauth <master-password>

# When a replica loses its connection with the master, or when the replication
# is still in progress, the replica can act in two different ways:
#
# 1) if replica-serve-stale-data is set to 'yes' (the default) the replica will
#    still reply to client requests, possibly with out of date data, or the
#    data set may just be empty if this is the first synchronization.
#
# 2) if replica-serve-stale-data is set to 'no' the replica will reply with
#    an error "SYNC with master in progress" to all the kind of commands
#    but to INFO, replicaOF, AUTH, PING, SHUTDOWN, REPLCONF, ROLE, CONFIG,
#    SUBSCRIBE, UNSUBSCRIBE, PSUBSCRIBE, PUNSUBSCRIBE, PUBLISH, PUBSUB,
#    COMMAND, POST, HOST: and LATENCY.
#
replica-serve-stale-data yes

# You can configure a replica instance to accept writes or not. Writing against
# a replica instance may be useful to store some ephemeral data (because data
# written on a replica will be easily deleted after resync with the master) but
# may also cause problems if clients are writing to it because of a
# misconfiguration.
#
# Since Redis 2.6 by default replicas are read-only.
#
# Note: read only replicas are not designed to be exposed to untrusted clients
# on the internet. It's just a protection layer against misuse of the instance.
# Still a read only replica exports by default all the administrative commands
# such as CONFIG, DEBUG, and so forth. To a limited extent you can improve
# security of read only replicas using 'rename-command' to shadow all the
# administrative / dangerous commands.
replica-read-only yes

# Replication SYNC strategy: disk or socket.
#
# -------------------------------------------------------
# WARNING: DISKLESS REPLICATION IS EXPERIMENTAL CURRENTLY
# -------------------------------------------------------
#
# New replicas and reconnecting replicas that are not able to continue the replication
# process just receiving differences, need to do what is called a "full
# synchronization". An RDB file is transmitted from the master to the replicas.
# The transmission can happen in two different ways:
#
# 1) Disk-backed: The Redis master creates a new process that writes the RDB
#                 file on disk. Later the file is transferred by the parent
#                 process to the replicas incrementally.
# 2) Diskless: The Redis master creates a new process that directly writes the
#              RDB file to replica sockets, without touching the disk at all.
#
# With disk-backed replication, while the RDB file is generated, more replicas
# can be queued and served with the RDB file as soon as the current child producing
# the RDB file finishes its work. With diskless replication instead once
# the transfer starts, new replicas arriving will be queued and a new transfer
# will start when the current one terminates.
#
# When diskless replication is used, the master waits a configurable amount of
# time (in seconds) before starting the transfer in the hope that multiple replicas
# will arrive and the transfer can be parallelized.
#
# With slow disks and fast (large bandwidth) networks, diskless replication
# works better.
repl-diskless-sync no

# When diskless replication is enabled, it is possible to configure the delay
# the server waits in order to spawn the child that transfers the RDB via socket
# to the replicas.
#
# This is important since once the transfer starts, it is not possible to serve
# new replicas arriving, that will be queued for the next RDB transfer, so the server
# waits a delay in order to let more replicas arrive.
#
# The delay is specified in seconds, and by default is 5 seconds. To disable
# it entirely just set it to 0 seconds and the transfer will start ASAP.
repl-diskless-sync-delay 5

# Replicas send PINGs to server in a predefined interval. It's possible to change
# this interval with the repl_ping_replica_period option. The default value is 10
# seconds.
#
# repl-ping-replica-period 10

# The following option sets the replication timeout for:
#
# 1) Bulk transfer I/O during SYNC, from the point of view of replica.
# 2) Master timeout from the point of view of replicas (data, pings).
# 3) Replica timeout from the point of view of masters (REPLCONF ACK pings).
#
# It is important to make sure that this value is greater than the value
# specified for repl-ping-replica-period otherwise a timeout will be detected
# every time there is low traffic between the master and the replica.
#
# repl-timeout 60

# Disable TCP_NODELAY on the replica socket after SYNC?
#
# If you select "yes" Redis will use a smaller number of TCP packets and
# less bandwidth to send data to replicas. But this can add a delay for
# the data to appear on the replica side, up to 40 milliseconds with
# Linux kernels using a default configuration.
#
# If you select "no" the delay for data to appear on the replica side will
# be reduced but more bandwidth will be used for replication.
#
# By default we optimize for low latency, but in very high traffic conditions
# or when the master and replicas are many hops away, turning this to "yes" may
# be a good idea.
repl-disable-tcp-nodelay no

# Set the replication backlog size. The backlog is a buffer that accumulates
# replica data when replicas are disconnected for some time, so that when a replica
# wants to reconnect again, often a full resync is not needed, but a partial
# resync is enough, just passing the portion of data the replica missed while
# disconnected.
#
# The bigger the replication backlog, the longer the time the replica can be
# disconnected and later be able to perform a partial resynchronization.
#
# The backlog is only allocated once there is at least a replica connected.
#
# repl-backlog-size 1mb

# After a master has no longer connected replicas for some time, the backlog
# will be freed. The following option configures the amount of seconds that
# need to elapse, starting from the time the last replica disconnected, for
# the backlog buffer to be freed.
#
# Note that replicas never free the backlog for timeout, since they may be
# promoted to masters later, and should be able to correctly "partially
# resynchronize" with the replicas: hence they should always accumulate backlog.
#
# A value of 0 means to never release the backlog.
#
# repl-backlog-ttl 3600

# The replica priority is an integer number published by Redis in the INFO output.
# It is used by Redis Sentinel in order to select a replica to promote into a
# master if the master is no longer working correctly.
#
# A replica with a low priority number is considered better for promotion, so
# for instance if there are three replicas with priority 10, 100, 25 Sentinel will
# pick the one with priority 10, that is the lowest.
#
# However a special priority of 0 marks the replica as not able to perform the
# role of master, so a replica with priority of 0 will never be selected by
# Redis Sentinel for promotion.
#
# By default the priority is 100.
replica-priority 100

# It is possible for a master to stop accepting writes if there are less than
# N replicas connected, having a lag less or equal than M seconds.
#
# The N replicas need to be in "online" state.
#
# The lag in seconds, that must be <= the specified value, is calculated from
# the last ping received from the replica, that is usually sent every second.
#
# This option does not GUARANTEE that N replicas will accept the write, but
# will limit the window of exposure for lost writes in case not enough replicas
# are available, to the specified number of seconds.
#
# For example to require at least 3 replicas with a lag <= 10 seconds use:
#
# min-replicas-to-write 3
# min-replicas-max-lag 10
#
# Setting one or the other to 0 disables the feature.
#
# By default min-replicas-to-write is set to 0 (feature disabled) and
# min-replicas-max-lag is set to 10.

# A Redis master is able to list the address and port of the attached
# replicas in different ways. For example the "INFO replication" section
# offers this information, which is used, among other tools, by
# Redis Sentinel in order to discover replica instances.
# Another place where this info is available is in the output of the
# "ROLE" command of a master.
#
# The listed IP and address normally reported by a replica is obtained
# in the following way:
#
#   IP: The address is auto detected by checking the peer address
#   of the socket used by the replica to connect with the master.
#
#   Port: The port is communicated by the replica during the replication
#   handshake, and is normally the port that the replica is using to
#   listen for connections.
#
# However when port forwarding or Network Address Translation (NAT) is
# used, the replica may be actually reachable via different IP and port
# pairs. The following two options can be used by a replica in order to
# report to its master a specific set of IP and port, so that both INFO
# and ROLE will report those values.
#
# There is no need to use both the options if you need to override just
# the port or the IP address.
#
# replica-announce-ip 5.5.5.5
# replica-announce-port 1234

################################## SECURITY ###################################

# Require clients to issue AUTH <PASSWORD> before processing any other
# commands.  This might be useful in environments in which you do not trust
# others with access to the host running redis-server.
#
# This should stay commented out for backward compatibility and because most
# people do not need auth (e.g. they run their own servers).
#
# Warning: since Redis is pretty fast an outside user can try up to
# 150k passwords per second against a good box. This means that you should
# use a very strong password otherwise it will be very easy to break.
#
# requirepass foobared

# Command renaming.
#
# It is possible to change the name of dangerous commands in a shared
# environment. For instance the CONFIG command may be renamed into something
# hard to guess so that it will still be available for internal-use tools
# but not available for general clients.
#
# Example:
#
# rename-command CONFIG b840fc02d524045429941cc15f59e41cb7be6c52
#
# It is also possible to completely kill a command by renaming it into
# an empty string:
#
# rename-command CONFIG ""
#
# Please note that changing the name of commands that are logged into the
# AOF file or transmitted to replicas may cause problems.

################################### CLIENTS ####################################

# Set the max number of connected clients at the same time. By default
# this limit is set to 10000 clients, however if the Redis server is not
# able to configure the process file limit to allow for the specified limit
# the max number of allowed clients is set to the current file limit
# minus 32 (as Redis reserves a few file descriptors for internal uses).
#
# Once the limit is reached Redis will close all the new connections sending
# an error 'max number of clients reached'.
#
# maxclients 10000

############################## MEMORY MANAGEMENT ################################

# Set a memory usage limit to the specified amount of bytes.
# When the memory limit is reached Redis will try to remove keys
# according to the eviction policy selected (see maxmemory-policy).
#
# If Redis can't remove keys according to the policy, or if the policy is
# set to 'noeviction', Redis will start to reply with errors to commands
# that would use more memory, like SET, LPUSH, and so on, and will continue
# to reply to read-only commands like GET.
#
# This option is usually useful when using Redis as an LRU or LFU cache, or to
# set a hard memory limit for an instance (using the 'noeviction' policy).
#
# WARNING: If you have replicas attached to an instance with maxmemory on,
# the size of the output buffers needed to feed the replicas are subtracted
# from the used memory count, so that network problems / resyncs will
# not trigger a loop where keys are evicted, and in turn the output
# buffer of replicas is full with DELs of keys evicted triggering the deletion
# of more keys, and so forth until the database is completely emptied.
#
# In short... if you have replicas attached it is suggested that you set a lower
# limit for maxmemory so that there is some free RAM on the system for replica
# output buffers (but this is not needed if the policy is 'noeviction').
#
# maxmemory <bytes>

# MAXMEMORY POLICY: how Redis will select what to remove when maxmemory
# is reached. You can select among five behaviors:
#
# volatile-lru -> Evict using approximated LRU among the keys with an expire set.
# allkeys-lru -> Evict any key using approximated LRU.
# volatile-lfu -> Evict using approximated LFU among the keys with an expire set.
# allkeys-lfu -> Evict any key using approximated LFU.
# volatile-random -> Remove a random key among the ones with an expire set.
# allkeys-random -> Remove a random key, any key.
# volatile-ttl -> Remove the key with the nearest expire time (minor TTL)
# noeviction -> Don't evict anything, just return an error on write operations.
#
# LRU means Least Recently Used
# LFU means Least Frequently Used
#
# Both LRU, LFU and volatile-ttl are implemented using approximated
# randomized algorithms.
#
# Note: with any of the above policies, Redis will return an error on write
#       operations, when there are no suitable keys for eviction.
#
#       At the date of writing these commands are: set setnx setex append
#       incr decr rpush lpush rpushx lpushx linsert lset rpoplpush sadd
#       sinter sinterstore sunion sunionstore sdiff sdiffstore zadd zincrby
#       zunionstore zinterstore hset hsetnx hmset hincrby incrby decrby
#       getset mset msetnx exec sort
#
# The default is:
#
# maxmemory-policy noeviction

# LRU, LFU and minimal TTL algorithms are not precise algorithms but approximated
# algorithms (in order to save memory), so you can tune it for speed or
# accuracy. For default Redis will check five keys and pick the one that was
# used less recently, you can change the sample size using the following
# configuration directive.
#
# The default of 5 produces good enough results. 10 Approximates very closely
# true LRU but costs more CPU. 3 is faster but not very accurate.
#
# maxmemory-samples 5

# Starting from Redis 5, by default a replica will ignore its maxmemory setting
# (unless it is promoted to master after a failover or manually). It means
# that the eviction of keys will be just handled by the master, sending the
# DEL commands to the replica as keys evict in the master side.
#
# This behavior ensures that masters and replicas stay consistent, and is usually
# what you want, however if your replica is writable, or you want the replica to have
# a different memory setting, and you are sure all the writes performed to the
# replica are idempotent, then you may change this default (but be sure to understand
# what you are doing).
#
# Note that since the replica by default does not evict, it may end using more
# memory than the one set via maxmemory (there are certain buffers that may
# be larger on the replica, or data structures may sometimes take more memory and so
# forth). So make sure you monitor your replicas and make sure they have enough
# memory to never hit a real out-of-memory condition before the master hits
# the configured maxmemory setting.
#
# replica-ignore-maxmemory yes

############################# LAZY FREEING ####################################

# Redis has two primitives to delete keys. One is called DEL and is a blocking
# deletion of the object. It means that the server stops processing new commands
# in order to reclaim all the memory associated with an object in a synchronous
# way. If the key deleted is associated with a small object, the time needed
# in order to execute the DEL command is very small and comparable to most other
# O(1) or O(log_N) commands in Redis. However if the key is associated with an
# aggregated value containing millions of elements, the server can block for
# a long time (even seconds) in order to complete the operation.
#
# For the above reasons Redis also offers non blocking deletion primitives
# such as UNLINK (non blocking DEL) and the ASYNC option of FLUSHALL and
# FLUSHDB commands, in order to reclaim memory in background. Those commands
# are executed in constant time. Another thread will incrementally free the
# object in the background as fast as possible.
#
# DEL, UNLINK and ASYNC option of FLUSHALL and FLUSHDB are user-controlled.
# It's up to the design of the application to understand when it is a good
# idea to use one or the other. However the Redis server sometimes has to
# delete keys or flush the whole database as a side effect of other operations.
# Specifically Redis deletes objects independently of a user call in the
# following scenarios:
#
# 1) On eviction, because of the maxmemory and maxmemory policy configurations,
#    in order to make room for new data, without going over the specified
#    memory limit.
# 2) Because of expire: when a key with an associated time to live (see the
#    EXPIRE command) must be deleted from memory.
# 3) Because of a side effect of a command that stores data on a key that may
#    already exist. For example the RENAME command may delete the old key
#    content when it is replaced with another one. Similarly SUNIONSTORE
#    or SORT with STORE option may delete existing keys. The SET command
#    itself removes any old content of the specified key in order to replace
#    it with the specified string.
# 4) During replication, when a replica performs a full resynchronization with
#    its master, the content of the whole database is removed in order to
#    load the RDB file just transferred.
#
# In all the above cases the default is to delete objects in a blocking way,
# like if DEL was called. However you can configure each case specifically
# in order to instead release memory in a non-blocking way like if UNLINK
# was called, using the following configuration directives:

lazyfree-lazy-eviction no
lazyfree-lazy-expire no
lazyfree-lazy-server-del no
replica-lazy-flush no

############################## APPEND ONLY MODE ###############################

# By default Redis asynchronously dumps the dataset on disk. This mode is
# good enough in many applications, but an issue with the Redis process or
# a power outage may result into a few minutes of writes lost (depending on
# the configured save points).
#
# The Append Only File is an alternative persistence mode that provides
# much better durability. For instance using the default data fsync policy
# (see later in the config file) Redis can lose just one second of writes in a
# dramatic event like a server power outage, or a single write if something
# wrong with the Redis process itself happens, but the operating system is
# still running correctly.
#
# AOF and RDB persistence can be enabled at the same time without problems.
# If the AOF is enabled on startup Redis will load the AOF, that is the file
# with the better durability guarantees.
#
# Please check http://redis.io/topics/persistence for more information.

appendonly no

# The name of the append only file (default: "appendonly.aof")

appendfilename "appendonly.aof"

# The fsync() call tells the Operating System to actually write data on disk
# instead of waiting for more data in the output buffer. Some OS will really flush
# data on disk, some other OS will just try to do it ASAP.
#
# Redis supports three different modes:
#
# no: don't fsync, just let the OS flush the data when it wants. Faster.
# always: fsync after every write to the append only log. Slow, Safest.
# everysec: fsync only one time every second. Compromise.
#
# The default is "everysec", as that's usually the right compromise between
# speed and data safety. It's up to you to understand if you can relax this to
# "no" that will let the operating system flush the output buffer when
# it wants, for better performances (but if you can live with the idea of
# some data loss consider the default persistence mode that's snapshotting),
# or on the contrary, use "always" that's very slow but a bit safer than
# everysec.
#
# More details please check the following article:
# http://antirez.com/post/redis-persistence-demystified.html
#
# If unsure, use "everysec".

# appendfsync always
appendfsync everysec
# appendfsync no

# When the AOF fsync policy is set to always or everysec, and a background
# saving process (a background save or AOF log background rewriting) is
# performing a lot of I/O against the disk, in some Linux configurations
# Redis may block too long on the fsync() call. Note that there is no fix for
# this currently, as even performing fsync in a different thread will block
# our synchronous write(2) call.
#
# In order to mitigate this problem it's possible to use the following option
# that will prevent fsync() from being called in the main process while a
# BGSAVE or BGREWRITEAOF is in progress.
#
# This means that while another child is saving, the durability of Redis is
# the same as "appendfsync none". In practical terms, this means that it is
# possible to lose up to 30 seconds of log in the worst scenario (with the
# default Linux settings).
#
# If you have latency problems turn this to "yes". Otherwise leave it as
# "no" that is the safest pick from the point of view of durability.

no-appendfsync-on-rewrite no

# Automatic rewrite of the append only file.
# Redis is able to automatically rewrite the log file implicitly calling
# BGREWRITEAOF when the AOF log size grows by the specified percentage.
#
# This is how it works: Redis remembers the size of the AOF file after the
# latest rewrite (if no rewrite has happened since the restart, the size of
# the AOF at startup is used).
#
# This base size is compared to the current size. If the current size is
# bigger than the specified percentage, the rewrite is triggered. Also
# you need to specify a minimal size for the AOF file to be rewritten, this
# is useful to avoid rewriting the AOF file even if the percentage increase
# is reached but it is still pretty small.
#
# Specify a percentage of zero in order to disable the automatic AOF
# rewrite feature.

auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# An AOF file may be found to be truncated at the end during the Redis
# startup process, when the AOF data gets loaded back into memory.
# This may happen when the system where Redis is running
# crashes, especially when an ext4 filesystem is mounted without the
# data=ordered option (however this can't happen when Redis itself
# crashes or aborts but the operating system still works correctly).
#
# Redis can either exit with an error when this happens, or load as much
# data as possible (the default now) and start if the AOF file is found
# to be truncated at the end. The following option controls this behavior.
#
# If aof-load-truncated is set to yes, a truncated AOF file is loaded and
# the Redis server starts emitting a log to inform the user of the event.
# Otherwise if the option is set to no, the server aborts with an error
# and refuses to start. When the option is set to no, the user requires
# to fix the AOF file using the "redis-check-aof" utility before to restart
# the server.
#
# Note that if the AOF file will be found to be corrupted in the middle
# the server will still exit with an error. This option only applies when
# Redis will try to read more data from the AOF file but not enough bytes
# will be found.
aof-load-truncated yes

# When rewriting the AOF file, Redis is able to use an RDB preamble in the
# AOF file for faster rewrites and recoveries. When this option is turned
# on the rewritten AOF file is composed of two different stanzas:
#
#   [RDB file][AOF tail]
#
# When loading Redis recognizes that the AOF file starts with the "REDIS"
# string and loads the prefixed RDB file, and continues loading the AOF
# tail.
aof-use-rdb-preamble yes

################################ LUA SCRIPTING  ###############################

# Max execution time of a Lua script in milliseconds.
#
# If the maximum execution time is reached Redis will log that a script is
# still in execution after the maximum allowed time and will start to
# reply to queries with an error.
#
# When a long running script exceeds the maximum execution time only the
# SCRIPT KILL and SHUTDOWN NOSAVE commands are available. The first can be
# used to stop a script that did not yet called write commands. The second
# is the only way to shut down the server in the case a write command was
# already issued by the script but the user doesn't want to wait for the natural
# termination of the script.
#
# Set it to 0 or a negative value for unlimited execution without warnings.
lua-time-limit 5000

################################ REDIS CLUSTER  ###############################

# Normal Redis instances can't be part of a Redis Cluster; only nodes that are
# started as cluster nodes can. In order to start a Redis instance as a
# cluster node enable the cluster support uncommenting the following:
#
# cluster-enabled yes

# Every cluster node has a cluster configuration file. This file is not
# intended to be edited by hand. It is created and updated by Redis nodes.
# Every Redis Cluster node requires a different cluster configuration file.
# Make sure that instances running in the same system do not have
# overlapping cluster configuration file names.
#
# cluster-config-file nodes-6379.conf

# Cluster node timeout is the amount of milliseconds a node must be unreachable
# for it to be considered in failure state.
# Most other internal time limits are multiple of the node timeout.
#
# cluster-node-timeout 15000

# A replica of a failing master will avoid to start a failover if its data
# looks too old.
#
# There is no simple way for a replica to actually have an exact measure of
# its "data age", so the following two checks are performed:
#
# 1) If there are multiple replicas able to failover, they exchange messages
#    in order to try to give an advantage to the replica with the best
#    replication offset (more data from the master processed).
#    Replicas will try to get their rank by offset, and apply to the start
#    of the failover a delay proportional to their rank.
#
# 2) Every single replica computes the time of the last interaction with
#    its master. This can be the last ping or command received (if the master
#    is still in the "connected" state), or the time that elapsed since the
#    disconnection with the master (if the replication link is currently down).
#    If the last interaction is too old, the replica will not try to failover
#    at all.
#
# The point "2" can be tuned by user. Specifically a replica will not perform
# the failover if, since the last interaction with the master, the time
# elapsed is greater than:
#
#   (node-timeout * replica-validity-factor) + repl-ping-replica-period
#
# So for example if node-timeout is 30 seconds, and the replica-validity-factor
# is 10, and assuming a default repl-ping-replica-period of 10 seconds, the
# replica will not try to failover if it was not able to talk with the master
# for longer than 310 seconds.
#
# A large replica-validity-factor may allow replicas with too old data to failover
# a master, while a too small value may prevent the cluster from being able to
# elect a replica at all.
#
# For maximum availability, it is possible to set the replica-validity-factor
# to a value of 0, which means, that replicas will always try to failover the
# master regardless of the last time they interacted with the master.
# (However they'll always try to apply a delay proportional to their
# offset rank).
#
# Zero is the only value able to guarantee that when all the partitions heal
# the cluster will always be able to continue.
#
# cluster-replica-validity-factor 10

# Cluster replicas are able to migrate to orphaned masters, that are masters
# that are left without working replicas. This improves the cluster ability
# to resist to failures as otherwise an orphaned master can't be failed over
# in case of failure if it has no working replicas.
#
# Replicas migrate to orphaned masters only if there are still at least a
# given number of other working replicas for their old master. This number
# is the "migration barrier". A migration barrier of 1 means that a replica
# will migrate only if there is at least 1 other working replica for its master
# and so forth. It usually reflects the number of replicas you want for every
# master in your cluster.
#
# Default is 1 (replicas migrate only if their masters remain with at least
# one replica). To disable migration just set it to a very large value.
# A value of 0 can be set but is useful only for debugging and dangerous
# in production.
#
# cluster-migration-barrier 1

# By default Redis Cluster nodes stop accepting queries if they detect there
# is at least an hash slot uncovered (no available node is serving it).
# This way if the cluster is partially down (for example a range of hash slots
# are no longer covered) all the cluster becomes, eventually, unavailable.
# It automatically returns available as soon as all the slots are covered again.
#
# However sometimes you want the subset of the cluster which is working,
# to continue to accept queries for the part of the key space that is still
# covered. In order to do so, just set the cluster-require-full-coverage
# option to no.
#
# cluster-require-full-coverage yes

# This option, when set to yes, prevents replicas from trying to failover its
# master during master failures. However the master can still perform a
# manual failover, if forced to do so.
#
# This is useful in different scenarios, especially in the case of multiple
# data center operations, where we want one side to never be promoted if not
# in the case of a total DC failure.
#
# cluster-replica-no-failover no

# In order to setup your cluster make sure to read the documentation
# available at http://redis.io web site.

########################## CLUSTER DOCKER/NAT support  ########################

# In certain deployments, Redis Cluster nodes address discovery fails, because
# addresses are NAT-ted or because ports are forwarded (the typical case is
# Docker and other containers).
#
# In order to make Redis Cluster working in such environments, a static
# configuration where each node knows its public address is needed. The
# following two options are used for this scope, and are:
#
# * cluster-announce-ip
# * cluster-announce-port
# * cluster-announce-bus-port
#
# Each instruct the node about its address, client port, and cluster message
# bus port. The information is then published in the header of the bus packets
# so that other nodes will be able to correctly map the address of the node
# publishing the information.
#
# If the above options are not used, the normal Redis Cluster auto-detection
# will be used instead.
#
# Note that when remapped, the bus port may not be at the fixed offset of
# clients port + 10000, so you can specify any port and bus-port depending
# on how they get remapped. If the bus-port is not set, a fixed offset of
# 10000 will be used as usually.
#
# Example:
#
# cluster-announce-ip 10.1.1.5
# cluster-announce-port 6379
# cluster-announce-bus-port 6380

################################## SLOW LOG ###################################

# The Redis Slow Log is a system to log queries that exceeded a specified
# execution time. The execution time does not include the I/O operations
# like talking with the client, sending the reply and so forth,
# but just the time needed to actually execute the command (this is the only
# stage of command execution where the thread is blocked and can not serve
# other requests in the meantime).
#
# You can configure the slow log with two parameters: one tells Redis
# what is the execution time, in microseconds, to exceed in order for the
# command to get logged, and the other parameter is the length of the
# slow log. When a new command is logged the oldest one is removed from the
# queue of logged commands.

# The following time is expressed in microseconds, so 1000000 is equivalent
# to one second. Note that a negative number disables the slow log, while
# a value of zero forces the logging of every command.
slowlog-log-slower-than 10000

# There is no limit to this length. Just be aware that it will consume memory.
# You can reclaim memory used by the slow log with SLOWLOG RESET.
slowlog-max-len 128

################################ LATENCY MONITOR ##############################

# The Redis latency monitoring subsystem samples different operations
# at runtime in order to collect data related to possible sources of
# latency of a Redis instance.
#
# Via the LATENCY command this information is available to the user that can
# print graphs and obtain reports.
#
# The system only logs operations that were performed in a time equal or
# greater than the amount of milliseconds specified via the
# latency-monitor-threshold configuration directive. When its value is set
# to zero, the latency monitor is turned off.
#
# By default latency monitoring is disabled since it is mostly not needed
# if you don't have latency issues, and collecting data has a performance
# impact, that while very small, can be measured under big load. Latency
# monitoring can easily be enabled at runtime using the command
# "CONFIG SET latency-monitor-threshold <milliseconds>" if needed.
latency-monitor-threshold 0

############################# EVENT NOTIFICATION ##############################

# Redis can notify Pub/Sub clients about events happening in the key space.
# This feature is documented at http://redis.io/topics/notifications
#
# For instance if keyspace events notification is enabled, and a client
# performs a DEL operation on key "foo" stored in the Database 0, two
# messages will be published via Pub/Sub:
#
# PUBLISH __keyspace@0__:foo del
# PUBLISH __keyevent@0__:del foo
#
# It is possible to select the events that Redis will notify among a set
# of classes. Every class is identified by a single character:
#
#  K     Keyspace events, published with __keyspace@<db>__ prefix.
#  E     Keyevent events, published with __keyevent@<db>__ prefix.
#  g     Generic commands (non-type specific) like DEL, EXPIRE, RENAME, ...
#  $     String commands
#  l     List commands
#  s     Set commands
#  h     Hash commands
#  z     Sorted set commands
#  x     Expired events (events generated every time a key expires)
#  e     Evicted events (events generated when a key is evicted for maxmemory)
#  A     Alias for g$lshzxe, so that the "AKE" string means all the events.
#
#  The "notify-keyspace-events" takes as argument a string that is composed
#  of zero or multiple characters. The empty string means that notifications
#  are disabled.
#
#  Example: to enable list and generic events, from the point of view of the
#           event name, use:
#
#  notify-keyspace-events Elg
#
#  Example 2: to get the stream of the expired keys subscribing to channel
#             name __keyevent@0__:expired use:
#
#  notify-keyspace-events Ex
#
#  By default all notifications are disabled because most users don't need
#  this feature and the feature has some overhead. Note that if you don't
#  specify at least one of K or E, no events will be delivered.
notify-keyspace-events ""

############################### ADVANCED CONFIG ###############################

# Hashes are encoded using a memory efficient data structure when they have a
# small number of entries, and the biggest entry does not exceed a given
# threshold. These thresholds can be configured using the following directives.
hash-max-ziplist-entries 512
hash-max-ziplist-value 64

# Lists are also encoded in a special way to save a lot of space.
# The number of entries allowed per internal list node can be specified
# as a fixed maximum size or a maximum number of elements.
# For a fixed maximum size, use -5 through -1, meaning:
# -5: max size: 64 Kb  <-- not recommended for normal workloads
# -4: max size: 32 Kb  <-- not recommended
# -3: max size: 16 Kb  <-- probably not recommended
# -2: max size: 8 Kb   <-- good
# -1: max size: 4 Kb   <-- good
# Positive numbers mean store up to _exactly_ that number of elements
# per list node.
# The highest performing option is usually -2 (8 Kb size) or -1 (4 Kb size),
# but if your use case is unique, adjust the settings as necessary.
list-max-ziplist-size -2

# Lists may also be compressed.
# Compress depth is the number of quicklist ziplist nodes from *each* side of
# the list to *exclude* from compression.  The head and tail of the list
# are always uncompressed for fast push/pop operations.  Settings are:
# 0: disable all list compression
# 1: depth 1 means "don't start compressing until after 1 node into the list,
#    going from either the head or tail"
#    So: [head]->node->node->...->node->[tail]
#    [head], [tail] will always be uncompressed; inner nodes will compress.
# 2: [head]->[next]->node->node->...->node->[prev]->[tail]
#    2 here means: don't compress head or head->next or tail->prev or tail,
#    but compress all nodes between them.
# 3: [head]->[next]->[next]->node->node->...->node->[prev]->[prev]->[tail]
# etc.
list-compress-depth 0

# Sets have a special encoding in just one case: when a set is composed
# of just strings that happen to be integers in radix 10 in the range
# of 64 bit signed integers.
# The following configuration setting sets the limit in the size of the
# set in order to use this special memory saving encoding.
set-max-intset-entries 512

# Similarly to hashes and lists, sorted sets are also specially encoded in
# order to save a lot of space. This encoding is only used when the length and
# elements of a sorted set are below the following limits:
zset-max-ziplist-entries 128
zset-max-ziplist-value 64

# HyperLogLog sparse representation bytes limit. The limit includes the
# 16 bytes header. When an HyperLogLog using the sparse representation crosses
# this limit, it is converted into the dense representation.
#
# A value greater than 16000 is totally useless, since at that point the
# dense representation is more memory efficient.
#
# The suggested value is ~ 3000 in order to have the benefits of
# the space efficient encoding without slowing down too much PFADD,
# which is O(N) with the sparse encoding. The value can be raised to
# ~ 10000 when CPU is not a concern, but space is, and the data set is
# composed of many HyperLogLogs with cardinality in the 0 - 15000 range.
hll-sparse-max-bytes 3000

# Streams macro node max size / items. The stream data structure is a radix
# tree of big nodes that encode multiple items inside. Using this configuration
# it is possible to configure how big a single node can be in bytes, and the
# maximum number of items it may contain before switching to a new node when
# appending new stream entries. If any of the following settings are set to
# zero, the limit is ignored, so for instance it is possible to set just a
# max entires limit by setting max-bytes to 0 and max-entries to the desired
# value.
stream-node-max-bytes 4096
stream-node-max-entries 100

# Active rehashing uses 1 millisecond every 100 milliseconds of CPU time in
# order to help rehashing the main Redis hash table (the one mapping top-level
# keys to values). The hash table implementation Redis uses (see dict.c)
# performs a lazy rehashing: the more operation you run into a hash table
# that is rehashing, the more rehashing "steps" are performed, so if the
# server is idle the rehashing is never complete and some more memory is used
# by the hash table.
#
# The default is to use this millisecond 10 times every second in order to
# actively rehash the main dictionaries, freeing memory when possible.
#
# If unsure:
# use "activerehashing no" if you have hard latency requirements and it is
# not a good thing in your environment that Redis can reply from time to time
# to queries with 2 milliseconds delay.
#
# use "activerehashing yes" if you don't have such hard requirements but
# want to free memory asap when possible.
activerehashing yes

# The client output buffer limits can be used to force disconnection of clients
# that are not reading data from the server fast enough for some reason (a
# common reason is that a Pub/Sub client can't consume messages as fast as the
# publisher can produce them).
#
# The limit can be set differently for the three different classes of clients:
#
# normal -> normal clients including MONITOR clients
# replica  -> replica clients
# pubsub -> clients subscribed to at least one pubsub channel or pattern
#
# The syntax of every client-output-buffer-limit directive is the following:
#
# client-output-buffer-limit <class> <hard limit> <soft limit> <soft seconds>
#
# A client is immediately disconnected once the hard limit is reached, or if
# the soft limit is reached and remains reached for the specified number of
# seconds (continuously).
# So for instance if the hard limit is 32 megabytes and the soft limit is
# 16 megabytes / 10 seconds, the client will get disconnected immediately
# if the size of the output buffers reach 32 megabytes, but will also get
# disconnected if the client reaches 16 megabytes and continuously overcomes
# the limit for 10 seconds.
#
# By default normal clients are not limited because they don't receive data
# without asking (in a push way), but just after a request, so only
# asynchronous clients may create a scenario where data is requested faster
# than it can read.
#
# Instead there is a default limit for pubsub and replica clients, since
# subscribers and replicas receive data in a push fashion.
#
# Both the hard or the soft limit can be disabled by setting them to zero.
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60

# Client query buffers accumulate new commands. They are limited to a fixed
# amount by default in order to avoid that a protocol desynchronization (for
# instance due to a bug in the client) will lead to unbound memory usage in
# the query buffer. However you can configure it here if you have very special
# needs, such us huge multi/exec requests or alike.
#
# client-query-buffer-limit 1gb

# In the Redis protocol, bulk requests, that are, elements representing single
# strings, are normally limited ot 512 mb. However you can change this limit
# here.
#
# proto-max-bulk-len 512mb

# Redis calls an internal function to perform many background tasks, like
# closing connections of clients in timeout, purging expired keys that are
# never requested, and so forth.
#
# Not all tasks are performed with the same frequency, but Redis checks for
# tasks to perform according to the specified "hz" value.
#
# By default "hz" is set to 10. Raising the value will use more CPU when
# Redis is idle, but at the same time will make Redis more responsive when
# there are many keys expiring at the same time, and timeouts may be
# handled with more precision.
#
# The range is between 1 and 500, however a value over 100 is usually not
# a good idea. Most users should use the default of 10 and raise this up to
# 100 only in environments where very low latency is required.
hz 10

# Normally it is useful to have an HZ value which is proportional to the
# number of clients connected. This is useful in order, for instance, to
# avoid too many clients are processed for each background task invocation
# in order to avoid latency spikes.
#
# Since the default HZ value by default is conservatively set to 10, Redis
# offers, and enables by default, the ability to use an adaptive HZ value
# which will temporary raise when there are many connected clients.
#
# When dynamic HZ is enabled, the actual configured HZ will be used as
# as a baseline, but multiples of the configured HZ value will be actually
# used as needed once more clients are connected. In this way an idle
# instance will use very little CPU time while a busy instance will be
# more responsive.
dynamic-hz yes

# When a child rewrites the AOF file, if the following option is enabled
# the file will be fsync-ed every 32 MB of data generated. This is useful
# in order to commit the file to the disk more incrementally and avoid
# big latency spikes.
aof-rewrite-incremental-fsync yes

# When redis saves RDB file, if the following option is enabled
# the file will be fsync-ed every 32 MB of data generated. This is useful
# in order to commit the file to the disk more incrementally and avoid
# big latency spikes.
rdb-save-incremental-fsync yes

# Redis LFU eviction (see maxmemory setting) can be tuned. However it is a good
# idea to start with the default settings and only change them after investigating
# how to improve the performances and how the keys LFU change over time, which
# is possible to inspect via the OBJECT FREQ command.
#
# There are two tunable parameters in the Redis LFU implementation: the
# counter logarithm factor and the counter decay time. It is important to
# understand what the two parameters mean before changing them.
#
# The LFU counter is just 8 bits per key, it's maximum value is 255, so Redis
# uses a probabilistic increment with logarithmic behavior. Given the value
# of the old counter, when a key is accessed, the counter is incremented in
# this way:
#
# 1. A random number R between 0 and 1 is extracted.
# 2. A probability P is calculated as 1/(old_value*lfu_log_factor+1).
# 3. The counter is incremented only if R < P.
#
# The default lfu-log-factor is 10. This is a table of how the frequency
# counter changes with a different number of accesses with different
# logarithmic factors:
#
# +--------+------------+------------+------------+------------+------------+
# | factor | 100 hits   | 1000 hits  | 100K hits  | 1M hits    | 10M hits   |
# +--------+------------+------------+------------+------------+------------+
# | 0      | 104        | 255        | 255        | 255        | 255        |
# +--------+------------+------------+------------+------------+------------+
# | 1      | 18         | 49         | 255        | 255        | 255        |
# +--------+------------+------------+------------+------------+------------+
# | 10     | 10         | 18         | 142        | 255        | 255        |
# +--------+------------+------------+------------+------------+------------+
# | 100    | 8          | 11         | 49         | 143        | 255        |
# +--------+------------+------------+------------+------------+------------+
#
# NOTE: The above table was obtained by running the following commands:
#
#   redis-benchmark -n 1000000 incr foo
#   redis-cli object freq foo
#
# NOTE 2: The counter initial value is 5 in order to give new objects a chance
# to accumulate hits.
#
# The counter decay time is the time, in minutes, that must elapse in order
# for the key counter to be divided by two (or decremented if it has a value
# less <= 10).
#
# The default value for the lfu-decay-time is 1. A Special value of 0 means to
# decay the counter every time it happens to be scanned.
#
# lfu-log-factor 10
# lfu-decay-time 1

########################### ACTIVE DEFRAGMENTATION #######################
#
# WARNING THIS FEATURE IS EXPERIMENTAL. However it was stress tested
# even in production and manually tested by multiple engineers for some
# time.
#
# What is active defragmentation?
# -------------------------------
#
# Active (online) defragmentation allows a Redis server to compact the
# spaces left between small allocations and deallocations of data in memory,
# thus allowing to reclaim back memory.
#
# Fragmentation is a natural process that happens with every allocator (but
# less so with Jemalloc, fortunately) and certain workloads. Normally a server
# restart is needed in order to lower the fragmentation, or at least to flush
# away all the data and create it again. However thanks to this feature
# implemented by Oran Agra for Redis 4.0 this process can happen at runtime
# in an "hot" way, while the server is running.
#
# Basically when the fragmentation is over a certain level (see the
# configuration options below) Redis will start to create new copies of the
# values in contiguous memory regions by exploiting certain specific Jemalloc
# features (in order to understand if an allocation is causing fragmentation
# and to allocate it in a better place), and at the same time, will release the
# old copies of the data. This process, repeated incrementally for all the keys
# will cause the fragmentation to drop back to normal values.
#
# Important things to understand:
#
# 1. This feature is disabled by default, and only works if you compiled Redis
#    to use the copy of Jemalloc we ship with the source code of Redis.
#    This is the default with Linux builds.
#
# 2. You never need to enable this feature if you don't have fragmentation
#    issues.
#
# 3. Once you experience fragmentation, you can enable this feature when
#    needed with the command "CONFIG SET activedefrag yes".
#
# The configuration parameters are able to fine tune the behavior of the
# defragmentation process. If you are not sure about what they mean it is
# a good idea to leave the defaults untouched.

# Enabled active defragmentation
# activedefrag yes

# Minimum amount of fragmentation waste to start active defrag
# active-defrag-ignore-bytes 100mb

# Minimum percentage of fragmentation to start active defrag
# active-defrag-threshold-lower 10

# Maximum percentage of fragmentation at which we use maximum effort
# active-defrag-threshold-upper 100

# Minimal effort for defrag in CPU percentage
# active-defrag-cycle-min 5

# Maximal effort for defrag in CPU percentage
# active-defrag-cycle-max 75

# Maximum number of set/hash/zset/list fields that will be processed from
# the main dictionary scan
# active-defrag-max-scan-fields 1000



```

- redis 的持久化方式
  - aof
  - rdb
  - 混合模式： 4.0 以后加入的新特性，支持两种方式配合使用
- RDB 特点
  - 二进制文件
  - 是某一个时刻内存的快照信息
- RDB 文件生成的**触发条件**
  - 手动触发
    - 阻塞触发： 执行 `save` 命令，主进程停止对外服务，开始备份数据生成 RDB 文件
    - 非阻塞触发： 执行 `bgsave` 命令，主进程 fork 一个子线程，由子进程执行备份数据工作生成 RDB 文件【fork 子进程过程也是阻塞的，但是子进程备份过程就不阻塞了】
  - 自动触发
    - 配置了 `save m n` 参数，表示当在 m 秒内，有 n 个 key 发生了改变，就会自动触 `bgsave` 命令发生成 RDB 文件
    - 执行了 flushall 命令，会把 RDB 文件清空
    - 需要主从复制时，主节点会执行 `bgsave` 命令自动生成一个 RDB 文件，发送给从节点
- RDB 有关的**配置参数 **
  - **save** 参数： 触发条件
  - **rediscompression** 参数： 是否开启 RDB 文件的压缩以节省磁盘空间
  - **redischekcsum** 参数： 是否校验 RDB 文件的合法性
- 配置参数的查询
  - 直接查看配置文件
  - 使用 `config get #{key}` 命令查询
- 修改配置文件方式
  - 直接修改 config 文件，但是需要重启才可以生效，永远生效
  - 使用 `config set #{key}` 命令进行修改，不需要重启即可生效，但是下次启动后失效
- RDB 文件**恢复 **
  - 启动时会自动加载 rdb 文件到内存中，在加载完毕之前无法对外提供服务
- 禁用 RDB 持久化
  - 使用 `config set save ""` 命令进行修改
- 优缺点
  - 优点
    - RDB 文件很小，属于二进制紧凑型的，很适合做备份文件，也可以利用 RDB 进行快速的恢复和主从复制
    - RDB 文件执行 `bgsave` 时，并不会过多影响 redis 的性能
  - 缺点
    - RDB 文件只保存某一个时间间隔的数据，有可能丢失保存之前的数据
    - 如果数据集很大，fork 子进程时会造成很大时间的阻塞，对 redis 有性能影响
    - 只记录 redis 中已经存在的数据，无法记录 redis 客户端的操作过程

## 04 Redis 持久化——AOF

- AOF 特点
  - 记录了每个键值对的操作命令
- 配置参数的查询
  - 直接查看配置文件
  - 使用 `config get #{key}` 命令查询
- 修改配置文件方式
  - 直接修改 config 文件，但是需要重启才可以生效，永远生效
  - 使用 `config set #{key}` 命令进行修改，不需要重启即可生效，但是下次启动后失效
- 重写机制
  - 概述： aof 文件记录了某一个键值对的多个修改记录，重写过程就是把多个修改记录修改成能表示终态的一个修改记录
  - 过程： 先生成一个新的文件，把当前 redis 中所有的数据使用最少命令方式保存到新文件中，当所有数据保存完成后，redis 会替换新旧 aof 文件，并把最新的持久化命令追加到 aof 文件中
  - 【例子】redis 对某一个 key 执行了 100 次加 1 的操作，aof 就会记录 100 次加 1 的命令，重写后 aof 记录了这个 key 的最终值
- 持久化触发的条件

  - 自动触发

    - **appendfsync always**： 记录每条操作命令，最多丢失一条数据，但是损耗性能
    - **appendfsync everysec**： 每秒写入一次磁盘，最多丢失一秒数据，是默认方式
    - **appendfsync no**： 不设置持久化策略，让操作系统来决定何时触发，linux 默认是 30s
    - 配置了持久化策略

      -

    - 配置了重写 aof 文件的两个参数：两个命令同时满足时才会触发重写
      - **auto-aof-rewrite-min-size**：重写的最小文件容量，默认是 64，表示 64MB，即 AOF 文件超过 64MB 时就触发重写
      - **auto-aof-rewrite-pencentage**：重写的大小比例，默认是 100，表示 100%，即 AOF 文件大小超过了上次重写后文件的 100%（即一倍），就会触发重写

  - 手动触发
    - 命令行执行 `bgrewriteaof` 命令

- 持久化文件加载机制
  - 只开启 AOF ，就只加载 AOF 文件
  - 只开启 RDB ，就只加载 RDB 文件
  - 开启混合持久化方式， 只会加载 AOF 文件（**即便是只有 RDB 没有 AOF，也不会加载 RDB**），因为混合持久化机制中是把 RDB 文件写入 AOF 的首部，之后的数据以 AOF 的方式追加到 AOF 文件的尾部
- 异常文件处理
  - 问题：
    - 如果服务器发生崩溃或者 AOF 存储已满时，AOF 最后一条命令可能会被截断，造成 aof 文件异常；
    - 也有可能 aof 文件中间的几条命令被中断，发生异常；
  - 解决方案
    - 如果配置了 `aof-load-truncated yes` 参数，则会自动忽略最后一条命令后启动
    - 使用 `redis-check-aof` 命令，定位到出现问题的命令后手动修复 aof 文件
    - 使用 `redis-check-aof --fix` 命令，让 redis 自动修复 aof 文件
- 优缺点
  - 优点
    - aof 文件更容易理解，即使不小心 flushall 了，只需要找到 aof 删除最后一条命令再进行恢复即可；
    - aof 默认的持久化策略最多丢失一秒的数据，保存的数据更加完整；
  - 缺点
    - 如果 aof 文件过大，会影响 redis 的启动速度
    - 相同数据，aof 文件比 RDB 文件要大
    - 在负载较高条件下，RDB 性能要强于 AOF

## 05 Redis 持久化——混合持久化

- Redis 4.0 以后支持的新特性
- 文件存储方式
  - 重写时，先把数据以 RDB 的方式写到 AOF 的开头，之后的数据再追加到 AOF 的末尾
- 手动触发重写
  - 执行 `bgrewriteaof` 命令
- 配置参数
  - aof-use-rdb-preamble
- 修改配置文件
  - 命令行修改
  - 配置文件修改
- 混合持久化方式的加载流程

![](https://cdn.nlark.com/yuque/0/2023/png/29433025/1699932985734-94a18990-fbcc-4637-9360-268c2eea8e0d.png#averageHue=%23fed378&id=fEGof&originHeight=1222&originWidth=786&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

- 优缺点
  - 集合了 aof 和 rdb 二者的优点，可以使 redis 更快的启动，也减少了丢失大量数据的风险
  - AOF 文件可读性变差，并且只能在 4.0 以后的版本中才可以同时开启

## 06 字符串使用与内部实现原理

```c
/*
* Redis 对象
*/
typedef struct redisObject {
  // 类型
  unsigned type:4;
  // 对齐位
  unsigned notused:2;
  // 编码方式
  unsigned encoding:4;
  // LRU 时间（相对于 server.lruclock）
  unsigned lru:22;
  // 引用计数
  int refcount;
  // 指向对象的值
  void *ptr;
} robj;

```

type 记录了对象`所保存的值的类型`，其枚举值列表如下：

```c
/*
* 对象类型
*/
#define REDIS_STRING 0    // 字符串
#define REDIS_LIST 1      // 列表
#define REDIS_SET 2       // 集合
#define REDIS_ZSET 3      // 有序集
#define REDIS_HASH 4      // 哈希表

```

encoding 记录了对象`所保存的值的编码`，其枚举值列表如下：

```c
/*
* 对象编码
*/
#define REDIS_ENCODING_RAW 0          // 编码为字符串
#define REDIS_ENCODING_INT 1          // 编码为整数
#define REDIS_ENCODING_HT 2           // 编码为哈希表
#define REDIS_ENCODING_ZIPMAP 3       // 编码为 zipmap
#define REDIS_ENCODING_LINKEDLIST 4   // 编码为双端链表
#define REDIS_ENCODING_ZIPLIST 5      // 编码为压缩列表
#define REDIS_ENCODING_INTSET 6       // 编码为整数集合
#define REDIS_ENCODING_SKIPLIST 7     // 编码为跳跃表

```

![](https://cdn.nlark.com/yuque/0/2023/png/29433025/1699932985867-6eae9721-3053-4d75-9831-cd2774817687.png#averageHue=%23f4efe7&id=hagxx&originHeight=1082&originWidth=1116&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

- 功能
  - 字符串存储
  - 数字运算
- 主要应用场景
  - 任何需要存储字符串的场景都可以
  - 特殊场景：页面存储、session 集中式存储、数字运算等
- 使用方法
  - CLI 命令
    - 单键操作
      - get
      - getrange
      - getset
      - set
      - setrange
      - setnx
      - append
      - strlen
    - 多键操作
      - mset
      - msetnx
      - mget
    - 数字操作
      - incr
      - decr
      - incrby
      - decrby
      - incrbyfloat
      - decrbyfloat
  - 外部 API 操作
    - jedis
- 对象存储及内部实现
  - 3.2 之前
  - 3.2 之后
    - int： 存储的是整数且长度小于 20 字节
    - embstr： 存储的是字符串且长度小于等于 44 字节
    - raw： 存储的是动态字符串，且长度大于 44 字节且小于 512Mb
      - redis 2.+ 是 32 字节
      - redis 3.0-4.0 是 39 字节
      - redis 5.0 是 44 字节
  - 为什么是 44 字节？
    - 64 字节 = redisObject + SDS
    - redisObject = 16 字节
    - SDS = 4 字节 + 44 字节的 buf[]

![](https://cdn.nlark.com/yuque/0/2023/png/29433025/1699932985964-78d47590-4ae6-4162-8995-58a3cbbf386a.png#averageHue=%23fdfefd&id=nFyXm&originHeight=238&originWidth=1510&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

- SDS 内部结构
- SDS 与 c 字符串的优点
  - O(1)的时间获取串的长度，SDS 是通过访问 length 值获取长度，而 c 是通过遍历所有的字符后得到长度；
  - 防止内存溢出
  - 二进制安全，SDS 末端使用 0 表示串的结束，中间部分可以有任意多的 0，而 c 不可以；

> The command `SET resource-name anystring NX EX max-lock-time` is a simple way to implement a locking system with Redis.     —— 来自官方文档： [https://redis.io/commands/set/](https://redis.io/commands/set/)

> 思考延伸： SDS 扩容及回收机制

## 07 附录：更多字符串操作命令

与 06 进行合并

## 08 字典使用与内部实现原理

- 散列表（哈希表）基本信息
  - 散列表特征： 其思想主要是基于数组支持按照下标随机访问数据时间复杂度为 O(1)的特性
  - 散列函数
    - 特征
      - 确定性： key1=key2，那么 hash(key1)=hash(key2)
      - 不确定性： key1≠key2，有可能会存在 hash(key1)=hash(key2)
    - 问题：
      - 引发哈希冲突
  - 散列表存储方式及哈希冲突解决思路
    - 开放寻址法
      - 线性探测

![](https://cdn.nlark.com/yuque/0/2023/png/29433025/1699932986041-c47e1c6a-4f76-40fe-8bfa-95e6ad39d2a0.png#averageHue=%23f7e1e1&id=fVvkS&originHeight=569&originWidth=696&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=stroke&title=) - 链表法 - 数组+链表方式实现

![](https://cdn.nlark.com/yuque/0/2023/png/29433025/1699932986122-1a4c0198-4f2f-411c-9f99-e0ff452c1f15.png#averageHue=%23f8ebeb&id=pw7oj&originHeight=1118&originWidth=1632&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=stroke&title=)

- 装载因子： 已有的元素个数 / 所有的元素个数， eg：数组长度为 10，其中只有 2 个元素，则装载因子为 0.2
  - 装载因子过高容易引起哈希冲突，过低造成存储空间浪费；
  - 为了让装载因子处于一个合适的范围，需要对 hashtable 进行扩容和缩容；
- dict 原理
  - 存储原理
    - ziplist 压缩列表

![](https://cdn.nlark.com/yuque/0/2023/png/29433025/1699932986208-6f2100d0-e989-46c2-80a3-6055fbf1aef6.png#averageHue=%23e5e8c1&id=apdz0&originHeight=839&originWidth=1106&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=stroke&title=) - 编码转换条件 - `键值对数量小于512` && `所有键值对的key和value的长度都小于64字节` 时使用 ziplist； - 否则就使用 hashtable - hashtable

![](https://cdn.nlark.com/yuque/0/2023/png/29433025/1699932986329-1d26d372-76b2-4a10-a51e-e87e84f4675b.png#averageHue=%23f7ede8&id=D6ggu&originHeight=1332&originWidth=2056&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=stroke&title=) - 集中式 rehash 缺点： 一次性的 hash，中间不会停止，会影响 redis 的读写性能，因为要花费资源去进行 hash，性能差 - 渐进式 rehash 过程：每一次对字典的操作，都顺带 rehash 一个 index，直到 rehash 完成，最后把 ht[1]变成 ht[0]，最后再申请一个 ht[1]，并把 rehashidx 置为-1，为下次 rehash 做准备； - 为 ht[1]分配空间，让字典同时拥有 ht[0]和 ht[1]； - 让 rehashidx=0，表示 rehash 过程开始 - 在 rehash 期间，redis 除了对外提供字典的增删改查的数据操作外，还会顺带把 ht[0]在 rehashidx 索引上的所有键值对 rehash 到 ht[1]上，然后再把 rehashidx 加一； - 新增操作：直接将键值对插入到 ht[1]上，保证 ht[0]的结点不会增加； - 删除操作：同时在 ht[0]和 ht[1]两个哈希表上执行，避免漏删； - 修改操作：同时在 ht[0]和 ht[1]两个哈希表上执行，避免漏改； - 查找操作：先从 ht[0]查，查不到的话再去 ht[1]查； - 直到 rehash 完成后，最后把 ht[1]变成 ht[0]，最后再申请一个 ht[1]，并把 rehashidx 置为-1，为下次 rehash 做准备； - 扩容 - 条件： 没有执行 BGSAVE 或没有执行 BGREWRITEAOF 命令时负载因子大于等于 1 || 执行 BGSAVE 或执行 BGREWRITEAOF 命令时负载因子大于等于 5 - 大小： 不小于 dict[0].used\*2 的第一个 2 的 n 次幂，如 dict[0].used = 3，则扩容大小为不小于 6 的第一个 2 的 n 次幂，不小于 6 的第一个 2 的 n 次幂是 8，因此扩容大小为 8；如 dict[0].used = 4，则扩容大小为不小于 8 的第一个 2 的 n 次幂，不小于 8 的第一个 2 的 n 次幂是 8，因此扩容大小依然是 8； - 缩容 - 条件：负载因子小于 0.1 - 大小：不小于 dict[0].used 的第一个 2 的 n 次幂，如 dict[0].used = 3，则缩容大小为不小于 3 的第一个 2 的 n 次幂，即 4；如 dict[0].used = 4，则缩容大小为不小于 4 的第一个 2 的 n 次幂，即 4；

- 命令
  - hset
  - hsetnx
  - hmset
  - hget
  - hmget
  - hdel
  - hincrby
  - hkeys
  - hvals
  - hgetall
  - hincrbyfloat
  - hexists
  - hlen

::: note 思考题

1. redis 中存储对象有几种方式？
   - 第一种：
     - set user:1:name zhangsan
     - set user:1:age 12
   - 第二种： value 为序列化后的对象信息
     - set user:1 serialize(userInfo)
   - 第三种： 使用字典
     - hset user:1 name zhangsan age 12
2. 假如 hashtable 数组上的链表元素有很多，那么 rehash 过程中，这些链表元素是怎么 rehash 到 ht[1]上的？
3. hashtable 扩容时，为什么 BGSAVE 或 BGREWRITEAOF 命令执行时的负载因子要比没有执行这两个命令时的负载因子大？
   :::

参考链接：

1. [https://www.cnblogs.com/hunternet/p/12651530.html](https:_www.cnblogs.com_hunternet_p_12651530)
2. [https://www.cnblogs.com/hunternet/p/11306690.html](https:_www.cnblogs.com_hunternet_p_11306690)
3. [https://www.cnblogs.com/hunternet/p/9989771.html](https:_www.cnblogs.com_hunternet_p_9989771)
4. [https://juejin.cn/post/7064359936842530830#heading-1](https://juejin.cn/post/7064359936842530830#heading-1)
5. 《redis 设计与实现》

## 09 附录：更多字典操作命令

与 08 合并

## 10 列表使用与内部实现原理

- 特征
  - 有序集合
  - 元素可以重复
- 基础使用
  - lpush
  - lrange
  - rpush
  - lpop
  - rpop
  - lindex
  - linsert
  - lset
  - ltrim
  - llen
  - lrem
- 使用场景【未找到来源】
  - lpush+lpop=Stack（栈）
  - lpush+rpop=Queue（队列）
  - lpush+ltrim=Capped Collection（有限集合）
  - lpush+brpop=Message Queue（消息队列）
- 内部实现
  - quicklist （ Redis 3.2 引入的数据类型 ，而 quicklist 底层使用压缩列表和双向列表组成，具体见《Redis 设计与实现》第 8.3 章。）
    - 由双向列表和 ziplist 构成的复合数据结构

![](https://cdn.nlark.com/yuque/0/2023/png/29433025/1699932986474-5220e94f-959e-4018-8a04-f009fd277067.png#averageHue=%23c3f7d7&id=efbLD&originHeight=912&originWidth=1502&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=) - 新增 - 判断 head 节点是否可以插入，可以插入，就在 ziplist 上插入，否则，就新建一个 quickListnode 节点进行插入 - 删除 - 单个元素： 遍历索引 - 区间元素： 先找到 start 下标的元素所在的 quicklistnode，然后删除 ziplist 上的数据，如果 ziplist 上能删除的元素个数小于要删除的元素个数，就会移动到下一个 quicklistnode，然后进行删除

## 11 附录：更多列表操作命令

与 10 进行合并

## 12 集合使用与内部实现原理

- 特征
  - 多个相同元素只保存一份，即元素不可重复
  - 没有顺序
- 使用命令
  - sadd
  - smembers
  - scard
  - sismember
  - smove
  - srem
  - spop
  - srandmember
  - sinter
  - sinterstore
  - sunion
  - sunionstore
  - sdiff
  - sdiffstore
- 代码实战
  - 使用 jedis 来实现并集、差集、交集
- 使用场景
  - 任何用来去重的场景和保证数据唯一性的场景
  - 求交差并补集合
  - 我关注的、关注我的
- 内部实现
  - 当元素都是整型，且元素个数小于 set-max-intset-entries 时会使用 intset 存储；
  - 其他情况下会使用 hashtable 进行存储；

## 13 附录：更多集合操作命令

与 12 合并。

## 14 有序集合使用与内部实现原理

- 特征
  - 元素不能重复，但分数可以重复
- 常用命令
  - zadd
  - zrange
  - zrem
  - zscore
  - zrangebyscore
  - zrank
  - zcard
  - zcount
  - zincrby
  - zrevrank
  - zremrangebyrank
  - zremrangebyscore
  - zinterstore
  - zunionstore
- 内部实现原理
  - skiplist

![](https://cdn.nlark.com/yuque/0/2023/png/29433025/1699932986558-3a0527a3-7f69-4427-8248-ae8e690df805.png#averageHue=%23c9fbfb&id=UQaXZ&originHeight=928&originWidth=1592&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

- 跳跃表基于单链表加索引的方式实现
- 跳跃表以空间换时间的方式提升了查找速度
- Redis 有序集合在节点元素较大或者元素数量较多时使用跳跃表实现
- Redis 的跳跃表实现由 zskiplist 和 zskiplistnode 两个结构组成,其中 zskiplist 用于保存跳跃表信息(比如表头节点、表尾节点、长度),而 zskiplistnode 则用于表示跳跃表节点
- Redis 每个跳跃表节点的层高都是 1 至 32 之间的随机数
- 在同一个跳跃表中,多个节点可以包含相同的分值,但每个节点的成员对象必须是唯一的跳跃表中的节点按照分值大小进行排序,当分值相同时,节点按照成员对象的大小进行排序。
- 跳跃表
  - 发展过程
  - 查找过程
  - 与红黑树的对比
- zset 内部的数据结构
  - ziplist
  - 转化条件
    - 元素个数小于 zset-max-ziplist-entries（默认 128 个）
    - 所有元素成员的长度要小于 zset-max-ziplist-value（默认 64 字节）
  - skiplist
- 使用场景
  - 排行榜
  - 排序

参考链接：

1. [跳跃表](https://www.laoyu.site/2019/%E6%8A%80%E6%9C%AF%E5%AE%9E%E8%B7%B5/redis/Redi%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84%E2%80%94%E2%80%94%E8%B7%B3%E8%B7%83%E8%A1%A8/)
2. 《redis 设计与实现》

## 15 附录：更多有序集合操作命令

与 14 合并。

## 16 Redis 事务深入解析

- 相关命令
  - multi
  - exec
  - discard
  - watch
  - unwatch
- 注意
  - 没有回滚命令

```
> multi
OK
> SET “NAME” “REDIS THEORY”
QUEUED
> SET “author” “San”
QUEUED
> exec
1) OK
2) OK

```

## 17 Redis 键值过期操作

![](https://cdn.nlark.com/yuque/0/2023/png/29433025/1699932986842-28d6905a-3cb2-48cb-b1b6-c9a56be046e8.png#averageHue=%23f0f1f7&id=Oq2zJ&originHeight=1122&originWidth=1588&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

- 相关命令
  - expire
  - pexpire
  - expireat
  - pexpireat
  - persist
- 持久化过程中的过期键
  - AOF 文件写入时： 没有过期的键也会写入 AOF，在进行恢复时，如果键过期，就往 AOF 中追加一个 DEL 命令
  - AOF 文件重写时： 会先检查键是否过期，如果过期就不往 AOF 文件中写，没有过期就写
  - RDB 文件生成时： 不会把过期的键保存到 RDB 中
  - RDB 文件加载时：
    - 主服务器会在加载时对每一个键做过期时间检查，如果发现过期就不加载；
    - 从服务器会把 RDB 中所有的键都加载到内存中，由主服务器对键的过期时间进行检查并删除，之后再进行主从同步；

## 18 Redis 过期策略与源码分析

- 过期键执行流程
- [key 的驱逐策略](https://redis.io/docs/manual/eviction/)
  - 当数据量大于 maxmemory 设置的值时开始执行驱逐策略
  - noeviction： 不驱逐
  - allkeys-lru： 从所有 key 中找到`最近最少使用key`进行过期操作，当缓存元素某一部分被频繁访问时，建议使用此策略；如果某个键很久没有被使用，但是最近被访问了一次，那它就不会被删除
  - allkeys-lfu： 从所有 key 中找到`最不经常用到的key`进行过期操作，解决了 lru 的问题
  - allkeys-random： 从所有的 key 中`随机选一个`进行过期操作，建议在所有的 key 被均匀的随机访问时采用此策略
  - volatile-lru： 从所有`设置了过期时间的key中挑选最近最少使用到的`key 进行过期操作
  - volatile-lfu： 从所有`设置了过期时间的key中挑选最不经常用到的`key 进行过期操作
  - volatile-random： 从所有设置了过期时间的 key 中`随机`选一个进行过期操作
  - volatile-ttl： 从所有设置了`过期时间的key中挑选一个存活时间`最短的 key 进行过期操作，建议在人为设置了过期时间时采用此种策略
- 过期原理
  - 定时过期： 在设置过期时间时，创建一个过期事件，到达时间时，执行过期时间主动删除 key
    - 优点： 快速回收内存
    - 缺点： 高并发场景下，或者同时有很多 key 过期时，会造成短暂卡顿，吞吐量下降；
  - 惰性过期： 不主动删除 key，在每次使用 key 时先检查过期时间，如果过期就删除，并返回 null
    - 优点： 删除过程可控，只在被使用时删除
    - 缺点： 不能快速回收内存
  - 定期过期： 每隔一段时间，根据驱逐策略执行删除命令
    - 定期执行扫描任务，每次扫描时并不是遍历所有的键，而是随机抽取并判断是否过期的方式进行删除；
    - 先从过期字典中随机挑选 20 个键，然后从这 20 个键中挑选过期的键进行删除，如果过期的比例超过四分之一，就再次挑选 20 个键；
    - 为避免过度扫描，通过判断 timelimit 来确定扫描次数
  - `redis采用惰性过期和定期过期方式进行删除`
- 执行淘汰的机制

![](https://cdn.nlark.com/yuque/0/2023/png/29433025/1699932986973-4dfc0aa5-9348-4c47-b26a-6c0337a5c738.png#averageHue=%23fcf0df&id=uJ7Wa&originHeight=565&originWidth=183&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

- lru 的原理
  - 基于链表结构，链表中的元素按照操作顺序从前往后排列，最新操作的键会被移动到表头，当需要内存淘汰时，只需要删除链表尾部的元素即可
  - 手写算法

[https://zhuanlan.zhihu.com/p/105587132](https://zhuanlan.zhihu.com/p/105587132)
[https://www.jianshu.com/p/60cc093d6c36](https://www.jianshu.com/p/60cc093d6c36)

::: tip 参考

1. [http://learn.lianglianglee.com/](http://learn.lianglianglee.com/)
2. [https://mp.weixin.qq.com/s/Ck0a8Ivjb5qhrOYEAHw-wQ](https://mp.weixin.qq.com/s/Ck0a8Ivjb5qhrOYEAHw-wQ)
3. 《redis 设计与实现》

:::

## 19 Redis 管道技术——Pipeline

- 解决了什么问题
  - 在操作缓存时，有时候需要执行很多条命令，管道命令就可以让 redis 一次性执行很多条命令，并把命令的执行结果一并返回
  - 本质上是客户端的功能，不是 redis 的特性
- 使用 Jedis 的管道技术
  - 首先先获取 Pipeline 对象，再为 Pipeline 对象设置需要执行的命令，最后再使用 sync() 方法或 syncAndReturnAll() 方法来统一执行这些命令
  - 注意
    - 虽然没有命令数量的限制，但是命令缓冲区大小不能超过 1G，超过后 redis 会断开与客户端的连接
    - 管道数量太多容易给客户端造成阻塞
    - 如果命令没有执行，可以查看客户端的命令缓冲区的大小是否超出限制；

## 20 查询附近的人——GEO

- 作用
  - 地理位置的存储
  - 3.2 以后提供的新特性
- 命令
  - geoadd
  - geopos
  - geodist
  - georadius
  - geohash
  - zrem

## 21 游标迭代器（过滤器）——Scan

- 场景
  - 查询出所有的 key
  - 在 2.8 之前，只能使用 keys 命令，这个命令没有分页功能，时间复杂度是 O(n)，也就是说 key 越多，查询所用时间越长；使用此命令，有可能会造成 redis 的假死
  - 2.8 及以后推出 scan 命令，解决了这个问题
- 命令：需要客户端进行循环遍历，多次调用，此次遍历结果需要用到上次遍历结果的第一个值作为开始位置。有点像 MySQL 中的 limit 的两个游标，但是又不一样。
  - scan 3993 match user_token_9999\* count 10000： 表示从 3993 位置开始查询 10000 个符合前缀为 user_token_9999 的 key
  - 返回结果为两个内容，第一个是遍历到 13773 的槽，第二个是结果列表，表示查询到的符合结果的数据集
    - 1.  "13773"
    - 2.
      1. "user_token_99995"
  - 如果要完成整个遍历，需要用上一次遍历的结果的第一个值作为下一次命令的起始位置，直到再次返回的结果中的第一个参数为 0，表示完成一次整个遍历
- 其他命令： 不区分大小写
  - HScan
  - SScan
  - ZScan
- 注意点
  - 生产环境下一定不要使用 keys，而是使用 scan 命令
  - scan 返回的结果中可能有重复值，需要客户端自己去重
  - scan 不保证能查询出在遍历时修改的数据
  - scan 不保证能不会查询出在遍历时删除的数据

> [https://redis.io/commands/scan/](https://redis.io/commands/scan/)

## 22 优秀的基数统计算法——HyperLogLog

- 产生的背景： 在一些统计的业务场景中，如果使用 Set 进行统计时，可能会耗费很多的内存空间，这对昂贵而又紧张的内存资源来说是不能忍受的，因此在 Redis 2.8.9 版本中添加了 HyperLogLog（简称 HLL）数据结构；
- 命令（只有三个）：
  - 添加元素： pfadd key element [element ...]
  - 统计不重复元素个数： pfcount key [key ...]
  - 合并 n 个 HyperLogLog 值： pfmerge destkey sourcekey [sourcekey ...]
- 原理：
  - 在 Redis 中使用 HLL 插入数据，相当于把存储的值经过 hash 之后，再将 hash 值转换为二进制，存入到不同的桶中，这样就可以用很小的空间存储很多的数据；
  - 统计时再去相应的位置进行对比很快就能得出结论

## 23 内存淘汰机制与算法

与 18 进行合并

## 24 消息队列——发布订阅模式

- 消息队列相关概念
  - 消费者
  - 发布者
  - channel： 是现实生活中的频道的抽象
  - 主题： 可以理解为同个类型的消息的集合，是为了解决不能接收不同 channel 的同类型消息的问题而产生的
  - 好的消息队列的特点
    - 能持久化消息
    - 能重复消费
    - 可以根据业务场景选择是否支持顺序消费
    - 高可用
    - 能存储相同内容的消息
    - 最好是支持能够确认消息是否被消费
- 相关命令
  - publish
    - 返回 0~n 的整数，表示有多少个消费者接收到了消息
  - subscribe
    - 可以订阅多个 channel
    - 命令会一直阻塞，等待接收消息
  - psubscribe
    - 可以订阅主题，只能订阅一个主题
- 注意
  - 发布订阅机制是无法持久化消息的，redis 重启后，消息会丢失
  - 发布订阅机制是发后即忘的，如果消费者没有收到消息，就再也收不到消息了
  - 5.0 之后引入 Stream 后解决了上面这个问题

## 25 消息队列的其他实现方式

- list
  - 使用方法
    - lpush
    - rpop
  - 比发布订阅机制的：
    - 优点
      - 可以持久化消息
      - 可以积压消息
    - 缺点
      - 不能重复消费
      - 消费时还需要遍历所有的消息列表
      - 没有主题订阅的功能
- ZSet
  - 使用方法
    - 比发布订阅机制的：
      - 优点
        - 支持持久化
        - 比 list 查询更方便，可以使用 score 属性来完成遍历
      - 缺点
        - 不能存储相同消息，也就是消息不能重复
        - 不能完成消息队列的有序性
        - 没有弹出功能

## 26 消息队列终极解决方案——Stream（上）

- 命令
  - xadd
  - xread： 循环阻塞读取消息
  - xrange
  - xlen
  - xdel
  - del
  - xgroup
    - xgroup delconsumer
    - xgroup destroy
  - xreadgroup
  - xack
  - xpending
  - xinfo
    - xinfo stream
    - xinfo groups
    - xinfo consumers

## 27 消息队列终极解决方案——Stream（下）

与 26 整合

## 28 实战：分布式锁详解与代码

- 什么是分布式锁
  - 就是分布式场景下并发控制的一种机制，`主要用于控制某一个资源在某一个时刻只能被一个应用所使用`。
- 有哪些实现方案
  - 数据库悲观锁方案
  - Memcached 方案
  - ZK 方案
  - Redis 方案
- redis 方案
  - 演进过程
    - setnx(k, v)： 没有超时失效时间，有可能造成死锁的问题；
    - setnx(k, v) + expire(k)： 但是两个命令非原子性，并发时还是有可能出现问题的；
    - set(k, v, nx, ex)： 可以解决上面的问题，但是又引入新的问题
      - 失效时间设置的过短，即业务处理时间长于失效时间，业务还没有处理完成，锁就被释放了，当业务处理完成之后再去删除 key 时，已经不是自己持有的那个锁了，就会造成误删。
      - 解决方案
        - 1.  失效时间过短： 处理时间过长的业务尽量不要放到锁的逻辑范围内；尽量让锁的失效时间设置的合理一些；
        - 2.  误删：
          - 在获取锁的时候，value 要保证唯一，
          - 在删除锁时，可以采用 lua 脚本先比对再删除的方式（这是因为比对和删除操作不具备原子性）

> 一个系统里面，可能有很多个业务场景需要使用分布式锁，在使用 redis 作为分布锁的实现方案时，每一个 key 就代表一个具体的业务场景，而不同的 value 则是代表着不同的并发请求。
> 这里蕴含着两个个前置知识：
>
> 1. 例如一个 web 项目中，有两个 controller，这两个 controller 中都需要使用分布式锁。所谓的并发请求是指，这两个 controller 一起并发执行，也表示同一个 controller 并发处理同一个类型的请求；如获取个人信息的 controller 和登陆的 controller，在某一时刻，一个用户调用了获取个人信息的 controller 接口，而与此同时另外一个用户调用登陆的 controller 登陆系统，那么这两个接口就是并发请求了；再如登陆的 controller，多个用户同时调用登陆接口登陆系统，这是同一个接口的的并发请求；
> 2. 每一个请求对应的都是 jvm 中的一个栈帧。栈帧里面保存着当前请求的各种信息。（具体可以了解一下 JVM 的相关知识，我们只需要知道方法区保存着方法的相关内容，而栈帧是方法运行时的内存表现形式）
>    了解到前置知识之后，这就很好理解分布式锁了，如果要针对获取个人信息的接口和登陆的接口同时安排上分布式锁，那么这两个接口的 key 一定是不同的；对于同一个接口，并发执行时，每次生成的 value 一定是不同的；value 大多采用：`${uuid}:${threadID}` 的形式，如： `b1fcc512-b2df-aa04-b3ab-0bb01d79e216:thread-1`

## 29 实战：布隆过滤器安装与使用及原理分析

- 使用场景
  - 判断一个 key 是否存在
- 使用过程和相关命令
  - 安装 布隆过滤器 模块
  - 命令
    - bf.add
    - bf.exists
    - bf.madd
    - bf.mexists
    - bf.reserve： reserve 有 2 个重要的参数：错误率和数组大小，错误率设置的越低，数组设置的越大，需要存储的空间就越大，相对来说查询的错误率也越低，需要如何设置需要使用者根据实际情况进行调整
- 基本原理

![](https://cdn.nlark.com/yuque/0/2023/png/29433025/1699932987056-32c9ad6e-adef-4eaf-b477-a31af86acbb3.png#averageHue=%23fbfbfb&id=ZKMX5&originHeight=640&originWidth=1474&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

- 利用几个不同的 hash 函数，把 key 均匀的存储在位数组中；
- 在查找某一个 key 是否存在时，就去判断这个 key 的位数组中是否全部为 1，如果有一个不为 1，则说明这个 key 一定不存在；但是如果全为 1，不能表明这个 key 一定存在；
- 分析：当位数组存储的值越稀疏，查询的准确率就越高
- 经典业务场景
  - 垃圾邮件过滤
  - 爬虫 URL 去重
  - 判断亿级元素集合中是否存在某一个 key

## 30 完整案例：实现延迟队列的两种方法

主要使用 zset 中的 score 属性来存储延迟执行时间。

## 31 实战：定时任务案例

- 实现思路
  - 通过发布订阅机制完成对某个事件的订阅，当某个事件完成时，消息接收者就会收到这个事件的完成信息，然后根据这个事件的完成信息对业务进行操作；
- 使用方式
  - 1. 开启 config set notify-keyspace-events 参数配置，值为 E 加上下面的几个字母
    - K：键空间通知，所有通知以 `__keyspace@<db>__` 为前缀，db 表示 redis 的数据库索引
    - E：键事件通知，所有通知以 `__keyevent@<db>__` 为前缀
    - g：DEL、EXPIRE、RENAME 等类型无关的通用命令的通知
    - $：字符串命令的通知
    - l：列表命令的通知
    - s：集合命令的通知
    - h：哈希命令的通知
    - z：有序集合命令的通知
    - x：过期事件，每当有过期键被删除时发送
    - e：驱逐（evict）事件，每当有键因为 maxmemory 政策而被删除时发送
    - A：参数 g$lshzxe 的别名
  - 2. 例子： config set notify-keyspace-events El 表示对列表事件进行订阅
  - 3. 使用
    - `psubscribe __keyevent@0__:expired` ： 表示 订阅 0 号数据库中过期事件
- 场景
  - 通过上面的例子，我们可以使用 redis 完成定时任务的业务操作

## 32 实战：RediSearch 高性能的全文搜索引擎

- RediSearch 的功能
  - 像搜索引擎一样完成搜索功能
- 使用
  - 1. 安装模块
    - docker 安装
    - mo 模块安装
  - 2. 使用
- 相关命令
  - ft.create
  - ft.add
  - ft.search
  - ft.del
  - ft.drop
  - ft.info

## 33 实战：Redis 性能测试

- 为什么要进行性能测试
  - 技术选型需要
  - 评估同一种技术的不同版本的性能差异
  - 评估同一种技术的不同部署模型的性能差异
  - 评估同一种技术的相同部署模型的不同配置的性能差异
  - 评估相同业务场景的不同存储数据结构的性能差异
  - 评估调优前后的性能差异
  - 总之：评估不同条件下的性能差异，以求选择一种更经济、更高效的运行方式
- 对 redis 的性能测试方式
  - 编写代码实现并发测试
  - 使用 redis 的工具：redis-benckmark 进行测试
- 测试案例
  - 使用 ./redis-benchmark 命令
  - 结果分析
    - 输出不同命令的在特定条件下的运行结果
    - 结果包括： qps、99.85 线、100 线等
    - 结论： redis 平均的 qps 为 8w
  - 还可以使用管道命令合并多条命令一起执行来进行性能测试

## 34 实战：Redis 慢查询

- 概念
  - 简而言之，就是对查询命令的消耗时间进行统计，筛选出满足条件的查询结果进行优化
- 开启方式
  - slowlog-log-slower-than ： 慢查询时间低于多少 微秒（1s = 1000ms = 1000,000 微妙）
  - slowlog-max-len： 满查询日志的最大记录数，只记录最近的 n 条慢查询日志
- 操作
  - slowlog get n： 查询慢查询日志中的记录
  - slowlog len： 慢查询队列长度
  - slowlog reset： 清空慢查询日志内容

## 35 实战：Redis 性能优化方案

- 背景
  - redis 是内存大小敏感型中间件，要求高性能；
- 优化方案
  - 部署时
    - 尽量采用分布式部署方式
    - 尽量使用物理机部署而非虚拟机`多个虚拟机占用同一个物理机的内存及网络带宽，造成资源浪费`
  - 配置时
    - 限制 redis 使用的内存大小`当物理内存不足时，如果没有配置redis使用的内存大小，操作系统会把redis使用的内存分页转移到swap空间，这个操作会造成redis的进程出现短暂阻塞`
    - 检查 redis 的持久化策略`持久化可以进行容灾和备份，但是持久化会对redis的性能有所损耗，如果需要开启持久化时，建议开启混合持久化方式；某些系统可能不需要开启时就需要关闭持久化机制`
    - 尽量配置延迟删除`开启了延迟删除的配置之后，redis会把键值对的删除操作放到BIO单独的子进程中进行，减少对主进程的干扰`
      - lazyfree-lazy-eviction：表示当 Redis 运行内存超过 maxmeory 时，是否开启 lazy free 机制删除；
      - lazyfree-lazy-expire：表示设置了过期时间的键值，当过期之后是否开启 lazy free 机制删除；
      - lazyfree-lazy-server-del：有些指令在处理已存在的键时，会带有一个隐式的 del 键的操作，比如 rename 命令，当目标键已存在，Redis 会先删除目标键，如果这些目标键是一个 big key，就会造成阻塞删除的问题，此配置表示在这种场景中是否开启 lazy free 机制删除；
      - slave-lazy-flush：针对 slave（从节点）进行全量数据同步，slave 在加载 master 的 RDB 文件前，会运行 flushall 来清理自己的数据，它表示此时是否开启 lazy free 机制删除。
  - 使用时的全局注意事项：
    - 客户端尽量使用线程池方式查询``
    - 避免使用时间复杂度为 O(N)的命令，如 keys
      - 决定禁止使用 keys 命令；
      - 避免一次查询所有的成员，要使用 scan 命令进行分批的，游标式的遍历；
      - 通过机制严格控制 Hash、Set、Sorted Set 等结构的数据大小；
      - 将排序、并集、交集等操作放在客户端执行，以减少 Redis 服务器运行压力；
      - 删除（del）一个大数据的时候，可能会需要很长时间，所以建议用异步删除的方式 unlink，它会启动一个新的线程来删除目标数据，而不阻塞 Redis 的主线程。
    - 避免缓存大面积失效`如果大型系统中某一时刻缓存大面积失效，就会造成redis循环多次的扫描删除过期字典，直到过期字典中的键被删除的比较稀疏为止，整个执行过程会造成内存管理器频繁回收内存页，这会redis的性能急剧下降`
      - 删除原理：默认配置项为 hz 10，表示每秒扫描 10 次，每次随机挑选 20key 来判断过期时间，如果发现过期就执行删除操作，并且如果过期的 key 超过了 5 个，就会继续执行扫描操作；
  - 具体业务场景应注意：
    - 缩短键值对的存储长度`重点优化内容`
    - 设置过期时间`避免频繁的触发内存淘汰策略`
    - 多使用管道机制执行命令`针对某些业务场景来说`
  - 性能测试
    - 开启慢查询日志，对耗时最长的业务场景进行分析，优化查询命令，生产环境中可以关闭``

## 36 实战：Redis 主从同步

- 主从同步原理
  - 把主节点的数据同步到从节点，使从节点具有跟主节点相同的数据内容；
- 使用方法
  - 启动时： redis-server --port 6380 --replicaof 127.0.0.1 6379
  - 运行时： replicaof 127.0.0.1 6380
- 同步原理
  - 全量同步： 主节点会执行一次 bgsave 命令生成一个 RDB 文件，然后以 socket 的方式把 rdb 文件发送给从节点，从节点加载到内存中完成全量同步；
  - 增量同步： 2.8 之前没有增量同步，2.8 之后主节点会记录从节点离线之后的命令，主节点会在从节点恢复上线后把存储的命令发送给从节点，离线命令大小由 repl-backlog-size 配置项控制
  - 零拷贝同步： 主节点 fork 一个子进程，由子进程通过 socket 方式，直接把 RDB 文件写入从节点；把 repl-diskless-sync 配置成 true 即可开启
- 注意
  - 在同步时会有数据短暂不一致的问题；
  - 从节点只读的配置项： replica-read-only no
  - 5.0 之前使用 slaveof， 之后使用 replicaof

## 37 实战：Redis 哨兵模式（上）

- 主从复制的问题： 出现故障时，需要手动切换主从服务器；不能自动化处理；
- 哨兵模式基本原理： 一个哨兵集群去监听一个 redis 集群，这个 redis 集群中可以有多台主服务器和多台从服务器，只要主服务器发生故障，哨兵集群就会从主服务器中选举一台服务器重新作为主服务器进行服务。达到了自动化处理主服务器故障的问题。
- 搭建过程
  - 奇数台哨兵服务器
    - 用于 quorum 选取使用，因为这个算法要求大于一半的服务器选举结果才是最终结果；
    - 跟 quorum 参数有关的概念有两个
      - 主观下线： 一个哨兵认为主服务器下线，就标记为主观下线；
      - 客观下线： 一个哨兵发现主服务器下线后，就会询问其他哨兵这台服务器是否下线，如果超过一半的哨兵都认为这台服务器下线，就把这台服务器标记为客观下线；
  - 在配置文件中配置要监听的主服务器相关信息，然后依次启动哨兵服务器，各哨兵服务器会自动发现彼此形成哨兵集群；
  - 3 台哨兵+1 台主服务器+3 台从服务器
- 容灾测试
  - kill 掉主服务器进程，一段时间后哨兵集群从 3 台从服务器中挑选一个作为主服务器重新对外提供服务
- 哨兵原理
  - 每个哨兵会以每秒 1 次的频率向主服务器、从服务器以及其他哨兵服务器发送一个 PING 指令；
  - 如果这个哨兵收到的消息超过 down-after-milliseconds 配置的时间，就默认主服务器主管下线，然后向其他哨兵询问此服务器是否下线，如果超过半数哨兵认为此服务器下线，就把此服务器标注为客观下线；
  - 此时，哨兵就启动自动容灾恢复阶段；
    - 会先排除掉所有不符合条件：
      - 排除所有已经下线或长时间没有回复心跳检测的疑似下线服务器；
      - 排除所有很长时间没有跟主服务器通信，获数据状态过时的从服务器；
      - 排除所有优先级（replica-priority，默认为 100，数字越小优先级越高）为 0 的服务器
    - 然后从符合条件的从服务器中挑选，其顺序为：
      - 优先级高的从节点直接晋升为主节点；
      - 优先级相同的从节点，晋升复制偏移量高的从节点为主节点；
      - 如果优先级相同且复制偏移量也一样，就晋升服务器 id 最小的那个为主节点
    - 哨兵先从所有从服务器中根据  replica-priority   配置来挑选一个服务器升级为主服务器；
  - 旧主节点恢复上线
    - 以从服务节点的角色加入集群

> 如果 PING 命令回复结果为：PONG、LOADING、MASTERDOWN（三者之一），就说明正常；
> 哨兵集群本质上也是 redis 集群，只不过只提供哨兵任务；
> TODO： 关注一下哨兵集群具体的容灾恢复过程

## 38 实战：Redis 哨兵模式（下）

- 一些相关命令
  - sentinel masters
  - sentinel master ${masterName}
  - sentinel get-master-addr-by-name
  - sentinel slaves
  - sentinel replicas
  - sentinel sentinels
  - sentinel ckquorum
  - sentinel failover
  - sentinel monitor
  - sentinel remove
  - sentinel set master-name quorum n

## 39 实战：Redis 集群模式（上）

Redis 采用方案三。

#### 方案一：哈希值 % 节点数

哈希取余分区思路非常简单：计算 `key` 的 hash 值，然后对节点数量进行取余，从而决定数据映射到哪个节点上。
不过该方案最大的问题是，**当新增或删减节点时**，节点数量发生变化，系统中所有的数据都需要 **重新计算映射关系**，引发大规模数据迁移。

#### 方案二：一致性哈希分区

一致性哈希算法将 **整个哈希值空间** 组织成一个虚拟的圆环，范围是 _[0 - 232 - 1]_，对于每一个数据，根据 `key` 计算 hash 值，确数据在环上的位置，然后从此位置沿顺时针行走，找到的第一台服务器就是其应该映射到的服务器：

![image.jpg](https://cdn.nlark.com/yuque/0/2024/webp/29433025/1712976683331-11e9c2a9-0402-4457-88cb-eda34fc07a43.webp#averageHue=%23e6eaf2&clientId=ub23ba00d-4c3e-4&from=paste&id=ufada7bed&originHeight=793&originWidth=1500&originalType=url&ratio=1&rotation=0&showTitle=false&size=21998&status=done&style=none&taskId=ua15471d0-8d44-4350-8b5b-6acc53f4291&title=)
与哈希取余分区相比，一致性哈希分区将 **增减节点的影响限制在相邻节点**。以上图为例，如果在 `node1` 和 `node2` 之间增加 `node5`，则只有 `node2` 中的一部分数据会迁移到 `node5`；如果去掉 `node2`，则原 `node2` 中的数据只会迁移到 `node4` 中，只有 `node4` 会受影响。
一致性哈希分区的主要问题在于，当 **节点数量较少** 时，增加或删减节点，**对单个节点的影响可能很大**，造成数据的严重不平衡。还是以上图为例，如果去掉 `node2`，`node4` 中的数据由总数据的 `1/4` 左右变为 `1/2` 左右，与其他节点相比负载过高。

#### 方案三：带有虚拟节点的一致性哈希分区

该方案在 **一致性哈希分区的基础上**，引入了 **虚拟节点** 的概念。Redis 集群使用的便是该方案，其中的虚拟节点称为 **槽（slot）**。槽是介于数据和实际节点之间的虚拟概念，每个实际节点包含一定数量的槽，每个槽包含哈希值在一定范围内的数据。
在使用了槽的一致性哈希分区中，**槽是数据管理和迁移的基本单位**。槽 **解耦** 了 **数据和实际节点** 之间的关系，增加或删除节点对系统的影响很小。仍以上图为例，系统中有 `4` 个实际节点，假设为其分配 `16` 个槽(0-15)；

- 槽 0-3 位于 node1；4-7 位于 node2；以此类推....

如果此时删除 `node2`，只需要将槽 4-7 重新分配即可，例如槽 4-5 分配给 `node1`，槽 6 分配给 `node3`，槽 7 分配给 `node4`；可以看出删除 `node2` 后，数据在其他节点的分布仍然较为均衡。

- 集群模式的搭建
- 为搭建好的集群
  - 添加一个从节点
  - 删除一个从节点
  - 从新 reshard
  - 负载均衡： 执行 rebalance 命令，但是此命令在 redis 认为没有必要执行时可能直接退出；
- 槽 slot
  - 16384
  - slot = CRC16(key) % 16383
- 故障发现
- 故障发现里面有两个重要的概念：疑似下线（PFAIL-Possibly Fail）和确定下线（Fail）。
  - 集群中的健康监测是通过定期向集群中的其他节点发送 PING 信息来确认的，如果发送 PING 消息的节点在规定时间内，没有收到返回的 PONG 消息，那么对方节点就会被标记为疑似下线。
  - 一个节点发现某个节点疑似下线，它会将这条信息向整个集群广播，其它节点就会收到这个消息，并且通过 PING 的方式监测某节点是否真的下线了。如果一个节点收到某个节点疑似下线的数量超过集群数量的一半以上，就可以标记该节点为确定下线状态，然后向整个集群广播，强迫其它节点也接收该节点已经下线的事实，并立即对该失联节点进行主从切换。
  - 这就是疑似下线和确认下线的概念，这个概念和哨兵模式里面的主观下线和客观下线的概念比较类似。
- 故障转移
  - 当一个节点被集群标识为确认下线之后就可以执行故障转移了，故障转移的执行流程如下：
    - 从下线的主节点的所有从节点中，选择一个从节点（选择的方法详见下面“新主节点选举原则”部分）；
    - 从节点会执行 SLAVEOF NO ONE 命令，关闭这个从节点的复制功能，并从从节点转变回主节点，原来同步所得的数据集不会被丢弃；
    - 新的主节点会撤销所有对已下线主节点的槽指派，并将这些槽全部指派给自己；
    - 新的主节点向集群广播一条 PONG 消息，这条 PONG 消息是让集群中的其他节点知道此节点已经由从节点变成了主节点，并且这个主节点已经接管了原本由已下线节点负责处理的槽位信息；
    - 新的主节点开始处理相关的命令请求，此故障转移过程完成。
- 新主节点选举原则
  - 新主节点选举的方法是这样的：
    - 集群的纪元（epoch）是一个自增计数器，初始值为 0；
    - 而每个主节点都有一次投票的机会，主节点会把这一票投给第一个要求投票的从节点；
    - 当从节点发现自己正在复制的主节点确认下线之后，就会向集群广播一条消息，要求所有有投票权的主节点给此从节点投票；
    - 如果有投票权的主节点还没有给其他人投票的情况下，它会向第一个要求投票的从节点发送一条消息，表示把这一票投给这个从节点；
    - 当从节点收到投票数量大于集群数量的半数以上时，这个从节点就会当选为新的主节点。

## 40 实战：Redis 集群模式（下）

与 39 合并；

## 41 案例：Redis 问题汇总和相关解决方案

- 缓存击穿
  - 热点缓存恰好在高并发场景下失效，导致大量请求直接打到数据库上的情况；
  - 解决方案
    - 加锁排队
    - 永不过期
- 缓存穿透
  - 请求的数据在数据库和缓存中都不存在，导致每次请求都请求到数据库
  - 解决方案
    - 加过滤器
    - 缓存空结果
- 缓存雪崩
  - 短时间内大量缓存过期，导致请求直接打到数据库上，给数据库造成巨大压力，甚至导致数据库宕机问题；
  - 解决方案
    - 加锁排队
    - 随机化过期时间
    - 设置二级缓存
- 缓存预热
  - 设置启动时自动加载数据到缓存中
  - 设置加载数据的接口，手动触发
  - 设置定时任务

## 42 技能学习指南

## 43 加餐：Redis 的可视化管理工具

- RedisClient
- Redis Desktop Manager
- RedisStudio
- AnotherRedisDesktopManager
- Reids Insight

---
