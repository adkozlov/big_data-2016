#!/usr/bin/env python3

from json import JSONDecoder, JSONEncoder
from sys import argv, stdin


def teams_by_users(users):
    teams = set(user["Team"]
                for user in users
                if "Team" in user)
    return iter(teams if teams else set("None"))


def documents_by_users(users):
    return list(set(user["DocID"]
                    for user in users
                    if "Team" not in user))


if __name__ == '__main__':
    shard = JSONDecoder().decode(stdin.read())
    result = {"DocID": documents_by_users(shard),
              "Team": next(teams_by_users(shard))}
    print(JSONEncoder().encode(result))
    with open(("1-%s-%s.json" % (argv[1], argv[2])).replace(" ", "_"), "w") as file:
        print(JSONEncoder().encode(
            {"User": argv[1],
             "DocID": result["DocID"],
             "Team": result["Team"]}),
            file=file)
