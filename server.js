const express = require("express");
const path = require("path");
const fs = require("fs");

const {
  MercadoPagoConfig,
  Preference,
  Payment
} = require("mercadopago");

const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =============================
// MERCADO PAGO CONFIG
// =============================
const client = new MercadoPagoConfig({
  accessToken:
    "APP_USR-3678280078464153-022416-b7b770deef907132313977cae0a3d6f8-1889126294"
});

// =============================
// SUPABASE CONFIG
// =============================
const supabase = createClient(
  "https://orrrvsamxgadkmrteoke.supabase.co",
  "sb_publishable_t_jxcR0uQS2WsXEMnMnIkQ_XsnMhQIK"
);

// =============================
// CRIAR PAGAMENTO
// =============================
app.post("/criar-pagamento", async (req, res) => {

  try {

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            title: "Imersão Do Zero ao Videomaker",
            quantity: 1,
            currency_id: "BRL",
            unit_price: 1
          }
        ],

        payment_methods: {
          installments: 12,
          default_installments: 1
        },

        notification_url:
          "https://imersao-backend.onrender.com/webhook",

        back_urls: {
          success:
            "https://superinfinite-nonenduring-myah.ngrok-free.app/sucesso.html",
          failure:
            "https://superinfinite-nonenduring-myah.ngrok-free.app",
          pending:
            "https://superinfinite-nonenduring-myah.ngrok-free.app"
        },

        auto_return: "approved"
      }
    });

    res.json({ url: response.init_point });

  } catch (error) {

    console.error("ERRO MERCADO PAGO:");
    console.error(error);

    res.status(500).send("Erro ao criar pagamento");
  }
});

// =============================
// WEBHOOK (CONFIRMA PAGAMENTO)
// =============================
app.post("/webhook", async (req, res) => {

  try {

    console.log("🔔 Webhook recebido:");
    console.log(req.body);

    if (req.body.type === "payment") {

      const paymentId = req.body.data.id;

      const payment = new Payment(client);

      const paymentInfo = await payment.get({
        id: paymentId
      });

      console.log("Status do pagamento:", paymentInfo.status);

      // =============================
      // PAGAMENTO APROVADO
      // =============================
      if (paymentInfo.status === "approved") {

        console.log("✅ PAGAMENTO APROVADO!");

        const email = paymentInfo.payer.email;
        const valor = paymentInfo.transaction_amount;

        // =============================
        // SALVAR NO SUPABASE
        // =============================
        const { data, error } = await supabase
          .from("pagamentos")
          .insert([
            {
              payment_id: paymentId,
              status: "approved",
              email: email,
              valor: valor
            }
          ]);

        if (error) {
          console.log("❌ Erro Supabase:", error);
        } else {
          console.log("✅ Salvo no Supabase!");
        }

        // =============================
        // BACKUP LOCAL (JSON)
        // =============================
        const filePath = "pagamentos.json";

        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, "[]");
        }

        let pagamentos = JSON.parse(
          fs.readFileSync(filePath)
        );

        const jaExiste = pagamentos.find(
          p => p.id === paymentId
        );

        if (!jaExiste) {

          pagamentos.push({
            id: paymentId,
            email,
            valor,
            date: new Date()
          });

          fs.writeFileSync(
            filePath,
            JSON.stringify(pagamentos, null, 2)
          );

          console.log("💾 Backup local salvo!");
        }
      }
    }

    res.sendStatus(200);

  } catch (error) {
    console.log("Erro webhook:", error);
    res.sendStatus(500);
  }
});

// =============================
// VER PAGAMENTOS (TESTE)
// =============================
app.get("/pagamentos", (req, res) => {

  try {

    const filePath = "pagamentos.json";

    if (!fs.existsSync(filePath)) {
      return res.json([]);
    }

    const pagamentos = JSON.parse(
      fs.readFileSync(filePath)
    );

    res.json(pagamentos);

  } catch (error) {
    console.log(error);
    res.status(500).send("Erro ao ler pagamentos");
  }
});

// =============================
// INICIAR SERVIDOR
// =============================
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});