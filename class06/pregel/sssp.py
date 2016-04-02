"""pagerank.py illustrates how to use the pregel.py library, and tests
that the library works.

"""

from pregel import Vertex, Pregel
from mincemeat import FileMapInputLineByLine
import sys

vertices = {}
num_workers = 1

def read_vertices(vertices, filename):
    finput = FileMapInputLineByLine(filename, False)
    try:
      while True:
        line = finput.next()[1]
        docid, outlinks = line.split()[:2];
        vertex = SSSPVertex(int(docid), float("inf"), [])
        vertices[docid] = vertex
    except StopIteration:
      return

def read_edges(vertices, filename):
    finput = FileMapInputLineByLine(filename, False)
    try:
      while True:
        line = finput.next()[1]
        docid, outlinks = line.split()[:2];
        src = vertices[docid]
        if outlinks != "==":
          dst_docids = outlinks.split(',')
          for d in dst_docids:
            dst = vertices[d]
            src.out_vertices.append(dst)
    except StopIteration:
      return
      
def main(filename):
    read_vertices(vertices, filename)
    read_edges(vertices, filename)
        
    p = Pregel(vertices.values(),num_workers)
    p.run()
    for vertex in p.vertices:
      print "#%s: %s" % (vertex.id, vertex.value)

class SSSPVertex(Vertex):
    def update(self):
        mindist = 0 if self.is_source() else float("inf")
        for (vertex,dist) in self.incoming_messages:
            if mindist > dist:
                mindist = dist
        if mindist < self.value:
            self.value = mindist
            self.outgoing_messages = [(vertex, mindist + 1) for vertex in self.out_vertices]
        else:
            self.active = True if mindist == float("inf") else False

    def is_source(self):
        return True if self.id == 1 else False
        
if __name__ == "__main__":
    main(sys.argv[1])
