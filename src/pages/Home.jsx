import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, MapPin, Phone, Wrench, BellRing, ChefHat, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { MenuSection } from "@/components/MenuSection";
import { CartDrawer } from "@/components/CartDrawer";
import { FloatingCart } from "@/components/FloatingCart";
import { EditableText } from "@/components/Inline";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { api, BRL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { WEEKDAYS, getOpenStatus } from "@/lib/hours";
import { buildCustomerMsgUrl, DEFAULT_MSG_RECEIVED, DEFAULT_MSG_READY } from "@/lib/whatsapp";

const norm = (s) =>
  (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user && user !== false && user.role === "admin";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("todos");
  const [cartOpen, setCartOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newOrder, setNewOrder] = useState(null);
  const seenRef = useRef(null);

  const playBeep = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const beep = (freq, start, dur) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
        o.start(ctx.currentTime + start);
        o.stop(ctx.currentTime + start + dur);
      };
      beep(880, 0, 0.18); beep(1245, 0.2, 0.25);
    } catch (e) { /* som bloqueado */ }
  };

  useEffect(() => {
    if (!isAdmin) return;
    let timer;
    const poll = async () => {
      try {
        const { data } = await api.get("/orders");
        if (seenRef.current === null) {
          seenRef.current = new Set(data.map((o) => o.id));
          return;
        }
        const fresh = data.filter((o) => !seenRef.current.has(o.id));
        if (fresh.length) {
          fresh.forEach((o) => seenRef.current.add(o.id));
          setNewOrder(fresh[0]);
          playBeep();
        }
      } catch (e) { /* ignore */ }
    };
    poll();
    timer = setInterval(poll, 12000);
    return () => clearInterval(timer);
  }, [isAdmin]);

  const notifyCustomer = (o, which) => {
    const isReady = which === "ready";
    const tpl = isReady ? (settings?.msg_ready || DEFAULT_MSG_READY) : (settings?.msg_received || DEFAULT_MSG_RECEIVED);
    api.put(`/orders/${o.id}/status`, { status: isReady ? "pronto" : "preparando" }).catch(() => {});
    window.open(buildCustomerMsgUrl(o, tpl, settings), "_blank");
    toast.success("Abrindo o WhatsApp do cliente...");
    setNewOrder(null);
  };

  const loadProducts = () => api.get("/products").then((r) => setProducts(r.data));
  useEffect(() => {
    api.get("/settings").then((r) => setSettings(r.data));
    api.get("/categories").then((r) => setCategories(r.data));
    loadProducts();
  }, []);

  const editable = isAdmin && editMode;

  const updateProduct = async (product, patch) => {
    const base = {
      code: product.code || "",
      name: product.name,
      description: product.description || "",
      category: product.category,
      image: product.image || "",
      available: product.available !== false,
      price: product.price,
      variants: product.variants || [],
    };
    const payload = { ...base, ...patch };
    if (payload.price != null) payload.price = Number(payload.price);
    payload.variants = (payload.variants || []).map((v) => ({ label: v.label, price: Number(v.price) }));
    try {
      const { data } = await api.put(`/products/${product.id}`, payload);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? data : p)));
      toast.success("Alteração salva");
    } catch (e) {
      toast.error("Erro ao salvar");
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Excluir "${product.name}" do cardápio?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success("Produto excluído");
    } catch (e) {
      toast.error("Erro ao excluir");
    }
  };

  const updateSettings = async (patch) => {
    try {
      const { data } = await api.put("/settings", patch);
      setSettings(data);
      toast.success("Alteração salva");
    } catch (e) {
      toast.error("Erro ao salvar");
    }
  };

  const catLabel = useMemo(() => {
    const m = {};
    categories.forEach((c) => (m[c.slug] = c.label));
    return m;
  }, [categories]);

  const q = norm(search);
  const matches = (p) =>
    !q || norm(p.name).includes(q) || norm(p.description).includes(q) || norm(catLabel[p.category]).includes(q);

  // admin vê todos (incl. indisponíveis); cliente vê apenas disponíveis
  const visibleProducts = useMemo(
    () => (isAdmin ? products : products.filter((p) => p.available !== false)),
    [products, isAdmin]
  );

  const sections = useMemo(() => {
    const base = activeCat === "todos" ? categories : categories.filter((c) => c.slug === activeCat);
    return base
      .map((c) => ({ category: c, items: visibleProducts.filter((p) => p.category === c.slug && matches(p)) }))
      .filter((s) => s.items.length > 0);
  }, [categories, visibleProducts, activeCat, q, catLabel]);

  const activeCats = useMemo(
    () => categories.filter((c) => visibleProducts.some((p) => p.category === c.slug)),
    [categories, visibleProducts]
  );

  const status = getOpenStatus(settings?.hours);
  const showImages = !q;

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white pb-20">
      <Header settings={settings} search={search} setSearch={setSearch} onOpenCart={() => setCartOpen(true)} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {isAdmin && (
          <div data-testid="admin-edit-bar" className="glass rounded-2xl border border-[#FF5722]/40 p-3 sm:p-4 mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 font-bold text-sm"><Wrench className="h-4 w-4 text-[#FF5722]" />Modo administrador</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch data-testid="edit-mode-switch" checked={editMode} onCheckedChange={setEditMode} />
              <span className="text-sm text-zinc-300">Editar site {editMode ? "(ativado)" : ""}</span>
            </label>
            <Button data-testid="open-panel-button" size="sm" variant="outline" onClick={() => navigate("/admin")} className="ml-auto border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
              Painel completo
            </Button>
            {editMode && (
              <p className="w-full text-xs text-zinc-400">Clique em nomes, descrições e preços para editar. As alterações são salvas automaticamente.</p>
            )}
          </div>
        )}

        {/* Capa / Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-[#18181B] border border-zinc-800 my-6 sm:my-8">
          <img src="/menu/hero.jpg" alt="Posto Allana" className="w-full h-56 sm:h-72 object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5 sm:p-8">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] text-[#FF8A3D] mb-2">POSTO ALLANA · COCAL - PI</span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">MENU</h1>
            <div className="mt-2 text-sm sm:text-lg text-zinc-200 font-semibold max-w-xl">
              {editable ? (
                <EditableText testid="edit-tagline" value={settings?.tagline} onSave={(v) => updateSettings({ tagline: v })} />
              ) : (
                settings?.tagline || "Pizzas, chapas, sushi, drinks, sucos e muito mais!"
              )}
            </div>
          </div>
        </section>

        <div className={`mb-4 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border ${status.open ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-red-400 border-red-500/30 bg-red-500/10"}`}>
          <Clock className="h-4 w-4" />{status.label}
        </div>

        <div className="sticky top-16 sm:top-20 z-30 -mx-4 px-4 py-3 glass border-b border-white/5 mb-6 rounded-b-2xl">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button data-testid="cat-todos" onClick={() => setActiveCat("todos")} className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeCat === "todos" ? "bg-[#FF5722] text-white" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"}`}>Todos</button>
            {activeCats.map((c) => (
              <button key={c.slug} data-testid={`cat-${c.slug}`} onClick={() => setActiveCat(c.slug)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeCat === c.slug ? "bg-[#FF5722] text-white" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"}`}>{c.label}</button>
            ))}
          </div>
        </div>

        {sections.length === 0 ? (
          <p data-testid="empty-results" className="text-center text-zinc-500 py-16">Nenhum produto encontrado para "{search}".</p>
        ) : (
          sections.map((s) => (
            <MenuSection key={s.category.slug} category={s.category} products={s.items} showImages={showImages} editable={editable} onUpdate={updateProduct} onDelete={deleteProduct} />
          ))
        )}

        <section className="mb-12 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center bg-gradient-to-r from-[#FF5722] to-[#F97316] rounded-full px-5 py-2.5 shadow-lg">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide leading-none">Horário de Funcionamento</h2>
            </div>
          </div>
          <div className="rounded-2xl bg-[#18181B] border border-zinc-800 p-5 sm:p-6 max-w-xl">
            <ul className="divide-y divide-zinc-800">
              {settings?.hours && WEEKDAYS.map((day, idx) => {
                const cfg = settings.hours[String(idx)];
                return (
                  <li key={idx} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-zinc-300">{day}</span>
                    <span className={cfg?.enabled ? "text-white font-medium" : "text-red-400"}>{cfg?.enabled ? `${cfg.open} às ${cfg.close}` : "Fechado"}</span>
                  </li>
                );
              })}
            </ul>
            {editable && <p className="mt-3 text-xs text-zinc-500">Para alterar os horários, use o Painel completo → aba Horários.</p>}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-zinc-500 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <p className="text-white font-bold text-lg">POSTO ALLANA</p>
            <p className="flex items-center gap-1.5 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              {editable ? <EditableText testid="edit-address" value={settings?.address} onSave={(v) => updateSettings({ address: v })} className="text-zinc-300" /> : (settings?.address || "Cocal - PI")}
            </p>
          </div>
          <p className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> WhatsApp:{" "}
            {editable ? <EditableText testid="edit-whatsapp" value={settings?.whatsapp_number} onSave={(v) => updateSettings({ whatsapp_number: v })} className="text-zinc-300" /> : settings?.whatsapp_number}
          </p>
        </div>
      </footer>

      <FloatingCart onOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} settings={settings} />

      {isAdmin && newOrder && (
        <div data-testid="new-order-notification" className="fixed top-20 right-4 z-50 w-[92vw] max-w-sm glass border border-[#FF5722]/50 rounded-2xl p-4 shadow-2xl animate-fade-up">
          <div className="flex items-start gap-3">
            <span className="grid place-items-center h-10 w-10 rounded-full bg-[#FF5722] shrink-0 animate-pulse">
              <BellRing className="h-5 w-5 text-white" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white">Novo pedido recebido!</p>
              <p className="text-sm text-zinc-300 truncate">{newOrder.customer?.name} · <span className="price-font text-[#FF5722] font-bold">{BRL(newOrder.total)}</span></p>
              <p className="text-xs text-zinc-500">{newOrder.items?.reduce((s, i) => s + i.qty, 0)} item(ns) · {newOrder.deliveryType}</p>
            </div>
            <button data-testid="notif-dismiss" onClick={() => setNewOrder(null)} className="text-zinc-400 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button data-testid="notif-received" onClick={() => notifyCustomer(newOrder, "received")} size="sm" className="bg-[#F59E0B] hover:bg-[#d97706] text-white font-semibold col-span-1">
              <ChefHat className="h-4 w-4 mr-1" />Recebido
            </Button>
            <Button data-testid="notif-ready" onClick={() => notifyCustomer(newOrder, "ready")} size="sm" className="bg-[#22C55E] hover:bg-[#16a34a] text-white font-semibold col-span-1">
              <BellRing className="h-4 w-4 mr-1" />Pronto
            </Button>
            <Button data-testid="notif-goto" onClick={() => navigate(`/admin?tab=pedidos&order=${newOrder.id}`)} size="sm" variant="outline" className="col-span-2 border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
              Ir para o pedido <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
