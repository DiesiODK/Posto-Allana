// Business hours helper. Days: 0=Domingo ... 6=Sábado
export const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

// Current time in Cocal-PI timezone (America/Fortaleza, UTC-3)
function nowInBrazil() {
  const str = new Date().toLocaleString("en-US", {
    timeZone: "America/Fortaleza",
  });
  return new Date(str);
}

// hours: { "0": {enabled, open, close}, ... }
export function getOpenStatus(hours) {
  if (!hours) return { open: false, label: "Horário indisponível" };
  const now = nowInBrazil();
  const day = now.getDay();
  const cfg = hours[String(day)];
  if (!cfg || !cfg.enabled) {
    return { open: false, label: "Fechado hoje", today: cfg };
  }
  const [oh, om] = cfg.open.split(":").map(Number);
  const [ch, cm] = cfg.close.split(":").map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  let openMin = oh * 60 + om;
  let closeMin = ch * 60 + cm;
  // overnight (e.g. close after midnight)
  let isOpen;
  if (closeMin <= openMin) {
    isOpen = cur >= openMin || cur < closeMin;
  } else {
    isOpen = cur >= openMin && cur < closeMin;
  }
  return {
    open: isOpen,
    label: isOpen
      ? `Aberto agora · fecha às ${cfg.close}`
      : `Fechado · abre às ${cfg.open}`,
    today: cfg,
  };
}
