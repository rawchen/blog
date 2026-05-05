#!/bin/sh

set -e

echo '---------------开始自动部署---------------'

# 项目根目录
ROOT_PATH=$(cd "$(dirname "$0")"; cd .; pwd)

# 项目名称
PROJECT_NAME=blog

# JAR名称
JAR_NAME=${PROJECT_NAME}.jar

# 本地start.sh路径
START_SCRIPT=start.sh

# Linux部署目录
DEPLOY_PATH=/root/${PROJECT_NAME}

# 服务器地址
SERVER_IP=x.x.x.x

# 服务器端口
SERVER_PORT=22

# SSH密钥
PEM_FILE=id_rsa.pem

echo '---------------项目本地路径---------------'

echo ${ROOT_PATH} && cd ${ROOT_PATH}

echo '---------------开始项目打包---------------'

mvn clean package -Dmaven.test.skip=true

mv target/${PROJECT_NAME}-0.0.1-SNAPSHOT.jar target/${JAR_NAME}

chmod 600 "${PEM_FILE}"

echo '---------------开始上传项目---------------'

ssh -i "${PEM_FILE}" -p ${SERVER_PORT} root@${SERVER_IP} "mkdir -p ${DEPLOY_PATH}"

scp -i "${PEM_FILE}" -P ${SERVER_PORT} "target/${JAR_NAME}" root@${SERVER_IP}:${DEPLOY_PATH}/

scp -i "${PEM_FILE}" -P ${SERVER_PORT} "${START_SCRIPT}" root@${SERVER_IP}:${DEPLOY_PATH}/

echo '---------------结束项目进程---------------'

ssh -i "${PEM_FILE}" -p ${SERVER_PORT} root@${SERVER_IP} << EOF

cd ${DEPLOY_PATH}

pkill -9 -f ${JAR_NAME} || true

echo '---------------开始启动项目---------------'

chmod +x ${JAR_NAME}

chmod +x ${START_SCRIPT}

./${START_SCRIPT}

tail -f -n 50 app.log

EOF