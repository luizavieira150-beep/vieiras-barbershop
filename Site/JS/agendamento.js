
const formulario = document.getElementById("form-agendamento");
const horarios = document.getElementById("horarios");

// identifica o barbeiro pelo link
const parametros = new URLSearchParams(window.location.search);
const barbeiroId = parametros.get("barbeiro") === "2" ? 2 : 1;

const campoData = document.getElementById("data");
const mensagemData = document.getElementById("mensagem-data");

let servicos = [];
let agendamentos = [];

// identifica serviço vindo da url

function normalizarNome(nome) {
    return nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

// carrega serviços do supabase

async function carregarServicos() {
    const { data, error } = await supabaseClient
        .from("servicos")
        .select("id, nome, preco, duracao");

    if (error) {
        console.error("Erro ao carregar serviços:", error);
        return;
    }

    servicos = data;

    const campoServicos = formulario.querySelector("fieldset:first-of-type");
    const legenda = campoServicos.querySelector("legend");

    campoServicos.innerHTML = "";
    campoServicos.appendChild(legenda);

    servicos.forEach(function (servico) {
        const label = document.createElement("label");
        const input = document.createElement("input");

        input.type = "checkbox";
        input.name = "servicos";
        input.value = servico.id;
        input.dataset.preco = servico.preco;
        input.dataset.duracao = servico.duracao;
        input.dataset.id = servico.id;

        label.appendChild(input);

        label.appendChild(
            document.createTextNode(
                ` ${servico.nome} — R$ ${Number(servico.preco)
                    .toFixed(2)
                    .replace(".", ",")} — ${servico.duracao} min`
            )
        );

        campoServicos.appendChild(label);

        input.addEventListener("change", atualizarServicos);
    });

    // marca serviço vindo da página inicial

    const servicoDaURL = parametros.get("servico");

    if (servicoDaURL) {
        const servicoNormalizado = normalizarNome(servicoDaURL);

        const servicoEncontrado = servicos.find(function (servico) {
            return normalizarNome(servico.nome) === servicoNormalizado;
        });

        if (servicoEncontrado) {
            const checkbox = campoServicos.querySelector(
                `input[data-id="${servicoEncontrado.id}"]`
            );

            if (checkbox) {
                checkbox.checked = true;
                atualizarServicos();
            }
        } else {
            console.warn("Serviço da URL não encontrado:", servicoDaURL);
        }
    }
}

// busca agendamentos do barbeiro selecionado

async function buscarAgendamentos(data) {
    const { data: dados, error } = await supabaseClient
        .from("agendamentos")
        .select("hora_inicio, duracao")
        .eq("data", data)
        .eq("barbeiro_id", barbeiroId)
        .eq("status", "agendado");

    if (error) {
        console.error("Erro ao buscar agendamentos:", error);
        return [];
    }

    return dados;
}

// define data mínima

const hoje = new Date();
const ano = hoje.getFullYear();
const mes = String(hoje.getMonth() + 1).padStart(2, "0");
const dia = String(hoje.getDate()).padStart(2, "0");

const dataAtual = `${ano}-${mes}-${dia}`;

campoData.min = dataAtual;

// cria resumo

const resumo = document.createElement("section");

resumo.setAttribute("aria-labelledby", "titulo-resumo");

resumo.innerHTML = `
    <h2 id="titulo-resumo">Resumo</h2>

    <p>
        <strong>Duração:</strong>
        <span id="duracao-total">0 minutos</span>
    </p>

    <p>
        <strong>Total:</strong>
        <span id="preco-total">R$ 0,00</span>
    </p>
`;

formulario.insertBefore(
    resumo,
    formulario.querySelector("fieldset:nth-of-type(2)")
);

const duracaoTotalElemento = document.getElementById("duracao-total");
const precoTotalElemento = document.getElementById("preco-total");

// atualiza resumo

function atualizarServicos() {
    let duracaoTotal = 0;
    let precoTotal = 0;

    const selecionados = document.querySelectorAll(
        'input[name="servicos"]:checked'
    );

    selecionados.forEach(function (servico) {
        duracaoTotal += Number(servico.dataset.duracao);
        precoTotal += Number(servico.dataset.preco);
    });

    duracaoTotalElemento.textContent = `${duracaoTotal} minutos`;

    precoTotalElemento.textContent = precoTotal.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

    gerarHorarios();
}

// verifica se horário está ocupado

function horarioEstaOcupado(horarioInicio, duracaoServico) {
    const [hora, minuto] = horarioInicio.split(":").map(Number);

    const inicioNovo = hora * 60 + minuto;
    const fimNovo = inicioNovo + duracaoServico;

    return agendamentos.some(function (agendamento) {
        const [horaAgendada, minutoAgendado] =
            agendamento.hora_inicio.split(":").map(Number);

        const inicioAgendado = horaAgendada * 60 + minutoAgendado;
        const fimAgendado =
            inicioAgendado + Number(agendamento.duracao);

        return (
            inicioNovo < fimAgendado &&
            fimNovo > inicioAgendado
        );
    });
}

// gera horários disponíveis

async function gerarHorarios() {
    horarios.innerHTML = "";
    delete horarios.dataset.horarioSelecionado;

    if (!campoData.value) {
        horarios.innerHTML = `
            <p>Escolha uma data para visualizar os horários.</p>
        `;
        return;
    }

    let duracaoTotal = 0;

    const selecionados = document.querySelectorAll(
        'input[name="servicos"]:checked'
    );

    selecionados.forEach(function (servico) {
        duracaoTotal += Number(servico.dataset.duracao);
    });

    if (duracaoTotal === 0) {
        horarios.innerHTML = `
            <p>Escolha pelo menos um serviço para visualizar os horários.</p>
        `;
        return;
    }

    agendamentos = await buscarAgendamentos(campoData.value);

    const partes = campoData.value.split("-");

    const dataEscolhida = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );

    const diaDaSemana = dataEscolhida.getDay();

    // domingo
    if (diaDaSemana === 0) {
        return;
    }

    // sábado
    if (diaDaSemana === 6) {
        return;
    }

    // horários de funcionamento

    let periodos = [];

    // segunda
    if (diaDaSemana === 1) {
        periodos = [
            {
                inicio: 14 * 60,
                fim: 19 * 60,
                permitePassarDoFim: true
            }
        ];
    } else {
        // terça a sexta
        periodos = [
            {
                inicio: 9 * 60,
                fim: 12 * 60,
                permitePassarDoFim: false
            },
            {
                inicio: 14 * 60,
                fim: 19 * 60,
                permitePassarDoFim: true
            }
        ];
    }

    // cria horários

    periodos.forEach(function (periodo) {
        for (
            let horarioAtual = periodo.inicio;
            horarioAtual <= periodo.fim;
            horarioAtual += 30
        ) {
            if (
                !periodo.permitePassarDoFim &&
                horarioAtual + duracaoTotal > periodo.fim
            ) {
                continue;
            }

            const hora = Math.floor(horarioAtual / 60);
            const minuto = horarioAtual % 60;

            const horaFormatada = String(hora).padStart(2, "0");
            const minutoFormatado = String(minuto).padStart(2, "0");

            const horario = `${horaFormatada}:${minutoFormatado}`;

            const ocupado = horarioEstaOcupado(horario, duracaoTotal);

            const botao = document.createElement("button");

            botao.type = "button";
            botao.textContent = horario;
            botao.dataset.horario = horario;

            // horário ocupado

            if (ocupado) {
                botao.disabled = true;
                botao.textContent = `${horario} - ocupado`;
            } else {
                botao.addEventListener("click", function () {
                    document
                        .querySelectorAll("#horarios button")
                        .forEach(function (outroBotao) {
                            outroBotao.classList.remove("selecionado");
                        });

                    botao.classList.add("selecionado");

                    horarios.dataset.horarioSelecionado =
                        botao.dataset.horario;
                });
            }

            horarios.appendChild(botao);
        }
    });
}

// alteração da data

campoData.addEventListener("change", function () {
    horarios.innerHTML = "";
    delete horarios.dataset.horarioSelecionado;

    if (!campoData.value) {
        mensagemData.textContent = "";

        horarios.innerHTML = `
            <p>Escolha uma data para visualizar os horários.</p>
        `;

        return;
    }

    const partes = campoData.value.split("-");

    const dataEscolhida = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );

    const diaDaSemana = dataEscolhida.getDay();

    mensagemData.textContent = "";

    // domingo
    if (diaDaSemana === 0) {
        mensagemData.textContent =
            "A barbearia não funciona aos domingos.";
        return;
    }

    // sábado
    if (diaDaSemana === 6) {
        mensagemData.textContent =
            "Aos sábados, o atendimento é por ordem de chegada.";
        return;
    }

    mensagemData.textContent =
        "Data disponível para agendamento.";

    gerarHorarios();
});

// envio do formulário

formulario.addEventListener("submit", async function (event) {
    event.preventDefault();

    // serviços selecionados

    const servicosSelecionados = [];

    const selecionados = document.querySelectorAll(
        'input[name="servicos"]:checked'
    );

    selecionados.forEach(function (servico) {
        const servicoEncontrado = servicos.find(function (item) {
            return Number(item.id) === Number(servico.dataset.id);
        });

        if (servicoEncontrado) {
            servicosSelecionados.push({
                id: Number(servicoEncontrado.id),
                nome: servicoEncontrado.nome,
                preco: Number(servicoEncontrado.preco),
                duracao: Number(servicoEncontrado.duracao)
            });
        }
    });

    // verificações

    if (servicosSelecionados.length === 0) {
        alert("Escolha pelo menos um serviço.");
        return;
    }

    const data = campoData.value;

    if (data === "") {
        alert("Escolha uma data.");
        return;
    }

    const horarioSelecionado =
        horarios.dataset.horarioSelecionado;

    if (!horarioSelecionado) {
        alert("Escolha um horário.");
        return;
    }

    // dados do cliente

    const clienteId = localStorage.getItem("clienteId");

    if (!clienteId) {
        alert("Cliente não identificado. Volte para a página inicial.");
        return;
    }

    // duração e preço total

    let duracaoTotal = 0;
    let precoTotal = 0;

    servicosSelecionados.forEach(function (servico) {
        duracaoTotal += servico.duracao;
        precoTotal += servico.preco;
    });

    // salva agendamento com o barbeiro identificado pela url

    const { data: novoAgendamento, error } = await supabaseClient
        .from("agendamentos")
        .insert([
            {
                cliente_id: Number(clienteId),
                barbeiro_id: barbeiroId,
                data: data,
                hora_inicio: horarioSelecionado,
                duracao: duracaoTotal,
                preco_total: precoTotal,
                status: "agendado"
            }
        ])
        .select()
        .single();

    if (error) {
        console.error("Erro ao salvar agendamento:", error);
        alert("Não foi possível realizar o agendamento.");
        return;
    }

    // salva serviços do agendamento

    const servicosParaSalvar = servicosSelecionados.map(function (servico) {
        return {
            agendamento_id: novoAgendamento.id,
            servico_id: servico.id,
            preco: servico.preco,
            duracao: servico.duracao
        };
    });

    const { error: erroServicos } = await supabaseClient
        .from("agendamentos_servicos")
        .insert(servicosParaSalvar);

    if (erroServicos) {
        console.error("Erro ao salvar serviços:", erroServicos);

        alert(
            "O agendamento foi criado, mas houve um erro ao salvar os serviços."
        );

        return;
    }

    // finalização

    localStorage.setItem(
        "agendamentoServicos",
        JSON.stringify(servicosSelecionados)
    );

    localStorage.setItem("agendamentoData", data);
    localStorage.setItem("agendamentoHorario", horarioSelecionado);
    localStorage.setItem("agendamentoDuracao", duracaoTotal);
    localStorage.setItem("agendamentoPreco", precoTotal);
    localStorage.setItem("agendamentoId", novoAgendamento.id);

    window.location.href = "finalizacao.html";
});

// inicia carregamento dos serviços

carregarServicos();
