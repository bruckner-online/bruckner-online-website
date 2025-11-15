# bin/bash

echo "📥 fetching bruckner-kopisten data..."

rm -rf src/data/editions && mkdir src/data/editions
rm -rf src/data/meta && mkdir src/data/meta
rm imprint.xml
curl -LO https://github.com/acdh-oeaw/bruckner-kopisten-data/archive/refs/heads/main.tar.gz
tar -xzvf main.tar.gz
mv ./bruckner-kopisten-data-main/data/editions/*.xml ./src/data/editions
mv ./bruckner-kopisten-data-main/data/meta/*.xml ./src/data/meta
rm -rf bruckner-kopisten-data-main
rm main.tar.gz
