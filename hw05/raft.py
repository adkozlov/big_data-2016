#!/usr/bin/env python
# encoding: utf-8
from __future__ import print_function
import argparse
import cherrypy
import requests

class RaftNode(object):
  def __init__(self, log, term):
    self.log = parse_log(log)
    self.term = term

  # heartbeat просто для красоты
  @cherrypy.expose()
  def heartbeat(self):
    return "OK"

  # Этот метод нужно реализовать
  @cherrypy.expose()
  def append_entry(self, idx, term, value):
    raise cherrypy.HTTPError(501)

  # Возвращает текущее состояние журнала
  @cherrypy.expose()
  def print_log(self):
    return str(self.log)

# Парсит журнал из вида <value>:<term> в список кортежей
def parse_log(log):
  return [(v, int(t)) for (v,t) in [entry.split(":") for entry in log.split(",")]]

# Выполняет репликацию журнала в соответствии с протоколом. port - порт ведомого, log - реплицируемый журнал
def replicate_log(port, log):
  resp = requests.get("http://localhost:%d/append_entry" % port, params={"idx": 0, "term": 0, "value": ""})
  print("Нам ответили HTTP %d" % resp.status_code)

# Печатает журнал ведомого. port - порт ведомого
def print_log(port):
  resp = requests.get("http://localhost:%d/print_log" % port)
  return resp.text.encode("utf-8")

parser = argparse.ArgumentParser()
parser.add_argument("-p", help="Номер порта", required = True, type = int)
parser.add_argument("-l", help="Начальный журнал в формате <value>:<term>,<value>:<term>,... Например: H:0,E:0,L:1,L:1", required = True)
parser.add_argument("-t", help="Номер поколения, в котором находится узел", required = True, type = int)
parser.add_argument("-f", help="Для лидера: перечисление портов ведомых через запятую")

args = parser.parse_args()

if not args.f:
  print("Запускаем ведомого на порту %d" % args.p)
  cherrypy.config.update({'server.socket_port': int(args.p)})
  cherrypy.quickstart(RaftNode(args.l, args.t))
else:
  print("Запускаем ведущего. Посылаем пульс ведомым...")
  follower_ports = [int(f.strip()) for f in args.f.split(",")]
  for port in follower_ports:
    resp = requests.get("http://localhost:%d/heartbeat" % port)
    if resp.status_code != 200:
      raise Exception("ERROR: ведомый на порту %d не принял пульс" % port)
    print("Ведомый на порту %d принял пульс. Реплицируем журнал" % port)
    replicate_log(port, parse_log(args.l))
    print("У ведомого на порту %d журнал сейчас такой: %s" % (port, print_log(port)))
