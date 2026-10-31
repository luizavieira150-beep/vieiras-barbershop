// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

const confirmacaoData =
    document.getElementById("confirmacao-data");

const confirmacaoHorario =
    document.getElementById("confirmacao-horario");

const confirmacaoServicos =
    document.getElementById("confirmacao-servicos");

const confirmacaoTotal =
    document.getElementById("confirmacao-total");


// ==========================================
// RECUPERA OS DADOS
// ==========================================

const servicos =
    JSON.parse(
        localStorage.getItem("agendamentoServicos")
    );

const data =
    localStorage.getItem("agendamentoData");

const horario =
    localStorage.getItem("agendamentoHorario");

const preco =
    localStorage.getItem("agendamentoPreco");


// ==========================================
// MOSTRA A DATA
// ==========================================

if (data) {

    const partes =
        data.split("-");

    const dataFormatada =
        `${partes[2]}/${partes[1]}/${partes[0]}`;

    confirmacaoData.textContent =
        dataFormatada;
}


// ==========================================
// MOSTRA O HORÁRIO
// ==========================================

if (horario) {

    confirmacaoHorario.textContent =
        horario;

}


// ==========================================
// MOSTRA OS SERVIÇOS
// ==========================================

confirmacaoServicos.innerHTML = "";

if (servicos) {

    servicos.forEach(function (servico) {

        const item =
            document.createElement("li");

        item.textContent = servico.nome;

        confirmacaoServicos.appendChild(item);

    });

}


// ==========================================
// MOSTRA O TOTAL
// ==========================================

if (preco) {

    confirmacaoTotal.textContent =
        Number(preco).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

}