# 2. 使用 Apollo 作为配置中心

### 1. apollo 部署及使用过程

#### 1.1. 部署过程

1. 下载三个 zip 包，并解压
2. 导入数据库
3. ~~创建 eureka 服务~~
4. ~~修改数据库中 apolloconfigdb.serverconfig 表中 eureka.service.url 的值为 eureka 的地址~~
5. 依次启动 config 、 admin、 portal 服务
6. 检查 8080 端口占用情况，如果被占用启动时会报错，8080 是 config 所在服务的端口

#### 1.2. 使用

##### 1.2.1. 配置 Apollo

管理台地址的端口为： 8070

初始化用户名密码为： apollo / admin

1. 创建项目
2. 创建配置项
3. 发布

##### 1.2.2. 在项目中使用

1. 在项目的 pom 中引入 Apollo 的客户端
2. 在项目的 application.yml 文件中添加：

```
apollo:
  bootstrap:
    enabled: true
    namespaces: application
  meta: http://192.168.1.150:8080 # 此地址为config服务所在的地址

```

3. 添加 app.properties 文件

```
app.id=XXXX

```

4. 创建配置文件

```
@Configuration
@EnableApolloConfig(value = "application", order = 10)
public class AppConfig {
}

```

5. 创建配置项并使用

```
@RestController
@RequestMapping("configConsumer")
@RefreshScope
public class ConfigClientController {

    @Value("${config_info}")
    private String config;

    @RequestMapping("/getConfigInfo")
    public String getConfigInfo(){
        return config;
    }
}

```

#### 1.3. 注意事项

1. 在部署后，在 web 控制台进行配置时，创建了一个项目，如果遇到报错信息： 请联系管理员 等信息，可以去找对应服务的启动文件，启动文件中有日志所在的地址，查看日志即可得知哪里出了问题；如果是端口占用，可以使用 netstat -nultp 命令查看端口占用情况。
2. 项目启动后，发现一直报错，应先考虑配置文件是否有误。注意： apollo.meta 地址是 config 服务所在的地址，不要写错。
3. configuration 项目和 administer 项目依赖 eureka，端口是 8080，要看看此端口是否已经被占用。

#### 1.4. 参考

- [Apollo 下载与安装](https://blog.csdn.net/SIMBA1949/article/details/107561778)
- [Apollo 官方文档](https://www.apolloconfig.com/#/zh/README)

---

### 2. 把 application.yml 文件整体放入 apollo

#### 2.1. 项目背景

把 springboot 项目中的 application.yml 文件，整个都放入 Apollo 中，启动时项目先从 Apollo 中获取配置文件，然后根据拉取的配置文件进行启动。这样可以达到配置文件保密的效果。

#### 2.2. 添加依赖

```
<dependency>
	<groupId>com.ctrip.framework.apollo</groupId>
	<artifactId>apollo-client</artifactId>
	<version>1.0.0</version>
</dependency>

```

#### 2.3. 添加注解

```
@EnableApolloConfig

```

#### 2.4. 发布配置文件内容

使用 http://www.toyaml.com/index.html 把 yml 格式转成 properties 格式。然后复制出所有的配置项，复制到 Apollo 管理页面上进行发布。

#### 2.5. 修改配置文件

注释掉之前所有的配置项，只添加下面内容：

```
app:
  id: 103929
apollo:
  bootstrap:
    enabled: true
    namespaces: application

```

#### 2.6. 创建本地缓存目录

```
cd /opt
sudo mkdir /opt/data
sudo chmod -R 777 data
sudo mkdir /opt/settings
cd settings
sudo touch server.properties
sudo vi server.properties

```

在 server.properties 文件中添加:

```
env=DEV
apollo.meta=http://192.168.1.150:8080

```

#### 2.7. 启动后进行验证

成功

#### 2.8. 注意事项

1. 创建本地目录是重要的步骤，不能省略，否则项目启动时会自己初始化，不会拉取 Apollo 的配置，创建完目录后还需要保证目录的读取权限。
2. 创建完本地目录后还需要创建 server.properties 文件，用来指定运行的环境。
3.

#### 2.9. 参考地址

1. [淘东电商项目（10） -Apollo 分布式配置中心管理 application.yml](https://blog.csdn.net/qq_20042935/article/details/104262790)
2. [携程 Apollo v1.4 开发指南](https://www.bookstack.cn/read/ctripcorp-apollo/spilt.2.5e3f6033aee666be.md#1.5%20%E5%BA%94%E7%94%A8%E8%AF%BB%E5%8F%96%E9%85%8D%E7%BD%AE)

---

### 3. 修改本地缓存的配置文件的目录地址

大多数公司里面的开发机都是经过部署过的，很多目录并没有读写权限，并且很多大厂内的电脑多是需要自己的账号登陆的，因此，可以把 Apollo 的本地缓存地址放置到用户自己的 Home 目录下。此外，由于配置中心的私密性，并且都是内网环境，因此还把 Apollo 的配置配置地址隐藏掉。这样只需要在家目录下放置 .settings.xml 文件，里面只需要指定环境即可。
