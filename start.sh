#!/bin/sh
APP_NAME=blog

nohup java -Xmx1024m -jar $APP_NAME.jar >> app.log 2>&1 &
echo $! > /var/run/$APP_NAME.pid
echo "$APP_NAME start successed pid is $! "