const express = require("express");
const path = require("path");
const fs = require("fs");

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
// CRIAR PAGAMENTO
// =============================
app.post("/criar-pagamento", async (req, res) => {
  try {

    const preference = new Preference(client);

    const externalRef = Date.now().toString();

    const response = await preference.create({
      body: {
        items: [{
          title: "Imersão Do Zero ao Videomaker",
          quantity: 1,
          currency_id: "BRL",
          unit_price: 1
        }],

        external_reference: externalRef,

notification_url: "https://twoframes.site/webhook",

back_urls: {
  success: "https://twoframes.site/sucesso.html?source=mp",
  failure: "https://twoframes.site",
  pending: "https://twoframes.site"
},
        auto_return: "approved",
        binary_mode: true
      }
    });

    res.json({ url: response.init_point });

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao criar pagamento");
  }
});

// =============================
// WEBHOOK
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
          status: "approved",
          email: paymentInfo.payer.email,
          valor: paymentInfo.transaction_amount
        });

      console.log("✅ Pagamento salvo");
    }

    res.sendStatus(200);

  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

// =============================
// VERIFICAR ACESSO
// =============================
app.get("/verificar-pagamento/:paymentId", async (req, res) => {

  try {

    const { data } = await supabase
      .from("pagamentos")
      .select("*")
      .eq("payment_id", req.params.paymentId)
      .eq("status", "approved")
      .single();

    if (!data)
      return res.json({ approved: false });

    res.json({ approved: true });

  } catch {
    res.json({ approved: false });
  }
});

app.get("/ultimo-acesso", async (req, res) => {

  try {

    const { data } = await supabase
      .from("pagamentos")
      .select("*")
      .eq("status", "approved")
      .order("criado_em", { ascending: false })
      .limit(1)
      .single();

    if (!data) return res.json({ acesso:false });

    res.json({ acesso:true });

  } catch {
    res.json({ acesso:false });
  }

});

app.listen(3000, () =>
  console.log("Servidor rodando")
);