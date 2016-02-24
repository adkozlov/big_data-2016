# encoding: utf-8
import argparse
import cherrypy
import hashlib
import json
import os
import requests
import sys
from threading import Timer


def json2obj(data): return json.JSONDecoder().decode(data)


class DFSMaster(object):
    def __init__(self, namespace_filename):
        self.namespace_filename = namespace_filename
        self.files = self.read_files()
        self.chunk_locations = {}
        self.chunkservers = []

    def read_files(self):
        if os.path.exists(self.namespace_filename):
            with open(self.namespace_filename) as f:
                return json2obj(f.read())
        else:
            return []

    def write_files(self):
        with open(self.namespace_filename, "w") as f:
            f.write(json.JSONEncoder().encode(self.files))

    @cherrypy.expose
    def register_chunkserver(self, newbie_id, newbie_chunks):
        new_chunk_locations = {}
        for chunk_id, chunkserver in self.chunk_locations.items():
            if chunkserver != newbie_id:
                new_chunk_locations[chunk_id] = chunkserver
        newbie_chunk_list = newbie_chunks.split()
        sys.stdout.write("Registering chunkserver %s with %d chunks" % (newbie_id, len(newbie_chunk_list)))
        for chunk in newbie_chunk_list:
            new_chunk_locations[chunk] = newbie_id

        self.chunk_locations = new_chunk_locations
        if not newbie_id in self.chunkservers:
            self.chunkservers.append(newbie_id)

    @cherrypy.expose
    def new_chunk(self, filename):
        if len(self.chunkservers) == 0:
            raise cherrypy.HTTPError(404, "No registered chunk servers. No one can write")

        chunkserver = hash(filename) % len(self.chunkservers)

        chunks = self.files[filename] if filename in self.files else []
        chunk_id = "%s_%d" % (hashlib.md5(filename.encode('utf-8')).hexdigest(), len(chunks))
        chunks.append(chunk_id)
        self.files[filename] = chunks

        self.write_files()
        return "%s %s" % (self.chunkservers[chunkserver], chunk_id)

    @cherrypy.expose()
    def get_file_chunks(self, filename=None):
        if filename is None:
            return json.JSONEncoder().encode(self.files)
        if filename not in self.files:
            raise cherrypy.HTTPError(404, "File %s is unknown" % filename)
        return json.JSONEncoder().encode(self.files[filename])

    @cherrypy.expose
    def get_chunk_locations(self, chunk_id=None):
        if chunk_id is None:
            return json.JSONEncoder().encode([
                                                 {"id": chunk_id, "chunkserver": chunkserver}
                                                 for chunk_id, chunkserver in self.chunk_locations.items()
                                                 ])
        return json.JSONEncoder().encode(self.chunk_locations[chunk_id])


def start_heartbeat(server):
    def closure():
        server.send_heartbeat()

    Timer(30, closure, ()).start()


class DFSChunkServer(object):
    def __init__(self, data_dir, hostname, port, master_host):
        self.data_dir = data_dir
        self.url = "%s:%d" % (hostname, port)
        self.register_url = "http://%s/register_chunkserver" % master_host
        self.send_heartbeat()

    def send_heartbeat(self):
        try:
            list = os.listdir(self.data_dir)
        except os.error as e:
            raise cherrypy.HTTPError(500, "ERROR: can't list directory %s: %s" % (self.data_dir, str(e)))
        list.sort(key=lambda a: a.lower())

        r = requests.post(self.register_url, data={'newbie_chunks': "\n".join(list), 'newbie_id': self.url})
        if r.status_code != 200:
            sys.stderr.write("Heartbeat failed: %s" % r.text)
            return False
        start_heartbeat(self)
        return True

    @cherrypy.expose
    def read(self, chunk_id):
        try:
            f = open(os.path.join(self.data_dir, chunk_id), 'rb')
        except IOError:
            raise cherrypy.HTTPError(404, "File %s not found" % chunk_id)
        fs = os.fstat(f.fileno())
        cherrypy.response.headers["Content-type"] = "text/plain"
        cherrypy.response.headers["Content-Length"] = str(fs[6])
        return f.read()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Сервер модели распределенной ФС")
    parser.add_argument("--role", required=False, default='master', help="Роль сервера: master или chunkserver")
    parser.add_argument("--port", required=False, default=8000,
                        help="Порт, который сервер обслуживает (8000 по умолчанию)")
    parser.add_argument("--namespace-filename", required=False, default="files",
                        help="Для мастера: имя файла с информацией о пространстве имен ('files' по умолчанию)")
    parser.add_argument("--master", required=False, default="localhost:8000",
                        help="Для chunkserver: хост и порт мастера (localhost:8000 по умолчанию)")
    parser.add_argument("--self-hostname", required=False, default='127.0.0.1',
                        help="Для chunkserver: имя или IP хоста, на котором он запущен (127.0.0.1 по умолчанию)")
    parser.add_argument("--data-dir", required=False, default="data",
                        help="Для chunkserver: имя каталога, содержащего контент фрагментов файлов ('data' по умолчанию)")
    args = parser.parse_args()

    cherrypy.config.update({'server.socket_port': int(args.port)})
    if args.role == 'master':
        cherrypy.quickstart(DFSMaster(args.namespace_filename))
    elif args.role == 'chunkserver':
        if args.master is None:
            raise Exception("Please specify master address")
        cherrypy.quickstart(DFSChunkServer(args.data_dir, args.self_hostname, int(args.port), args.master))
