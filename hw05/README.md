## Легенда
Вам нужно реализовать механизм репликации журнала в протоколе Raft.

## Подробности о задаче
Предполагается, что все остальные части протокола реализованы. У вас есть выбор ведущего, внесение и утверждение
новых значений и прочее. Требуется реализовать только репликацию журнала, описанную в оригинальной статье как `AppendEntries` RPC.
В рамках этого задания журнал на узле хранится в массиве в памяти, общение происходит по протоколу HTTP.

В файле `raft.py` реализована заготовка узла алгоритма Raft. Узел умеет играть роль лидера и ведомого. У меня код работает с
Python 2, а с Python 3 у cherrypy какие-то странные проблемы при старте, которые я не хочу решать. Поэтому используйте, pls, Python 2.

### Запуск узла

Эта команда запустит на порту 8001 ведомого, находящегося в поколении №1 с журналом H:1,E:1,L:1

```
    python raft.py -p 8001 -t 1 -l H:1,E:1,L:1
```

Эта команда запустит на порту 8002 ведомого, находящегося в поколении №2 с журналом H:1,E:1,L:1,O:2

```
    python raft.py -p 8002 -t 2 -l H:1,E:1,L:1,O:2
```

А эта запустит на порту 8000 лидера, находящегося в поколении №3 с журналом H:1,E:1,L:1,L:2,O:3 и ведомыми на портах 8001 и 8002

```
    python raft.py -p 8000 -t 3 -l H:1,E:1,L:1,L:2,O:3 -f 8001,8002
```

В имеющейся заготовке ведомый не делает ничего, а лидер при старте посылает heartbeat запрос всем известным ему ведомым,
потом пробует послать `append_entry` (в заготовке он получает HTTP 501) и потом просит текущее состояние журнала ведомого,
посылая запрос `print_log`.

### Что нужно сделать

Нужно реализовать метод `RaftNode.append_entry` и процесс репликации журнала от лидера к ведомому.
По окончании репликации напечатать в консоли состояние журнала каждого ведомого узла