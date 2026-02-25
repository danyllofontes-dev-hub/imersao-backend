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
const { Payment } = require("mercadopago");

app.post("/webhook", async (req, res) => {

  try {

    console.log("🔔 Webhook recebido:");
    console.log(req.body);

    // verifica se é evento de pagamento
    if (req.body.type === "payment") {

      const paymentId = req.body.data.id;

      const payment = new Payment(client);

      // busca pagamento real na API
      const paymentInfo = await payment.get({
        id: paymentId
      });

      console.log("Status do pagamento:", paymentInfo.status);

      // ✅ PAGAMENTO APROVADO
      if (paymentInfo.status === "approved") {

        console.log("✅ PAGAMENTO APROVADO!");

        // 👉 AQUI vamos liberar o grupo depois
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

    if (!fs.existsSync("pagamentos.json")) {
      return res.json([]);
    }

    const pagamentos = JSON.parse(
      fs.readFileSync("pagamentos.json")
    );

    res.json(pagamentos);

  } catch (error) {
    res.status(500).send("Erro ao ler pagamentos");
  }

});
// =============================
// INICIAR SERVIDOR
// =============================
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});