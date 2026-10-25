FROM debian:bookworm-slim@sha256:7ff6ba31527b9e336162fa061746c366c4b2032f4d2cff2078bea43f78efe3f8

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl python3 util-linux openjdk-17-jre-headless ant \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /opt/saxon \
    && curl -fL --retry 3 https://repo.maven.apache.org/maven2/net/sf/saxon/Saxon-HE/9.9.1-7/Saxon-HE-9.9.1-7.jar -o /opt/saxon/saxon9he.jar \
    && curl -fL --retry 3 https://repo.maven.apache.org/maven2/ant-contrib/ant-contrib/1.0b3/ant-contrib-1.0b3.jar -o /usr/share/ant/lib/ant-contrib-1.0b3.jar \
    && echo '8ef1b919a466d257b20dc1df05909d51800df283bd1d5e3b0ba7567bf67f88b1  /opt/saxon/saxon9he.jar' | sha256sum -c - \
    && echo 'be33a69818310b5c55e41dc11d48cd895f5f129da4b0d28c2f4c6c3e1cbcf3fc  /usr/share/ant/lib/ant-contrib-1.0b3.jar' | sha256sum -c -

WORKDIR /workspace
ENTRYPOINT ["bash", "src/scripts/edition/entrypoint.sh"]
