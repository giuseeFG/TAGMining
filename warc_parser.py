import warc
f = warc.open("09small.warc")
output = open("New09Small.warc", 'w')
i = 0
for record in f:
	output.write(str(record))
	print i
	i = i+1
output.close()