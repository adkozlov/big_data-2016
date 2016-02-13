**TL;DR** Исходные файлы домашних заданий надо брать из общедоступного репозитория `http://git.barashev.net/user/bigdata-2016-master`.
Решения домашних заданий надо заливать в свой собственный приватный репозиторий.

## Подготовка 

Далее в этой инструкции считается, что вашим именем пользователя на git.barashev.net является *student*.
Сделайте через UI форк репозитория `http://git.barashev.net/user/bigdata-2016-master` и  назовите его, например,
`http://git.barashev.net/student/bigdata-2016-student` и поставьте в его настройках на странице 
`http://git.barashev.net/student/bigdata-2016-student/edit` visibility level в private

## Алгоритм оформления и сдачи решения

    # Делаем локальный клон своего репозитория
    git clone http://git.barashev.net/student/bigdata-2016-student.git
    
    # Добавляем преподавательский репозиторий в качестве еще одного remote репозитория
    git remote add prepod http://git.barashev.net/user/bigdata-2016-master.git
    
    # Получаем содержимое ветки master преподавательского репозитория
    git checkout master
    git pull prepod master
    
    # Делаем новую ветку в своем локальном репозитории
    git checkout -b task
    
    # hack hack hack
    # делаем commit, обычными командами git add и git commit
    # Заливаем ветку task в свой приватный репозиторий
    git push origin task
    
    # Если во время работы над task в преподавательском репозитории что-то поменялось
    git checkout master
    git pull prepod master
    git checkout task
    git merge master
    
    
