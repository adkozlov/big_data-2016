#!/usr/bin/env python
# encoding: utf-8
from __future__ import print_function
import json
import sys
shard = sys.argv[1]

def map_docs(docs):
    out = []
    for doc in docs:
        if not doc["Users"]:
            continue
        for user in doc["Users"]:
            out.append({"Key": user, "Value": {"DocID": doc["DocID"]}})
    return out

def map_team(team):
    out = []
    for user in team["Users"]:
        out.append({"Key": user, "Value": {"Team": team["Team"]}})
    return out
    
with open(shard, "r") as f:
    input_value = json.JSONDecoder().decode(f.read())
    output_values = []

    if isinstance(input_value, list):
        output_values += map_docs(input_value)
    else:
        output_values += map_team(input_value)

    print(json.JSONEncoder().encode(output_values))
