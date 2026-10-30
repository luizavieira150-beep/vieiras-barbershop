const listaProximos = document.getElementById("lista-proximos");
const listaHistorico = document.getElementById("lista-historico");

const clienteId = localStorage.getItem("clienteId");

// IDs dos barbeiros
const barbeiros = {
    "1": "Marcelo",
    "2": "Fábio"
};

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

function formatarData(data) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
}

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

    const barbeiro = barbeiros[String(agendamento.barbeiro_id)]
        || "Não identificado";

    card.appendChild(
        criarElemento("p", "", `Barbeiro: ${barbeiro}`)
    );

    card.appendChild(
        criarElemento(
            "p",
            "",
            `Data: ${formatarData(agendamento.data)}`
        )
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

    return card;
}

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
        console.error("Erro ao buscar serviços dos agendamentos:", erroRelacoes);

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

    console.log("Agendamentos encontrados:", agendamentos);
    console.log("Relações encontradas:", relacoes);
    console.log("Erro nas relações:", erroRelacoes)
    console.log("IDs dos serviços:", idsServicos);

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

    console.log("Serviços encontrados:", servicos);

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
