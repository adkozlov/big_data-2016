## Легенда
Вам нужно реализовать простую колоночную СУБД, использующую для сжатия данных колонках алгоритм Run-Length Encoding.

## Подробности о задаче

Алгоритм Run-Length Encoding заменяет повторяющуюся серию данных на элемент серии и длину серии [1]. Вам нужно написать код, который, прочитав с диска "сырые" данные, построит в памяти колоночные структуры и будет способен выполнять простейший булевский поиск.

### Сырые данные

Исходные данные записаны на диске в текстовом файле. В одной строке находится одна запись, состоящая из целочисленного идентификатора и трех строковых полей, разделённых запятыми. Порядок записи полей фиксирован: нулевым идет идентификатор, за ним  первое поле, потом второе и наконец третье :). Идентификаторы образуют монотонно возрастающую последовательность без пропусков.

Пример исходных данных

    1,lorem,ipsum,dolor
    2,lorem,ipsum,split
    3,lorem,sit,amet

### Булевский поиск
Ваша БД должна уметь находить записи, содержащие заданные значения полей. В качестве ответа должны вернуться идентификаторы записей.

Запрос состоит из искомых значений, разделённых запятыми. Отсутствие значения в запросе означает, что это поле не входит в искомые.

Пример запроса и ответа, с приведёнными выше исходными данными:

    Q: lorem,,amet
    A: 3

    Q: lorem,,
    A: 1,2,3

    Q: ,ipsum,dolor
    A: 1

    Q: lorem,dolor,sit
    A:


### Запуск программы
Решение должно принимать аргументы `--data DATA_FILE --query QUERY`, где `DATA_FILE` - файл с исходными данными, `QUERY` - запрос и печатать в стандартный выход идентификаторы записей, удовлетворяющих запросу.

## Ограничения и пожелания
Все данные поместятся в оперативную память.

  [1] https://en.wikipedia.org/wiki/Run-length_encoding
