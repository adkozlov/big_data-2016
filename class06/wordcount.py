def run(sc):
	rdd_dataset = sc.textFile("dataset/*/*")
	rdd_words = rdd_dataset.flatMap(lambda line: line.split())
	rdd_mapper_output = rdd_words.map(lambda w : (w, 1))
	rdd_reducer_output = rdd_mapper_output.reduceByKey(lambda a, b: a+b)
	rdd_reducer_output.saveAsTextFile("wordcount_result")

