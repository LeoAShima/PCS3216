const LIMITE_INSTRUCOES = 1000

var programCounter = 0;
var accumulator = 0;
var memory = [];
memory.length = 4096
memory.fill(0, 0, 4096);

var halted = true;
var haltReason = "-";

var indirectMode = false;

var dadosEntrada = [];
var dadosSaida = [];

function boot() {
    programCounter = 0;
    accumulator = 0;
    memory.length = 4096
    memory.fill(0, 0, 4096);
    halted = true;
}

var instrucaoAtual = {
    "bytes": [],
    "nome": String,
    "mnemonico": String,
    "comprimento": Number,
    "operando": String,
    "evento": undefined
}

function setPC(pc) {
    let event = new CustomEvent("setPC", {'detail': { 'oldPC': programCounter, 'newPC': pc }});
    programCounter = pc;
    decodeInstruction();
    window.dispatchEvent(event);
}

function setMemory(addr, value) {
    memory[addr] = value;
    if (addr == programCounter || addr == programCounter+1) setPC(programCounter) // Força decodificação da instrução atual alterada
    let event = new CustomEvent("setMemory", {'detail': {'addr': addr, 'value': value}})
    window.dispatchEvent(event);
}

function setAccumulator(value) {
    accumulator = value;
    let event = new Event("setAccumulator")
    window.dispatchEvent(event);
}

function getData() {
    let text = document.getElementById("entradaTextArea").value.trim().split('');
    let firstByte = text.shift();
    text = text.join('').trim().split('');
    let secondByte = text.shift();
    if (firstByte == undefined) firstByte = 0;
    if (secondByte == undefined) secondByte = 0;
    document.getElementById("entradaTextArea").value = text.join('').trim();
    return parseInt("0x"+firstByte + secondByte)
}

function putData(data) {
    document.getElementById('saidaTextArea').value+=intToHex(data,2);
}

function decodeInstruction() {
    let firstByte = memory[programCounter];
    switch (firstByte.toHexByte()[0]) {
        case "0":
            instrucaoAtual.nome = "Jump incondicional";
            instrucaoAtual.mnemonico = "JP";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte(), memory[programCounter+1].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                setPC(parseInt("0x"+instrucaoAtual.operando));
                console.log("Jump to address "+instrucaoAtual.operando+" ("+parseInt("0x"+instrucaoAtual.operando)+")") //DEBUG
            }
            break;
        case "1":
            instrucaoAtual.nome = "Jump if zero";
            instrucaoAtual.mnemonico = "JZ";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte(), memory[programCounter+1].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                if (accumulator == 0) {
                    setPC(parseInt("0x"+instrucaoAtual.operando));
                    console.log("Jump to address "+instrucaoAtual.operando+" ("+parseInt("0x"+instrucaoAtual.operando)+")") //DEBUG
                } else {
                    setPC(programCounter+2);
                    console.log("Value not zero. Next instruction") //DEBUG
                }
            }
            break;
        case "2":
            instrucaoAtual.nome = "Jump if negative";
            instrucaoAtual.mnemonico = "JN";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte(), memory[programCounter+1].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                if (accumulator >= 128) { // Se acumulador > 127, em complemento de dois é negativo
                    setPC(parseInt("0x"+instrucaoAtual.operando));
                    console.log("Jump to address "+instrucaoAtual.operando+" ("+parseInt("0x"+instrucaoAtual.operando)+")") //DEBUG
                } else {
                    setPC(programCounter+2);
                    console.log("Value not negative. Next instruction") //DEBUG
                }
            }
            break;
        case "3":
            instrucaoAtual.nome = "Load Value";
            instrucaoAtual.mnemonico = "LV";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte(), memory[programCounter+1].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                setAccumulator(parseInt("0x"+instrucaoAtual.operando.substr(-2)));
                setPC(programCounter+2);
            }
            break;
        case "4":
            instrucaoAtual.nome = "Add";
            instrucaoAtual.mnemonico = "+";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte(), memory[programCounter+1].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                accumulator += memory[parseInt("0x"+instrucaoAtual.operando)];
                if (accumulator >= 256) accumulator-=256;
                setAccumulator(accumulator) //Atualiza mostrador
                setPC(programCounter+2);
            }
            break;
        case "5":
            instrucaoAtual.nome = "Subtract";
            instrucaoAtual.mnemonico = "-";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte(), memory[programCounter+1].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                accumulator -= memory[parseInt("0x"+instrucaoAtual.operando)];
                if (accumulator < 0) accumulator+=256;
                setAccumulator(accumulator) //Atualiza mostrador
                setPC(programCounter+2);
            }
            break;
        case "6":
            instrucaoAtual.nome = "Multiply";
            instrucaoAtual.mnemonico = "*";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte(), memory[programCounter+1].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                accumulator *= memory[parseInt("0x"+instrucaoAtual.operando)];
                while (accumulator > 255) accumulator-=256;
                setAccumulator(accumulator) //Atualiza mostrador
                setPC(programCounter+2);
            }
            break;
        case "7":
            instrucaoAtual.nome = "Divide";
            instrucaoAtual.mnemonico = "/";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte(), memory[programCounter+1].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                if (memory[parseInt("0x"+instrucaoAtual.operando)] == 0) {
                    console.log("ERROR: CANNOT DIVIDE BY ZERO")
                    halted = true;
                    haltReason = "Divided by zero at 0x"+("00"+programCounter.toString(16)).substr(-3)
                } else {
                    setAccumulator(Math.floor(accumulator/memory[parseInt("0x"+instrucaoAtual.operando)]));
                }
                setPC(programCounter+2);
            }
            break;
        case "8":
            instrucaoAtual.nome = "Load from Memory";
            instrucaoAtual.mnemonico = "LD";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte(), memory[programCounter+1].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                setAccumulator(memory[parseInt("0x"+instrucaoAtual.operando)]);
                setPC(programCounter+2);
            }
            break;
        case "9":
            instrucaoAtual.nome = "Move to Memory";
            instrucaoAtual.mnemonico = "MM";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte(), memory[programCounter+1].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                setMemory(parseInt("0x"+instrucaoAtual.operando), accumulator)
                setPC(programCounter+2);
            }
            break;
        case "A":
            instrucaoAtual.nome = "Subroutine Call";
            instrucaoAtual.mnemonico = "SC";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte(), memory[programCounter+1].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                setMemory(parseInt("0x"+instrucaoAtual.operando), parseInt("0x"+("00" + programCounter.toString(16)).substr(-3)[0]));
                setMemory(parseInt("0x"+instrucaoAtual.operando+1), parseInt("0x"+("00" + programCounter.toString(16)).substr(-3).substr(-2)));
                setPC(parseInt("0x"+instrucaoAtual.operando)+2);
            }
            break;
        case "B":
            instrucaoAtual.nome = "Return from Subroutine";
            instrucaoAtual.mnemonico = "RS";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte(), memory[programCounter+1].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                setPC(parseInt("0x"+instrucaoAtual.operando));
                console.log("Jump to address "+instrucaoAtual.operando+" ("+parseInt("0x"+instrucaoAtual.operando)+")") //DEBUG
            }
            break;
        case "C":
            instrucaoAtual.nome = "Halt Machine";
            instrucaoAtual.mnemonico = "HM";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte(), memory[programCounter+1].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                halted = true;
                haltReason = "Halt Instruction at address 0x"+("00"+programCounter.toString(16)).substr(-3);
                setPC(parseInt("0x"+instrucaoAtual.operando));
                console.log("Jump to address "+instrucaoAtual.operando+" ("+parseInt("0x"+instrucaoAtual.operando)+")") //DEBUG
            }
            break;
        case "D":
            instrucaoAtual.nome = "Get Data";
            instrucaoAtual.mnemonico = "GD";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                //TODO ADD CHECK IF ENTRADA IS EMPTY
                setAccumulator(getData());
                setPC(programCounter+2);
            }
            break;
        case "E":
            instrucaoAtual.nome = "Put Data";
            instrucaoAtual.mnemonico = "PD";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte();
            instrucaoAtual.evento = function() {
                putData(accumulator);
                setPC(programCounter+2);
            }
            break;
        case "F":
            instrucaoAtual.nome = "Operating System Call";
            instrucaoAtual.mnemonico = "OS";
            instrucaoAtual.comprimento = 2;
            instrucaoAtual.bytes = [memory[programCounter].toHexByte()]
            instrucaoAtual.operando = memory[programCounter].toHexByte()[1] + memory[programCounter+1].toHexByte()
            instrucaoAtual.evento = function() {
                halted = true;
                haltReason = "OS Instruction at address 0x"+("00"+programCounter.toString(16)).substr(-3);
                if (instrucaoAtual.operando == "FFF") haltReason = "OS: Loader falhou checksum";
                if (instrucaoAtual.operando == "000") haltReason = "OS: Programa finalizou execução"
                setPC(programCounter+2);
            }
            break;
    }
}

boot()

// Helper Functions
Number.prototype.toHexByte = function() {
    let x = this.valueOf();
    return ("0" + x.toString(16)).substr(-2).toUpperCase();
}