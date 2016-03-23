#!/usr/bin/env python
# encoding: utf-8
from __future__ import print_function

import json
import sys


def hashcode(s):
    h = 0
    for c in s:
        h = (31 * h + ord(c)) & 0xFFFFFFFF
    return (((h + 0x80000000) & 0xFFFFFFFF) - 0x80000000) % 10


if __name__ == '__main__':
    # Этот скрипт вызывается для каждой задачи свертки
    # Ключ свертки передается в аргументах запуска
    key = sys.argv[1]
    reducerId = sys.argv[2]

    # Список значений передаётся в виде массива JSON объектов
    # в стандартном потоке входа. Каждый объект в массиве -- результат
    # выхода какой-то задачи маппинга
    distinct_values = set(v for v in json.JSONDecoder().decode(sys.stdin.read()))
    values = [v for v in distinct_values]
    # Свертка записывает результат в файл, название которого образовано идентификатором
    # свертки и остатком от хеш-кода слова, делённым на 10. Таким образом, каждый
    # процесс свертки произведёт 10 шардов
    with open("%s-%s" % (hashcode(key), reducerId), "a") as f:
        print("%s %s" % (key, json.JSONEncoder().encode(values)), file=f)
