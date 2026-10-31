const formulario = document.getElementById("form-login");

formulario.addEventListener("submit", async function (event) {

    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const telefone = document.getElementById("telefone").value.trim();

    if (nome === "") {
        alert("Informe seu nome.");
        return;
    }

    if (telefone === "") {
        alert("Informe seu telefone.");
        return;
    }


    // Procura o cliente pelo telefone
    const { data: clienteExistente, error: erroBusca } =
        await supabaseClient
            .from("clientes")
            .select("*")
            .eq("telefone", telefone)
            .limit(1);


    if (erroBusca) {

        console.error("Erro ao buscar cliente:", erroBusca);

        alert("Não foi possível acessar o cadastro.");

        return;
    }


    // Se o cliente já existe
    if (clienteExistente.length > 0) {

        localStorage.setItem(
            "clienteId",
            clienteExistente[0].id
        );

        localStorage.setItem(
            "clienteNome",
            clienteExistente[0].nome
        );

        localStorage.setItem(
            "clienteTelefone",
            clienteExistente[0].telefone
        );

        window.location.href = "index.html";

        return;
    }


    // Se o cliente ainda não existe, cadastra
    const { data: novoCliente, error: erroCadastro } =
        await supabaseClient
            .from("clientes")
            .insert([
                {
                    nome: nome,
                    telefone: telefone
                }
            ])
            .select();


    if (erroCadastro) {

        console.error("Erro ao cadastrar cliente:", erroCadastro);

        alert("Não foi possível cadastrar o cliente.");

        return;
    }


    // Guarda os dados do novo cliente
    localStorage.setItem(
        "clienteId",
        novoCliente[0].id
    );

    localStorage.setItem(
        "clienteNome",
        novoCliente[0].nome
    );

    localStorage.setItem(
        "clienteTelefone",
        novoCliente[0].telefone
    );


    // Vai para os serviços
    window.location.href = "index.html";

});