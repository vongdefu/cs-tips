
```sh
docker pull kibana:7.4.2
docker run --name kibana -e ELASTICSEARCH_HOSTS=http://192.168.1.150:9200 -p 5601:5601 \
-d kibana:7.4.2

docker update kibana --restart=always

```

[Centos7 下安装最新 ffmpeg](https://blog.csdn.net/smily77369/article/details/114926723)
[CentOS7安装ffmpeg](https://blog.csdn.net/fengguang54/article/details/118725400)

---

**上面的方式在实践过程中会发现缺少部分编解码器，是不够完全的。**
**根据 **[**a-schild**](https://github.com/a-schild)**/**[**jave2**](https://github.com/a-schild/jave2)**的思路，直接下载这个包下面的运行文件即可。**

**如，mac上直接下载**
**jave-nativebin-osxm1/src/main/resources/ws/schild/jave/nativebin/ffmpeg-aarch64-osx ，**
**下载到本地之后，然后配置一下环境变量即可。**
