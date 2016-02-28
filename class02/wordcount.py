#!/usr/bin/env python
import mincemeat
import sys

from mapinput import FileShardsMapInput
from mapinput import JsonFileMapInput

def mapfn(k, v):
    for w in v.split():
        yield w, 1

def reducefn(k, vs):
    result = 0
    for v in vs:
        result += v
    return result

s = mincemeat.Server()

s.map_input = FileShardsMapInput("./wordcount_shard*.json", JsonFileMapInput)
s.mapfn = mapfn
s.reducefn = reducefn
s.reduce_output_format = "json"
s.reduce_shard_pattern = "wordcount_output_%s.json"
results = s.run_server(password="")
s.dump_results()
