
const listaProximos = document.getElementById("lista-proximos");
const listaHistorico = document.getElementById("lista-historico");

const clienteId = localStorage.getItem("clienteId");
const clienteNome = localStorage.getItem("clienteNome");

// dados dos barbeiros
const barbeiros = {
    "1": {
        nome: "Marcelo",
        telefone: "5549999040378"
    },
    "2": {
        nome: "Fábio",
        telefone: "5549984128590"
    }
};

// cria elementos da página
function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    if (texto !== undefined) {
        elemento.textContent = texto;
    }

    return elemento;
}

// formata a data
function formatarData(data) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
}

// calcula quanto falta para o agendamento
function calcularTempoRestante(agendamento) {
    const dataHora = new Date(
        `${agendamento.data}T${agendamento.hora_inicio}`
    );

    return dataHora.getTime() - Date.now();
}

// verifica se ainda pode solicitar cancelamento
function podeSolicitarCancelamento(agendamento) {
    const vinteEQuatroHoras = 24 * 60 * 60 * 1000;

    return calcularTempoRestante(agendamento) >= vinteEQuatroHoras;
}

// abre o WhatsApp do barbeiro responsável
function solicitarCancelamento(agendamento, nomesServicos) {

    const barbeiro = barbeiros[String(agendamento.barbeiro_id)];

    if (!barbeiro) {
        alert("Não foi possível identificar o barbeiro.");
        return;
    }

    const mensagem =
        `Olá, ${barbeiro.nome}! Gostaria de solicitar o cancelamento do meu agendamento.\n\n` +
        `Cliente: ${clienteNome || "Cliente"}\n` +
        `Serviços: ${nomesServicos.join(" + ")}\n` +
        `Data: ${formatarData(agendamento.data)}\n` +
        `Horário: ${agendamento.hora_inicio.substring(0, 5)}\n\n` +
        `Aguardo a confirmação. Obrigado(a)!`;

    const link = `https://wa.me/${barbeiro.telefone}?text=${encodeURIComponent(mensagem)}`;

    window.open(link, "_blank");
}

// cria os cartões dos agendamentos
function criarCard(agendamento, relacoes, servicos) {

    const card = criarElemento("article", "card-agendamento");

    const servicosDoAgendamento = relacoes
        .filter(relacao =>
            String(relacao.agendamento_id) === String(agendamento.id)
        )
        .map(relacao => {
            return servicos.find(servico =>
                String(servico.id) === String(relacao.servico_id)
            );
        })
        .filter(Boolean);

    const nomesServicos = servicosDoAgendamento.map(
        servico => servico.nome
    );

    const titulo = criarElemento(
        "h3",
        "",
        nomesServicos.length > 0
            ? nomesServicos.join(" + ")
            : "Serviços não encontrados"
    );

    card.appendChild(titulo);

    const barbeiro = barbeiros[String(agendamento.barbeiro_id)];

    card.appendChild(
        criarElemento(
            "p",
            "",
            `Barbeiro: ${barbeiro ? barbeiro.nome : "Não identificado"}`
        )
    );

    card.appendChild(
        criarElemento("p", "", `Data: ${formatarData(agendamento.data)}`)
    );

    card.appendChild(
        criarElemento(
            "p",
            "",
            `Horário: ${agendamento.hora_inicio.substring(0, 5)}`
        )
    );

    const duracao =
        agendamento.duracao_minutos ??
        agendamento.duracao;

    card.appendChild(
        criarElemento(
            "p",
            "",
            `Duração: ${duracao ?? "Não informada"} minutos`
        )
    );

    card.appendChild(
        criarElemento(
            "p",
            "valor-agendamento",
            `Total: R$ ${Number(agendamento.preco_total)
                .toFixed(2)
                .replace(".", ",")}`
        )
    );

    const status = String(agendamento.status).toLowerCase();

    let nomeStatus = "Agendado";
    let classeStatus = "status-agendamento";

    if (status === "cancelado") {
        nomeStatus = "Cancelado";
        classeStatus += " status-cancelado";
    } else if (
        status === "concluido" ||
        status === "concluído"
    ) {
        nomeStatus = "Concluído";
        classeStatus += " status-concluido";
    }

    card.appendChild(
        criarElemento("span", classeStatus, nomeStatus)
    );

    // mostra o botão de WhatsApp somente com 24 horas ou mais
    if (
        status === "agendado" &&
        podeSolicitarCancelamento(agendamento)
    ) {
        const botaoCancelar = criarElemento(
            "button",
            "botao-cancelar",
            "Solicitar cancelamento pelo WhatsApp"
        );

        botaoCancelar.type = "button";

        botaoCancelar.addEventListener("click", () => {
            solicitarCancelamento(agendamento, nomesServicos);
        });

        card.appendChild(botaoCancelar);
    }

    return card;
}

// carrega os agendamentos do cliente
async function carregarAgendamentos() {

    if (!clienteId) {
        listaProximos.replaceChildren(
            criarElemento(
                "p",
                "mensagem-vazia",
                "Você precisa se identificar para consultar seus agendamentos."
            )
        );

        listaHistorico.replaceChildren();
        return;
    }

    const { data: agendamentos, error } = await supabaseClient
        .from("agendamentos")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("data", { ascending: true })
        .order("hora_inicio", { ascending: true });

    if (error) {
        console.error("Erro ao buscar agendamentos:", error);

        listaProximos.replaceChildren(
            criarElemento(
                "p",
                "mensagem-vazia",
                "Não foi possível carregar seus agendamentos."
            )
        );

        listaHistorico.replaceChildren();
        return;
    }

    if (!agendamentos || agendamentos.length === 0) {
        listaProximos.replaceChildren(
            criarElemento(
                "p",
                "mensagem-vazia",
                "Você ainda não possui agendamentos."
            )
        );

        listaHistorico.replaceChildren(
            criarElemento(
                "p",
                "mensagem-vazia",
                "Seu histórico aparecerá aqui."
            )
        );

        return;
    }

    const idsAgendamentos = agendamentos.map(item => item.id);

    const { data: relacoes, error: erroRelacoes } =
        await supabaseClient
            .from("agendamentos_servicos")
            .select("*")
            .in("agendamento_id", idsAgendamentos);

    if (erroRelacoes) {
        console.error("Erro ao buscar serviços:", erroRelacoes);

        listaProximos.replaceChildren(
            criarElemento(
                "p",
                "mensagem-vazia",
                "Não foi possível carregar os serviços."
            )
        );

        listaHistorico.replaceChildren();
        return;
    }

    const idsServicos = [
        ...new Set(
            (relacoes || []).map(item => Number(item.servico_id))
        )
    ];

    let servicos = [];

    if (idsServicos.length > 0) {

        const { data, error: erroServicos } = await supabaseClient
            .from("servicos")
            .select("id, nome")
            .in("id", idsServicos);

        if (erroServicos) {
            console.error("Erro ao buscar serviços:", erroServicos);
        } else {
            servicos = data || [];
        }
    }

    listaProximos.replaceChildren();
    listaHistorico.replaceChildren();

    const agora = new Date();

    const hoje = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
    );

    let quantidadeProximos = 0;
    let quantidadeHistorico = 0;

    agendamentos.forEach(agendamento => {

        const status = String(agendamento.status).toLowerCase();

        const dataAgendamento = new Date(
            `${agendamento.data}T00:00:00`
        );

        const ehProximo =
            status === "agendado" &&
            dataAgendamento >= hoje;

        const card = criarCard(
            agendamento,
            relacoes || [],
            servicos
        );

        if (ehProximo) {
            listaProximos.appendChild(card);
            quantidadeProximos++;
        } else {
            listaHistorico.appendChild(card);
            quantidadeHistorico++;
        }
    });

    if (quantidadeProximos === 0) {
        listaProximos.appendChild(
            criarElemento(
                "p",
                "mensagem-vazia",
                "Você não possui próximos agendamentos."
            )
        );
    }

    if (quantidadeHistorico === 0) {
        listaHistorico.appendChild(
            criarElemento(
                "p",
                "mensagem-vazia",
                "Você ainda não possui histórico."
            )
        );
    }
}

carregarAgendamentos();
