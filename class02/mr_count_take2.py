#!/usr/bin/env python
# encoding: utf-8
import argparse
import mincemeat
import sys
import libcount
import time

parser = argparse.ArgumentParser(description='Считает числа в файле')
parser.add_argument('--dataset', help='Каталог с шардами', required=True)
parser.add_argument('--chunk-size', type=int, help='размер блока в килобайтах', default=4)
args = parser.parse_args()

def mapfn(k, v):
    f = ChunkedFile("%s" % k, 4)
    f.open_for_read()
    counts = {}
    result = libcount.count(f, 1, counts)
    for key, value in counts.items():
        yield str(key), value

def reducefn(k, vs):
    #print("key %s values count=%d" % (k, len(vs)))
    result = sum(vs)
    return result

s = mincemeat.Server()

s.map_input = mincemeat.FileNameMapInput(args.dataset)
s.mapfn = mapfn
s.reducefn = reducefn

start = time.time()
results = s.run_server(password="")
end = time.time()
print(sorted(results.items()))
print("Completed in %f seconds" % (end-start))
