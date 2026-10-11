export function normalizePhone(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "5586994477146";
  // if already includes country code 55
  if (digits.length >= 12 && digits.startsWith("55")) return digits;
  return "55" + digits;
}

const BRL = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PAYMENT_LABELS = {
  dinheiro: "Dinheiro em espécie",
  pix: "Pix",
  credito: "Cartão de crédito",
  debito: "Cartão de débito",
};

export function buildWhatsappUrl({ items, customer, payment, total, deliveryType, settings }) {
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Fortaleza" });

  const lines = items
    .map((i) => {
      const nm = i.variantLabel ? `${i.name} (${i.variantLabel})` : i.name;
      const note = i.note ? `\n     _obs: ${i.note}_` : "";
      return `• ${i.qty}x ${nm} — ${BRL(i.price * i.qty)}${note}`;
    })
    .join("\n");

  const tipo = deliveryType === "retirada" ? "Retirar no balcão" : "Entrega (Delivery)";
  const payLabel = PAYMENT_LABELS[payment.method] || payment.method;
  const troco =
    payment.method === "dinheiro" && payment.changeFor
      ? `\n💵 *Troco para:* ${BRL(payment.changeFor)}`
      : "";

  let enderecoBloco = "";
  if (deliveryType !== "retirada") {
    const ref = customer.referencia ? ` (${customer.referencia})` : "";
    enderecoBloco = `\n📍 *Endereço:* ${customer.address || "-"}, ${customer.bairro || "-"}${ref}`;
  }

  const msg =
    `*NOVO PEDIDO - ${(settings?.name || "POSTO ALLANA").toUpperCase()}*\n` +
    `--------------------------------\n` +
    `👤 *Cliente:* ${customer.name}\n` +
    `📞 *Telefone:* ${customer.phone}\n` +
    `🛵 *Tipo:* ${tipo}` +
    enderecoBloco +
    `\n--------------------------------\n` +
    `📋 *ITENS DO PEDIDO:*\n${lines}\n` +
    `--------------------------------\n` +
    `💰 *Total:* ${BRL(total)}\n` +
    `💳 *Pagamento:* ${payLabel}${troco}\n` +
    `--------------------------------\n` +
    `⏰ *Horário do pedido:* ${now}`;

  const phone = normalizePhone(settings?.whatsapp_number);
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export const DEFAULT_MSG_RECEIVED = "Olá {nome}! 👋 Recebemos o seu pedido no {loja} e já estamos preparando 👨‍🍳🔥. Em breve avisamos quando estiver pronto!";
export const DEFAULT_MSG_READY = "Olá {nome}! ✅ Seu pedido no {loja} está *pronto*! Já pode retirar no balcão ou está saindo para entrega 🛵. Obrigado pela preferência! 🧡";

// Mensagem do estabelecimento PARA o cliente (recebido / pronto), com placeholders.
export function buildCustomerMsgUrl(order, template, settings) {
  const store = settings?.name || "Posto Allana";
  const tipo = order.deliveryType === "retirada" ? "retirada no balcão" : "entrega";
  const msg = (template || "")
    .split("{nome}").join(order.customer?.name || "")
    .split("{loja}").join(store)
    .split("{tipo}").join(tipo);
  const phone = normalizePhone(order.customer?.phone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// Mensagem enviada do estabelecimento PARA o cliente avisando que o pedido está pronto.
export function buildCustomerReadyUrl(order, settings) {
  const store = settings?.name || "Posto Allana";
  const fim =
    order.deliveryType === "retirada"
      ? "já está ficando pronto para *retirada no balcão*"
      : "está sendo preparado e logo sairá para *entrega*";
  const msg =
    `Olá ${order.customer?.name || ""}! 👋\n\n` +
    `Seu pedido no *${store}* ${fim} 👨‍🍳🔥\n\n` +
    `Qualquer dúvida é só chamar por aqui. Obrigado pela preferência! 🧡`;
  const phone = normalizePhone(order.customer?.phone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
