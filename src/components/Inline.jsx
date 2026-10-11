import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { BRL } from "@/lib/api";

export const EditableText = ({ value, onSave, className = "", multiline = false, placeholder = "—", testid }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");
  useEffect(() => setVal(value ?? ""), [value]);

  const commit = () => {
    setEditing(false);
    if ((val || "") !== (value || "")) onSave(val);
  };

  if (editing) {
    const Cmp = multiline ? "textarea" : "input";
    return (
      <Cmp
        data-testid={testid}
        autoFocus
        value={val}
        rows={multiline ? 2 : undefined}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !multiline) { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setVal(value ?? ""); setEditing(false); }
        }}
        className={`bg-zinc-900 border border-[#FF5722] rounded px-2 py-1 text-white outline-none w-full ${className}`}
      />
    );
  }

  return (
    <span
      data-testid={testid}
      onClick={() => setEditing(true)}
      title="Clique para editar"
      className={`cursor-text rounded px-1 -mx-1 ring-1 ring-dashed ring-white/20 hover:bg-white/5 inline-flex items-center gap-1 ${className}`}
    >
      {value || <span className="text-zinc-500">{placeholder}</span>}
      <Pencil className="h-3 w-3 opacity-40 shrink-0" />
    </span>
  );
};

export const EditablePrice = ({ value, onSave, testid, label }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? 0);
  useEffect(() => setVal(value ?? 0), [value]);

  const commit = () => {
    setEditing(false);
    if (Number(val) !== Number(value)) onSave(Number(val));
  };

  if (editing) {
    return (
      <input
        data-testid={testid}
        autoFocus
        type="number"
        step="0.01"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setVal(value ?? 0); setEditing(false); }
        }}
        className="price-font w-24 bg-white text-black font-bold text-sm px-2 py-1.5 rounded-lg outline-none ring-2 ring-[#FF5722]"
      />
    );
  }

  return (
    <button
      data-testid={testid}
      onClick={() => setEditing(true)}
      title="Clique para editar o preço"
      className="price-font min-w-[78px] text-center bg-white text-black font-bold text-sm px-3 py-1.5 rounded-lg ring-1 ring-black/10 hover:ring-2 hover:ring-[#FF5722] transition-all"
    >
      {label && <span className="block text-[9px] text-zinc-500 uppercase leading-none mb-0.5">{label}</span>}
      {BRL(value).replace("R$", "R$ ")}
    </button>
  );
};
