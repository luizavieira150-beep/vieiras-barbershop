const formulario = document.getElementById("form-agendamento");
const servicos = document.querySelectorAll('input[name="servicos"]');
const horarios = document.getElementById("horarios");

const campoData = document.getElementById("data");
const mensagemData = document.getElementById("mensagem-data");


// ==========================================
// DATA MÍNIMA
// ==========================================

// Impede que o cliente escolha uma data passada
const hoje = new Date();

const ano = hoje.getFullYear();
const mes = String(hoje.getMonth() + 1).padStart(2, "0");
const dia = String(hoje.getDate()).padStart(2, "0");

const dataAtual = `${ano}-${mes}-${dia}`;

campoData.min = dataAtual;


// ==========================================
// RESUMO DOS SERVIÇOS
// ==========================================

// Cria o espaço para mostrar o resumo
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


// Coloca o resumo antes da escolha da data
formulario.insertBefore(
    resumo,
    formulario.querySelector("fieldset:nth-of-type(2)")
);


const duracaoTotalElemento =
    document.getElementById("duracao-total");

const precoTotalElemento =
    document.getElementById("preco-total");


// ==========================================
// ATUALIZAR RESUMO
// ==========================================

function atualizarServicos() {

    let duracaoTotal = 0;
    let precoTotal = 0;

    servicos.forEach(function (servico) {

        if (servico.checked) {

            duracaoTotal += Number(servico.dataset.duracao);

            precoTotal += Number(servico.dataset.preco);

        }

    });


    duracaoTotalElemento.textContent =
        `${duracaoTotal} minutos`;


    precoTotalElemento.textContent =
        precoTotal.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });


    // Atualiza os horários
    gerarHorarios();
}


// ==========================================
// GERAR HORÁRIOS
// ==========================================

function gerarHorarios() {

    // Limpa os horários anteriores
    horarios.innerHTML = "";

    // Limpa o horário selecionado
    delete horarios.dataset.horarioSelecionado;


    // Se não tiver data
    if (!campoData.value) {

        horarios.innerHTML = `
            <p>
                Escolha uma data para visualizar os horários.
            </p>
        `;

        return;
    }


    // Soma a duração dos serviços selecionados
    let duracaoTotal = 0;

    servicos.forEach(function (servico) {

        if (servico.checked) {

            duracaoTotal +=
                Number(servico.dataset.duracao);

        }

    });


    // Se nenhum serviço foi escolhido
    if (duracaoTotal === 0) {

        horarios.innerHTML = `
            <p>
                Escolha pelo menos um serviço para visualizar os horários.
            </p>
        `;

        return;
    }


    // ==========================================
    // DESCOBRE O DIA DA SEMANA
    // ==========================================

    const partes = campoData.value.split("-");

    const dataEscolhida = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );

    const diaDaSemana =
        dataEscolhida.getDay();


    // Domingo
    if (diaDaSemana === 0) {
        return;
    }


    // Sábado
    if (diaDaSemana === 6) {
        return;
    }


    // ==========================================
    // HORÁRIOS DE FUNCIONAMENTO
    // ==========================================

    let periodos = [];


    // Segunda-feira
    if (diaDaSemana === 1) {

        periodos = [
            {
                inicio: 14 * 60,
                fim: 19 * 60,
                permitePassarDoFim: true
            }
        ];

    } else {

        // Terça a sexta
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


    // ==========================================
    // CRIA OS HORÁRIOS
    // ==========================================

    periodos.forEach(function (periodo) {

        // Horários de 30 em 30 minutos
        for (
            let horarioAtual = periodo.inicio;
            horarioAtual <= periodo.fim;
            horarioAtual += 30
        ) {

            // Pela manhã, o serviço não pode passar das 12:00
            if (
                !periodo.permitePassarDoFim &&
                horarioAtual + duracaoTotal > periodo.fim
            ) {

                continue;

            }


            const hora =
                Math.floor(horarioAtual / 60);

            const minuto =
                horarioAtual % 60;


            const horaFormatada =
                String(hora).padStart(2, "0");

            const minutoFormatado =
                String(minuto).padStart(2, "0");


            // Cria o botão
            const botao =
                document.createElement("button");


            botao.type = "button";


            botao.textContent =
                `${horaFormatada}:${minutoFormatado}`;


            botao.dataset.horario =
                `${horaFormatada}:${minutoFormatado}`;


            // Seleciona o horário
            botao.addEventListener("click", function () {

                document
                    .querySelectorAll("#horarios button")
                    .forEach(function (outroBotao) {

                        outroBotao.classList.remove(
                            "selecionado"
                        );

                    });


                botao.classList.add("selecionado");


                horarios.dataset.horarioSelecionado =
                    botao.dataset.horario;

            });


            horarios.appendChild(botao);

        }

    });

}


// ==========================================
// ALTERAÇÃO DOS SERVIÇOS
// ==========================================

servicos.forEach(function (servico) {

    servico.addEventListener("change", function () {

        atualizarServicos();

    });

});


// ==========================================
// VERIFICAÇÃO DA DATA
// ==========================================

campoData.addEventListener("change", function () {

    // Limpa os horários anteriores
    horarios.innerHTML = "";

    delete horarios.dataset.horarioSelecionado;


    // Se não tiver data
    if (!campoData.value) {

        mensagemData.textContent = "";

        horarios.innerHTML = `
            <p>
                Escolha uma data para visualizar os horários.
            </p>
        `;

        return;
    }


    // Cria a data escolhida sem problemas de fuso horário
    const partes =
        campoData.value.split("-");


    const dataEscolhida = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );


    const diaDaSemana =
        dataEscolhida.getDay();


    mensagemData.textContent = "";


    // ==========================================
    // DOMINGO
    // ==========================================

    if (diaDaSemana === 0) {

        mensagemData.textContent =
            "A barbearia não funciona aos domingos.";

        return;
    }


    // ==========================================
    // SÁBADO
    // ==========================================

    if (diaDaSemana === 6) {

        mensagemData.textContent =
            "Aos sábados, o atendimento é por ordem de chegada.";

        return;
    }


    // ==========================================
    // SEGUNDA A SEXTA
    // ==========================================

    mensagemData.textContent =
        "Data disponível para agendamento.";


    // Gera os horários
    gerarHorarios();

});


// ==========================================
// ENVIO DO FORMULÁRIO
// ==========================================

formulario.addEventListener("submit", function (event) {

    event.preventDefault();


    const servicosSelecionados = [];


    servicos.forEach(function (servico) {

        if (servico.checked) {

            servicosSelecionados.push({

                nome:
                    servico.value,

                preco:
                    Number(servico.dataset.preco),

                duracao:
                    Number(servico.dataset.duracao)

            });

        }

    });


    // Verifica se escolheu serviço
    if (servicosSelecionados.length === 0) {

        alert("Escolha pelo menos um serviço.");

        return;
    }


    // Verifica se escolheu data
    const data =
        campoData.value;


    if (data === "") {

        alert("Escolha uma data.");

        return;
    }


    // Verifica se escolheu horário
    const horarioSelecionado =
        horarios.dataset.horarioSelecionado;


    if (!horarioSelecionado) {

        alert("Escolha um horário.");

        return;
    }


    // Guarda os dados do agendamento
    localStorage.setItem(
        "agendamentoServicos",
        JSON.stringify(servicosSelecionados)
    );

    localStorage.setItem(
        "agendamentoData",
        data
    );

    localStorage.setItem(
        "agendamentoHorario",
        horarioSelecionado
    );


    // Calcula duração e preço total
    let duracaoTotal = 0;
    let precoTotal = 0;

    servicosSelecionados.forEach(function (servico) {

        duracaoTotal += servico.duracao;
        precoTotal += servico.preco;

    });

    localStorage.setItem(
        "agendamentoDuracao",
        duracaoTotal
    );

    localStorage.setItem(
        "agendamentoPreco",
        precoTotal
    );


    // Vai para a página de finalização
    window.location.href = "finalizacao.html";

});