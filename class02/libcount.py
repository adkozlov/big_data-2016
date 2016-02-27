import file_api

def read_by_chunks(file):
    """Turn `ChunkedFile` into an stream of chunks."""

    return iter(file.read_chunk, [])

def group_by_blocks(chunks, chunks_per_block):
    """Turn a stream of chunks into a stream of blocks."""

    def concat_all(chunks):
        return [x for chunk in chunks for x in chunk]

    return map(concat_all, windows(chunks, chunks_per_block))

def windows(stream, window_size):
    """Cut a stream into fixed-sized windows"""

    window = []
    for x in stream:
        window.append(x)
        if len(window) == window_size:
            yield window
            window = []

    if window:
        yield window

def count_array(arr, out):
    for num in arr:
        if not num in out:
            out[num] = 0
        out[num] += 1

def count(file, buffer_size, counts):
    blocks = group_by_blocks(read_by_chunks(file), buffer_size)
    for b in blocks:
        count_array(b, counts)
