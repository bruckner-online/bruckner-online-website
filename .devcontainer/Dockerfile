FROM ghcr.io/acdh-oeaw/devcontainer-frontend:24

RUN \
  echo "🔧 Installing java and ant..." && \
	apt-get update && \
	apt-get install -y --no-install-recommends \
    openjdk-17-jre-headless \
    ant \
    unzip \
    curl && \
	echo "📦 Downloading ant-contrib..." && \
	curl -L -o "/usr/share/ant/lib/ant-contrib-1.0b3.jar" "https://repo1.maven.org/maven2/ant-contrib/ant-contrib/1.0b3/ant-contrib-1.0b3.jar" && \
	echo "✅ Java, ant, and ant-contrib installed successfully."
