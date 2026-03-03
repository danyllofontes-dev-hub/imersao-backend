const express = require("express");
const path = require("path");

const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =============================
// MERCADO PAGO
// =============================
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-3678280078464153-022416-b7b770deef907132313977cae0a3d6f8-1889126294"
});

// =============================
// SUPABASE
// =============================
const supabase = createClient(
  "https://orrrvsamxgadkmrteoke.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycnJ2c2FteGdhZGttcnRlb2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAzMTg5MiwiZXhwIjoyMDg3NjA3ODkyfQ.vQ0hevgJPGhNEggQYQNXexF8IsJcDCevPK4XxRutnkk"
);

// =============================
// CRIAR PAGAMENTO (FORM + LEAD)
// =============================
app.post("/criar-pagamento", async (req, res) => {
  try {

    const { nome, email, telefone } = req.body;

    // salva lead imediatamente
    const { data: cliente, error } = await supabase
      .from("clientes")
      .insert({
        nome,
        email,
        telefone,
        grupo_enviado:false
      })
      .select()
      .single();

    if (error) throw error;

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [{
          title: "Imersão Do Zero ao Videomaker",
          quantity: 1,
          currency_id: "BRL",
          unit_price: 149.9
        }],

        payer:{ email },

        external_reference: cliente.id.toString(),

        notification_url:"https://twoframes.site/webhook",

        back_urls:{
          success:"https://twoframes.site/sucesso.html?source=mp",
          failure:"https://twoframes.site",
          pending:"https://twoframes.site/pix.html"
        },

        auto_return:"approved",
        binary_mode:true
      }
    });

    res.json({ url: response.init_point });

  } catch (err) {
    console.log(err);
    res.status(500).send("Erro ao criar pagamento");
  }
});

// =============================
// WEBHOOK (VINCULA PAGAMENTO)
// =============================
app.post("/webhook", async (req, res) => {

  try {

    if (req.body.type !== "payment")
      return res.sendStatus(200);

    const payment = new Payment(client);

    const paymentInfo = await payment.get({
      id: req.body.data.id
    });

    if (paymentInfo.status === "approved") {

      await supabase
        .from("pagamentos")
        .upsert({
          payment_id: paymentInfo.id,
          status:"approved",
          email: paymentInfo.payer.email,
          valor: paymentInfo.transaction_amount,
          cliente_id: paymentInfo.external_reference
        });

      console.log("✅ Pagamento aprovado e vinculado");
    }

    res.sendStatus(200);

  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

// =============================
// LISTAR CLIENTES ADMIN (FIX DEFINITIVO)
// =============================
app.get("/admin-clientes", async (req, res) => {

  try {

    // 1️⃣ pega clientes
    const { data: clientes, error: erroClientes } =
      await supabase
        .from("clientes")
        .select("*")
        .order("id", { ascending:false });

    if (erroClientes) throw erroClientes;

    // 2️⃣ pega pagamentos aprovados
    const { data: pagamentos, error: erroPagamentos } =
      await supabase
        .from("pagamentos")
        .select("*");

    if (erroPagamentos) throw erroPagamentos;

    // 3️⃣ junta manualmente
    const resultado = clientes.map(cliente => {

      const pagamentosCliente = pagamentos.filter(
        p => String(p.cliente_id) === String(cliente.id)
      );

      return {
        ...cliente,
        pagamentos: pagamentosCliente
      };
    });

    res.json(resultado);

  } catch (err) {
    console.log("ERRO ADMIN:", err);
    res.status(500).send("erro admin");
  }

});

// =============================
// MARCAR ENVIO DO GRUPO
// =============================
app.post("/marcar-enviado/:id", async (req,res)=>{

  await supabase
    .from("clientes")
    .update({ grupo_enviado:true })
    .eq("id", req.params.id);

  res.sendStatus(200);
});

// =============================
// GERAR LINK WHATSAPP AUTOMÁTICO
// =============================
app.get("/gerar-whatsapp/:id", async (req,res)=>{

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if(!cliente)
    return res.status(404).send("Cliente não encontrado");

  const numero = "55" + cliente.telefone;

  const mensagem = encodeURIComponent(
`Olá ${cliente.nome}! 🎬

Seu pagamento da *Imersão Do Zero ao Videomaker* foi confirmado ✅

Aqui está o link do grupo exclusivo:

👉 https://chat.whatsapp.com/SEU_LINK_DO_GRUPO

Nos vemos lá 🚀`
  );

  const url = `https://wa.me/${numero}?text=${mensagem}`;

  res.json({ url });
});

// =============================
app.listen(3000, ()=>console.log("Servidor rodando"));