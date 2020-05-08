let MAX_INSTRUCTIONS_PER_BLOCK = 63;

const tabelaMnemonicos = {
    "JP": {"tipo": "instrucao", "codigoHex": "0", "tamanho": 2},
    "JZ": {"tipo": "instrucao", "codigoHex": "1", "tamanho": 2},
    "JN": {"tipo": "instrucao", "codigoHex": "2", "tamanho": 2},
    "LV": {"tipo": "instrucao", "codigoHex": "3", "tamanho": 2},
    "+": {"tipo": "instrucao", "codigoHex": "4", "tamanho": 2},
    "-": {"tipo": "instrucao", "codigoHex": "5", "tamanho": 2},
    "*": {"tipo": "instrucao", "codigoHex": "6", "tamanho": 2},
    "/": {"tipo": "instrucao", "codigoHex": "7", "tamanho": 2},
    "LD": {"tipo": "instrucao", "codigoHex": "8", "tamanho": 2},
    "MM": {"tipo": "instrucao", "codigoHex": "9", "tamanho": 2},
    "SC": {"tipo": "instrucao", "codigoHex": "A", "tamanho": 2},
    "RS": {"tipo": "instrucao", "codigoHex": "B", "tamanho": 2},
    "HM": {"tipo": "instrucao", "codigoHex": "C", "tamanho": 2},
    "GD": {"tipo": "instrucao", "codigoHex": "D", "tamanho": 2},
    "PD": {"tipo": "instrucao", "codigoHex": "E", "tamanho": 2},
    "OS": {"tipo": "instrucao", "codigoHex": "F", "tamanho": 2},
    "@": {"tipo": "pseudo", "codigoHex": "0", "tamanho": 0},
    "#": {"tipo": "pseudo", "codigoHex": "0", "tamanho": 0},
    "K": {"tipo": "pseudo", "codigoHex": "0", "tamanho": 1},
}

let ci = 0;
let simbolos = {};
let blocoAtual = {"enderecoInicial": 0, "dados": []};
let blocos = [];
let addrInstrucaoInicial = 0;
let quantidadeInstrucoes = 0;

function setMaxInstructionsPerBlock(qtde) {
    MAX_INSTRUCTIONS_PER_BLOCK = qtde;
}

/**
 * Converte texto para inteiro.
 * Se o texto começa com "/", é tratado como hexadecimal.
 * Caso contrário é tratado como decimal.
 * @param {string} text Texto a ser convertido para inteiro
 * @returns {number}
 */
function parseNumber(text) {
    let result = 0;
    if (text[0] == "/") {
        text = text.split('')
        text.shift()
        result = parseInt(text.join(''), 16)
    } else {
        result = parseInt(text)
    }
    return result;
}

/**
 * Converte um numero inteiro em string Hexadecimal
 * @param {number} number Número a ser convertido para hexadecimal
 * @param {number} length Comprimento do valor em hexadecimal (0-4)
 * @param {string} prefix Prefixo a ser adicionado (exemplo: "0x")
 */
function intToHex(number, length, prefix) {
    if (!prefix) {
        prefix = "";
    }
    if (typeof length == undefined || length == 0) {
        return prefix + number.toString(16).toUpperCase();
    }
    return prefix+("0000" + number.toString(16)).substr(-1*length).toUpperCase();
}

/**
 * Interpreta o operando da instrução ASM
 * @param {string} operando Operando como rótulo, decimal ou hexadecimal
 * @param {number} nbytes Número de bytes a serem retornados
 * @returns {string} Operando efetivo em hexadecimal
 */
function parseOperando(operando, nbytes) {
    if (/^\d+$/.test(operando)) { //Apenas números, tratar como decimal
        return intToHex(parseInt(operando), 2*nbytes)
    } else if (operando.match(/^\/[0-9a-fA-F]+$/)) { //Hexadecimal
        return intToHex(parseNumber(operando), 2*nbytes)
    } else { //Rótulo
        console.log("Rótulo: "+operando+" has hex addr "+intToHex(simbolos[operando].endereco, 2*nbytes))
        if (operando in simbolos == false) throw new ReferenceError("Símbolo \""+operando+"\" inexistente");
        return intToHex(simbolos[operando].endereco, 2*nbytes)
    }
}

/**
 * Divide a linha em rótulo, instrução, operando e comentário.
 * Valores não definidos na linha são retornados como undefined.
 * @param {string} line Linha a ser dividida
 * @returns {object} Retorna {rotulo, instrucao, operando, comentario}
 */
function parseRawLine(line) {
    let comentario = line.split(";")[1];
    let codigo = line.split(";")[0].match(/\S+/g);
    let rotulo, instrucao, operando = "";

    if (codigo && codigo.length == 3) { //Se possui rótulo, instrução e operando
        rotulo = codigo[0];
        instrucao = codigo[1];
        operando = codigo[2];
    } else if (codigo && codigo.length == 2) { //Se possui apenas instrução e operando
        rotulo = undefined;
        instrucao = codigo[0];
        operando = codigo[1];
    } else { // Se a linha não contém informações (ou algo há algo de errado)
        rotulo = undefined;
        instrucao = undefined;
        operando = undefined;
    }
    return {rotulo, instrucao, operando, comentario};
}

/**
 * Adiciona o rótulo passado à tabela de símbolos.
 * Caso já exista na tabela, lança uma exceção;
 * @param {string} rotulo 
 */
function addRotulo(rotulo) {
    if (rotulo in simbolos) {
        throw new ReferenceError("Símbolo \""+rotulo+"\" já existente na tabela")
    } else {
        simbolos[rotulo] = {}
        simbolos[rotulo].endereco = ci;
    }
}

/**
 * Atualiza o CI de acordo com a instrução fornecida
 * @param {string} instrucao
 * @param {string} operando 
 */
function analisarInstrucaoPasso1(instrucao, operando) {
    if (instrucao in tabelaMnemonicos) {
        if (tabelaMnemonicos[instrucao].tipo == "pseudo") {
            if (instrucao == "K") {
                ci+=1;
            } else if (instrucao == "@") {
                ci = parseNumber(operando)
            } else if (instrucao == "#") {
                return 0;
            } else {
                throw new Error("Pseudo instrução inválida: "+instrucao);
            }
        } else {
            ci+=tabelaMnemonicos[instrucao].tamanho;
        }
    } else {
        throw new Error("Instrução inválida: "+instrucao);
    }
}

function montagemPasso1(filecontent) {
    ci = 0;
    for (i in filecontent) {
        let linha = filecontent[i];
        let {rotulo, instrucao, operando, comentario} = parseRawLine(linha);

        console.group("Parsing line "+parseInt(parseInt(i)+1));
        if (rotulo) console.log("Rótulo: "+rotulo);
        if (instrucao) console.log("Instrução: "+instrucao);
        if (operando) console.log("Operando: "+operando);
        if (comentario) console.log("Comentário: "+comentario)

        if (!instrucao) {
            console.info("%cPulando linha vazia", 'color: blue')
            console.groupEnd();
            continue;
        }

        if (rotulo) {
            console.info("%cAdicionando rótulo \""+rotulo+"\" à tabela de símbolos", 'color: blue')
            addRotulo(rotulo);
        }

        if (analisarInstrucaoPasso1(instrucao, operando) === 0) {
            console.groupEnd();
            break;
        }
        console.groupEnd();
    }
}

function flushBlocoPasso2() {
    if (blocoAtual.dados.length > 0) {
        blocos.push(blocoAtual);
    }
    blocoAtual = {"enderecoInicial": 0, "dados": []};
    quantidadeInstrucoes = 0;
}

function analisarInstrucaoPasso2(instrucao, operando) {
    if (instrucao in tabelaMnemonicos) {
        if (tabelaMnemonicos[instrucao].tipo == "pseudo") {
            if (instrucao == "K") {
                blocoAtual.dados.push(parseNumber(operando))
                ci++;
                quantidadeInstrucoes++;
            } else if (instrucao == "@") {
                flushBlocoPasso2();
                blocoAtual.enderecoInicial = parseNumber(operando)
                ci = blocoAtual.enderecoInicial;
            } else if (instrucao == "#") {
                addrInstrucaoInicial = parseInt(parseOperando(operando, 2), 16);
                return 0;
            } else {
                throw new Error("Pseudo instrução inválida: "+instrucao);
            }
        } else {
            let operandohex = parseOperando(operando, 2);
            blocoAtual.dados.push(parseInt(tabelaMnemonicos[instrucao].codigoHex+operandohex[1], 16))
            blocoAtual.dados.push(parseInt(operandohex[2]+operandohex[3], 16))
            ci+=tabelaMnemonicos[instrucao].tamanho;
            quantidadeInstrucoes++;
        }
    } else {
        throw new Error("Instrução inválida: "+instrucao);
    }
}

function montagemPasso2(filecontent) {
    ci = 0;
    quantidadeInstrucoes = 0;
    blocos = [];
    blocoAtual = {"enderecoInicial": 0, "dados": []};
    addrInstrucaoInicial = 0;

    for (i in filecontent) {
        let linha = filecontent[i];
        let {rotulo, instrucao, operando, comentario} = parseRawLine(linha);

        console.group("Parsing line "+parseInt(parseInt(i)+1));
        if (rotulo) console.log("Rótulo: "+rotulo);
        if (instrucao) console.log("Instrução: "+instrucao);
        if (operando) console.log("Operando: "+operando);
        if (comentario) console.log("Comentário: "+comentario)

        if (!instrucao) {
            console.info("%cPulando linha vazia", 'color: blue')
            console.groupEnd();
            continue;
        }

        if (quantidadeInstrucoes >= MAX_INSTRUCTIONS_PER_BLOCK) {
            flushBlocoPasso2();
            blocoAtual.enderecoInicial = ci;
        }

        if (analisarInstrucaoPasso2(instrucao, operando) === 0) {
            console.groupEnd();
            break;
        }
        console.groupEnd();
    }
    flushBlocoPasso2();

    let codigoHexMontado = "";
    console.log("Endereço instrução inicial: "+addrInstrucaoInicial)
    codigoHexMontado += intToHex(addrInstrucaoInicial, 4) + "\n";
    codigoHexMontado += intToHex(blocos.length, 2) + "\n" + "\n";
    for (i in blocos) {
        codigoHexMontado += intToHex(blocos[i].dados.length, 2) + "\n";
        codigoHexMontado += intToHex(blocos[i].enderecoInicial, 4) + "\n";
        let blocoChecksum = 0;
        for (j in blocos[i].dados) {
            blocoChecksum += blocos[i].dados[j];
            codigoHexMontado += intToHex(blocos[i].dados[j], 2);
        }
        codigoHexMontado += "\n" + intToHex(blocoChecksum, 2) + "\n" + "\n";
    }
    console.log("Blocos: ")
    console.log(blocos);
    return codigoHexMontado;
}

function montar(text) {
    simbolos = {};

    let filecontent = text.split('\n');

    console.groupCollapsed("Montagem Passo 1")
    montagemPasso1(filecontent);
    console.groupEnd();

    console.groupCollapsed("Montagem Passo 2")
    let codigoHexMontado = montagemPasso2(filecontent);
    console.log(codigoHexMontado);
    console.groupEnd();
    
    return codigoHexMontado;
}