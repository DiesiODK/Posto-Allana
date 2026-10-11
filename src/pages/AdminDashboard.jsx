import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  LogOut, Plus, Pencil, Trash2, Clock, Phone, Package, ReceiptText, Store, Save, X, ImagePlus, Loader2, ChefHat, BellRing,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { api, BRL } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { buildCustomerMsgUrl, DEFAULT_MSG_RECEIVED, DEFAULT_MSG_READY } from "@/lib/whatsapp";
import { WEEKDAYS } from "@/lib/hours";

const emptyProduct = {
  code: "", name: "", description: "", category: "pizzas", image: "",
  price: 0, variants: [], available: true,
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialTab = params.get("tab") || "produtos";
  const focusOrder = params.get("order");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user === false) navigate("/admin/login");
  }, [user, navigate]);

  useEffect(() => {
    if (focusOrder && orders.length) {
      const el = document.querySelector(`[data-testid="order-${focusOrder}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-[#FF5722]");
        setTimeout(() => el.classList.remove("ring-2", "ring-[#FF5722]"), 3000);
      }
    }
  }, [focusOrder, orders]);

  const loadAll = () => {
    api.get("/products").then((r) => setProducts(r.data));
    api.get("/categories").then((r) => setCategories(r.data));
    api.get("/settings").then((r) => setSettings(r.data));
    api.get("/orders").then((r) => setOrders(r.data)).catch(() => {});
  };
  useEffect(() => { if (user && user !== false) loadAll(); }, [user]);

  const catLabel = useMemo(() => {
    const m = {}; categories.forEach((c) => (m[c.slug] = c.label)); return m;
  }, [categories]);

  if (!user || user === false) return null;

  const handleLogout = async () => { await logout(); navigate("/admin/login"); };

  return (
    <div className="min-h-screen bg-[#121214] text-white">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#121214]/90 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-9 w-9 rounded-lg bg-[#FF5722]"><Store className="h-5 w-5" /></span>
            <div className="leading-none">
              <p className="font-black">Painel Admin</p>
              <p className="text-xs text-zinc-500">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")} className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800">Ver site</Button>
            <Button data-testid="logout-button" onClick={handleLogout} variant="destructive"><LogOut className="h-4 w-4 mr-2" />Sair</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue={initialTab}>
          <TabsList className="bg-zinc-900 border border-zinc-800 flex-wrap h-auto">
            <TabsTrigger value="produtos" data-testid="tab-produtos"><Package className="h-4 w-4 mr-1.5" />Produtos</TabsTrigger>
            <TabsTrigger value="horarios" data-testid="tab-horarios"><Clock className="h-4 w-4 mr-1.5" />Horários</TabsTrigger>
            <TabsTrigger value="whatsapp" data-testid="tab-whatsapp"><Phone className="h-4 w-4 mr-1.5" />WhatsApp</TabsTrigger>
            <TabsTrigger value="pedidos" data-testid="tab-pedidos"><ReceiptText className="h-4 w-4 mr-1.5" />Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value="produtos" className="mt-6">
            <ProductsTab products={products} categories={categories} catLabel={catLabel} reload={loadAll} />
          </TabsContent>
          <TabsContent value="horarios" className="mt-6">
            {settings && <HoursTab settings={settings} setSettings={setSettings} />}
          </TabsContent>
          <TabsContent value="whatsapp" className="mt-6">
            {settings && <WhatsappTab settings={settings} setSettings={setSettings} />}
          </TabsContent>
          <TabsContent value="pedidos" className="mt-6">
            <OrdersTab orders={orders} reload={loadAll} settings={settings} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ProductsTab({ products, categories, catLabel, reload }) {
  const [editing, setEditing] = useState(null);

  const del = async (p) => {
    if (!window.confirm(`Excluir "${p.name}"?`)) return;
    await api.delete(`/products/${p.id}`);
    toast.success("Produto excluído");
    reload();
  };

  const byCat = useMemo(() => {
    const m = {};
    products.forEach((p) => { (m[p.category] = m[p.category] || []).push(p); });
    return m;
  }, [products]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-zinc-400 text-sm">{products.length} produtos cadastrados</p>
        <Button data-testid="add-product-button" onClick={() => setEditing({ ...emptyProduct })} className="bg-[#FF5722] hover:bg-[#F97316] transition-colors">
          <Plus className="h-4 w-4 mr-1.5" />Novo produto
        </Button>
      </div>

      {categories.map((c) => {
        const list = byCat[c.slug];
        if (!list?.length) return null;
        return (
          <div key={c.slug} className="mb-8">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><span className="h-5 w-1 rounded bg-[#FF5722]" />{c.label}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((p) => (
                <div key={p.id} data-testid={`admin-product-${p.code}`} className="flex gap-3 rounded-xl bg-[#18181B] border border-zinc-800 p-3">
                  <img src={p.image} alt={p.name} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate">{p.name}</p>
                    <p className="text-xs text-[#FF5722] font-bold">
                      {p.variants?.length ? p.variants.map((v) => BRL(v.price)).join(" / ") : BRL(p.price)}
                    </p>
                    {!p.available && <span className="text-[10px] text-red-400">Indisponível</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button data-testid={`edit-product-${p.code}`} onClick={() => setEditing(p)} className="text-zinc-400 hover:text-white"><Pencil className="h-4 w-4" /></button>
                    <button data-testid={`delete-product-${p.code}`} onClick={() => del(p)} className="text-zinc-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {editing && (
        <ProductDialog product={editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
      )}
    </div>
  );
}

function ProductDialog({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    ...product,
    price: product.price ?? 0,
    variants: product.variants || [],
  }));
  const [hasVariants, setHasVariants] = useState((product.variants || []).length > 0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isNew = !product.id;

  const setVariant = (i, k, v) =>
    setForm((f) => ({ ...f, variants: f.variants.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)) }));
  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, { label: "", price: 0 }] }));
  const removeVariant = (i) => setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      set("image", data.url);
      toast.success("Imagem enviada!");
    } catch (err) {
      toast.error("Falha ao enviar imagem");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      code: form.code,
      name: form.name,
      description: form.description,
      category: form.category,
      image: form.image,
      available: form.available,
      price: hasVariants ? null : Number(form.price),
      variants: hasVariants ? form.variants.map((v) => ({ label: v.label, price: Number(v.price) })) : [],
    };
    try {
      if (isNew) await api.post("/products", payload);
      else await api.put(`/products/${product.id}`, payload);
      toast.success("Produto salvo");
      onSaved();
    } catch (e) {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#18181B] border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isNew ? "Novo produto" : "Editar produto"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label className="text-zinc-300">Nome</Label>
              <Input data-testid="product-name-input" value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1 bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <Label className="text-zinc-300">Código</Label>
              <Input value={form.code} onChange={(e) => set("code", e.target.value)} className="mt-1 bg-zinc-900 border-zinc-800" />
            </div>
          </div>
          <div>
            <Label className="text-zinc-300">Descrição</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1 bg-zinc-900 border-zinc-800" rows={2} />
          </div>
          <div>
            <Label className="text-zinc-300">Categoria</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className="mt-1 bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-zinc-300">Imagem do produto</Label>
            <div className="mt-1 flex items-center gap-2">
              <label data-testid="upload-image-label" className="inline-flex items-center gap-2 cursor-pointer bg-[#FF5722] hover:bg-[#F97316] text-white font-semibold text-sm px-3 py-2 rounded-md transition-colors">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {uploading ? "Enviando..." : "Enviar da galeria / PC"}
                <input data-testid="product-image-file" type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
              </label>
              {form.image && <span className="text-xs text-green-400">✓ Imagem definida</span>}
            </div>
            <Input data-testid="product-image-input" value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="ou cole uma URL: https://..." className="mt-2 bg-zinc-900 border-zinc-800" />
            {form.image && <img src={form.image} alt="" className="mt-2 h-28 w-full object-cover rounded-lg border border-zinc-800" />}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2">
            <Label className="text-zinc-300">Tem variações (ex: 6 und / 10 und)</Label>
            <Switch checked={hasVariants} onCheckedChange={setHasVariants} />
          </div>

          {hasVariants ? (
            <div className="space-y-2">
              {form.variants.map((v, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input value={v.label} onChange={(e) => setVariant(i, "label", e.target.value)} placeholder="Rótulo" className="bg-zinc-900 border-zinc-800" />
                  <Input type="number" value={v.price} onChange={(e) => setVariant(i, "price", e.target.value)} placeholder="Preço" className="w-28 bg-zinc-900 border-zinc-800" />
                  <button onClick={() => removeVariant(i)} className="text-zinc-400 hover:text-red-400"><X className="h-4 w-4" /></button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addVariant} className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"><Plus className="h-4 w-4 mr-1" />Adicionar variação</Button>
            </div>
          ) : (
            <div>
              <Label className="text-zinc-300">Preço (R$)</Label>
              <Input data-testid="product-price-input" type="number" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className="mt-1 bg-zinc-900 border-zinc-800" />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2">
            <Label className="text-zinc-300">Disponível</Label>
            <Switch checked={form.available} onCheckedChange={(v) => set("available", v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800">Cancelar</Button>
          <Button data-testid="save-product-button" onClick={save} disabled={saving} className="bg-[#FF5722] hover:bg-[#F97316] transition-colors"><Save className="h-4 w-4 mr-1.5" />Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HoursTab({ settings, setSettings }) {
  const [hours, setHours] = useState(settings.hours);
  const [saving, setSaving] = useState(false);
  const upd = (idx, k, v) => setHours((h) => ({ ...h, [idx]: { ...h[idx], [k]: v } }));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/settings", { hours });
      setSettings(data);
      toast.success("Horários atualizados");
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl">
      <div className="rounded-2xl bg-[#18181B] border border-zinc-800 p-5 space-y-3">
        {WEEKDAYS.map((day, idx) => {
          const cfg = hours[String(idx)] || { enabled: false, open: "18:00", close: "23:00" };
          return (
            <div key={idx} data-testid={`hours-row-${idx}`} className="flex items-center gap-3">
              <div className="w-32 text-sm text-zinc-300">{day}</div>
              <Switch checked={cfg.enabled} onCheckedChange={(v) => upd(String(idx), "enabled", v)} />
              <Input type="time" value={cfg.open} disabled={!cfg.enabled} onChange={(e) => upd(String(idx), "open", e.target.value)} className="w-28 bg-zinc-900 border-zinc-800 disabled:opacity-40" />
              <span className="text-zinc-500">às</span>
              <Input type="time" value={cfg.close} disabled={!cfg.enabled} onChange={(e) => upd(String(idx), "close", e.target.value)} className="w-28 bg-zinc-900 border-zinc-800 disabled:opacity-40" />
            </div>
          );
        })}
      </div>
      <Button data-testid="save-hours-button" onClick={save} disabled={saving} className="mt-4 bg-[#FF5722] hover:bg-[#F97316] transition-colors"><Save className="h-4 w-4 mr-1.5" />Salvar horários</Button>
    </div>
  );
}

function WhatsappTab({ settings, setSettings }) {
  const [form, setForm] = useState({
    whatsapp_number: settings.whatsapp_number || "",
    name: settings.name || "",
    tagline: settings.tagline || "",
    address: settings.address || "",
    msg_received: settings.msg_received ?? DEFAULT_MSG_RECEIVED,
    msg_ready: settings.msg_ready ?? DEFAULT_MSG_READY,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/settings", form);
      setSettings(data);
      toast.success("Configurações salvas");
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-md space-y-4">
      <div className="rounded-2xl bg-[#18181B] border border-zinc-800 p-5 space-y-4">
        <div>
          <Label className="text-zinc-300">Número do WhatsApp (para receber pedidos)</Label>
          <Input data-testid="whatsapp-input" value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} placeholder="86994477146" className="mt-1 bg-zinc-900 border-zinc-800" />
          <p className="text-xs text-zinc-500 mt-1">Digite com DDD. O código do país (55) é adicionado automaticamente.</p>
        </div>
        <div>
          <Label className="text-zinc-300">Nome do estabelecimento</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1 bg-zinc-900 border-zinc-800" />
        </div>
        <div>
          <Label className="text-zinc-300">Slogan</Label>
          <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className="mt-1 bg-zinc-900 border-zinc-800" />
        </div>
        <div>
          <Label className="text-zinc-300">Endereço</Label>
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} className="mt-1 bg-zinc-900 border-zinc-800" />
        </div>
      </div>

      <div className="rounded-2xl bg-[#18181B] border border-zinc-800 p-5 space-y-4">
        <p className="font-bold text-sm">Mensagens enviadas ao cliente</p>
        <p className="text-xs text-zinc-500">Use <b>{"{nome}"}</b> (nome do cliente), <b>{"{loja}"}</b> (nome do estabelecimento) e <b>{"{tipo}"}</b> (entrega/retirada).</p>
        <div>
          <Label className="text-zinc-300">1) Pedido recebido / em preparo</Label>
          <Textarea data-testid="msg-received-input" value={form.msg_received} onChange={(e) => set("msg_received", e.target.value)} rows={3} className="mt-1 bg-zinc-900 border-zinc-800" />
        </div>
        <div>
          <Label className="text-zinc-300">2) Pedido pronto (retirar/entrega)</Label>
          <Textarea data-testid="msg-ready-input" value={form.msg_ready} onChange={(e) => set("msg_ready", e.target.value)} rows={3} className="mt-1 bg-zinc-900 border-zinc-800" />
        </div>
      </div>

      <Button data-testid="save-whatsapp-button" onClick={save} disabled={saving} className="bg-[#FF5722] hover:bg-[#F97316] transition-colors"><Save className="h-4 w-4 mr-1.5" />Salvar</Button>
    </div>
  );
}

function OrdersTab({ orders, reload, settings }) {
  const delOne = async (o) => {
    if (!window.confirm(`Excluir o pedido de "${o.customer?.name}"?`)) return;
    await api.delete(`/orders/${o.id}`);
    toast.success("Pedido excluído");
    reload();
  };

  const notifyCustomer = async (o, which) => {
    const digits = (o.customer?.phone || "").replace(/\D/g, "");
    if (!digits) {
      toast.error("Este pedido não tem um telefone válido para avisar.");
      return;
    }
    const isReady = which === "ready";
    const template = isReady
      ? (settings?.msg_ready || DEFAULT_MSG_READY)
      : (settings?.msg_received || DEFAULT_MSG_RECEIVED);
    try {
      await api.put(`/orders/${o.id}/status`, { status: isReady ? "pronto" : "preparando" });
    } catch (e) { /* segue mesmo assim */ }
    window.open(buildCustomerMsgUrl(o, template, settings), "_blank");
    toast.success("Abrindo o WhatsApp do cliente...");
    reload();
  };

  const toggleDone = async (o, done) => {
    await api.put(`/orders/${o.id}/status`, { done });
    toast.success(done ? "Pedido marcado como concluído" : "Pedido reaberto");
    reload();
  };

  const clearAll = async () => {
    if (!window.confirm("Tem certeza que deseja limpar TODO o histórico de pedidos? Esta ação não pode ser desfeita.")) return;
    const { data } = await api.delete("/orders");
    toast.success(`${data.deleted} pedido(s) removido(s)`);
    reload();
  };

  const dayKey = (iso) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" });

  const groups = useMemo(() => {
    const m = {};
    orders.forEach((o) => {
      const k = dayKey(o.created_at);
      (m[k] = m[k] || []).push(o);
    });
    // ordena dias do mais recente para o mais antigo
    return Object.entries(m).sort((a, b) => {
      const pa = a[0].split("/").reverse().join("");
      const pb = b[0].split("/").reverse().join("");
      return pb.localeCompare(pa);
    });
  }, [orders]);

  if (!orders.length) return <p className="text-zinc-500">Nenhum pedido registrado ainda.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-zinc-400 text-sm">{orders.length} pedido(s) no total</p>
        <Button data-testid="clear-orders-button" onClick={clearAll} variant="destructive">
          <Trash2 className="h-4 w-4 mr-1.5" />Limpar histórico
        </Button>
      </div>

      {groups.map(([day, list]) => {
        const dayTotal = list.reduce((s, o) => s + (o.total || 0), 0);
        return (
          <div key={day} data-testid={`order-day-${day}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="h-5 w-1 rounded bg-[#FF5722]" />
              <h3 className="font-bold text-lg">{day}</h3>
              <span className="text-xs text-zinc-500">{list.length} pedido(s) · {BRL(dayTotal)}</span>
            </div>
            <div className="space-y-3">
              {list.map((o) => {
                const done = !!o.done;
                const badge = done
                  ? { t: "Concluído", c: "bg-green-500/15 text-green-400 border-green-500/30" }
                  : o.status === "pronto"
                  ? { t: "Pronto", c: "bg-blue-500/15 text-blue-400 border-blue-500/30" }
                  : o.status === "preparando"
                  ? { t: "Preparando", c: "bg-amber-500/15 text-amber-400 border-amber-500/30" }
                  : { t: "Novo", c: "bg-zinc-700/40 text-zinc-300 border-zinc-600/40" };
                return (
                  <div key={o.id} data-testid={`order-${o.id}`} className={`rounded-xl bg-[#18181B] border border-zinc-800 p-4 transition-opacity ${done ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{o.customer?.name} · <span className="text-zinc-400 font-normal">{o.customer?.phone}</span></p>
                        <p className="text-xs text-zinc-500">{new Date(o.created_at).toLocaleString("pt-BR", { timeZone: "America/Fortaleza" })} · {o.deliveryType}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span data-testid={`order-status-${o.id}`} className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.c}`}>{badge.t}</span>
                        <span className="price-font font-extrabold text-[#FF5722]">{BRL(o.total)}</span>
                        <button
                          data-testid={`delete-order-${o.id}`}
                          onClick={() => delOne(o)}
                          className="h-8 w-8 grid place-items-center rounded-md bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Excluir pedido"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <ul className="mt-2 text-sm text-zinc-300 space-y-0.5">
                      {o.items?.map((i, idx) => (
                        <li key={idx}>{i.qty}x {i.name}{i.variantLabel ? ` (${i.variantLabel})` : ""}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-zinc-400">Pagamento: {o.payment?.method}{o.payment?.changeFor ? ` · troco p/ ${BRL(o.payment.changeFor)}` : ""}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-3">
                      <Button data-testid={`notify-received-${o.id}`} onClick={() => notifyCustomer(o, "received")} size="sm" className="bg-[#F59E0B] hover:bg-[#d97706] text-white font-semibold">
                        <ChefHat className="h-4 w-4 mr-1.5" />Recebido · em preparo
                      </Button>
                      <Button data-testid={`notify-ready-${o.id}`} onClick={() => notifyCustomer(o, "ready")} size="sm" className="bg-[#22C55E] hover:bg-[#16a34a] text-white font-semibold">
                        <BellRing className="h-4 w-4 mr-1.5" />Pedido pronto
                      </Button>
                      <label className="flex items-center gap-2 cursor-pointer select-none ml-auto">
                        <Checkbox
                          data-testid={`done-${o.id}`}
                          checked={done}
                          onCheckedChange={(v) => toggleDone(o, !!v)}
                          className="border-zinc-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                        />
                        <span className="text-sm text-zinc-300">Pedido concluído</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
