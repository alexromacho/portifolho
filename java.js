document.addEventListener("click", (event) => {
    const botaoQuantidade = event.target.closest(".qty button:not([data-remove-row])");
    const botaoAdicionar = event.target.closest("[data-add-item]");
    const botaoRemover = event.target.closest("[data-remove-item]");
    const botaoRemoverLinha = event.target.closest("[data-remove-row]");

    if (botaoQuantidade) {
        alterarQuantidade(botaoQuantidade);
        salvarItensAdicionados(botaoQuantidade.closest("form"));
    }

    if (botaoAdicionar) {
        adicionarItemNaLista(botaoAdicionar.closest("form"));
    }

    if (botaoRemover) {
        const formulario = botaoRemover.closest("form");

        botaoRemover.closest("li").remove();
        salvarItensAdicionados(formulario);
    }

    if (botaoRemoverLinha) {
        const formulario = botaoRemoverLinha.closest("form");

        botaoRemoverLinha.closest("tr").remove();
        salvarItensAdicionados(formulario);
    }
});

document.addEventListener("input", (event) => {
    if (event.target.matches(".qty__input, .numero-item")) {
        salvarItensAdicionados(event.target.closest("form"));
    }
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js").then((registro) => {
            registro.update();
        });
    });
}

window.addEventListener("pagehide", () => {
    document.querySelectorAll("form").forEach((formulario) => {
        salvarItensAdicionados(formulario);
    });
});

document.querySelectorAll("#pedidoVero tbody tr").forEach((linha) => {
    adicionarBotaoRemoverLinha(linha);
});

const pedidoAgua = document.querySelector("#pedidoAgua");

if (pedidoAgua) {
    restaurarItensAdicionados(pedidoAgua);

    pedidoAgua.addEventListener("submit", (event) => {
        event.preventDefault();

        const dados = new FormData(pedidoAgua);
        const semGas = Number(dados.get("aguaSemGas"));
        const comGas = Number(dados.get("aguaComGas"));
        const itens = [];
        const mensagem = document.querySelector("#mensagemAgua");

        if (semGas > 0) {
            itens.push(`${semGas}x Agua sem gas`);
        }

        if (comGas > 0) {
            itens.push(`${comGas}x Agua com gas`);
        }

        itens.push(...buscarItensAdicionados(pedidoAgua));

        if (itens.length === 0) {
            mensagem.textContent = "Escolha pelo menos um item antes de enviar.";
            return;
        }

        mensagem.textContent = "";
        enviarPedidoWhatsapp("Aragua", itens);
    });
}

const pedidoVero = document.querySelector("#pedidoVero");

if (pedidoVero) {
    restaurarItensAdicionados(pedidoVero);

    pedidoVero.addEventListener("submit", (event) => {
        event.preventDefault();

        const itens = Array.from(pedidoVero.querySelectorAll("tbody tr"))
            .map((linha) => {
                const produto = linha.dataset.produto;
                const quantidade = obterQuantidade(linha.querySelector(".qty"));

                return `${quantidade}x ${produto}`;
            })
            .filter((item) => !item.startsWith("0x "));
        const mensagem = document.querySelector("#mensagemVero");

        if (itens.length === 0) {
            mensagem.textContent = "Escolha pelo menos um produto antes de enviar.";
            return;
        }

        mensagem.textContent = "";
        enviarPedidoWhatsapp("Vero Imports", itens);
    });
}

const pedidoWr = document.querySelector("#pedidoWr");

if (pedidoWr) {
    restaurarItensAdicionados(pedidoWr);

    pedidoWr.addEventListener("submit", (event) => {
        event.preventDefault();

        const itens = buscarItensAdicionados(pedidoWr);
        const mensagem = document.querySelector("#mensagemWr");

        if (itens.length === 0) {
            mensagem.textContent = "Adicione pelo menos um item na lista antes de enviar.";
            return;
        }

        mensagem.textContent = "";
        enviarPedidoWhatsapp("WR Embalagens", itens);
    });
}

const fornecedorForm = document.querySelector("#fornecedorForm");

if (fornecedorForm) {
    renderizarFornecedoresAdicionados();

    fornecedorForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const dados = new FormData(fornecedorForm);
        const fornecedor = {
            id: criarId(),
            nome: String(dados.get("nome")).trim(),
            whatsapp: limparTelefone(String(dados.get("whatsapp")).trim()),
            site: normalizarSite(String(dados.get("site")).trim()),
        };

        if (!fornecedor.nome) {
            return;
        }

        const fornecedores = lerFornecedoresAdicionados();
        fornecedores.push(fornecedor);
        salvarFornecedoresAdicionados(fornecedores);
        fornecedorForm.reset();
        renderizarFornecedoresAdicionados();
    });
}

function alterarQuantidade(botao) {
    const controle = botao.closest(".qty");
    const botoes = Array.from(controle.querySelectorAll("button"));
    const campo = obterCampoQuantidade(controle);
    const atual = obterQuantidade(controle);

    if (botao === botoes[0]) {
        definirQuantidade(campo, Math.max(0, atual - 1));
        return;
    }

    definirQuantidade(campo, atual + 1);
}

function adicionarItemNaLista(formulario) {
    const itemInput = formulario.querySelector('[name="itemExtra"]');
    const mensagem = formulario.querySelector(".pedido__mensagem");
    const item = itemInput.value.trim();

    if (!item) {
        if (mensagem) {
            mensagem.textContent = "Digite o nome do item para adicionar na lista.";
        }

        return;
    }

    if (formulario.id === "pedidoVero") {
        adicionarLinhaNaTabela(formulario, item);
    } else if (formulario.id === "pedidoWr") {
        adicionarLinhaSimples(formulario, item);
    } else {
        adicionarLinhaNaLista(formulario, item);
    }

    salvarItensAdicionados(formulario);

    if (mensagem) {
        mensagem.textContent = "";
    }

    itemInput.value = "";
    itemInput.focus();
}

function adicionarLinhaNaTabela(formulario, item) {
    const corpoTabela = formulario.querySelector("tbody");
    const linha = document.createElement("tr");

    linha.dataset.produto = item;
    linha.dataset.adicionado = "true";
    linha.innerHTML = `
        <td>${escaparHtml(item)}</td>
        <td>
            <div class="qty">
                <button type="button">-</button>
                <input class="qty__input" type="number" min="0" inputmode="numeric" aria-label="Quantidade">
                <button type="button">+</button>
                <button class="remover-item" type="button" data-remove-row>Remover</button>
            </div>
        </td>
    `;

    corpoTabela.appendChild(linha);
}

function adicionarBotaoRemoverLinha(linha) {
    const controle = linha.querySelector(".qty");

    if (!controle || controle.querySelector("[data-remove-row]")) {
        return;
    }

    const botao = document.createElement("button");
    botao.className = "remover-item";
    botao.type = "button";
    botao.dataset.removeRow = "";
    botao.textContent = "Remover";

    controle.appendChild(botao);
}

function adicionarLinhaNaLista(formulario, item, quantidade = 0) {
    const lista = formulario.querySelector(".lista-itens");
    const linha = document.createElement("li");

    linha.dataset.produto = item;
    linha.innerHTML = `
        <span>${escaparHtml(item)}</span>
        <div class="qty">
            <button type="button">-</button>
            <span>${quantidade || ""}</span>
            <button type="button">+</button>
        </div>
        <button class="remover-item" type="button" data-remove-item>Remover</button>
    `;

    lista.appendChild(linha);
}

function salvarItensAdicionados(formulario) {
    if (!formulario) {
        return;
    }

    const itens = obterItensParaSalvar(formulario);
    const conteudo = JSON.stringify(itens);

    try {
        localStorage.setItem(chaveItens(formulario), conteudo);
        localStorage.setItem(chaveBackupItens(formulario), conteudo);
    } catch (erro) {
        console.warn("Nao foi possivel salvar os itens.", erro);
    }
}

function restaurarItensAdicionados(formulario) {
    const itensSalvos = lerItensSalvos(formulario);

    itensSalvos.forEach((item) => {
        if (formulario.id === "pedidoVero") {
            adicionarLinhaNaTabela(formulario, item.produto);
            definirQuantidade(
                obterCampoQuantidade(formulario.querySelector("tbody tr:last-child .qty")),
                item.quantidade
            );
        } else if (formulario.id === "pedidoWr") {
            adicionarLinhaSimples(formulario, item.produto, item.numero);
        } else {
            adicionarLinhaNaLista(formulario, item.produto, item.quantidade);
        }
    });
}

function lerItensSalvos(formulario) {
    try {
        const salvo = localStorage.getItem(chaveItens(formulario)) || localStorage.getItem(chaveBackupItens(formulario));

        return JSON.parse(salvo || "[]");
    } catch {
        return [];
    }
}

function chaveItens(formulario) {
    return `pedidos:${location.pathname}:${formulario.id}`;
}

function chaveBackupItens(formulario) {
    return `itens-${formulario.id}`;
}

function obterItensParaSalvar(formulario) {
    if (formulario.id === "pedidoVero") {
        return Array.from(formulario.querySelectorAll('tbody tr[data-adicionado="true"]')).map((linha) => {
            return {
                produto: linha.dataset.produto,
                quantidade: obterQuantidade(linha.querySelector(".qty")),
            };
        });
    }

    return Array.from(formulario.querySelectorAll(".lista-itens li")).map((linha) => {
        return {
            produto: linha.dataset.produto,
            quantidade: linha.querySelector(".qty") ? obterQuantidade(linha.querySelector(".qty")) : 1,
            numero: linha.querySelector(".numero-item") ? linha.querySelector(".numero-item").value.trim() : "",
        };
    });
}

function buscarItensAdicionados(formulario) {
    return Array.from(formulario.querySelectorAll(".lista-itens li"))
        .map((linha) => {
            if (formulario.id === "pedidoWr") {
                const numero = linha.querySelector(".numero-item").value.trim();

                return numero ? `${linha.dataset.produto} - ${numero}` : linha.dataset.produto;
            }

            const quantidade = obterQuantidade(linha.querySelector(".qty"));

            return `${quantidade}x ${linha.dataset.produto}`;
        })
        .filter((item) => !item.startsWith("0x "));
}

function adicionarLinhaSimples(formulario, item, numero = "") {
    const lista = formulario.querySelector(".lista-itens");
    const linha = document.createElement("li");

    linha.dataset.produto = item;
    linha.innerHTML = `
        <span>${escaparHtml(item)}</span>
        <input class="numero-item" type="number" inputmode="numeric" aria-label="Numero" placeholder="Numero" value="${escaparHtml(numero)}">
        <button class="remover-item" type="button" data-remove-item>Remover</button>
    `;

    lista.appendChild(linha);
}

function enviarPedidoWhatsapp(fornecedor, itens) {
    const telefones = {
        "Aragua": "5514981012021",
        "Vero Imports": "5514996511343",
        "WR Embalagens": "551432236491",
    };
    const texto = [
        `Ola, quero fazer este pedido para ${fornecedor}:`,
        "",
        ...itens.map((item) => `- ${item}`),
    ].join("\n");

    window.open(`https://wa.me/${telefones[fornecedor]}?text=${encodeURIComponent(texto)}`, "_blank");
}

function lerFornecedoresAdicionados() {
    try {
        return JSON.parse(localStorage.getItem("fornecedores-adicionados") || "[]");
    } catch {
        return [];
    }
}

function salvarFornecedoresAdicionados(fornecedores) {
    localStorage.setItem("fornecedores-adicionados", JSON.stringify(fornecedores));
}

function renderizarFornecedoresAdicionados() {
    const lista = document.querySelector("#fornecedoresAdicionados");

    if (!lista) {
        return;
    }

    const fornecedores = lerFornecedoresAdicionados();
    lista.innerHTML = "";

    fornecedores.forEach((fornecedor) => {
        const card = document.createElement("article");
        card.className = "fornecedor-card";
        card.innerHTML = `
            <h2>${escaparHtml(fornecedor.nome)}</h2>
            <div class="fornecedor-acoes">
                ${fornecedor.whatsapp ? `<a class="botao botao--whatsapp" href="https://wa.me/${fornecedor.whatsapp}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ""}
                ${fornecedor.site ? `<a class="botao" href="${escaparHtml(fornecedor.site)}" target="_blank" rel="noopener noreferrer">Site</a>` : ""}
                <button class="remover-item" type="button" data-remove-fornecedor="${fornecedor.id}">Remover</button>
            </div>
        `;

        lista.appendChild(card);
    });
}

document.addEventListener("click", (event) => {
    const removerFornecedor = event.target.closest("[data-remove-fornecedor]");

    if (!removerFornecedor) {
        return;
    }

    const fornecedores = lerFornecedoresAdicionados().filter((fornecedor) => {
        return fornecedor.id !== removerFornecedor.dataset.removeFornecedor;
    });

    salvarFornecedoresAdicionados(fornecedores);
    renderizarFornecedoresAdicionados();
});

function limparTelefone(telefone) {
    const numeros = telefone.replace(/\D/g, "");

    if (!numeros) {
        return "";
    }

    return numeros.startsWith("55") ? numeros : `55${numeros}`;
}

function normalizarSite(site) {
    if (!site) {
        return "";
    }

    return /^https?:\/\//i.test(site) ? site : `https://${site}`;
}

function criarId() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function obterCampoQuantidade(controle) {
    return controle.querySelector(".qty__input") || controle.querySelector("span");
}

function obterQuantidade(controle) {
    const campo = obterCampoQuantidade(controle);

    return Number(campo.value || campo.textContent) || 0;
}

function definirQuantidade(campo, quantidade) {
    if (campo.matches("input")) {
        campo.value = quantidade || "";
        return;
    }

    campo.textContent = quantidade || "";
}

function escaparHtml(texto) {
    return texto.replace(/[&<>"']/g, (caractere) => {
        const mapa = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        };

        return mapa[caractere];
    });
}
