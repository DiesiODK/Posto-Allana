// Metadados por categoria para reproduzir o layout do cardápio em PDF.
// icon: imagem redonda no cabeçalho (pílula laranja)
// images: fotos da seção (como aparecem no PDF)
// layout: "below" (fotos abaixo dos itens) | "side" (fotos ao lado)
const IMG = (f) => `/menu/${f}.jpg`;

export const CATEGORY_META = {
  "pizzas": { icon: IMG("pizza_2"), images: [IMG("pizza_1"), IMG("pizza_2"), IMG("pizza_3"), IMG("pizza_doce")], layout: "below", note: "Todas as pizzas são servidas em 8 fatias" },
  "pizzas-doces": { icon: IMG("pizza_doce"), note: "Todas as pizzas são servidas em 8 fatias" },
  "bordas": { icon: IMG("pizza_1") },
  "chapas": { icon: IMG("chapa_1"), images: [IMG("chapa_1"), IMG("porcao_1"), IMG("porcao_2")], layout: "below" },
  "porcoes": { icon: IMG("porcao_1") },
  "entradas": { icon: IMG("combinado_2") },
  "yakisoba": { icon: IMG("yakisoba"), images: [IMG("yakisoba")], layout: "side" },
  "temaki": { icon: IMG("temaki_4"), images: [IMG("temaki_1"), IMG("temaki_2"), IMG("temaki_3"), IMG("temaki_4")], layout: "side" },
  "hot-roll": { icon: IMG("hotroll"), images: [IMG("hotroll")], layout: "side" },
  "niguiri": { icon: IMG("uramaki_2") },
  "uramaki": { icon: IMG("uramaki_1"), images: [IMG("uramaki_1"), IMG("uramaki_2")], layout: "side" },
  "hossomaki": { icon: IMG("hossomaki"), images: [IMG("hossomaki")], layout: "side" },
  "joe": { icon: IMG("joe"), images: [IMG("joe")], layout: "below" },
  "sashimi": { icon: IMG("combinado_1") },
  "combinados": { icon: IMG("combinado_1"), images: [IMG("combinado_1"), IMG("combinado_2")], layout: "below" },
  "sobremesa": { icon: IMG("sobremesa_2"), images: [IMG("sobremesa_1"), IMG("sobremesa_2")], layout: "below" },
  "lanches": { icon: IMG("lanches"), subtitle: "Boquinha de Anjo" },
  "bebidas": { icon: IMG("bebidas"), images: [IMG("bebidas")], layout: "below" },
  "sucos": { icon: IMG("sucos") },
  "drinks": { icon: IMG("drink_1"), images: [IMG("drink_1"), IMG("drink_2"), IMG("drink_3")], layout: "below" },
  "drinks-sem-alcool": { icon: IMG("drink_3") },
};
