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

s.map_input = FileShardsMapInput("./*.json", JsonFileMapInput)
s.mapfn = mapfn
s.reducefn = reducefn

results = s.run_server(password="")
mincemeat.dump_results(results)
