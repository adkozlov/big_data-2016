def split(pair):
    (first, second) = pair
    return first, second.split(" ")


def compare(pair):
    (first, second) = pair
    (first_name, first_words) = first
    (second_name, second_words) = second

    result = -1
    if first_name != second_name:
        first_set = set(first_words)
        second_set = set(second_words)
        result = float(len(first_set & second_set)) / len(first | second_set)

    return first_name, second_name, result


def run(sc):
    documents = sc.wholeTextFiles("data/*").map(split)
    documents = documents.cartesian(documents)
    result = documents.map(compare)

    with open("result", "w+") as file:
        for (first_name, second_name, diff) in result.takeOrdered(20, lambda x, y, z: -z):
            print("%s %s" % (first_name, second_name), file=file)
