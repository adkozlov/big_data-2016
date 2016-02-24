# encoding: utf8
import requests


class DFSClient(object):
    def __init__(self, master_url):
        self.master_url = master_url

    def file_chunks(self, filename):
        r = requests.get("http://%s/get_file_chunks" % self.master_url,
                         params={"filename": filename})
        if r.status_code != 200:
            raise Exception("ERROR: can't get file chunks from master")
        return r.json()

    def chunk_locations(self, chunk_id):
        r = requests.get("http://%s/get_chunk_locations" % self.master_url,
                         params={"chunk_id": chunk_id})
        if r.status_code != 200:
            raise Exception("ERROR: can't get chunk locations from master")
        return r.json()

    def get_chunk_data(self, chunk_server_id, chunk_id):
        r = requests.get("http://%s/read" % chunk_server_id,
                         params={"chunk_id": chunk_id})
        if r.status_code != 200:
            raise Exception("ERROR: can't get chunk %s from chunkserver %s" % (chunk_id, chunk_server_id))
        return r.text
