const express = require("express");
const path = require("path");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ✅ Mercado Pago config
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-3678280078464153-022416-b7b770deef907132313977cae0a3d6f8-1889126294"
});

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
            unit_price: 1 // valor teste
          }
        ],

        payment_methods: {
          installments: 12,
          default_installments: 1
        },

        // ✅ WEBHOOK PRODUÇÃO (RENDER)
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
    console.error(error.cause);

    res.status(500).send("Erro ao criar pagamento");
  }
});

// =============================
// WEBHOOK (CONFIRMA PAGAMENTO)
// =============================
app.post("/webhook", async (req, res) => {

  try {

    console.log("🔔 Webhook recebido:");
    console.log(JSON.stringify(req.body, null, 2));

    // Mercado Pago envia vários eventos
    if (req.body.type === "payment") {
      console.log("💰 Evento de pagamento recebido!");
    }

    res.sendStatus(200);

  } catch (error) {
    console.log("Erro no webhook:", error);
    res.sendStatus(500);
  }
});

// =============================
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});