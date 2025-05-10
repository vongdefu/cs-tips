# final 关键字

## 使用场景

- 修饰类
  - 表明了你不能打算继承该类，也就是说这个类不能有子类；
  - 无需为 final 类中的方法添加 final，因为 final 类中的方法默认是 final 的， 也就是说这个类中所有的方法都不能被覆盖；
  - 要想扩展使用一个 final 类，除了继承之外，还可以使用组合的方式；
- 修饰方法
  - 被修饰的方法不能被覆盖，即不能被重写；
  - private 方法是隐式的 final
  - final 方法是可以被重载的
- 修饰参数
  - 可以对方法中的某一参数声明为 final，表明无法修改此参数所引用的对象；
  - 可以用来向匿名内部类传递数据；
- 修饰变量
  - 并不是所有被 final 修饰的字段都是编译期常量
  - 如 `Random r = new Random();  final int k = r.nextInt();` k 的最终值依旧可以改变；
  - blank final 变量
    - 表示 final 变量可以在声明时，声明为空白，即不赋值；
    - 但是在被使用之前，必须完成赋值；
  - static final 变量
    - final 表示这个变量的引用不可改变；
    - static 表示这个变量属于这个类，每个由这个类构造出来的对象都可以直接使用这个变量的引用；

## 多线程下的问题

由于编译器重排序机制，可能就会出现这种情况：

1. 比如说某个 final 方法，线程 A 还没有完成对这个对象的构造，线程 B 就开始使用这个对象的 final 方法了；
2. 比如说某个 final 变量，线程 A 还没有完成对这个 final 变量的赋值操作，线程 B 就要访问这个 final 变量了；

## 线程安全的保证措施

JVM 禁用了一些重排序的规则，保证了 final 域在多线程场景下的线程安全。

- 修饰基本数据类型
  - 禁止把 `对 final 域的写操作` 重排序到 `构造函数` 之后；
    - 也就是说，构造之前先赋值；
    - 实现原理：在构造函数返回之前插入 StoreStore 屏障；
  - 禁止把 `对 final 域的读操作` 重排序到 `读到对象引用` 之后；
    - 也就是说，不能还没有拿到对象的引用，就向访问这个对象中的 final 域；
    - 实现原理：在读 final 域的操作前插入一个 LoadLoad 屏障；
- 修饰引用数据类型
  - 在`构造之前先赋值`的前提下，禁止把 `对构造函数内的 final 域的写入` 重排序到 `把对象的引用赋值给引用变量` 之后；也就是说，如果有一个类，其构造函数中有对 final 域的写入，那么在把这个类的对象的引用赋值给引用变量的时候，必须先完成构造函数中对 final 域的写入；

<details>

<summary>1. 禁止修饰引用数据类型的重排序例子</summary>

```java
public class FinalReferenceDemo {
    final int[] arrays;
    private FinalReferenceDemo finalReferenceDemo;

    public FinalReferenceDemo() {
        arrays = new int[1];  //1
        arrays[0] = 1;        //2
    }

    public void writerOne() {
        finalReferenceDemo = new FinalReferenceDemo(); //3
    }

    public void writerTwo() {
        arrays[0] = 2;  //4
    }

    public void reader() {
        if (finalReferenceDemo != null) {  //5
            int temp = finalReferenceDemo.arrays[0];  //6
        }
    }
}
```

<div class="warning">

如上面的例子，多线程场景下，构造函数 FinalReferenceDemo()执行的顺序和 writerOne()的执行顺序并不能确定。

JVM 禁止重排序之后，由于`构造之前先赋值`，所以 1 处代码一定会发生在 3 处之前；由于`构造函数中对 final 域的写入，一定先发生于把这个对象的引用赋值给引用变量之前`，所以 2 处代码一定先于 3 处代码的执行。

</div>
</details>

## final 引用不能从构造函数内“溢出”

在 Java 中，**final 引用不能从构造函数内“溢出”**（也叫"逸出"）这个说法，主要是关于**对象在构造过程中还未初始化完成就被其他线程访问**的问题。这种“逸出”可能会导致线程看到**不完整或未初始化的对象状态**，进而引发并发错误。

当一个`final`字段在构造函数中被初始化后，它的值在 Java 内存模型（JMM）中具有特殊保障：**一旦构造函数执行完毕并返回，其他线程看到的这个对象将会看到这个`final`字段的正确值。**

但如果`this`在构造函数中就被泄露到外部（通过某些方式被其他线程访问到了），这就破坏了这个保障，**即“final 引用从构造函数中逸出”**。

### 🌰 示例：final 引用从构造函数中逸出的反例

```java
public class UnsafeEscape {
    public final int value;

    public UnsafeEscape(MyListener listener) {
        value = 42;
        listener.register(this); // this在构造函数中逸出了
    }

    public interface MyListener {
        void register(UnsafeEscape obj);
    }

    public static void main(String[] args) {
        MyListener listener = new MyListener() {
            @Override
            public void register(UnsafeEscape obj) {
                // 模拟在构造未完成时另一个线程访问该对象
                new Thread(() -> {
                    System.out.println("Value from another thread: " + obj.value);
                }).start();
            }
        };

        new UnsafeEscape(listener); // 构造函数中已经泄露 this
    }
}
```

### ⚠️ 可能的问题：

- 如果`value`还没来得及初始化（**尽管这段代码几乎不会复现这个问题**），另一线程就访问它，会出现值未定义或非法状态。
- 更复杂的情况是，如果对象还有其他非`final`字段，也可能读到“默认值”或“中间状态”。

### ✅ 正确做法：避免 this 逸出

```java
public class SafeEscape {
    public final int value;

    private SafeEscape() {
        value = 42;
    }

    public static SafeEscape create(MyListener listener) {
        SafeEscape instance = new SafeEscape();
        listener.register(instance); // 构造完成后再暴露
        return instance;
    }

    public interface MyListener {
        void register(SafeEscape obj);
    }

    public static void main(String[] args) {
        MyListener listener = new MyListener() {
            @Override
            public void register(SafeEscape obj) {
                new Thread(() -> {
                    System.out.println("Safe value: " + obj.value);
                }).start();
            }
        };

        SafeEscape.create(listener); // 安全地暴露对象
    }
}
```

### 🧠 总结

- `final`字段在构造函数**完成后**，会获得 Java 内存模型的“安全发布”语义。
- 如果在构造函数中把`this`传出去（注册到监听器、启动线程、添加到集合等），构造完成前对象就可能被其他线程访问，这叫“this 逸出”或“构造函数逸出”。
- 要避免这个问题，**可以使用工厂方法模式**，在对象完全构造后再暴露出去。
