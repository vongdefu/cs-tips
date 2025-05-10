

# 附录 02 基准测试示例

好的，这里是一个简单的 Redis 基准测试案例，可以帮助你评估 Redis 在你的环境中的性能。我们将使用 Redis 自带的 `redis-benchmark` 工具。假设你已经安装并运行了 Redis 服务器，以下是基准测试的步骤：

1.  **启动 Redis 服务器**：

确保 Redis 服务器已经在运行，默认情况下，它运行在端口 6379 上。 

```shell
redis-server

```
 

2.  **运行基准测试**：

使用 `redis-benchmark` 工具进行基准测试。以下命令将测试 Redis 的性能，执行 100000 个请求，使用 50 个并发连接。 

```shell
redis-benchmark -n 100000 -c 50

```

你会看到类似以下的输出： 

```shell
====== PING_INLINE ======
  100000 requests completed in 1.32 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1

99.94% <= 1 milliseconds
100.00% <= 2 milliseconds
100.00% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 5 milliseconds
100.00% <= 6 milliseconds
100.00% <= 6 milliseconds

====== PING_BULK ======
  100000 requests completed in 1.32 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1

99.96% <= 1 milliseconds
99.97% <= 2 milliseconds
100.00% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 5 milliseconds
100.00% <= 6 milliseconds
100.00% <= 6 milliseconds

====== SET ======
  100000 requests completed in 1.34 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1

99.94% <= 1 milliseconds
100.00% <= 2 milliseconds
100.00% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 5 milliseconds
100.00% <= 6 milliseconds
100.00% <= 6 milliseconds

====== GET ======
  100000 requests completed in 1.35 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1

99.93% <= 1 milliseconds
99.98% <= 2 milliseconds
100.00% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 5 milliseconds
100.00% <= 6 milliseconds
100.00% <= 6 milliseconds

```
 

- **解释结果**：以上输出结果表示不同命令的性能统计，例如 PING_INLINE、PING_BULK、SET、GET 等。每个部分显示了执行这些命令所花的时间和各百分位的响应时间。 
- **更多选项**：你可以通过 `redis-benchmark --help` 查看更多选项和参数。例如，你可以指定不同的数据大小、命令类型和测试的键数等。 

```shell
redis-benchmark --help

```
 

通过以上步骤，你可以基本了解 Redis 在你的环境中的性能表现。根据你的需求和测试结果，进一步优化 Redis 配置或硬件环境。

