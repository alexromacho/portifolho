document.addEventListener("click", (event) => {
    const botaoQuantidade = event.target.closest(".qty button:not([data-remove-row])");
    const botaoAdicionar = event.target.closest("[data-add-item]");
    const botaoRemover = event.target.closest("[data-remove-item]");
    const botaoRemoverLinha = event.target.closest("[data-remove-row]");

    if (botaoQuantidade) {
        alterarQuantidade(botaoQuantidade);
    }

    if (botaoAdicionar) {
        adicionarItemNaLista(botaoAdicionar.closest("form"));
    }

    if (botaoRemover) {
        botaoRemover.closest("li").remove();
    }

    if (botaoRemoverLinha) {
        botaoRemoverLinha.closest("tr").remove();
    }
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js");
    });
}

document.querySelectorAll("#pedidoVero tbody tr").forEach((linha) => {
    adicionarBotaoRemoverLinha(linha);
});

const pedidoAgua = document.querySelector("#pedidoAgua");

if (pedidoAgua) {
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
    pedidoVero.addEventListener("submit", (event) => {
        event.preventDefault();

        const itens = Array.from(pedidoVero.querySelectorAll("tbody tr"))
            .map((linha) => {
                const produto = linha.dataset.produto;
                const quantidade = Number(linha.querySelector(".qty span").textContent);

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
    const valor = controle.querySelector("span");
    const atual = Number(valor.textContent);

    if (botao === botoes[0]) {
        valor.textContent = Math.max(0, atual - 1);
        return;
    }

    valor.textContent = atual + 1;
}

function adicionarItemNaLista(formulario) {
    const itemInput = formulario.querySelector('[name="itemExtra"]');
    const quantidadeInput = formulario.querySelector('[name="quantidadeExtra"]');
    const mensagem = formulario.querySelector(".pedido__mensagem");
    const item = itemInput.value.trim();
    const quantidade = Number(quantidadeInput.value);

    if (!item || quantidade <= 0) {
        if (mensagem) {
            mensagem.textContent = "Digite o item e a quantidade para adicionar na lista.";
        }

        return;
    }

    if (formulario.id === "pedidoVero") {
        adicionarLinhaNaTabela(formulario, item, quantidade);
    } else {
        adicionarLinhaNaLista(formulario, item, quantidade);
    }

    if (mensagem) {
        mensagem.textContent = "";
    }

    itemInput.value = "";
    quantidadeInput.value = "0";
    itemInput.focus();
}

function adicionarLinhaNaTabela(formulario, item, quantidade) {
    const corpoTabela = formulario.querySelector("tbody");
    const linha = document.createElement("tr");

    linha.dataset.produto = item;
    linha.innerHTML = `
        <td>${escaparHtml(item)}</td>
        <td>
            <div class="qty">
                <button type="button">-</button>
                <span>${quantidade}</span>
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

function adicionarLinhaNaLista(formulario, item, quantidade) {
    const lista = formulario.querySelector(".lista-itens");
    const linha = document.createElement("li");

    linha.dataset.produto = item;
    linha.dataset.quantidade = String(quantidade);
    linha.innerHTML = `
        <span>${quantidade}x ${escaparHtml(item)}</span>
        <button class="remover-item" type="button" data-remove-item>Remover</button>
    `;

    lista.appendChild(linha);
}

function buscarItensAdicionados(formulario) {
    return Array.from(formulario.querySelectorAll(".lista-itens li")).map((linha) => {
        return `${linha.dataset.quantidade}x ${linha.dataset.produto}`;
    });
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
