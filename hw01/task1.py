#!/usr/bin/python
# encoding: utf8
import sys
sys.path.insert(1,'../dfs')

from client import DFSClient

## Это проверка работоспособности кода. Её можно удалить
# -----------8< --------------
c = DFSClient("localhost:8000")
print("== Фрагменты файла /foo ==")
print(c.file_chunks("/foo"))
print("\n== Расположение фрагмента 'chunk1' ==")
print(c.chunk_locations("chunk1"))
print("\n== Содержимое фрагмента 'chunk1' ==")
print(c.get_chunk_data("localhost:8001", "chunk1"))
# ----------->8 --------------

# Эту функцию надо реализовать. Функция принимает имя файла и
# возвращает итератор по его строкам.
# Если вы не знаете ничего про итераторы или об их особенностях в Питоне,
# погуглите "python итератор генератор". Вот например
# http://0agr.ru/blog/2011/05/05/advanced-python-iteratory-i-generatory/
def get_file_content(filename):
  raise "Comment out this line and write your code below"

# эту функцию надо реализовать. Она принимает название файла с ключами и возвращает
# число
def calculate_sum(keys_filename):
  raise "Comment out this line and write your code below"
