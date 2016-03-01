#!/usr/bin/env python
# encoding: utf-8
from __future__ import print_function
import json
import sys

# Имя файла - шарда передаётся в первом аргументе
shard = sys.argv[1]

# Функция маппинга
def mapfn(key, value):
    for w in value.split():
        yield w, 1

# Маппер читает JSON объекты из массива. По протоколу,
# каждый объект всегда состоит из двух полей:
# Key - строка, являющаяся идентификатором объекта
# Value - в общем случае проивзольный JSON объект, но данный маппер
# рассчитывает на то, что это строка.
#
# В соответствии с протоколом маппер выплевывает JSON-объект, являющийся массивом
# Массив состоит из JSON объектов, в каждом из которых есть поля
# Key -- ключ свертки
# Value -- в общем случае произвольный JSON объект, передающийся задачам свертки
# Данный маппер в качестве Value выплевывает числа
with open(shard, "r") as f:
    input_values = json.JSONDecoder().decode(f.read())
    output_values = []

    for v in input_values:
        key = v["Key"]
        value = v["Value"]
        output_values += [{"Key": k, "Value": v} for (k, v) in mapfn(key, value)]

    print(json.JSONEncoder().encode(output_values))
