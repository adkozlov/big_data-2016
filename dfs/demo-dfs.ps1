# Автор: Андрей Кокорев
# Пример использования: выполнить команду
# powershell -ExecutionPolicy ByPass -File .\demo-dfs.ps1 --data "..\hw01\data" --logs "..\hw01\logs" --files "..\hw01\data\files"
# в директории dfs для запуска мастера и 4 чанк-серверов из 1 домашнего задания
# Проверено на Windows 8.1 Pro (x64)
param(
    [string]$files="./files",
    [string]$data="./data",
    [string]$logs="./logs"
)

if (!(Test-Path $files)){
    echo "Файл $files не найден"
    Exit
}
if (!(Test-Path $data)){
    echo "Директория $data не найдена"
    Exit
}
if (!(Test-Path $logs)){
    echo "Директория $logs не найдена, создаем"
    New-Item -ItemType directory -Path $logs
    echo ""
}

#Получаем список всех под-директорий 
$dir = dir $data | ?{$_.PSISContainer}

echo "Запускаем мастер. Его консольный вывод направлен в файл $logs\master.log"
$master = Start-Process "cmd" -Args "/c", "python server.py --role master --port 8000 --namespace-filename $files > $logs\master.log 2>&1" -PassThru -NoNewWindow
echo " master PID: $($master.ID)"

echo "Запускаем файловые серверы. Их консольный вывод направлен в файлы "
$chunkservers = @()
$port = 8001
foreach ($d in $dir){
    $log = "$logs\cs_$($d.Name).log"
    $chunkserver = Start-Process "cmd" -Args "/c", "python server.py --role chunkserver --port $port --data-dir $($d.FullName) > $log 2>&1" -PassThru -NoNewWindow
    $chunkservers += $chunkserver.ID
    echo " name: $($d.Name), PID: $($chunkserver.ID), port: $port, log: $log"
    $port += 1
}
 
echo "Нажмите любую клавишу чтобы остановить DFS... "
$x = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
taskkill /PID $master.ID /F /T

foreach($cs in $chunkservers) {
    taskkill /PID $cs /F /T     
}
