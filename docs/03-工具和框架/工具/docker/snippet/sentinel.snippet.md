```sh

docker pull bladex/sentinel-dashboard:1.7.1

docker run --name sentinel -p 8858:8858 -d bladex/sentinel-dashboard:1.7.1

docker update sentinel --restart=always

```