#!/bin/bash
echo "Запускаем мастера. Его консольный вывод направлен в файл master.log"
python server.py --role master --port 8000 --namespace-filename  ../hw01/data/files > master.log 2>&1 &
MASTER_PID=$!

sleep 5
echo "Запускаем файловый сервер. Его консольный вывод направлен в файл chunkserver.log"
python server.py --role chunkserver --port 8001 --data-dir ../hw01/data/cs0 > chunkserver0.log 2>&1 &
CHUNKSERVER_PID0=$!
python server.py --role chunkserver --port 8002 --data-dir ../hw01/data/cs1 > chunkserver1.log 2>&1 &
CHUNKSERVER_PID1=$!
python server.py --role chunkserver --port 8003 --data-dir ../hw01/data/cs2 > chunkserver2.log 2>&1 &
CHUNKSERVER_PID2=$!
python server.py --role chunkserver --port 8004 --data-dir ../hw01/data/cs3 > chunkserver3.log 2>&1 &
CHUNKSERVER_PID3=$!




echo "Запустите python demo.py"
echo "master=$MASTER_PID cs=$CHUNKSERVER_PID"
read -p "Нажмите любую клавишу чтобы остановить DFS... " -n1 -s
kill -KILL $MASTER_PID $CHUNKSERVER_PID0 $CHUNKSERVER_PID1 $CHUNKSERVER_PID2 $CHUNKSERVER_PID3 
