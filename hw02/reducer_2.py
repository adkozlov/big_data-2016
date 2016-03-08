#!/usr/bin/env python3

from json import JSONDecoder, JSONEncoder
from sys import argv, stdin


if __name__ == '__main__':
    result = [user for user in JSONDecoder().decode(stdin.read())]
    print(JSONEncoder().encode(result))
    with open(("2-%s-%s.json" % (argv[1], argv[2])), "w") as file:
        print(JSONEncoder().encode(
            [{"Users": result,
              "DocID": argv[1]}]),
            file=file)
