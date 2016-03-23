#!/usr/bin/env python3
# encoding: utf-8
from collections import Counter
from json import JSONEncoder, JSONDecoder
from sys import argv, stdin


def hashcode(s):
    h = 0
    for c in s:
        h = (31 * h + ord(c)) & 0xFFFFFFFF
    return (((h + 0x80000000) & 0xFFFFFFFF) - 0x80000000) % 10

if __name__ == '__main__':
    index = {}
    for value in JSONDecoder().decode(stdin.read()):
        counter = index.setdefault(value["id"], Counter())
        counter[value["kind"]] += 1

    key = argv[1]
    with open("%s-%s" % (hashcode(key), argv[2]), "a") as file:
        print("%s %s" % (key, JSONEncoder().encode(index)), file=file)
