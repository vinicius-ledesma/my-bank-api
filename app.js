const express = require("express");
const app = express();
const mongoose = require("mongoose");
const uri = require("./environment").dbUri;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
const Schema = mongoose.Schema;

app.use(express.json());

const accountsSchema = new Schema(
  {
    agencia: { type: Number, required: true },
    conta: { type: Number, required: true },
    nome: { type: String, required: true },
    balance: {
      type: Number,
      required: true,
      validate: {
        validator: function (value) {
          return value > 0;
        },
        message: "balance need to be > 0",
      },
    },
  },
  { collection: "accounts" }
);

const contas = mongoose.model("Accounts", accountsSchema);

app.get("/", function (req, res) {
  contas.find().then(function (doc, err) {
    if (err) throw err;
    res.send(doc);
  });
});

app.post("/deposito", function (req, res) {
  const { agencia, conta, value } = req.body;
  if (!value || value < 1) {
    res.status(400).send({ message: "Valor inválido!" });
    return;
  }
  contas.findOne({ agencia, conta }).then(function (doc, err) {
    if (err) throw err;
    if (!doc) {
      res.status(404).send({ message: "Agência e conta não encontrados." });
      return;
    }
    const balance = doc.balance + value;
    contas
      .findOneAndUpdate({ agencia, conta }, { balance }, { new: true })
      .then(function (newDoc, newErr) {
        if (newErr) throw newErr;
        if (!newDoc) {
          res.status(404).send({ message: "Agência e conta não encontrados." });
          return;
        }
        res.status(201).send({ balance: newDoc.balance });
      });
  });
});

app.post("/saque", function (req, res) {
  const { agencia, conta, value } = req.body;
  if (!value || value < 1) {
    res.status(400).send({ message: "Valor inválido!" });
    return;
  }
  contas.findOne({ agencia, conta }).then(function (doc, err) {
    if (err) throw err;
    if (!doc) {
      res.status(404).send({ message: "Agência e conta não encontrados." });
      return;
    }
    const balance = doc.balance - value - 1;
    if (balance < 0) {
      res.status(400).send({ message: "Saldo insuficiente!" });
      return;
    }
    contas
      .findOneAndUpdate({ agencia, conta }, { balance }, { new: true })
      .then(function (newDoc, newErr) {
        if (newErr) throw newErr;
        if (!newDoc) {
          res.status(404).send({ message: "Agência e conta não encontrados." });
          return;
        }
        res.status(201).send({ balance: newDoc.balance });
      });
  });
});

app.get("/saldo", function (req, res) {
  const { agencia, conta } = req.body;
  contas.findOne({ agencia, conta }).then(function (doc, err) {
    if (err) throw err;
    if (!doc) {
      res.status(404).send({ message: "Agência e conta não encontrados." });
      return;
    }
    const { balance } = doc;
    res.send({ balance });
  });
});

app.delete("/excluir", function (req, res) {
  const { agencia, conta } = req.body;

  contas.findOne({ agencia, conta }).then(function (doc, err) {
    if (err) throw err;
    if (!doc) {
      res.status(404).send({ message: "Agência e conta não encontrados." });
      return;
    }
    contas.findOneAndDelete({ agencia, conta }).then(function (newDoc, newErr) {
      if (newErr) throw newErr;
      if (!newDoc) {
        res.status(404).send({ message: "Agência e conta não encontrados." });
        return;
      }
      contas.countDocuments({ agencia: newDoc.agencia }, function (err, c) {
        res.send({ activeAcounts: c });
      });
    });
  });
});

app.listen(3000, function () {
  console.log("API listening on port 3000!");
});
