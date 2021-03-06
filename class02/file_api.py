# encoding: utf-8
import struct

# Файл, хранящий массив целых чисел, разбитый на блоки
# по несколько килобайт
# Структура блока:
# первые четыре байта - целое число L, равное количеству хранимых
# в блоке чисел
# последующие L*4 байт -- хранимые в блоке числа
# оставшиеся байты, если таковые есть, заполняются нулями
# Байты числа хранятся в little-endian порядке
class ChunkedFile:
    # Конструктор, создающий поблочный файл, читающий данные
    # из указанного filename блоками по chunk_size_kb килобайт
    def __init__(self, filename, chunk_size_kb):
        self.filename = filename
        self.chunk_size_kb = chunk_size_kb

    # Окрывает файл для чтения
    def open_for_read(self):
        self.stream = open(self.filename, "rb")

    # Открывает файл для записи
    def open_for_write(self):
        self.stream = open(self.filename, "ab")

    # Читает очередной блок и возвращает список из хранимых в блоке целых чисел
    # Возвращает пустой список, если достигнут конец файла.
    def read_chunk(self):
        # Читаем сырые байты. Мы ожидаем увидеть 256*chunk_size_kb целых чисел
        chunk = self.stream.read(self.chunk_size_kb*1024)
        if len(chunk) == 0:
            return []
        fmt = "<%dI" % (self.chunk_size_kb * 256)
        raw_data = list(struct.unpack(fmt, chunk))
        # Первое число -- размер массива без паддинга нулями
        # Выгрызаем из сырого массива действительные данные
        data_count = raw_data[0]
        return raw_data[1:data_count+1]

    # Записывает целочисленный список int_list в очередной блок.
    # Если список не помещается в блок, выбрасывает exception
    # Если список меньше, чем размер блока, дополняет оставшееся
    # в блоке место нулями
    def write_chunk(self, int_list):
        # Проверяем, помещается ли массив в блок
        if len(int_list)*4 + 4 > self.chunk_size_kb * 1024:
            raise Exception("Chunk is too big: %d bytes > expected %d bytes" % (len(int_list)*4, self.chunk_size_kb * 1024 - 4))
        # В начале блока мы записываем количество чисел в массиве и потом сам массив
        fmt = "<I%dI" % len(int_list)
        data = struct.pack(fmt, int(len(int_list)), *int_list)
        self.stream.write(data)
        # Если блок заполнен не полностью, мы дополняем его нулями.
        tail_bytes_count = self.chunk_size_kb*1024 - len(int_list)*4 - 4
        tail_int_count = tail_bytes_count // 4
        for b in range(tail_int_count):
            self.stream.write(struct.pack("<I", 0))
        self.stream.flush()

    # Закрывает файл
    def close(self):
        self.stream.close()
