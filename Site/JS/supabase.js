const SUPABASE_URL = "https://xkjwksmdtuogynrerzjp.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_LMl06pjQnXvaRDKPOtFJ-w_xsgJ9H4D";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Supabase conectado!");

async function testarSupabase() {
    const { data, error } = await supabaseClient
        .from("servicos")
        .select("*");

    if (error) {
        console.error("Erro ao acessar o Supabase:", error);
        return;
    }

    console.log("Serviços encontrados no Supabase:", data);
}

testarSupabase();