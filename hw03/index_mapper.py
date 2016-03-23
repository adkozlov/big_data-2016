#!/usr/bin/env python3
# encoding: utf-8
from json import JSONDecoder, JSONEncoder
from string import punctuation
from sys import argv


def tokenize(s):
    return "".join(c for c in s.lower() if c not in punctuation).split()

if __name__ == '__main__':
    with open(argv[1], "r") as file:
        shard = JSONDecoder().decode(file.read())

        def map_terms(kind):
            def mapper(term):
                return {"Key": term, "Value": {"id": shard["ID"], "kind": kind}}

            item = shard[kind]
            string = item if isinstance(item, str) else " ".join(item)
            return list(map(mapper, tokenize(string)))

        print(JSONEncoder().encode(map_terms("Authors") + map_terms("Title") + map_terms("Body")))
