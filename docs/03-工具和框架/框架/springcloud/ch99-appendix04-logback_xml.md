
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration debug="false">
  <!--定义日志文件的存储地址 勿在 LogBack 的配置中使用相对路径-->
  <property name="LOG_HOME" value="/log" />
  <!-- 日志最大的历史 30天 -->  
  <property name="maxHistory" value="30"/>  
  <!-- 控制台输出 -->
  <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
      <!--格式化输出：%d表示日期，%thread表示线程名，%-5level：级别从左显示5个字符宽度%msg：日志消息，%n是换行符-->
      <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
    </encoder>
  </appender>

  <!-- ERROR级别日志 -->  
  <!-- 滚动记录文件，先将日志记录到指定文件，当符合某个条件时，将日志记录到其他文件 RollingFileAppender-->  
  <appender name="ERROR" class="ch.qos.logback.core.rolling.RollingFileAppender">  
    <!-- 过滤器，只记录WARN级别的日志 -->  
    <filter class="ch.qos.logback.classic.filter.LevelFilter">  
      <level>ERROR</level>  
      <onMatch>ACCEPT</onMatch>  
      <onMismatch>DENY</onMismatch>  
    </filter>  
    <!-- 最常用的滚动策略，它根据时间来制定滚动策略.既负责滚动也负责出发滚动 -->  
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">  
      <!--日志输出位置  可相对、和绝对路径 -->  
      <fileNamePattern>${LOG_HOME}/%d{yyyy-MM-dd}/api-error-log.log</fileNamePattern>  

      <maxHistory>${maxHistory}</maxHistory>  
    </rollingPolicy>  

    <encoder>  
      <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger - %msg%n</pattern>
      <!--设置编码格式-->
      <charset>UTF-8</charset>
    </encoder>  
  </appender>  
  <!-- WARN级别日志 appender -->  
  <appender name="WARN" class="ch.qos.logback.core.rolling.RollingFileAppender">  
    <!-- 过滤器，只记录WARN级别的日志 -->  
    <filter class="ch.qos.logback.classic.filter.LevelFilter">  
      <level>WARN</level>  
      <onMatch>ACCEPT</onMatch>  
      <onMismatch>DENY</onMismatch>  
    </filter>  
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">  
      <!-- 按天回滚 daily -->  
      <fileNamePattern>${LOG_HOME}/%d{yyyy-MM-dd}/api-warn-log.log  
      </fileNamePattern>  
      <!-- 日志最大的历史 60天 -->  
      <maxHistory>${maxHistory}</maxHistory>  
    </rollingPolicy>  
    <encoder>  
      <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger - %msg%n</pattern>  
    </encoder>  
  </appender>  


  <!-- INFO级别日志 appender -->  
  <appender name="INFO" class="ch.qos.logback.core.rolling.RollingFileAppender">  
    <!-- 过滤器，只记录INFO级别的日志 -->  
    <filter class="ch.qos.logback.classic.filter.LevelFilter">  
      <level>INFO</level>  
      <onMatch>ACCEPT</onMatch>  
      <onMismatch>DENY</onMismatch>  
    </filter>  
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">  
      <!-- 按天回滚 daily -->  
      <fileNamePattern>${LOG_HOME}/%d{yyyy-MM-dd}/api-info-log.log  
      </fileNamePattern>  
        <!-- 日志最大的历史 60天 -->  
        <maxHistory>${maxHistory}</maxHistory>  
      </rollingPolicy>  
        <encoder>  
        <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger - %msg%n</pattern>  
      </encoder>  
      </appender>  

        <!-- DEBUG级别日志 appender -->  
        <appender name="DEBUG" class="ch.qos.logback.core.rolling.RollingFileAppender">  
        <!-- 过滤器，只记录DEBUG级别的日志 -->  
        <filter class="ch.qos.logback.classic.filter.LevelFilter">  
        <level>DEBUG</level>  
        <onMatch>ACCEPT</onMatch>  
        <onMismatch>DENY</onMismatch>  
      </filter>  
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">  
        <!-- 按天回滚 daily -->  
        <fileNamePattern>${LOG_HOME}/%d{yyyy-MM-dd}/api-debug-log.log  
      </fileNamePattern>  
        <!-- 日志最大的历史 60天 -->  
        <maxHistory>${maxHistory}</maxHistory>  
      </rollingPolicy>  
        <encoder>  
        <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger - %msg%n</pattern>  
      </encoder>  
      </appender>  
        <!-- TRACE级别日志 appender -->  
        <appender name="TRACE" class="ch.qos.logback.core.rolling.RollingFileAppender">  
        <!-- 过滤器，只记录ERROR级别的日志 -->  
        <filter class="ch.qos.logback.classic.filter.LevelFilter">  
        <level>TRACE</level>  
        <onMatch>ACCEPT</onMatch>  
        <onMismatch>DENY</onMismatch>  
      </filter>  
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">  
        <!-- 按天回滚 daily -->  
        <fileNamePattern>${LOG_HOME}/%d{yyyy-MM-dd}/api-trace-log.log  
      </fileNamePattern>  
        <!-- 日志最大的历史 60天 -->  
        <maxHistory>${maxHistory}</maxHistory>  
      </rollingPolicy>  
        <encoder>  
        <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger - %msg%n</pattern>  
      </encoder>  
      </appender>  

        <logger name="org.hibernate.type.descriptor.sql.BasicBinder" level="TRACE"/>
        <logger name="org.hibernate.type.descriptor.sql.BasicExtractor" level="TRACE"/>
        <logger name="org.hibernate.SQL" level="DEBUG"/>
        <logger name="org.hibernate.engine.QueryParameters" level="DEBUG"/>
        <logger name="org.hibernate.engine.query.HQLQueryPlan" level="DEBUG"/>

        <!-- 日志输出级别 -->
        <root level="DEBUG">  
        <!-- 控制台输出 -->  
        <appender-ref ref="STDOUT" />  
        <!-- 文件输出 -->  
        <appender-ref ref="ERROR" />  
        <appender-ref ref="INFO" />  
        <appender-ref ref="WARN" />  
        <appender-ref ref="DEBUG" />  
        <appender-ref ref="TRACE" />  
      </root> 
      </configuration>

```


```
<?xml version="1.0" encoding="UTF-8"?>
<configuration debug="false" scan="true" scanPeriod="1000 seconds">
    <timestamp key="date" datePattern="yyyyMMdd" />
    <property name="defaultPattern"
              value="%blue(%d{MM-dd HH:mm:ss}) [%boldYellow(%thread)] | %highlight(%-5level) | %boldGreen(%logger) %X{clientIp} %X{operateId} - %highlight(%msg) %n"/>
    <!-- 尽量别用绝对路径，如果带参数不同容器路径解释可能不同,以下配置参数在pom.xml里 -->
    <property name="log.root.level" value="DEBUG" /> <!-- 日志级别 -->
    <property name="log.other.level" value="WARN" /> <!-- 其他日志级别 -->
    <property name="log.base" value="logs" /> <!-- 日志路径，这里是相对路径，web项目eclipse下会输出到eclipse的安装目录下，如果部署到linux上的tomcat下，会输出到tomcat/bin目录 下 -->
    <property name="log.moduleName" value="hive" />  <!-- 模块名称， 影响日志配置名，日志文件名 -->
    <property name="log.max.size" value="100MB" /> <!-- 日志文件大小,超过这个大小将被压缩 -->

    <!--控制台输出 -->
    <appender name="stdout" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
            <Pattern>${defaultPattern}</Pattern>
        </encoder>
    </appender>

    <!-- 用来保存输出所有级别的日志 -->
    <appender name="file.all" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <File>${log.base}/${log.moduleName}/${log.moduleName}.log</File><!-- 设置日志不超过${log.max.size}时的保存路径，注意如果
            是web项目会保存到Tomcat的bin目录 下 -->
        <!-- 滚动记录文件，先将日志记录到指定文件，当符合某个条件时，将日志记录到其他文件。 -->
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <FileNamePattern>${log.base}/archive/${log.moduleName}/${log.moduleName}_all_%d{yyyy-MM-dd}.%i.log.zip
            </FileNamePattern>
            <!-- 文件输出日志 (文件大小策略进行文件输出，超过指定大小对文件备份) -->
            <timeBasedFileNamingAndTriggeringPolicy
                    class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
                <maxFileSize>${log.max.size}</maxFileSize>
            </timeBasedFileNamingAndTriggeringPolicy>
        </rollingPolicy>
        <!-- 日志输出的文件的格式 -->
        <layout class="ch.qos.logback.classic.PatternLayout">
            <pattern>%date{yyyy-MM-dd HH:mm:ss.SSS} %-5level[%thread]%logger{56}.%method:%L -%msg%n</pattern>
        </layout>
    </appender>

    <!-- 这也是用来保存输出所有级别的日志 -->
    <appender name="file.all.other" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <File>${log.base}/${log.moduleName}/${log.moduleName}_other.log</File>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <FileNamePattern>${log.base}/archive/${log.moduleName}/${log.moduleName}_other_%d{yyyy-MM-dd}.%i.log.zip
            </FileNamePattern>
            <timeBasedFileNamingAndTriggeringPolicy
                    class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
                <maxFileSize>${log.max.size}</maxFileSize>
            </timeBasedFileNamingAndTriggeringPolicy>
        </rollingPolicy>
        <layout class="ch.qos.logback.classic.PatternLayout">
            <pattern>%date{yyyy-MM-dd HH:mm:ss.SSS} %-5level [%thread] %logger{56}.%method:%L -%msg%n</pattern>
        </layout>
    </appender>

    <!-- 只用保存输出error级别的日志 -->
    <appender name="file.error"
              class="ch.qos.logback.core.rolling.RollingFileAppender">
        <File>${log.base}/${log.moduleName}/${log.moduleName}_err.log</File>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <FileNamePattern>${log.base}/archive/${log.moduleName}/${log.moduleName}_err_%d{yyyy-MM-dd}.%i.log.zip
            </FileNamePattern>
            <timeBasedFileNamingAndTriggeringPolicy
                    class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
                <maxFileSize>${log.max.size}</maxFileSize>
            </timeBasedFileNamingAndTriggeringPolicy>
        </rollingPolicy>
        <layout class="ch.qos.logback.classic.PatternLayout">
            <pattern>%date{yyyy-MM-dd HH:mm:ss.SSS} %-5level [%thread] %logger{56}.%method:%L - %msg%n</pattern>
        </layout>
        <!-- 下面为配置只输出error级别的日志 -->
        <filter class="ch.qos.logback.classic.filter.LevelFilter">
            <level>ERROR</level>
            <onMatch>ACCEPT</onMatch>
            <onMismatch>DENY</onMismatch>
        </filter>
    </appender>

    <!-- 不丢失日志.默认的,如果队列的80%已满,则会丢弃TRACT、DEBUG、INFO级别的日志 -->
    <!-- 更改默认的队列的深度,该值会影响性能.默认值为256 -->
    <!-- 添加附加的appender,最多只能添加一个 -->
    <appender name="file.async" class="ch.qos.logback.classic.AsyncAppender">
        <discardingThreshold>0</discardingThreshold>
        <queueSize>256</queueSize>
        <includeCallerData>true</includeCallerData>
        <appender-ref ref="file.all" />
    </appender>

    <appender name="file.async.other" class="ch.qos.logback.classic.AsyncAppender">
        <discardingThreshold>0</discardingThreshold>
        <queueSize>256</queueSize>
        <includeCallerData>true</includeCallerData>
        <appender-ref ref="file.all.other" />
    </appender>


    <logger name="cn.felord" additivity="false">
        <level value="${log.root.level}" />
        <appender-ref ref="stdout" />
        <appender-ref ref="file.async" />
        <appender-ref ref="file.error" />
    </logger>
    <logger name="com.netflix.discovery" level="ERROR"/>
    <logger name="org.apache.http" level="ERROR"/>
    <logger name="org.springframework.web.servlet.DispatcherServlet" level="${log.root.level}"/>
    <logger name="jdbc.sqltiming" level="${log.root.level}"/>
    <logger name="com.ibatis" level="${log.root.level}" />
    <logger name="com.rerun.task" level="${log.root.level}" />
    <logger name="com.ibatis.common.jdbc.SimpleDataSource" level="${log.root.level}" />
    <logger name="com.ibatis.common.jdbc.ScriptRunner" level="${log.root.level}" />
    <logger name="com.ibatis.sqlmap.engine.impl.SqlMapClientDelegate" level="${log.root.level}" />
    <logger name="java.sql.Connection" level="${log.root.level}" />
    <logger name="java.sql.Statement" level="${log.root.level}" />
    <logger name="java.sql.PreparedStatement" level="${log.root.level}" />
    <logger name="java.sql.ResultSet" level="${log.root.level}" />
    <logger name="org" level="DEBUG"/>
    <logger name="freemarker" level="ERROR"/>
    <logger name="springfox" level="ERROR"/>
    <!-- root将级别为${log.root.level}及大于${log.root.level}的日志信息交给已经配置好的名为“Console”的appender处理，“Console”appender将信息打印到Console,其它同理 -->
    <root level="${log.root.level}">
        <appender-ref ref="stdout" /> <!--  标识这个appender将会添加到这个logger -->
        <appender-ref ref="file.async.other" />
        <appender-ref ref="file.error" />
    </root>
</configuration>

```




[logback.xml](https://www.yuque.com/attachments/yuque/0/2022/xml/29433025/1666595350204-8eb0e002-a3c1-418b-800c-0f08ba9d4cdf.xml?_lake_card=%7B%22src%22%3A%22https%3A%2F%2Fwww.yuque.com%2Fattachments%2Fyuque%2F0%2F2022%2Fxml%2F29433025%2F1666595350204-8eb0e002-a3c1-418b-800c-0f08ba9d4cdf.xml%22%2C%22name%22%3A%22logback.xml%22%2C%22size%22%3A7557%2C%22ext%22%3A%22xml%22%2C%22source%22%3A%22%22%2C%22status%22%3A%22done%22%2C%22download%22%3Atrue%2C%22type%22%3A%22text%2Fxml%22%2C%22taskId%22%3A%22u672fe57b-7ac7-4832-b8d1-9d3cff81789%22%2C%22taskType%22%3A%22upload%22%2C%22__spacing%22%3A%22both%22%2C%22mode%22%3A%22title%22%2C%22id%22%3A%22u0c68910b%22%2C%22margin%22%3A%7B%22top%22%3Atrue%2C%22bottom%22%3Atrue%7D%2C%22card%22%3A%22file%22%7D)
