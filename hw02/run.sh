#!/bin/bash
rm *.json
rm errors
../mapreduce/lin/mapreduce -shard-file shards.txt -mapper ./mr_solution_mapper1.py -reducer ./mr_solution_reducer1.py
find . -name "step1*.json" -exec echo '{}' ';' > shards2.txt
../mapreduce/lin/mapreduce -shard-file shards2.txt -mapper ./mr_solution_mapper2.py -reducer ./mr_solution_reducer2.py

echo "

Ошибки записаны в файл errors, выходные шарды в файлы step2*.json"
