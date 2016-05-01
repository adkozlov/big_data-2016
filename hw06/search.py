from argparse import ArgumentParser
from functools import reduce
from operator import and_


class DataBase:
    def __init__(self, data_file):
        with open(data_file) as file:
            data = list(map(DataBase.split_query, file.readlines()))
            self.size = len(data)

            first_row = data[0]
            self.start = int(first_row[0])
            columns_count = len(first_row) - 1

            rows = list(map(lambda x: x[1:], data))

            def create_column(index):
                return DataBase.create_column(map(lambda x: x[index], rows))

            self.columns = list(map(create_column, range(columns_count)))

    def execute(self, query):
        result = (DataBase.execute_on_column(column, subquery)
                  for (column, subquery) in zip(self.columns, DataBase.split_query(query))
                  if subquery != "")

        return list(map(lambda x: self.start + x, reduce(and_, result)))

    @staticmethod
    def create_column(rows):
        def create_pair(value, count=None):
            return value, (count if count else 0) + 1

        iterator = iter(rows)
        column = [create_pair(next(iterator))]
        for current in iterator:
            previous, count = column[-1]
            append = current != previous

            current_pair = create_pair(current,
                                       count if not append else None)
            if append:
                column.append(current_pair)
            else:
                column[-1] = current_pair

        return column

    @staticmethod
    def execute_on_column(column, subquery):
        result = set()
        index = 0
        for (value, count) in column:
            if value == subquery:
                result.update(map(lambda x: x + index, range(count)))
            index += count

        return result

    @staticmethod
    def split_query(query):
        return query.strip("\n").split(",")


if __name__ == '__main__':
    parser = ArgumentParser(description="Column data base")
    parser.add_argument("--data", required=True, help="A file with data")
    parser.add_argument("--query", required=True, help="A search query")
    arguments = parser.parse_args()

    print(DataBase(arguments.data).execute(arguments.query))

    # data_base = DataBase(arguments.data)
    # list(map(lambda x: print(data_base.execute(x)),
    #          ["lorem,,amet", "lorem,,", ",ipsum,dolor", "lorem,dolor,sit"]))
