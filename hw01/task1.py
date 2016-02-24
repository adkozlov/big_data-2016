#!/usr/bin/python3
# encoding: utf8

from client import DFSClient


def get_file_content(filename):
    for chunk in client.file_chunks(filename):
        yield from client.get_chunk_data(client.chunk_locations(chunk), chunk).splitlines()


def calculate_sum(keys_filename, partitions_filename="/partitions"):
    def split_lines(filename):
        return (tuple(line.split()) for line in get_file_content(filename) if line)

    def calculate_sum_shard(shard_filename, query):
        return sum((int(value) for (key, value) in split_lines(shard_filename) if key == query))

    return sum((calculate_sum_shard(shard_filename, key)
                for (origin, bound, shard_filename) in split_lines(partitions_filename)
                for key in get_file_content(keys_filename)
                if origin <= key <= bound))


if __name__ == '__main__':
    from argparse import ArgumentParser

    parser = ArgumentParser(description="")
    parser.add_argument("--keys", required=False, default="/keys", help="Keys file")
    parser.add_argument("--partitions", required=False, default="/partitions", help="Partitions file")
    parser.add_argument("--master", required=False, default="localhost:8000",
                        help="Master host and port (default localhost:8000)")
    args = parser.parse_args()

    client = DFSClient(args.master)
    print(calculate_sum(args.keys, args.partitions))
