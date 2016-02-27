# encoding: utf-8
import argparse
from file_api import ChunkedFile
import libcount
import os


parser = argparse.ArgumentParser(description='Считает числа в файле')
parser.add_argument('--dataset', help='Массив данных', required=True)
parser.add_argument('--chunk-size', type=int, help='размер блока в килобайтах', default=4)
parser.add_argument('--mem-chunk-limit', type=int, help='сколько блоков помещается в память', default=10000)
args = parser.parse_args()

counts = {}
for filename in os.listdir(args.dataset):
    path = os.path.join(args.dataset, filename)
    if os.path.isfile(path):
        f = ChunkedFile(path, args.chunk_size)
        f.open_for_read()
        libcount.count(f, args.mem_chunk_limit, counts)
        f.close()

print(counts)
