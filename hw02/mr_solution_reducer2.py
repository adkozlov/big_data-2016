#!/usr/bin/env python
# encoding: utf-8
from __future__ import print_function
from collections import defaultdict
import json
import sys

# Этот скрипт вызывается для каждой задачи свертки
# Ключ свертки передается в аргументах запуска
key = sys.argv[1]
reducerId = sys.argv[2]

# Список значений передаётся в виде массива JSON объектов
# в стандартном потоке входа. Каждый объект в массиве -- результат
# выхода какой-то задачи маппинга
s = sys.stdin.read()
values = json.JSONDecoder().decode(s)

docid = key
teams = defaultdict(list)

for v in values:
    teams[v["Team"]].append(v["User"])

if len(teams) > 1:
    users = []
    for team in teams:
        for user in teams[team]:
            users.append(user)
            users.append(team)
    output = [{"DocID": docid, "Users": users}]

    with open("step2-%s.json" % reducerId, "a") as f:
        print(json.JSONEncoder().encode(output), file=f)
