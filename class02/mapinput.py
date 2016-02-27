import glob
import json
import os

class MapInput:
    def next(self):
        pass

class DictMapInput(MapInput):
    def __init__(self, datasource_dict):
        self.datasource_dict = datasource_dict
        self.dict_iter = iter(datasource_dict)

    def next(self):
        key = self.dict_iter.next()
        return key, self.datasource_dict[key]

class FileMapInput(MapInput):
    currentFile = None
    lineCount = 0

    def __init__(self, directory):
        self.input_dir = directory
        self.filenames = deque([])
        for f in os.listdir(directory):
            if os.path.isfile(os.path.join(directory, f)):
                self.filenames.append(os.path.join(directory, f))

    def next(self):
        if len(self.filenames) == 0:
            raise StopIteration
        filename = self.filenames.popleft()
        f = codecs.open(filename, "r", "utf-8")
        print 'file ', f.name
        return f.name,f.read()

from file_api import ChunkedFile

class InputChunkByChunk(MapInput):
    currentFile = None
    lineCount = 0

    def __init__(self, directory, chunk_size):
        self.input_dir = directory
        self.chunk_size = chunk_size
        self.filenames = deque([])
        for f in os.listdir(directory):
            if not os.path.isdir(f):
                self.filenames.append(os.path.join(directory, f))

    def next(self):
        if self.currentFile is not None:
            nextChunk = self.currentFile.read_chunk()
            if nextChunk:
                return self.currentFile.filename, nextChunk
            else:
                self.currentFile.close()

        if len(self.filenames) == 0:
            raise StopIteration
        filename = self.filenames.popleft()
        self.currentFile = ChunkedFile(filename, self.chunk_size)
        self.currentFile.open_for_read()
        print 'next file=' + filename
        return next(self)

class FileNameMapInput(MapInput):
    def __init__(self, directory):
        self.input_dir = directory
        self.filenames = deque([])
        for f in os.listdir(directory):
            if os.path.isfile(os.path.join(directory, f)):
                self.filenames.append(f)

    def next(self):
        if len(self.filenames) == 0:
            raise StopIteration
        filename = self.filenames.popleft()
        return "%s/%s" % (self.input_dir, filename), ""

class JsonFileMapInput(MapInput):
    def __init__(self, filename):
        with open(filename, "r") as f:
            stored_dict = json.JSONDecoder().decode(f.read())
            self.iter_items = ((key, stored_dict[key]) for key in stored_dict)

    def next(self):
        return next(self.iter_items)

class FileShardsMapInput(MapInput):
    def __init__(self, glob_pattern, shard_input_constructor):
        self.glob = glob.iglob(glob_pattern)
        self.shard_iterator = None
        self.shard_input_constructor = shard_input_constructor

    def next(self):
        if self.shard_iterator is not None:
            try:
                return self.shard_iterator.next()
            except StopIteration:
                pass
        filename = next(self.glob)
        self.shard_iterator = self.shard_input_constructor(filename)
        return next(self)
