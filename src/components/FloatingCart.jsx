import { ShoppingBag, ChevronRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { BRL } from "@/lib/api";

export const FloatingCart = ({ onOpen }) => {
  const { count, total } = useCart();
  if (!count) return null;
  return (
    <div className="sm:hidden fixed bottom-4 inset-x-4 z-40 animate-fade-up">
      <button
        data-testid="floating-cart-button"
        onClick={onOpen}
        className="glass-orange w-full flex items-center justify-between rounded-2xl px-5 py-3.5 text-white font-bold transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-2">
          <span className="relative grid place-items-center h-7 w-7 rounded-full bg-white/20">
            <ShoppingBag className="h-4 w-4" />
            <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 grid place-items-center rounded-full bg-white text-[#FF5722] text-[11px] font-black">
              {count}
            </span>
          </span>
          Ver pedido
        </span>
        <span className="flex items-center gap-1">
          <span className="price-font text-lg">{BRL(total)}</span>
          <ChevronRight className="h-5 w-5 opacity-80" />
        </span>
      </button>
    </div>
  );
};
