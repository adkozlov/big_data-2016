from __future__ import print_function


def difference(pair):
    (first, second) = pair
    (first_name, first_words) = first
    (second_name, second_words) = second

    diff = -1
    if first_name < second_name:
        first_set = set(first_words)
        second_set = set(second_words)
        diff = float(len(first_set & second_set)) / len(first_set | second_set)

    return first_name, second_name, diff


def run(sc):
    documents = sc.wholeTextFiles("data/*") \
        .map(lambda x: (x[0], x[1].split(" ")))
    result = documents \
        .cartesian(documents) \
        .map(difference) \
        .takeOrdered(20, lambda x: -x[2])

    with open("result", "w+") as file:
        for (first_name, second_name, diff) in result:
            print("%s %s" % (first_name, second_name), file=file)
