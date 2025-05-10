
![image.png](./image/InnoDB中的数据存储/1699925029655.png)


- 内存部分： 
   - 由多个缓冲区构成，使用多个缓冲区的目的在于增加临界资源，减少多个线程对缓冲区的竞争，用来提高并发；
   - 每一个缓冲区都被称为一个缓冲区实例，根据存储内容，把缓冲器划分为两类：缓冲池（Buffer Pool，检测BP） 和 日志缓冲（Log Buffer，缓存写入log文件的数据，即redolog数据和undolog数据）；
   - 每一个缓冲区实例是由多个离散的页（page）组成的，缓存页的大小和磁盘页一样为16K；
- OS Cache部分： 操作系统缓存
- 磁盘部分： 包括各种表空间，可以理解为磁盘文件；包括以下5中表空间 
   - 系统表空间 （System Tablespace，又称共享表空间）
   - 独立表空间（File-Per-Table Tablespaces）
   - undo表空间（undo Tablespaces）
   - 通用表空间（General Tablespaces）
   - 临时表空间（temporary tablespace）
