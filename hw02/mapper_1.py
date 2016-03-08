#!/usr/bin/env python3

from sys import argv
from json import JSONDecoder, JSONEncoder


def teams_by_user(users, team):
    return [{"Key": user,
             "Value": {"Team": team}}
            for user in users]


def documents_by_user(documents):
    return [{"Key": user,
             "Value": {"DocID": document["DocID"]}}
            for document in documents
            for user in document["Users"]]


if __name__ == '__main__':
    with open(argv[1], "r") as file:
        shard = JSONDecoder().decode(file.read())
        print(JSONEncoder().encode(
            teams_by_user(shard["Users"], shard["Team"]) if "Team" in shard else documents_by_user(shard)))
