#!/bin/bash

../mapreduce/mac/mapreduce -shard-file shards.txt -mapper ./mapper_1.py -reducer ./reducer_1.py
for file in $(ls 1-*.json); do echo $file; done >> shards_2.txt
../mapreduce/mac/mapreduce -shard-file shards_2.txt -mapper ./mapper_2.py -reducer ./reducer_2.py
