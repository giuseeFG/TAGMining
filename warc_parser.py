import warc
f = warc.open("/Users/tiziano/project_giw/ducumenti_motore_ricerca/02.warc")
output = open("/Users/tiziano/project_giw/ducumenti_motore_ricerca/New02.warc", 'w')
i = 0
for record in f:
	output.write(str(record))
	print i
	i = i+1
output.close()