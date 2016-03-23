#!/usr/bin/env python3
# encoding: utf-8

from argparse import ArgumentParser
from glob import glob
from json import JSONDecoder
from operator import itemgetter, add
from subprocess import Popen

from index_mapper import tokenize


def parse_arguments():
    parser = ArgumentParser()
    parser.add_argument("--data", required=False, default="data", help="Каталог с шардами")
    parser.add_argument("--query", required=True, help="Термы запроса")
    parser.add_argument("--weights", required=True, help="Веса")

    arguments = parser.parse_args()
    return (
        arguments.data,
        set(tokenize(arguments.query)),
        dict(zip(["Authors", "Title", "Body"],
                 list(map(float, arguments.weights.split(",")))))
    )


def create_index(shard_file_path):
    Popen(["../mapreduce/mac/mapreduce",
           "-shard-file", "%s/shards.txt" % shard_file_path,
           "-mapper", "./index_mapper.py",
           "-reducer", "./index_reducer.py"]
          ).wait()


def execute_query(query, weights):
    def mapper(pair):
        i, kinds = pair
        intersection = weights.keys() & kinds.keys()
        return i, sum(weights[kind] * kinds[kind] for kind in intersection)

    def handle_shard(shard_path):
        with open(shard_path, "r") as file:
            def non_empty_lines():
                return filter(None, map(str.rstrip, file))

            def split_line(line):
                return tuple(line.split(maxsplit=1))

            for (term, index) in map(split_line, non_empty_lines()):
                if term in query:
                    yield from map(mapper, JSONDecoder().decode(index).items())

    def sum_tuples(x, y):
        return tuple(map(add, x, y))

    result = {}
    for shard_path in glob("[0-9]-*"):
        if not result:
            for (i, weight) in handle_shard(shard_path):
                result.setdefault(i, (0, 0))

        for (i, weight) in handle_shard(shard_path):
            if i in result:
                result[i] = sum_tuples(result[i], (weight, 1))

    return dict((i, weight) for (i, (weight, count)) in result.items() if count == len(query))

if __name__ == '__main__':
    path, query, weights = parse_arguments()
    create_index(path)

    for pair in sorted(execute_query(query, weights).items(), key=itemgetter(1), reverse=True):
        print("%s %.2f" % pair)
