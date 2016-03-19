#!/usr/bin/env python
# encoding: utf-8
from __future__ import print_function
import json
import sys

# Этот скрипт вызывается для каждой задачи свертки
# Ключ свертки передается в аргументах запуска
key = sys.argv[1]
reducerId = sys.argv[2]

# Список значений передаётся в виде массива JSON объектов
# в стандартном потоке входа. Каждый объект в массиве -- результат
# выхода какой-то задачи маппинга
values = json.JSONDecoder().decode(sys.stdin.read())

user = key
teams = []
docs = []
for v in values:
    if "Team" in v:
        teams.append(v["Team"])
    elif "DocID" in v:
        docs.append(v["DocID"])

if len(teams) == 0:
    output = {"User": user, "Error": "is not a member of any team"}
elif len(teams) > 1:
    output = {"User": user, "Error": "is a member of many teams: %s" % str(teams)}
else:
    output = {"User": user, "Team": teams[0], "Docs": docs}

with open("step1-%s-%s.json" % (reducerId, user), "a") as f:
    print(json.JSONEncoder().encode(output), file=f)
