#!/bin/bash
echo "Запускаем мастера. Его консольный вывод направлен в файл master.log"
python server.py --role master --port 8000 > master.log 2>&1 &
MASTER_PID=$!

echo "Запускаем файловый сервер. Его консольный вывод направлен в файл chunkserver.log"
python server.py --role chunkserver --port 8001 > chunkserver.log 2>&1 &
CHUNKSERVER_PID=$!

echo "Запустите python demo.py"
echo "master=$MASTER_PID cs=$CHUNKSERVER_PID"
read -p "Нажмите любую клавишу чтобы остановить DFS... " -n1 -s
kill -KILL $MASTER_PID $CHUNKSERVER_PID
