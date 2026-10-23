FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl openjdk-17-jre-headless ant \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /opt/saxon \
    && curl -fL --retry 3 https://repo.maven.apache.org/maven2/net/sf/saxon/Saxon-HE/9.9.1-7/Saxon-HE-9.9.1-7.jar -o /opt/saxon/saxon9he.jar \
    && curl -fL --retry 3 https://repo.maven.apache.org/maven2/ant-contrib/ant-contrib/1.0b3/ant-contrib-1.0b3.jar -o /usr/share/ant/lib/ant-contrib-1.0b3.jar

WORKDIR /workspace
ENTRYPOINT ["bash", "src/scripts/edition/build.sh"]
