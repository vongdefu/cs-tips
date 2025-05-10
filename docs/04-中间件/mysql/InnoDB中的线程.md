
## 查看InnoDB中的工作线程


```
mysql> show engine innodb status;

```

把输出结果中无用的信息剔除后：


```
=====================================
2023-06-06 03:42:16 0x7fc3dc11d700 INNODB MONITOR OUTPUT
=====================================
Per second averages calculated from the last 21 seconds
-----------------
BACKGROUND THREAD
-----------------
srv_master_thread loops: 1 srv_active, 0 srv_shutdown, 79992 srv_idle
srv_master_thread log flush and writes: 79993
----------
SEMAPHORES
----------
OS WAIT ARRAY INFO: reservation count 2
OS WAIT ARRAY INFO: signal count 2
RW-shared spins 0, rounds 4, OS waits 2
RW-excl spins 0, rounds 0, OS waits 0
RW-sx spins 0, rounds 0, OS waits 0
Spin rounds per wait: 4.00 RW-shared, 0.00 RW-excl, 0.00 RW-sx
------------
TRANSACTIONS
------------
Trx id counter 45571
Purge done for trx's n:o < 0 undo n:o < 0 state: running but idle
History list length 0
LIST OF TRANSACTIONS FOR EACH SESSION:
---TRANSACTION 421954169522016, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
--------
FILE I/O
--------
I/O thread 0 state: waiting for completed aio requests (insert buffer thread)
I/O thread 1 state: waiting for completed aio requests (log thread)
I/O thread 2 state: waiting for completed aio requests (read thread)
I/O thread 3 state: waiting for completed aio requests (read thread)
I/O thread 4 state: waiting for completed aio requests (read thread)
I/O thread 5 state: waiting for completed aio requests (read thread)
I/O thread 6 state: waiting for completed aio requests (write thread)
I/O thread 7 state: waiting for completed aio requests (write thread)
I/O thread 8 state: waiting for completed aio requests (write thread)
I/O thread 9 state: waiting for completed aio requests (write thread)
Pending normal aio reads: [0, 0, 0, 0] , aio writes: [0, 0, 0, 0] ,
 ibuf aio reads:, log i/o's:, sync i/o's:
Pending flushes (fsync) log: 0; buffer pool: 0
467 OS file reads, 53 OS file writes, 7 OS fsyncs
0.00 reads/s, 0 avg bytes/read, 0.00 writes/s, 0.00 fsyncs/s
-------------------------------------
INSERT BUFFER AND ADAPTIVE HASH INDEX
-------------------------------------
Ibuf: size 1, free list len 3092, seg size 3094, 0 merges
merged operations:
 insert 0, delete mark 0, delete 0
discarded operations:
 insert 0, delete mark 0, delete 0
Hash table size 34679, node heap has 0 buffer(s)
Hash table size 34679, node heap has 0 buffer(s)
Hash table size 34679, node heap has 0 buffer(s)
Hash table size 34679, node heap has 0 buffer(s)
Hash table size 34679, node heap has 0 buffer(s)
Hash table size 34679, node heap has 0 buffer(s)
Hash table size 34679, node heap has 0 buffer(s)
Hash table size 34679, node heap has 0 buffer(s)
0.00 hash searches/s, 0.00 non-hash searches/s
---
LOG
---
Log sequence number 23040733278
Log flushed up to   23040733278
Pages flushed up to 23040733278
Last checkpoint at  23040733269
0 pending log flushes, 0 pending chkp writes
10 log i/o's done, 0.00 log i/o's/second
----------------------
BUFFER POOL AND MEMORY
----------------------
Total large memory allocated 137428992
Dictionary memory allocated 117329
Buffer pool size   8192
Free buffers       7719
Database pages     473
Old database pages 0
Modified db pages  0
Pending reads      0
Pending writes: LRU 0, flush list 0, single page 0
Pages made young 0, not young 0
0.00 youngs/s, 0.00 non-youngs/s
Pages read 439, created 34, written 36
0.00 reads/s, 0.00 creates/s, 0.00 writes/s
No buffer pool page gets since the last printout
Pages read ahead 0.00/s, evicted without access 0.00/s, Random read ahead 0.00/s
LRU len: 473, unzip_LRU len: 0
I/O sum[0]:cur[0], unzip sum[0]:cur[0]
--------------
ROW OPERATIONS
--------------
0 queries inside InnoDB, 0 queries in queue
0 read views open inside InnoDB
Process ID=1, Main thread ID=140478756386560, state: sleeping
Number of rows inserted 0, updated 0, deleted 0, read 8
0.00 inserts/s, 0.00 updates/s, 0.00 deletes/s, 0.00 reads/s
----------------------------
END OF INNODB MONITOR OUTPUT
============================

```

从上面输出结果的`FILE I/O`部分可知，总共有四类IO工作线程，如下：

- read thread：将数据从磁盘加载到缓存page页；
- write thread：将缓存脏页刷新到磁盘；
- log thread：将日志缓冲区刷盘到log文件；
- insert buffer thread：将写缓冲change buffer的更改内容刷新到磁盘；


### Master Thread 主线程

负责调度其他线程，优先级最高。主要职能：脏页刷盘（调用page cleaner thread）、undo页回收（purge thread）、redo日志刷新（log thread）、合并写缓冲（insert buffer thread）。如果这些子线程通过配置关闭了，那么关闭的子线程的任务就会由master thread来做。

主线程是由多个无限循环构成的，主要有2个主处理，分别是每隔1秒和10秒的处理：

- 每1秒的操作（有条件的做）： 
   - 刷盘日志缓冲区
   - 合并change buffer数据到磁盘的B+树中，根据IO读写压力决定是否操作
   - 刷盘脏页到磁盘（条件是脏页比例达到75%才操作（innodb_max_dirty_pages_pct），而且不是一次性刷盘所有脏页，而是默认每次刷盘200页（innodb_io_capacity））。
- 每10秒操作（无条件的做）： 
   - 刷盘脏页到磁盘
   - 合并change buffer数据
   - 刷盘日志缓冲区
   - 删除无用的undo页


### Purge Thread 线程

事务提交之后，该事务相关的undo日志不再需要，Purge Thread负责回收已分配的undo页。默认有4个purge thread。


```
mysql> show variables like '%innodb_purge_threads%';
+----------------------+-------+
| Variable_name        | Value |
+----------------------+-------+
| innodb_purge_threads | 4     |
+----------------------+-------+
1 row in set (0.00 sec)

```


### Page Cleaner thread 线程

将脏数据刷新到磁盘（会调用 write thread 线程），脏数据刷盘后对应的redo log也就没用了，可以释放掉这部分 redo log，达到redo log 循环使用的目的。默认有1个Page Cleaner thread。


```
mysql> show variables like '%innodb_page_cleaners%';
+----------------------+-------+
| Variable_name        | Value |
+----------------------+-------+
| innodb_page_cleaners | 1     |
+----------------------+-------+
1 row in set (0.00 sec)

```


## 总结

InnoDB中的线程包括两大类：

- 读写工作线程 
   - `read thread`：将数据从磁盘加载到缓存page页；
   - `write thread`：将缓存脏页刷新到磁盘；
   - `log thread`：将日志缓冲区刷盘到log文件；
   - `insert buffer thread`：将写缓冲change buffer的更改内容刷新到磁盘；
- 后台辅助线程 
   - `Master Thread 主线程`： 负责调度其他线程，优先级最高。主要职能：脏页刷盘（调用page cleaner thread）、undo页回收（purge thread）、redo日志刷新（log thread）、合并写缓冲（insert buffer thread）。如果这些子线程通过配置关闭了，那么关闭的子线程的任务就会由master thread来做。
   - `Purge Thread 线程`：事务提交之后，该事务相关的undo日志不再需要，Purge Thread负责回收已分配的undo页。默认有4个purge thread。
   - `Page Cleaner thread 线程`：将脏数据刷新到磁盘（会调用 write thread 线程），脏数据刷盘后对应的redo log也就没用了，可以释放掉这部分 redo log，达到redo log 循环使用的目的。默认有1个Page Cleaner thread。



