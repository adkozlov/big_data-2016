import json
import mwclient
import mwparserfromhell as mwparser
import sys
sys.path.append("../dfs/")

import client as dfs

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

site = mwclient.Site('en.wikipedia.org')
category = site.Pages['Category:Distributed_file_systems']
counter = 0

encoder = json.JSONEncoder(indent = 2)
with open("data/shards.txt", "w") as toc:
	for page in category:
		print(page.name)
		page_filename = "data/page%d" % counter
		with open(page_filename, "w") as f:
			page_record = {}
			page_record["Title"] = page.name
			page_record["Authors"] = get_authors(page)
			page_record["Body"] = mwparser.parse(page.text()).strip_code().encode('utf-8')
			f.write(encoder.encode(page_record))
		toc.write("%s" % page_filename)
		counter += 1
