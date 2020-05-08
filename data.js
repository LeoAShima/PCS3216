let memoryImages = {}

memoryImages.loader = [208,0,144,106,64,104,144,104,208,0,144,107,144,105,208,0,144,108,208,0,144,109,208,0,144,110,208,0,144,111,48,0,144,113,48,144,64,110,144,100,48,0,64,111,144,101,208,0,0,100,64,113,144,113,128,111,64,114,144,111,16,72,128,109,80,114,144,109,16,80,0,34,128,110,64,114,144,110,0,62,208,0,144,112,80,113,16,90,255,255,128,108,80,114,144,108,16,104,0,18,144,0,0,50,192,0,0,0,0,0,0,0,0,0,1]

let sampleFiles = {}

sampleFiles.nquadrado = "\t@\t/080\nINIC\tLD\tUM\t; Inicializa as variaveis\n\tMM\tCONT\t; com o valor 1\n\tMM\tIMPAR\n\tMM\tRESULT\n\nLOOP\tLD\tCONT\t; Carrega o contador e verifica\n\t-\tN\t; se ja e igual N\n\tJZ\tFORA\t; Se sim, encerra\n\tLD\tCONT\t; Pega o contador\n\t+\tUM\t; Soma 1\n\tMM\tCONT\t; Devolve\n\tLD\tIMPAR\t; Coloca o proximo numero impar\n\t+\tDOIS\n\tMM\tIMPAR\n\t+\tRESULT\t; E soma no resultado\n\tMM\tRESULT\n\tJP\tLOOP\n\nFORA\tLD\tRESULT\t; Resultado esta em RESULT\n\tPD\t/000\n\tOS\t/000\t; Halt Machine\n\n\t@\t/0B0\t; Area de Dados\nUM\tK\t01\nDOIS\tK\t02\nIMPAR\tK\t0\nN\tK\t4\nRESULT\tK\t0\nCONT\tK\t0\n\n\t#\tINIC\n"