#!/bin/bash
NUM_WORKERS="$1"
shift
python $@ &
sleep 2s
for w in $(seq 1 $NUM_WORKERS); do
    python mincemeat.py -p "" localhost&
done
#python mincemeat.py -p changeme localhost &
#python mincemeat.py -p changeme localhost &
