import warc
f = warc.open("09.warc")
output = open("new_file.warc", 'w')
i = 0
for record in f:
	output.write(str(record))

output.close()