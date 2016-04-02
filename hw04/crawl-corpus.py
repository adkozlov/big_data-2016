#!/usr/bin/env python
# encoding: utf-8
import argparse
import json
import mwclient
import mwparserfromhell as mwparser
import os
import sys

reload(sys)
sys.setdefaultencoding("utf-8")

def get_authors(page):
	authors = []
	revisions = page.revisions()
	try:
		for i in range(5):
			rev = revisions.next()
			authors.append(rev['user'])
	except StopIteration:
		pass
	return authors

def crawl(category, dir):
	site = mwclient.Site('en.wikipedia.org')
	category = site.Pages[category]
	counter = 0

	with open("%s/shards.txt" % dir, "w") as toc:
		for page in category:
			print(page.name)
			page_filename = "%s/page%d" % (dir, counter)
			with open(page_filename, "w") as f:
				f.write("%s\n%s" % (page.name, mwparser.parse(page.text()).strip_code(normalize=False, collapse=False)))
			toc.write("%s\n" % page_filename)
			counter += 1

# python crawl-corpus.py --category Category:Distributed_file_systems --dir data

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Стягивает содержимое категории из аглоязычной википедии")
    parser.add_argument("--category", required = False,  default = 'Category:Distributed_file_systems', help="Название категории")
    parser.add_argument("--dir", required = False, default = 'data', help="Каталог для записи корпуса")
    args = parser.parse_args()
    print("Downloading %s into %s" % (args.category, args.dir))
    if not os.path.exists(args.dir):
        os.makedirs(args.dir)
    crawl(args.category, args.dir)
