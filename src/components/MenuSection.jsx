import { useState } from "react";
import { Plus, Minus, Trash2, CheckCircle2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useCart } from "@/context/CartContext";
import { BRL } from "@/lib/api";
import { CATEGORY_META } from "@/lib/menuMeta";
import { EditableText, EditablePrice } from "@/components/Inline";

const vidOf = (product, variant) =>
  variant ? `${product.code}-${variant.label.replace(/\s/g, "")}` : product.code;

const PurchaseControl = ({ product, variant }) => {
  const { items, addItem, removeItem, updateQty } = useCart();
  const [qty, setQty] = useState(1);
  const key = `${product.id}__${variant?.label || "default"}`;
  const inCart = items.find((i) => i.key === key);
  const price = variant ? variant.price : product.price;
  const vid = vidOf(product, variant);

  const add = () => {
    addItem(product, variant, qty);
    toast.success(`${qty}x ${product.name}${variant ? ` (${variant.label})` : ""} adicionado!`);
    setQty(1);
  };

  const displayQty = inCart ? inCart.qty : qty;
  const dec = () => (inCart ? updateQty(key, -1) : setQty((q) => Math.max(1, q - 1)));
  const inc = () => (inCart ? updateQty(key, 1) : setQty((q) => q + 1));

  return (
    <div className="w-full sm:w-72 flex flex-col gap-2 self-stretch sm:self-end">
      {variant && (
        <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wide">{variant.label}</span>
      )}
      <span className="price-font w-full text-center bg-white text-black font-bold text-base px-3 py-2 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
        {BRL(price).replace("R$", "R$ ")}
      </span>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-zinc-900 rounded-full border border-zinc-700 shrink-0">
          <button data-testid={`qty-dec-${vid}`} onClick={dec} className="h-8 w-8 grid place-items-center text-zinc-300 hover:text-white" aria-label="Diminuir">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span data-testid={`qty-val-${vid}`} className="w-6 text-center text-sm font-bold">{displayQty}</span>
          <button data-testid={`qty-inc-${vid}`} onClick={inc} className="h-8 w-8 grid place-items-center text-zinc-300 hover:text-white" aria-label="Aumentar">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {inCart ? (
          <div className="flex-1 flex items-center justify-between gap-2 bg-green-500/10 border border-green-500/30 rounded-md px-3 py-1.5">
            <span data-testid={`incart-${vid}`} className="inline-flex items-center gap-1 text-green-400 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4" />{inCart.qty} no pedido · {BRL(inCart.qty * price).replace("R$", "R$ ")}
            </span>
            <button data-testid={`remove-${vid}`} onClick={() => { removeItem(key); toast(`${product.name} removido do pedido`); }} className="text-red-400 hover:text-red-300" aria-label="Remover">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button data-testid={`add-${vid}`} onClick={add} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#FF5722] hover:bg-[#F97316] text-white font-bold text-sm px-3.5 py-2 rounded-md transition-colors">
            <ShoppingBag className="h-4 w-4" />Adicionar
          </button>
        )}
      </div>
    </div>
  );
};

const EditControls = ({ product, onUpdate, onDelete }) => {
  const hasVariants = product.variants && product.variants.length > 0;
  const saveVariant = (i, patch) => {
    const variants = product.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v));
    onUpdate(product, { variants });
  };
  return (
    <div className="flex flex-col gap-2 items-stretch sm:items-end w-full sm:w-auto">
      {hasVariants ? (
        product.variants.map((v, i) => (
          <div key={i} className="flex items-center gap-2 justify-end">
            <EditableText testid={`edit-vlabel-${product.code}-${i}`} value={v.label} onSave={(nv) => saveVariant(i, { label: nv })} className="text-[11px] uppercase text-zinc-300" />
            <EditablePrice testid={`edit-vprice-${product.code}-${i}`} value={v.price} onSave={(np) => saveVariant(i, { price: np })} />
          </div>
        ))
      ) : (
        <EditablePrice testid={`edit-price-${product.code}`} value={product.price} onSave={(np) => onUpdate(product, { price: np })} />
      )}
      <div className="flex items-center gap-3 justify-end">
        <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
          <Switch data-testid={`edit-available-${product.code}`} checked={product.available !== false} onCheckedChange={(v) => onUpdate(product, { available: v })} className="scale-90" />
          Disponível
        </label>
        <button data-testid={`edit-delete-${product.code}`} onClick={() => onDelete(product)} className="h-8 w-8 grid place-items-center rounded-md bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors" title="Excluir produto">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const ProductRow = ({ product, editable, onUpdate, onDelete }) => {
  const { items } = useCart();
  const hasVariants = product.variants && product.variants.length > 0;
  const anyInCart = items.some((i) => i.id === product.id);
  const unavailable = product.available === false;

  return (
    <div
      data-testid={`menu-row-${product.code}`}
      className={`flex flex-wrap items-start justify-between gap-x-3 gap-y-3 py-3 border-b border-dashed border-zinc-800/70 transition-colors ${
        anyInCart ? "bg-green-500/[0.04] -mx-2 px-2 rounded-lg border-l-2 border-l-green-500" : ""
      } ${unavailable ? "opacity-50" : ""}`}
    >
      <div className="min-w-0 w-full sm:w-auto sm:flex-1">
        <p className="font-extrabold text-white text-xl sm:text-2xl leading-tight uppercase flex items-center gap-1.5 flex-wrap">
          {product.code && <span className="text-zinc-500">{product.code} – </span>}
          {editable ? (
            <EditableText testid={`edit-name-${product.code}`} value={product.name} onSave={(v) => onUpdate(product, { name: v })} className="uppercase font-extrabold" />
          ) : (
            product.name
          )}
          {unavailable && <span className="text-[10px] text-red-400 normal-case font-semibold">(indisponível)</span>}
          {anyInCart && !editable && <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />}
        </p>
        {editable ? (
          <div className="mt-1">
            <EditableText testid={`edit-desc-${product.code}`} multiline value={product.description} placeholder="Adicionar descrição" onSave={(v) => onUpdate(product, { description: v })} className="text-[#FF8A3D] text-base sm:text-lg" />
          </div>
        ) : (
          product.description && <p className="text-[#FF8A3D] text-base sm:text-lg leading-snug mt-1">{product.description}</p>
        )}
      </div>

      <div className="w-full sm:w-auto shrink-0 flex flex-col gap-2 items-stretch sm:items-end">
        {editable ? (
          <EditControls product={product} onUpdate={onUpdate} onDelete={onDelete} />
        ) : hasVariants ? (
          product.variants.map((v) => <PurchaseControl key={v.label} product={product} variant={v} />)
        ) : (
          <PurchaseControl product={product} />
        )}
      </div>
    </div>
  );
};

export const MenuSection = ({ category, products, showImages = true, editable = false, onUpdate, onDelete }) => {
  const meta = CATEGORY_META[category.slug] || {};
  const images = showImages ? meta.images : null;
  const side = meta.layout === "side" && images;

  const rows = (
    <div className="flex-1 min-w-0">
      {products.map((p) => <ProductRow key={p.id} product={p} editable={editable} onUpdate={onUpdate} onDelete={onDelete} />)}
      {meta.note && <p className="text-center text-xs sm:text-sm font-semibold text-zinc-400 mt-3 uppercase tracking-wide">{meta.note}</p>}
    </div>
  );

  const gallery = (cls) =>
    images && (
      <div className={cls}>
        {images.map((src, i) => (
          <img key={i} src={src} alt={category.label} loading="lazy" className="w-full h-28 sm:h-36 object-cover rounded-xl border border-zinc-800" />
        ))}
      </div>
    );

  return (
    <section id={category.slug} className="mb-10 scroll-mt-32 animate-fade-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative inline-flex items-center bg-gradient-to-r from-[#FF5722] to-[#F97316] rounded-full pl-5 pr-14 py-2.5 shadow-lg">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide leading-none">{category.label}</h2>
          {meta.subtitle && <span className="ml-3 text-sm font-bold text-white/90 uppercase hidden sm:inline">· {meta.subtitle}</span>}
          {meta.icon && <img src={meta.icon} alt="" className="absolute -right-2 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full object-cover border-[3px] border-[#121214] shadow-md" />}
        </div>
      </div>

      {side ? (
        <div className="lg:flex lg:gap-6 lg:items-start">
          {rows}
          <div className={`mt-4 lg:mt-0 lg:w-72 shrink-0 grid gap-3 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {images.map((src, i) => (
              <img key={i} src={src} alt={category.label} loading="lazy" className="w-full h-32 lg:h-36 object-cover rounded-xl border border-zinc-800" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {rows}
          {gallery(`mt-5 grid gap-3 ${images && images.length >= 3 ? "grid-cols-2 sm:grid-cols-4" : images && images.length === 2 ? "grid-cols-2" : "grid-cols-1 max-w-md mx-auto"}`)}
        </>
      )}
    </section>
  );
};
