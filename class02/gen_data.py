# encoding: utf-8
from file_api import *
from random import gauss
import argparse

parser = argparse.ArgumentParser(description='Генерирует входные данные для сортировки')
parser.add_argument('--output', help='Имя файла для записи результата', required=True)
parser.add_argument('--chunk-size', type=int, help='размер блока в килобайтах', required=True)
parser.add_argument('--dataset-size', type=int, help='количество чисел в генерируемом массиве', required=True)
parser.add_argument('--max-value', type=int, help='максимальное значение случайного числа')
parser.add_argument('--mean-value', type=int, help='среднее значение случайного числа')

args = parser.parse_args()
print("Генерируем %d чисел блоками по %d килобайт и записываем в файл %s" % (args.dataset_size, args.chunk_size, args.output))

def gen_rand_value():
    r = gauss(args.mean_value, (args.max_value - args.mean_value)/3)
    if r < 0 or r > args.max_value:
        return gen_rand_value()
    return int(r)

ints_per_chunk = (args.chunk_size * 1024 - 4) // 4
data = []
w = ChunkedFile(args.output, args.chunk_size)
w.open_for_write()
for i in range(args.dataset_size):
    if i % ints_per_chunk == 0:
        if len(data) > 0:
            print("Записываем блок №%d" % (i // ints_per_chunk))
            w.write_chunk(data)
            data = []
    data.append(gen_rand_value())

if len(data) > 0:
    print("Записываем последний блок")
    w.write_chunk(data)
w.close()
print("Готово")
