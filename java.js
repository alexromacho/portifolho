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
    if (event.target.matches(".qty__input")) {
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

function alterarQuantidade(botao) {
    const controle = botao.closest(".qty");
    const botoes = Array.from(controle.querySelectorAll("button"));
    const valor = obterCampoQuantidade(controle);
    const atual = obterQuantidade(controle);

    if (botao === botoes[0]) {
        definirQuantidade(valor, Math.max(0, atual - 1));
        return;
    }

    definirQuantidade(valor, atual + 1);
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

    try {
        localStorage.setItem(`itens-${formulario.id}`, JSON.stringify(itens));
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
        } else {
            adicionarLinhaNaLista(formulario, item.produto, item.quantidade);
        }
    });
}

function lerItensSalvos(formulario) {
    try {
        return JSON.parse(localStorage.getItem(`itens-${formulario.id}`) || "[]");
    } catch {
        return [];
    }
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
            quantidade: obterQuantidade(linha.querySelector(".qty")),
        };
    });
}

function buscarItensAdicionados(formulario) {
    return Array.from(formulario.querySelectorAll(".lista-itens li"))
        .map((linha) => {
            const quantidade = obterQuantidade(linha.querySelector(".qty"));

            return `${quantidade}x ${linha.dataset.produto}`;
        })
        .filter((item) => !item.startsWith("0x "));
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
