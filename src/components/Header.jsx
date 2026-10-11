import { Clock, Search, ShoppingBag, UtensilsCrossed, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { getOpenStatus } from "@/lib/hours";
import { BRL } from "@/lib/api";

export const Header = ({ settings, search, setSearch, onOpenCart }) => {
  const { count, total } = useCart();
  const navigate = useNavigate();
  const status = getOpenStatus(settings?.hours);

  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-40 w-full glass border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16 sm:h-20">
          <button
            onClick={() => navigate("/")}
            data-testid="logo-button"
            className="flex items-center gap-2 shrink-0"
          >
            <span className="grid place-items-center h-10 w-10 rounded-xl bg-[#FF5722]">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </span>
            <span className="hidden sm:block text-left leading-none">
              <span className="block text-xs font-semibold tracking-[0.2em] text-zinc-400">POSTO</span>
              <span className="block text-xl font-black text-white -mt-0.5">ALLANA</span>
            </span>
          </button>

          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              data-testid="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pizza, sushi, bebida..."
              className="pl-9 h-11 glass-panel text-white placeholder:text-zinc-400 focus-visible:ring-[#FF5722] border-white/10"
            />
          </div>

          <div
            data-testid="status-badge"
            className={`hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
              status.open
                ? "text-green-400 border-green-500/30 bg-green-500/10"
                : "text-red-400 border-red-500/30 bg-red-500/10"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            {status.open ? "Aberto agora" : "Fechado"}
          </div>

          <Button
            data-testid="cart-button"
            onClick={onOpenCart}
            className="relative bg-[#FF5722] hover:bg-[#F97316] text-white font-semibold transition-colors"
          >
            <ShoppingBag className="h-4 w-4 sm:mr-2" />
            <span className="price-font hidden sm:inline">{BRL(total)}</span>
            {count > 0 && (
              <span
                data-testid="cart-count"
                className="absolute -top-2 -right-2 h-5 min-w-5 px-1 grid place-items-center rounded-full bg-white text-[#FF5722] text-xs font-bold"
              >
                {count}
              </span>
            )}
          </Button>

          <Button
            data-testid="admin-link-button"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Área do administrador"
          >
            <Lock className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
