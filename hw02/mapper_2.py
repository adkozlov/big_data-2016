#!/usr/bin/env python3

from sys import argv
from json import JSONDecoder, JSONEncoder


def info_by_document(user, team, documents):
    return [{"Key": document,
             "Value": [user, team]}
            for document in documents]


if __name__ == '__main__':
    with open(argv[1], "r") as file:
        shard = JSONDecoder().decode(file.read())
        print(JSONEncoder().encode(info_by_document(shard["User"], shard["Team"], shard["DocID"])))
