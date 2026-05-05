# 打包前端项目
set -e
cd front
pnpm i
pnpm run build:prod

mkdir -p ../src/main/resources/static && \
find ../src/main/resources/static -mindepth 1 -delete && \
cp -r dist/. ../src/main/resources/static/

# 远程部署
cd ..
chmod +x remote_deploy.sh
./remote_deploy.sh