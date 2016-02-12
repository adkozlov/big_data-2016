from file_api import *

# 255 целых чисел поместятся на страницу размером 1 килобайт
# Еще 4 байта отведено служебной информации
data = []
for i in range(255):
    data += [i]

# Записываем
w = FileIterator("/tmp/data", 1)
w.open_for_write()
w.write_chunk(data)
w.close()

# И читаем
r = FileIterator("/tmp/data", 1)
r.open_for_read()
data = r.read_chunk()
print(data)
r.close()
