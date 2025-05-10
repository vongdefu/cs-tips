# ThreadLocal 类

多线程环境下访问一个共享变量，会出现线程安全问题，为保证共享变量的线程安全，我们常常采用加锁的方式来解决，如果锁使用不当，就会产生死锁的问题。为此，JDK 提供了 ThreadLocal 类，基本原理是为每一个线程提供共享变量副本，让每一个线程操作共享变量时，都操作自己的变量副本。

## 简单使用

<details>

<summary>例子1</summary>

```java
public class ThreadLocalTest {
  private static ThreadLocal<String> threadLocal = new ThreadLocal<String>();
  public static void main(String[] args){
    //创建第一个线程
    Thread threadA = new Thread(()->{
      threadLocal.set("ThreadA：" + Thread.currentThread().getName());
      System.out.println("线程A本地变量中的值为：" + threadLocal.get());
    });
    //创建第二个线程
    Thread threadB = new Thread(()->{
      threadLocal.set("ThreadB：" + Thread.currentThread().getName());
      System.out.println("线程B本地变量中的值为：" + threadLocal.get());
    });
    //启动线程A和线程B
    threadA.start();
    threadB.start();
  }
}

// 运行结果
线程A本地变量中的值为：ThreadA：Thread-0
线程B本地变量中的值为：ThreadB：Thread-1
```

</details>

<details>

<summary>例子2</summary>

```java
public class ThreadLocalTest {
  private static ThreadLocal<String> threadLocal = new ThreadLocal<String>();
  public static void main(String[] args){
    //创建第一个线程
    Thread threadA = new Thread(()->{
      threadLocal.set("ThreadA：" + Thread.currentThread().getName());
      System.out.println("线程A本地变量中的值为：" + threadLocal.get());
      threadLocal.remove();
      System.out.println("线程A删除本地变量后ThreadLocal中的值为：" + threadLocal.get());
    });
    //创建第二个线程
    Thread threadB = new Thread(()->{
      threadLocal.set("ThreadB：" + Thread.currentThread().getName());
      System.out.println("线程B本地变量中的值为：" + threadLocal.get());
      System.out.println("线程B没有删除本地变量：" + threadLocal.get());
    });
    //启动线程A和线程B
    threadA.start();
    threadB.start();
  }
}

// 运行结果
线程A本地变量中的值为：ThreadA：Thread-0
线程B本地变量中的值为：ThreadB：Thread-1
线程B没有删除本地变量：ThreadB：Thread-1
线程A删除本地变量后ThreadLocal中的值为：null
```

</details>

从上面两个例子中，可以看出，线程 A 和线程 B 存储在 ThreadLocal 中的变量互不干扰，线程 A 存储的变量只能由线程 A 访问，线程 B 存
储的变量只能由线程 B 访问。

## 原理

我们先看 Thread 类，

```java
public class Thread implements Runnable {
  /***********省略N行代码*************/
  ThreadLocal.ThreadLocalMap threadLocals = null;
  ThreadLocal.ThreadLocalMap inheritableThreadLocals = null;
  /***********省略N行代码*************/
}
```

可以看出：

1. Thread 类中存在两个成员变量 threadLocals 和 inheritableThreadLocals，
2. 这两个成员变量的类型均为 ThreadLocal.ThreadLocalMap；
3. 这两个变量的初始值均为 null；

也就是说，**线程的本地变量并不是存放在 ThreadLocal 中的，而是存放在每一个线程对象的 threadLocals 变量里面的**。也就是说：

1. ThreadLocal 中保存的线程本地变量，事实上是存放在具体线程的内存空间中的；
2. ThreadLocal 类只是提供了用来操作线程本地变量的方法： set() 和 get() ；
   1. 调用 ThreadLocal 类的 set() 方法时，就把变量保存到执行此 set()方法的线程中去；
   2. 调用 ThreadLocal 类的 get() 方法时，就从调用 get()方法的当前线程中的 threadLocals 变量中的值取出来；

### ThreadLocal.set()

<details>

<summary>ThreadLocal.set()源码</summary>

```java
public void set(T value) {
  //获取当前线程
  Thread t = Thread.currentThread();
  //以当前线程为Key，获取ThreadLocalMap对象
  ThreadLocalMap map = getMap(t);   // @1处
  //获取的ThreadLocalMap对象不为空
  if (map != null)
    //设置value的值
    map.set(this, value);   // @A处： 调用ThreadLocalMap中的set方法；
  else
    //获取的ThreadLocalMap对象为空，创建Thread类中的threadLocals变量
    createMap(t, value);    // @2
}

// @1处跳转到此方法
ThreadLocalMap getMap(Thread t) {
  return t.threadLocals;
}

// @2处跳转到此方法
void createMap(Thread t, T firstValue) {
  t.threadLocals = new ThreadLocalMap(this, firstValue);
}
```

</details>

代码解析：

1. 先获取调用 set(T value)方法的当前线程；
2. 之后调用 getMap(t)： 把获得的当前线程作为参数传递给 getMap(t) 方法，此方法返回 t.threadLocals 变量的值，这个值的类型为 ThreadLocalMap；
3. 如果获取到的 t.threadLocals ：
   1. 不为空，就把【当前对象作为 map 的 key，要设置的变量的 value 作为 map 的 value】设置到 map 中去；
   2. 为空，就以当前对象为 key，要设置的变量的值为 value，构造出一个 ThreadLocalMap 对象，之后把构造出的这个对象赋值给当前线程的 threadLocals 变量；

### ThreadLocal.get()

<details>

<summary>ThreadLocal.get()源码</summary>

```java
public T get() {
  //获取当前线程
  Thread t = Thread.currentThread();
  //获取当前线程的threadLocals成员变量
  ThreadLocalMap map = getMap(t);
  //获取的threadLocals变量不为空
  if (map != null) {
    //返回本地变量对应的值
    ThreadLocalMap.Entry e = map.getEntry(this);    // @B，调用 ThreadLocalMap 中的 getEntry() 方法
    if (e != null) {
      @SuppressWarnings("unchecked")
      T result = (T)e.value;
      return result;
    }
  }
  //初始化threadLocals成员变量的值
  return setInitialValue();   // @1
}

// @1处跳转到此方法
private T setInitialValue() {
  //调用初始化Value的方法
  T value = initialValue();   // @2
  Thread t = Thread.currentThread();
  //根据当前线程获取threadLocals成员变量
  ThreadLocalMap map = getMap(t);
  if (map != null)
    //threadLocals不为空，则设置value值
    map.set(this, value);
  else
    //threadLocals为空,创建threadLocals变量
    createMap(t, value);
  return value;
}

// @2处跳转到此方法
protected T initialValue() {
  return null;
}
```

</details>

代码解析：

1. 先获取调用 set(T value)方法的当前线程；
2. getMap(t)： 把获得的当前线程作为参数传递给 getMap(t) 方法，此方法返回 t.threadLocals 变量的值，这个值的类型为 ThreadLocalMap；
3. 如果获取到的 t.threadLocals ：
   1. 不为空，就使用当前对象作为 key，去获得的 map 中找到 Entry，之后强转为 T 类型后返回；
   2. 如果为空，就执行 setInitialValue() 方法，过程跟 set()方法一样：
      1. 获取当前线程；
      2. 在获取当前线程的 threadLocals 变量；
      3. 如果不为空，就用当前对象作为 key，变量的值作为 value，保存到 map 中去；
      4. 如果不为空，就以当前对象为 key，要设置的变量的值为 value，构造出一个 ThreadLocalMap 对象，之后把构造出的这个对象赋值给当前线程的 threadLocals 变量；

### ThreadLocal.remove()

<details>

<summary>ThreadLocal.remove()源码</summary>

```java
public void remove() {
  //根据当前线程获取threadLocals成员变量
  ThreadLocalMap m = getMap(Thread.currentThread());
  if (m != null)
    //threadLocals成员变量不为空，则移除value值
    m.remove(this);   // C处：调用 ThreadLocalMap 中的 remove() 方法
}
```

</details>

代码解析：

1. 根据当前线程获取 threadLocals 成员变量；
2. 如果不为空，就调用 remove 方法，移除掉即可；

## ThreadLocalMap 解析

<details>

<summary>ThreadLocal.ThreadLocalMap 源码</summary>

```java
public class ThreadLocal<T> {
  ...
  static class ThreadLocalMap {
      static class Entry extends WeakReference<ThreadLocal<?>> {
          Object value;

          Entry(ThreadLocal<?> k, Object v) {
              super(k);  // 这里的 Key 是 WeakReference
              value = v;
          }
      }

      private Entry[] table;  // 存储 ThreadLocal 变量的数组
      private int size;       // 当前 Entry 数量
      private int threshold;  // 触发扩容的阈值

      ...省略方法
  }
  ...
}

```

</details>

可以看出：

1. ThreadLocalMap 内部有一个 entry 数组 table ；
2. 这个 entry 数组的元素类型是位于 ThreadLocalMap 内部的静态类 Entry ；
3. 这个 静态内部类 Entry 继承自 WeakReference 类，这是一个弱引用，当内存不足时， JVM 会回收 ThreadLocal 对象，并且将其对应的 Entry.value 设置为 null，这样可以在很大程度上避免内存泄漏。

### ThreadLocalMap 中的 set() 方法

再看 ThreadLocal 中的 set() 源码，在 【**@A 处**】实际上调用的是：ThreadLocalMap 中的 set() 方法：

<details>

<summary>ThreadLocal.ThreadLocalMap中的set()方法</summary>

```java
private void set(ThreadLocal<?> key, Object value) {
  Entry[] tab = table;
  int len = tab.length;
  int i = key.threadLocalHashCode & (len - 1); // @1： 判断是否越界

  for (Entry e = tab[i];
      e != null;
      e = tab[nextIndex(i, len)]) { // @2-解决hash冲突
    ThreadLocal<?> k = e.get();
    if (k == key) { // 如果 key 已存在，更新 value
      e.value = value;
      return;
    }
    if (k == null) { // Key 为 null，清理无效 Entry
      replaceStaleEntry(key, value, i);
      return;
    }
  }

  tab[i] = new Entry(key, value); // 直接插入 Entry
  size++;
  if (size >= threshold) {
    rehash();   // @3-大于阈值后进行rehash()；
  }
}

// @1跳转到ThreadLocal外部，之后调用nextHashCode()方法来计算新增entry的索引值；
private final int threadLocalHashCode = nextHashCode();
private static AtomicInteger nextHashCode = new AtomicInteger();
private static final int HASH_INCREMENT = 0x61c88647;
private static int nextHashCode() {
  return nextHashCode.getAndAdd(HASH_INCREMENT);
}

// @2处调用ThreadLocalMap中的nextIndex()方法解决hash冲突
private static int nextIndex(int i, int len) {
  return ((i + 1 < len) ? i + 1 : 0);
}

// @3处调用ThreadLocalMap中的rehash()方法进行rehash
private void rehash() {
  // 清理被 GC 回收的 key
  // 看方法源码得知： 清理过程会遍历整个数组，将 key 为 null 的 Entry 清除。
  expungeStaleEntries();

  //扩容
  if (size >= threshold - threshold / 4)
    resize(); // @4-扩容
}

// @4缩扩容： 调用 ThreadLocalMap中的 resize() 方法
private void resize() {
  Entry[] oldTab = table;
  int oldLen = oldTab.length;
  // 扩容为原来的两倍
  int newLen = oldLen * 2;
  Entry[] newTab = new Entry[newLen];

  int count = 0;
  // 遍历老数组
  for (int j = 0; j < oldLen; ++j) {
    Entry e = oldTab[j];
    if (e != null) {
      ThreadLocal<?> k = e.get();
      if (k == null) {
        e.value = null; // 释放 Value，防止内存泄漏
      } else {
        // 重新计算位置
        int h = k.threadLocalHashCode & (newLen - 1);
        while (newTab[h] != null) {
          // 线性探测寻找新位置
          h = nextIndex(h, newLen);
        }
        // 放入新数组
        newTab[h] = e;
        count++;
      }
    }
  }
  table = newTab;
  size = count;
  threshold = newLen * 2 / 3; // 重新计算缩扩容阈值
}

```

</details>

代码解析：

1. 每创建一个 ThreadLocal 对象，它就会新增一个**黄金分割数**，可以让哈希码分布的非常均匀；
2. 使用 开放定址法 来确定 value 要保存的位置；
   1. 如果 i 位置被占用，尝试 i+1 ；
   2. 如果 i+1 也被占用，继续探测 i+2 ，直到找到一个空位；
   3. 如果到达数组末尾，则回到数组头部，继续寻找空位；
3. 把 entry 放到 hash 表中；
4. 对 size 加 1 后判断是否大于阈值，是的话就进入 rehash 过程；
   1. rehash 过程总的来讲是“先清理再扩容”；
   2. 清理时，调用 expungeStaleEntries()方法，清理到被 GC 回收的 key；
   3. 之后判断清理后的数组大小是否大于阈值的四分之三，如果大于就执行 resize() 方法进行扩容；
   4. 调用 resize() 方法扩容时，会先申请一个数组长度 2 倍的空间，然后使用开放定址法把原数组中的 entry 复制到新数组；

<div class="warning">

开放定址法和拉链法是散列表查找元素的两种重要的方法。

1. 开放寻址法： 就是先确定索引位置，之后判断索引位置是否为空，如果为空就把元素填进去；如果不为空就找下一个位置，直到数组末尾；到数组末尾之后又从头开始，还是一个位置一个位置的找，直到找到空位置；Java 中的 ThreadLocalMap 中的 Entry 数组采用的就是这种方式；
2. 拉链法： 会把索引相同的放到一个链表上，在查找时，先计算出索引位置，然后对比此位置上的链表，直到 value 相同；在插入时，先定位索引位置，然后往链表上插，有头插法和尾插法，前插法就是插入时断开链表，把新元素插到链表头处；尾插法就是插入时不需要断开链表，直接把元素插入到链表结尾；Java 中的 HashMap 采用的是这种方式；

</div>

### ThreadLocalMap 中的 getEntry()方法

再看 ThreadLocal 的 get() 源码，在【**B 处**】实际上调用的： ThreadLocalMap 中的 getEntry()方法：

<details>

<summary>ThreadLocal.ThreadLocalMap中的getEntry()方法</summary>

```java
private Entry getEntry(ThreadLocal<?> key) {
  int i = key.threadLocalHashCode & (table.length - 1);
  Entry e = table[i];

  if (e != null && e.get() == key) { // 如果 key 存在，直接返回
      return e;
  } else {
      return getEntryAfterMiss(key, i, e); // 继续查找
  }
}
```

</details>

代码解析：先获取 key 的索引，之后使用开放定址法找到对应的 value。

### ThreadLocalMap 中的 remove()方法

再看 ThreadLocal 的 remove() 源码，在【**CC 处**】实际上调用的： ThreadLocalMap 中的 remove()方法：

<details>

<summary>ThreadLocal.ThreadLocalMap中的remove()方法</summary>

```java
private void remove(ThreadLocal<?> key) {
  Entry[] tab = table;
  int len = tab.length;
  int i = key.threadLocalHashCode & (len - 1);

  for (Entry e = tab[i]; e != null; e = tab[nextIndex(i, len)]) {
    if (e.get() == key) {
      e.clear(); // 清除 WeakReference
      e.value = null; // 释放 Value
      expungeStaleEntries();
      return;
    }
  }
}
```

</details>

代码解析： 先获取 key 的索引，之后使用开放定址法找到 value，之后进行清除。

## 应用场景

### 阿里巴巴开发手册中推荐的 ThreadLocal 的用法

<details>

<summary>推荐用法</summary>

```java
import java.text.DateFormat;
import java.text.SimpleDateFormat;

public class DateUtils {
    public static final ThreadLocal<DateFormat> df = new ThreadLocal<DateFormat>(){
        @Override
        protected DateFormat initialValue() {
            return new SimpleDateFormat("yyyy-MM-dd");
        }
    };
}


// 使用
DateUtils.df.get().format(new Date());
```

</details>

## ThreadLocal 变量不具有传递性

```java
public class ThreadLocalTest {
  private static ThreadLocal<String> threadLocal = new ThreadLocal<String>();
  public static void main(String[] args){
    //在主线程中设置值
    threadLocal.set("ThreadLocalTest");
    //在子线程中获取值
    Thread thread = new Thread(new Runnable() {

    @Override
    public void run() {
      System.out.println("子线程获取值：" + threadLocal.get());
    }

  });
  //启动子线程
  thread.start();
  //在主线程中获取值
  System.out.println("主线程获取值：" + threadLocal.get());
}

// 运行结果
主线程获取值：ThreadLocalTest
子线程获取值：null
```

解释：因为 ThreadLocal 变量存储在每个线程的 ThreadLocalMap 中，而子线程不会继承父线程的 ThreadLocalMap。

可以使用 InheritableThreadLocal 来解决这个问题。

## InheritableThreadLocal 使用示例

```java
class InheritableThreadLocalExample {
    private static final InheritableThreadLocal<String> inheritableThreadLocal = new InheritableThreadLocal<>();

    public static void main(String[] args) {
        inheritableThreadLocal.set("父线程的值");

        new Thread(() -> {
            System.out.println("子线程获取的值：" + inheritableThreadLocal.get()); // 继承了父线程的值
        }).start();
    }
}
```

## InheritableThreadLocal 原理

```java
public class Thread {
    /* 普通 ThreadLocal 变量存储的地方 */
    ThreadLocal.ThreadLocalMap threadLocals = null;

    /* InheritableThreadLocal 变量存储的地方 */
    ThreadLocal.ThreadLocalMap inheritableThreadLocals = null;
}
```

在 Thread 类的定义中，每个线程都有两个 ThreadLocalMap：

- threadLocals 用来存放普通 ThreadLocal 本地变量，且不会被子线程继承；
- inheritableThreadLocals 用来存放 InheritableThreadLocal 类型的本地变量；

InheritableThreadLocal 类型的本地变量的原理：

当 `new Thread()` 创建一个子线程时，Thread 的 `init()` 方法会检查父线程是否有 inheritableThreadLocals，如果有，就会拷贝 InheritableThreadLocal 变量到子线程：

```java
private void init(ThreadGroup g, Runnable target, String name, long stackSize) {
    // 获取当前父线程
    Thread parent = currentThread();
    // 复制 InheritableThreadLocal 变量
    if (parent.inheritableThreadLocals != null) {
        this.inheritableThreadLocals =
            ThreadLocal.createInheritedMap(parent.inheritableThreadLocals);
    }
}
```

---

## 总结

1. 在多线程场景下，常常涉及到共享变量的使用，为了保证线程安全，我们常常使用锁，但是锁使用不当时，会产生死锁的问题。为此 jdk 基于线程本地变量的思想，实现了 ThreadLocal 类，其核心理念是： 改共享变量为线程的本地变量，即让每一个线程都拥有一个变量副本保存到线程本地。
2. ThreadLocal 类是 JDK 为每一个线程创建本地变量的解决方案，这个类主要有三个方法：set、get、remove；
   1. set 方法
      1. 先获取调用 set(T value)方法的当前线程；
      2. 之后调用 getMap(t)： 把获得的当前线程作为参数传递给 getMap(t) 方法，此方法返回 t.threadLocals 变量的值，这个值的类型为 ThreadLocalMap；
      3. 如果获取到的 t.threadLocals ：
         1. 不为空，就把【当前对象作为 map 的 key，要设置的变量的 value 作为 map 的 value】设置到 map 中去；
         2. 为空，就以当前对象为 key，要设置的变量的值为 value，构造出一个 ThreadLocalMap 对象，之后把构造出的这个对象赋值给当前线程的 threadLocals 变量；
   2. get 方法
      1. 先获取调用 set(T value)方法的当前线程；
      2. 之后调用 getMap(t)： 把获得的当前线程作为参数传递给 getMap(t) 方法，此方法返回 t.threadLocals 变量的值，这个值的类型为 ThreadLocalMap；
      3. 如果获取到的 t.threadLocals ：
         1. 不为空，就使用当前对象作为 key，去获得的 map 中找到 Entry，之后强转为 T 类型后返回；
         2. 如果为空，就执行 setInitialValue() 方法，过程跟 set()方法一样：
            1. 获取当前线程；
            2. 在获取当前线程的 threadLocals 变量；
            3. 如果不为空，就用当前对象作为 key，变量的值作为 value，保存到 map 中去；
            4. 如果不为空，就以当前对象为 key，要设置的变量的值为 value，构造出一个 ThreadLocalMap 对象，之后把构造出的这个对象赋值给当前线程的 threadLocals 变量；
   3. remove 方法
      1. 根据当前线程获取 threadLocals 成员变量；如果不为空，就调用 remove 方法，移除掉即可；
      2. 为防止内存泄漏，最佳实践是每次使用完，要调用此方法以清除线程本地变量；
3. 由 set 方法可知： ThreadLocal 类保存的变量，实际上并不是保存在 ThreadLocal 的内部，而是保存到 Thread 类中的 threadLocals 变量中的，也就是说线程的本地变量是保存在具体的每一个线程的内存空间中，ThreadLocal 只是提供了对线程本地变量的操作方法；
4. Thread 类中的 threadLocals 变量的类型是 ThreadLocalMap，这是一个 ThreadLocal 的静态内部类，它的内部是一个 entry 数组，逻辑上是一个散列表；
5. Entry 类又是 ThreadLocalMap 内部的一个静态内部类，这个类继承自 WeakReference 类，WeakReference 是一个弱引用，当内存不足时， JVM 会回收 ThreadLocal 对象，并且将其对应的 Entry.value 设置为 null，可以避免内存泄漏。
6. 应用程序中对 ThreadLocal 的 set、get、remove 方法的调用最终都会调用到静态内部类 ThreadLocalMap 的对应的方法上；
   1. ThreadLocal 的 set 方法的调用会调用到 ThreadLocalMap 的 set 方法上：
      1. 这个方法会先生成一个 entry 对象，然后使用开放定址法把这个 entry 放到数组中去
      2. 之后判断 数组大小 是否超出阈值，如果超出阈值，则执行 rehash 过程；
      3. rehash 过程主要是“先清理，再扩容”；
      4. 清理时，抹除被 GC 回收的 entry；
      5. 之后判断数组大小是否超过阈值的四分之三，
         1. 如果大于，就执行 resize() 方法，此时 rehash 过程属于扩容过程；
         2. 如果不大于，那么抹除 GC 回收的 entry 之后，rehash 就结束了，此时 rehash 过程属于缩容过程；
      6. 扩容的过程是： 先申请一块两倍大小的内存，之后把 entry 一个个按照开放定址的方式复制到新的内存空间，最后使用新数组替换旧数组；
   2. ThreadLocal 的 get 方法会调用到 ThreadLocalMap 的 getEntry 方法上，这个方法会使用开放定址法来找到 entry 数组中的变量；
   3. ThreadLocal 的 remove 方法会调用到 ThreadLocalMap 的 remove 方法上，这个方法同样使用开放定址法清除找到的 entry 变量；
7. 使用 ThreadLocal 作为线程本地变量时，子线程是无法继承父线程的本地变量的；这是因为 ThreadLocal 会为每一个线程都创建一个线程本地变量；
8. InheritableThreadLocal 可以实现子线程继承父线程的本地变量，它的原理是： InheritableThreadLocal 把线程本地变量存放到 Thread.inheritableThreadLocals 变量中，当 new Thread()创建一个子线程时，Thread 类中的 init 方法会检查父线程中是否有 inheritableThreadLocals ，如果有，就拷贝给子线程，这样就实现了继承的目的；
