# volatile 关键字

<details>

<summary>单例模式</summary>

```java
class Singleton{
  private volatile static Singleton instance = null;

  private Singleton() {}

  public static Singleton getInstance() {
      if(instance==null) {
          synchronized (Singleton.class) {
              if(instance==null) {
                  instance = new Singleton();
              }
          }
      }
      return instance;
  }
}

```

</details>

- 内部原理
  - 分析字节码，可以看出 volatile 关键字转化为了 lock 指令，这相当于给变量添加了一道内存屏障，这道内存屏障的作用就是当这个变量发生改变时让其他处理器得到的变量变成无效的。
  - 保证可见性
    - 某一线程对 volatile 变量的修改会同步到主存中，同时也会使已经读到该变量的其他线程的缓存中的值失效，当其他线程发现自己缓存中的值失效时，就会重新从主存中读取新值；
  - 禁止指令重排
    - 编译器或执行器进行指令优化时，不能改变 volatile 变量在源代码的位置；
    - 当程序执行到 volatile 变量的读写操作时，其前面的操作的一定是已经全部完成的，且操作的结果一定是对后面的操作可见；其后面的操作肯定还没有进行；
  - 不保证指令的原子性
  - 也不保证共享变量的互斥访问
- 所引起的问题
  - **总线风暴**： volatile 依赖**总线嗅探机制**不断刷新到主内存，而在多处理器架构上，所有的处理器是共用一条总线的，并且所有的处理器都是靠总线与住内存进行数据交互的，这种交互机制本质上是通过主线进行通信的，这种通信的流量就是缓存一致性流量，如果缓存一致性流量超过总线所能承受的最大带宽，就会造成总线风暴。（CAS 算法和 volatile 都会造成总线风暴）
