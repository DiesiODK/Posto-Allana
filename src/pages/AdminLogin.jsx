import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user !== false) navigate("/admin");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[#121214] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <span className="grid place-items-center h-14 w-14 rounded-2xl bg-[#FF5722] mb-3">
            <UtensilsCrossed className="h-7 w-7 text-white" />
          </span>
          <h1 className="text-2xl font-black text-white">POSTO ALLANA</h1>
          <p className="text-sm text-zinc-500">Painel do administrador</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-[#18181B] border border-zinc-800 p-6">
          <div>
            <Label className="text-zinc-300">E-mail</Label>
            <Input data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-zinc-900 border-zinc-800 text-white" required />
          </div>
          <div>
            <Label className="text-zinc-300">Senha</Label>
            <Input data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 bg-zinc-900 border-zinc-800 text-white" required />
          </div>
          {error && <p data-testid="login-error" className="text-sm text-red-400">{error}</p>}
          <Button data-testid="login-submit" type="submit" disabled={loading} className="w-full h-11 bg-[#FF5722] hover:bg-[#F97316] text-white font-bold transition-colors">
            <Lock className="h-4 w-4 mr-2" /> {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <button onClick={() => navigate("/")} className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-white">
          ← Voltar ao cardápio
        </button>
      </div>
    </div>
  );
}
