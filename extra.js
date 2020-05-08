window.addEventListener("setPC", function(e) {
  updatePainelEstado();
  grifarPCAtual(e.detail.oldPC, e.detail.newPC)
});

window.addEventListener("setMemory", function(e) {
  let memCell = getMemCellElement(e.detail.addr);
  if (memCell) {
    memCell.innerText = ("0" + e.detail.value.toString(16)).substr(-2).toUpperCase();
  }
});

window.addEventListener("setAccumulator", function(e) {
  document.getElementById("accumulatorDisplay").innerText = "0x" + ("0" + accumulator.toString(16)).substr(-2).toUpperCase();
});

function grifarPCAtual(oldPC, newPC) {
  for (i = 0; i < 2; i++) {
    let oldPCElement = getMemCellElement(oldPC+i);
    if (oldPCElement) {
      oldPCElement.style.removeProperty("background-color")
      oldPCElement.style.removeProperty("color")
    }
  }
  for (i = 0; i < instrucaoAtual.comprimento; i++) {
    let newPCElement = getMemCellElement(newPC+i);
    if (newPCElement) {
      newPCElement.style.backgroundColor = "yellow"
      newPCElement.style.color = "black"
    }
  }
}

function getMemCellElement(addr) {
  let targetMemClassPC = "Mem0x"+("00" + addr.toString(16)).substr(-3);
  return document.getElementsByClassName(targetMemClassPC)[0];
}

function updatePainelEstado() {
  document.getElementById("programCounterDisplay").innerText = "0x" + ("00" + programCounter.toString(16)).substr(-3).toUpperCase();
  document.getElementById("accumulatorDisplay").innerText = "0x" + ("0" + accumulator.toString(16)).substr(-2).toUpperCase();

  document.getElementById("nomeInstrucao").innerText = instrucaoAtual.nome;
  document.getElementById("mnemonicoInstrucao").innerText = instrucaoAtual.mnemonico;
  document.getElementById("comprimentoInstrucao").innerText = instrucaoAtual.comprimento;
  document.getElementById("bytesInstrucao").innerText = instrucaoAtual.bytes.join(" ");
  document.getElementById("operandoInstrucao").innerText = instrucaoAtual.operando;

  if (halted) {
    document.getElementById("estadoHalted").innerText = "Parado"
    document.getElementById("estadoHaltedMotivo").innerText = haltReason;
  } else {
    document.getElementById("estadoHalted").innerText = "Executando"
    document.getElementById("estadoHaltedMotivo").innerText = "-";
  }
}

// INÍCIO FUNÇÕES DADOS

function updateDados() {
  updatePainelEstado()
  let targetMemClassPC = "Mem0x"+("00" + programCounter.toString(16)).substr(-3);
  let targetMemClassPCElement = document.getElementsByClassName(targetMemClassPC)[0];
  if (targetMemClassPCElement) {
    document.getElementsByClassName(targetMemClassPC)[0].style.backgroundColor = "yellow";
    document.getElementsByClassName(targetMemClassPC)[0].style.color = "black";
  }
  if (instrucaoAtual.comprimento == 2) {
    let targetMemClassPC = "Mem0x"+("00" + (programCounter+1).toString(16)).substr(-3);
    let targetMemClassPCElement = document.getElementsByClassName(targetMemClassPC)[0];
    if (targetMemClassPCElement) {
      document.getElementsByClassName(targetMemClassPC)[0].style.backgroundColor = "yellow";
      document.getElementsByClassName(targetMemClassPC)[0].style.color = "black";
    }
  }  
}

// FIM FUNÇÕES DADOS

// INÍCIO FUNÇÕES MEMÓRIA

let memoriaPaginaAtual = 0;
function memoriaPaginaSeguinte() {
  if (memoriaPaginaAtual < 15) {
    memoriaPaginaAtual++;
  } else {
    memoriaPaginaAtual = 0;
  }
  renderMemory(memoriaPaginaAtual);
}
function memoriaPaginaAnterior() {
  if (memoriaPaginaAtual > 0) {
    memoriaPaginaAtual--;
  } else {
    memoriaPaginaAtual = 15;
  }
  renderMemory(memoriaPaginaAtual);
}
document.getElementById("memoriaPaginaSeguinte").addEventListener("click", () => memoriaPaginaSeguinte())
document.getElementById("memoriaPaginaAnterior").addEventListener("click", () => memoriaPaginaAnterior())

function renderMemory() {
  let memoryTable = document.getElementById("memoryTable");
  let headerLine = document.createElement("tr");
  let emptyHeader = document.createElement("th");
  memoryTable.innerHTML = "";
  headerLine.appendChild(emptyHeader);
  for (i = 0; i < 16; i++) {
    let headerValue = document.createElement("th");
    headerValue.innerText = i.toString(16).toUpperCase();
    headerLine.appendChild(headerValue);
  }
  memoryTable.appendChild(headerLine);
  for (i = memoriaPaginaAtual*16; i < memoriaPaginaAtual*16+16; i++) {
    let memRow = document.createElement("tr");
    let rowGroup = document.createElement("td")
    let rowLabel = "0x" + ("0" + i.toString(16)).substr(-2).toUpperCase();
    rowGroup.innerHTML = "<b>"+rowLabel+"</b>";
    memRow.appendChild(rowGroup);
    for (j = 0; j < 16; j++) {
      let memoryCell = document.createElement("td");
      memoryCell.className = "Mem"+rowLabel+j.toString(16);
      memoryCell.innerText = ("0" + memory[i*16+j].toString(16)).substr(-2).toUpperCase();
      memRow.appendChild(memoryCell)
    }
    memoryTable.appendChild(memRow);
  }
  document.getElementById("memoriaPaginaAtual").innerText = "Página " + parseInt(memoriaPaginaAtual).toString().padStart(2, "0") + "/15";
  grifarPCAtual(0, programCounter);
}

document.getElementById("botaoCarregarMemoria").addEventListener("click", function() {
  let codigo = prompt("Insira o código montado em hexadecimal").replace(/\s/g,'')
  if (!codigo) return;
  let mem = codigo.match(/.{1,2}/g);
  boot() //Limpa memoria
  for (i = 0; i < mem.length; i++) {
    memory[i] = parseInt("0x"+mem[i])
  }
  decodeInstruction()
  renderMemory()
  updateDados()
})

// FIM FUNÇÕES MEMÓRIA

document.getElementById("botaoExecutarPasso").addEventListener("click", function() {
  haltReason = "Passo"
  instrucaoAtual.evento();
})

document.getElementById("botaoExecutar").addEventListener("click", function() {
  executarContinuo();
})

function executarContinuo() {
  halted = false;
  let instrucoes = 0;
  let executar = function() {
    instrucaoAtual.evento();
    instrucoes++;
    if (instrucoes >= LIMITE_INSTRUCOES) {
      halted = true;
      haltReason = "Limite de instruções atingido."
      updatePainelEstado();
    }
    if (!halted) {
      setTimeout(executar, 1)
    }
  }
  setTimeout(executar, 1)
}

document.getElementById("botaoParar").addEventListener("click", function() {
  halted = true;
  haltReason = "Parada Manual"
})

document.getElementById("botaoSetPC").addEventListener("click", function() {
  let PC = prompt("Digite o Program Counter em decimal, ou em hexadecimal com o prefixo '0x'")
  // TODO: Verificar se valor é válido
  setPC(parseInt(PC))
})

document.getElementById("botaoSetAccumulator").addEventListener("click", function() {
  let acc = prompt("Digite o Program Counter em decimal, ou em hexadecimal com o prefixo '0x'")
  // TODO: Verificar se valor é válido
  setAccumulator(parseInt(acc))
})

// Funções Arquivos

let filesystem = {};

function renderFiles() {
  let arquivoListaElement = document.getElementById("arquivoLista");
  arquivoListaElement.innerHTML = "";
  for (let file in filesystem) {
    if (Object.prototype.hasOwnProperty.call(filesystem, file)) {
      let listItem = document.createElement("li");
      listItem.innerText = file;
      listItem.addEventListener("click", function() {
        openFile(file)
      });
      arquivoListaElement.appendChild(listItem);
    }
  }
}

function loadSampleFiles() {
  filesystem['nquadrado.asm'] = sampleFiles.nquadrado;
  openFile('nquadrado.asm')
  renderFiles();
}

document.getElementById("arquivoRestaurarExemplos").addEventListener("click", () => loadSampleFiles())

function openFile(filename) {
  document.getElementById("arquivoName").innerText = filename;
  document.getElementById("arquivoContent").value = filesystem[filename];
  document.getElementById("painelIOArquivo").style.visibility = "visible";
}

function saveFile() {
  let filename = document.getElementById("arquivoName").innerText;
  if (Object.prototype.hasOwnProperty.call(filesystem, filename)) {
    filesystem[filename] = document.getElementById("arquivoContent").value;
  }
}

function closeFile() {
  document.getElementById("painelIOArquivo").style.visibility = "hidden";
}

document.getElementById("arquivoCriar").addEventListener("click", function() {
  saveFile();
  let nome = prompt("Digite o nome do arquivo a ser criado");
  if (nome in filesystem) {
    alert("Já existe um arquivo com este nome");
  } else if (nome) {
    filesystem[nome] = "";
    openFile(nome);
  }
  renderFiles()
})

document.getElementById("arquivoSalvar").addEventListener("click", () => saveFile());

document.getElementById("arquivoExecutar").addEventListener("click", function() {
  carregarLoader();
  saveFile();
  document.getElementById("entradaTextArea").value = filesystem[document.getElementById("arquivoName").innerText];
  executarContinuo();
})

document.getElementById("arquivoMontar").addEventListener("click", function() {
  saveFile();
  try {
    let codigo = montar(filesystem[document.getElementById("arquivoName").innerText]);
    let filename = document.getElementById("arquivoName").innerText;
    filesystem[filename+".hex"] = codigo;
    renderFiles();
    openFile(filename+".hex");
    console.log(codigo)
  } catch (exception) {
    alert(exception)
    console.groupEnd();
    console.groupEnd();
    console.groupEnd();
  }
})

function carregarLoader() {
  boot()
  for (i = 0; i < memoryImages.loader.length; i++) {
    memory[i] = memoryImages.loader[i];
  }
  decodeInstruction();
  renderMemory();
  updateDados();
}


closeFile();
decodeInstruction();
renderMemory();
updateDados();
