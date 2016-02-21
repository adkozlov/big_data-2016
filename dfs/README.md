### TL;DR:
```
cd bigdata-2016-master/dfs
./demo-dfs.sh
```

### Подробности
DFS состоит из нескольких серверов: мастера и как минимум одного файлового сервера. Мастер хранит метаданные, файловые серверы хранят фрагменты в каталоге на диске.

Пространство имен (отображение имени файла во фрагменты) мастер читает из текстового файла
 с именем по умолчанию `files`.

Информацию о расположении фрагментов мастер получает от файловых серверов. Имя файла-фрагмента является его идентификатором. Каждый файловый сервер сообщает мастеру, какие фрагменты у него есть.

Мастер, файловые серверы и клиент общаются друг с другом по HTTP.

### Клиентский код
В файле `client.py` находится класс, реализующий простой клиент. В файле `demo.py` находится
пример его использования.

### Необходимые модули
Для работы DFS требуется Python 2 или 3 и модули `cherrypy` и `requests`. Если их у вас нет, то
поставьте их командой `pip install` или другими средствами установки питоновских пакетов