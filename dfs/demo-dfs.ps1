# Автор: Андрей Кокорев
# Для использования выполнить команду 
# powershell -ExecutionPolicy ByPass -File .\demo-dfs.ps1
# в директории dfs.
# Проверено на Windows 8.1 Pro (x64)

echo "Запускаем мастер. Его консольный вывод направлен в файл master.log"
$master = Start-Process "cmd" -Args "/c", "python server.py --role master --port 8000 > master.log 2>&1" -PassThru -NoNewWindow

echo "Запускаем файловый сервер. Его консольный вывод направлен в файл chunkserver.log"
$chunkserver = Start-Process "cmd" -Args "/c", "python server.py --role chunkserver --port 8001 > chunkserver.log 2>&1" -PassThru -NoNewWindow

echo "Запустите python demo.py"
echo "master=$($master.ID) chunk_server=$($chunkserver.ID)"
echo "Нажмите любую клавишу чтобы остановить DFS... "
$x = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

taskkill /PID $master.ID /F /T
taskkill /PID $chunkserver.ID /F /T
