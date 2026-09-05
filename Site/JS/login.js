const formulario = document.getElementById("form-login");

formulario.addEventListener("submit", function (event) {

    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const telefone = document.getElementById("telefone").value.trim();

    if (telefone === "") {
        alert("Informe seu telefone.");
        return;
    }

    // Guarda os dados temporariamente para o sistema utilizar
    localStorage.setItem("clienteNome", nome);
    localStorage.setItem("clienteTelefone", telefone);

    // Vai para a página de serviços
    window.location.href = "index.html";
});