import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { BRL } from "@/lib/api";

export const ProductCard = ({ product, index = 0 }) => {
  const { addItem } = useCart();
  const hasVariants = product.variants && product.variants.length > 0;

  const handleAdd = (variant) => {
    addItem(product, variant);
    const label = variant ? ` (${variant.label})` : "";
    toast.success(`${product.name}${label} adicionado!`);
  };

  return (
    <div
      data-testid={`product-card-${product.code}`}
      className="group relative flex flex-col rounded-2xl bg-[#18181B] border border-zinc-800 hover:border-[#FF5722]/50 hover:shadow-[0_0_24px_rgba(255,87,34,0.15)] transition-colors duration-300 overflow-hidden animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        {product.code && (
          <span className="absolute top-2 left-2 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-black/60 text-zinc-300 backdrop-blur-sm">
            #{product.code}
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-bold text-white leading-tight">{product.name}</h3>
          {product.description && (
            <p className="mt-1 text-xs sm:text-sm text-zinc-400 leading-snug line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {hasVariants ? (
          <div className="flex flex-col gap-2 pt-1 border-t border-zinc-800/60">
            {product.variants.map((v) => (
              <button
                key={v.label}
                data-testid={`add-variant-${product.code}-${v.label.replace(/\s/g, "")}`}
                onClick={() => handleAdd(v)}
                className="flex items-center justify-between rounded-lg bg-zinc-900 hover:bg-[#FF5722]/15 border border-zinc-800 hover:border-[#FF5722]/40 px-3 py-2 transition-colors"
              >
                <span className="text-sm text-zinc-300 capitalize">{v.label}</span>
                <span className="flex items-center gap-2 text-sm font-extrabold text-[#FF5722]">
                  {BRL(v.price)}
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
            <span className="text-xl font-extrabold text-[#FF5722]">{BRL(product.price)}</span>
            <Button
              data-testid={`add-to-cart-${product.code}`}
              size="sm"
              onClick={() => handleAdd(null)}
              className="bg-[#FF5722] hover:bg-[#F97316] text-white font-semibold transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
