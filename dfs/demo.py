# encoding: utf-8
from client import DFSClient

c = DFSClient("localhost:8000")
print("== Фрагменты файла /foo ==")
print(c.file_chunks("/foo"))
print("\n== Расположение фрагмента 'chunk1' ==")
print(c.chunk_locations("chunk1"))
print("\n== Содержимое фрагмента 'chunk1' ==")
print(c.get_chunk_data("localhost:8001", "chunk1"))
