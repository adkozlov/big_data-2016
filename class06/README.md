# Запуск Spark + wordcount.py

Все пути в инструкции относительные к текущему каталогу, в котором находится этот README

1. Установите Java и Python 
1. Скачайте Spark 1.6.1 prebuilt for Hadoop 2.6: http://spark.apache.org/downloads.html и распакуйте на диск. Далее предполагается, что Spark находится в каталоге `spark`. 
1. Скачайте шекспировские пьесы (или любой другой корпус текстовых файлов) https://drive.google.com/file/d/0B0o9buNJq6vtVjRoWXo3SGRMWEk/view?usp=sharing и распакуйте в текущем каталоге. Далее предполагается, что корпус находится в каталоге `dataset`
1. Запустите питоновскую консоль, передав аргумент `--py-files`: `spark/bin/pyspark --py-files wordcount.py`. После этого `wordcount` будет находиться в `PYTHONPATH` и его можно будет импортировать
1. В консоли напишите 
```
from wordcount import run
run(sc)
```
1. Spark должен запуститься, посчитать слвоа и записать результат в каталог `wordcount_result`

