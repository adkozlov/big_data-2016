#!/usr/bin/env python
# encoding: utf-8
from __future__ import print_function
import json
import sys
shard = sys.argv[1]

with open(shard, "r") as f:
    input_value = json.JSONDecoder().decode(f.read())
    out = []

    if "Error" in input_value:
        with open("errors", "a") as errors:
            print("Data error: user %s %s" % (input_value["User"], input_value["Error"]),
                file=errors)
    else:
        for doc in input_value["Docs"]:
            out.append({"Key": doc, "Value": {"User": input_value["User"], "Team": input_value["Team"]}})

    print(json.JSONEncoder().encode(out))
