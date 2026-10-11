import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, Clock, AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/context/CartContext";
import { BRL, api } from "@/lib/api";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { getOpenStatus } from "@/lib/hours";

const PAYMENTS = [
  { id: "dinheiro", label: "Dinheiro em espécie" },
  { id: "pix", label: "Pix" },
  { id: "credito", label: "Cartão de crédito" },
  { id: "debito", label: "Cartão de débito" },
];

export const CartDrawer = ({ open, onOpenChange, settings }) => {
  const { items, updateQty, removeItem, setNote, total, clear } = useCart();
  const [step, setStep] = useState("cart"); // cart | checkout
  const [form, setForm] = useState({
    name: "",
    phone: "",
    deliveryType: "entrega",
    address: "",
    bairro: "",
    referencia: "",
    payment: "pix",
    changeFor: "",
  });
  const [sending, setSending] = useState(false);

  const status = getOpenStatus(settings?.hours);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const canSubmit =
    form.name.trim() &&
    form.phone.trim() &&
    (form.deliveryType === "retirada" || (form.address.trim() && form.bairro.trim()));

  const handleSend = async () => {
    if (!canSubmit) {
      toast.error("Preencha nome, telefone e endereço.");
      return;
    }
    setSending(true);
    const payload = {
      customer: {
        name: form.name,
        phone: form.phone,
        address: form.address,
        bairro: form.bairro,
        referencia: form.referencia,
      },
      items: items.map((i) => ({
        name: i.name,
        variantLabel: i.variantLabel,
        qty: i.qty,
        price: i.price,
        note: i.note,
      })),
      total,
      payment: {
        method: form.payment,
        changeFor: form.changeFor ? Number(form.changeFor) : null,
      },
      deliveryType: form.deliveryType,
    };
    try {
      await api.post("/orders", payload);
    } catch (e) {
      // still proceed to WhatsApp even if saving fails
    }
    const url = buildWhatsappUrl({
      items,
      customer: payload.customer,
      payment: payload.payment,
      total,
      deliveryType: form.deliveryType,
      settings,
    });
    window.open(url, "_blank");
    toast.success("Pedido enviado para o WhatsApp!");
    clear();
    setStep("cart");
    onOpenChange(false);
    setSending(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-testid="cart-drawer"
        className="w-full sm:max-w-md glass text-white border-l border-white/10 flex flex-col p-0"
      >
        <SheetHeader className="p-5 border-b border-zinc-800">
          <SheetTitle className="text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#FF5722]" />
            {step === "cart" ? "Seu Pedido" : "Finalizar Pedido"}
          </SheetTitle>
        </SheetHeader>

        {!status.open && (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Estamos <b>fechados</b> no momento. {status.label}. Você pode montar o pedido e enviar assim que abrirmos.
            </span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex-1 grid place-items-center text-center px-6">
            <div className="text-zinc-500">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Seu carrinho está vazio.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
              {step === "cart" &&
                items.map((i) => (
                  <div key={i.key} data-testid={`cart-item-${i.key}`} className="flex gap-3">
                    <img src={i.image} alt={i.name} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">
                        {i.name}
                        {i.variantLabel && <span className="text-zinc-400"> · {i.variantLabel}</span>}
                      </p>
                      <p className="price-font text-sm font-bold text-[#FF5722]">{BRL(i.price * i.qty)}</p>
                      <Input
                        value={i.note}
                        onChange={(e) => setNote(i.key, e.target.value)}
                        placeholder="Observação (ex: sem cebola)"
                        className="mt-1 h-8 text-xs bg-zinc-900 border-zinc-800"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 bg-zinc-900 rounded-full border border-zinc-800">
                        <button
                          data-testid={`qty-minus-${i.key}`}
                          onClick={() => updateQty(i.key, -1)}
                          className="h-7 w-7 grid place-items-center text-zinc-300 hover:text-white"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">{i.qty}</span>
                        <button
                          data-testid={`qty-plus-${i.key}`}
                          onClick={() => updateQty(i.key, 1)}
                          className="h-7 w-7 grid place-items-center text-zinc-300 hover:text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        data-testid={`remove-${i.key}`}
                        onClick={() => removeItem(i.key)}
                        className="text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

              {step === "checkout" && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-zinc-300">Nome completo *</Label>
                    <Input data-testid="checkout-name" value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1 bg-zinc-900 border-zinc-800" />
                  </div>
                  <div>
                    <Label className="text-zinc-300">Telefone *</Label>
                    <Input data-testid="checkout-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(86) 9xxxx-xxxx" className="mt-1 bg-zinc-900 border-zinc-800" />
                  </div>

                  <div>
                    <Label className="text-zinc-300">Tipo de pedido</Label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      {[
                        { id: "entrega", label: "Entrega" },
                        { id: "retirada", label: "Retirar no balcão" },
                      ].map((o) => (
                        <button
                          key={o.id}
                          data-testid={`delivery-${o.id}`}
                          onClick={() => set("deliveryType", o.id)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            form.deliveryType === o.id
                              ? "border-[#FF5722] bg-[#FF5722]/15 text-white"
                              : "border-zinc-800 bg-zinc-900 text-zinc-400"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.deliveryType === "entrega" && (
                    <>
                      <div>
                        <Label className="text-zinc-300">Endereço (rua e número) *</Label>
                        <Input data-testid="checkout-address" value={form.address} onChange={(e) => set("address", e.target.value)} className="mt-1 bg-zinc-900 border-zinc-800" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-zinc-300">Bairro *</Label>
                          <Input data-testid="checkout-bairro" value={form.bairro} onChange={(e) => set("bairro", e.target.value)} className="mt-1 bg-zinc-900 border-zinc-800" />
                        </div>
                        <div>
                          <Label className="text-zinc-300">Referência</Label>
                          <Input data-testid="checkout-ref" value={form.referencia} onChange={(e) => set("referencia", e.target.value)} className="mt-1 bg-zinc-900 border-zinc-800" />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <Label className="text-zinc-300">Forma de pagamento</Label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      {PAYMENTS.map((p) => (
                        <button
                          key={p.id}
                          data-testid={`payment-${p.id}`}
                          onClick={() => set("payment", p.id)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            form.payment === p.id
                              ? "border-[#FF5722] bg-[#FF5722]/15 text-white"
                              : "border-zinc-800 bg-zinc-900 text-zinc-400"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.payment === "dinheiro" && (
                    <div>
                      <Label className="text-zinc-300">Troco para quanto?</Label>
                      <Input data-testid="checkout-change" type="number" value={form.changeFor} onChange={(e) => set("changeFor", e.target.value)} placeholder="Ex: 100" className="mt-1 bg-zinc-900 border-zinc-800" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800 p-5 space-y-3">
              <div className="flex items-center justify-between text-lg">
                <span className="text-zinc-400">Total</span>
                <span data-testid="cart-total" className="price-font font-bold text-white">{BRL(total)}</span>
              </div>
              {step === "cart" ? (
                <Button data-testid="go-checkout-button" onClick={() => setStep("checkout")} className="w-full h-12 bg-[#FF5722] hover:bg-[#F97316] text-white font-bold text-base transition-colors">
                  Continuar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("cart")} className="h-12 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800">
                    Voltar
                  </Button>
                  <Button data-testid="send-whatsapp-button" disabled={sending} onClick={handleSend} className="flex-1 h-12 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-base transition-colors">
                    <Send className="h-4 w-4 mr-2" /> Enviar no WhatsApp
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
