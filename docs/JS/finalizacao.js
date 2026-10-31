// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

const listaServicos = document.getElementById("resumo-servicos");
const resumoData = document.getElementById("resumo-data");
const resumoHorario = document.getElementById("resumo-horario");
const resumoDuracao = document.getElementById("resumo-duracao");
const resumoTotal = document.getElementById("resumo-total");

const botaoConfirmar =
    document.getElementById("confirmar-agendamento");


// ==========================================
// RECUPERA OS DADOS DO AGENDAMENTO
// ==========================================

const servicos =
    JSON.parse(
        localStorage.getItem("agendamentoServicos")
    );

const data =
    localStorage.getItem("agendamentoData");

const horario =
    localStorage.getItem("agendamentoHorario");

const duracao =
    localStorage.getItem("agendamentoDuracao");

const preco =
    localStorage.getItem("agendamentoPreco");


// ==========================================
// VERIFICA SE EXISTEM DADOS
// ==========================================

if (
    !servicos ||
    !data ||
    !horario ||
    !duracao ||
    !preco
) {

    alert("Não foi possível encontrar os dados do agendamento.");

    window.location.href = "agendamento.html";

}


// ==========================================
// MOSTRA OS SERVIÇOS
// ==========================================

listaServicos.innerHTML = "";

servicos.forEach(function (servico) {

    const item = document.createElement("li");

    item.textContent =
        `${servico.nome} — ${servico.duracao} min — R$ ${servico.preco.toFixed(2).replace(".", ",")}`;

    listaServicos.appendChild(item);

});


// ==========================================
// MOSTRA A DATA
// ==========================================

// Transforma 2026-09-08 em 08/09/2026
const partesData = data.split("-");

const dataFormatada =
    `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

resumoData.textContent = dataFormatada;


// ==========================================
// MOSTRA O HORÁRIO
// ==========================================

resumoHorario.textContent = horario;


// ==========================================
// MOSTRA A DURAÇÃO
// ==========================================

resumoDuracao.textContent =
    `${duracao} minutos`;


// ==========================================
// MOSTRA O TOTAL
// ==========================================

const precoFormatado =
    Number(preco).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

resumoTotal.textContent = precoFormatado;


// ==========================================
// BOTÃO CONFIRMAR
// ==========================================

botaoConfirmar.addEventListener("click", function () {

    window.location.href = "confirmacao.html";

});