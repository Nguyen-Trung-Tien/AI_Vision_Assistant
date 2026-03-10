export default function Avatar({ email }) {
  const letter = (email?.[0] ?? "?").toUpperCase();
  const colors = [
    "from-purple-500 to-indigo-500",
    "from-cyan-500 to-blue-500",
    "from-pink-500 to-rose-500",
    "from-orange-500 to-amber-500",
    "from-green-500 to-emerald-500",
  ];
  const idx = email ? email.charCodeAt(0) % colors.length : 0;
  return (
    <div
      className={`w-9 h-9 rounded-full bg-linear-to-br ${colors[idx]} flex items-center justify-center text-white text-sm font-bold shrink-0`}
    >
      {letter}
    </div>
  );
}
