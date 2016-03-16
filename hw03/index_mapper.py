#!/usr/bin/env python
# encoding: utf-8
from __future__ import print_function
import json
import sys

# Имя файла - шарда передаётся в первом аргументе
shard = sys.argv[1]

# Маппер читает шард паука как JSON объект.
# В соответствии с протоколом маппер выплевывает JSON-объект, являющийся массивом
# Массив состоит из JSON объектов, в каждом из которых есть поля
# Key -- ключ свертки, в данном случае слово из текста
# Value -- в общем случае произвольный JSON объект, передающийся задачам свертки
# Данный маппер в качестве Value выплевывает номера документов
with open(shard, "r") as f:
    page = json.JSONDecoder().decode(f.read())
    output_values = []
    output_values += [{"Key": v, "Value": page["ID"]} for v in page["Authors"]]
    output_values += [{"Key": v, "Value": page["ID"]} for v in page["Title"].split()]
    lines = page["Body"].split("\\n")
    body_words = (w for line in lines for w in line.split())
    output_values += [{"Key": v, "Value": page["ID"]} for v in body_words]

    print(json.JSONEncoder().encode(output_values))
    
