import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { fetchHeatmap } from "../services/api";

import PageHeader from "../components/ui/PageHeader";
import StatsCard from "../components/ui/StatsCard";
import { MapIcon, Thermometer, MapPin, Calendar, RefreshCw } from "lucide-react";

// ── Heatmap layer (uses leaflet.heat) ─────────────────────────────────────────
function HeatLayer({ points }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    if (!points.length) return;

    const maxIntensity = Math.max(...points.map((p) => p.intensity), 1);
    const heatData = points.map((p) => [
      p.lat,
      p.lng,
      p.intensity / maxIntensity,
    ]);

    layerRef.current = L.heatLayer(heatData, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      gradient: {
        0.0: "#3b82f6", // blue  — low
        0.4: "#f59e0b", // amber — medium
        0.7: "#ef4444", // red   — high
        1.0: "#ffffff", // white — peak
      },
    }).addTo(map);

    // Auto-fit bounds around all points
    if (points.length > 0) {
      const latLngs = points.map((p) => [p.lat, p.lng]);
      map.fitBounds(latLngs, { padding: [40, 40], maxZoom: 15 });
    }

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [points, map]);

  return null;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function Stat({ label, value, color = "text-text-primary" }) {
  return (
    <div className="bg-bg-card border border-border-primary rounded-xl px-4 py-3 shadow-sm">
      <p className="text-text-secondary/40 text-[10px] uppercase font-bold tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function HeatmapPage() {
  const [points, setPoints] = useState([]);
  const [type, setType] = useState("danger");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchHeatmap(type, days);
      setPoints(Array.isArray(res) ? res : []);
    } catch {
      setPoints([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [type, days]);

  const maxInt = points.length
    ? Math.max(...points.map((p) => p.intensity))
    : 0;
  const totalHits = points.reduce((s, p) => s + p.intensity, 0);
  const top5 = [...points]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 5);

  // Vietnam center fallback
  const defaultCenter = [16.047, 108.206];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader 
        title="DANGER" 
        highlight="HEATMAP" 
        description={`${points.length} vị trí · ${totalHits} lượt phát hiện · ${days} ngày qua`}
      >
        <button
          onClick={load}
          disabled={loading}
          className="h-11 px-5 rounded-2xl bg-text-primary/5 border border-border-primary text-text-secondary text-[11px] font-bold uppercase tracking-widest hover:bg-text-primary/10 hover:text-text-primary transition-all disabled:opacity-40 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Vị trí ghi nhận"
          value={points.length}
          icon={MapPin}
          color="text-indigo-500"
        />
        <StatsCard
          label="Tổng lượt phát hiện"
          value={totalHits}
          icon={Thermometer}
          color="text-orange-500"
        />
        <StatsCard
          label="Điểm rủi ro nhất"
          value={`${maxInt} lượt`}
          icon={MapIcon}
          color="text-red-500"
        />
        <StatsCard
          label="Phạm vi hiển thị"
          value={`${days} ngày`}
          icon={Calendar}
          color="text-purple-500"
        />
      </div>


      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-6">
        {/* Type */}
        <div>
          <label className="block text-text-secondary text-[10px] uppercase font-bold tracking-widest mb-3">
            Loại dữ liệu hiển thị
          </label>
          <div className="flex gap-2">
            {[
              { v: "danger", label: "⚠️ Chỉ mục nguy hiểm" },
              { v: "all", label: "📊 Tất cả phát hiện" },
            ].map(({ v, label }) => (
              <button
                key={v}
                onClick={() => setType(v)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                  type === v
                    ? "bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-300"
                    : "bg-bg-card border-border-primary text-text-secondary hover:bg-text-primary/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Days */}
        <div>
          <label className="block text-text-secondary text-[10px] uppercase font-bold tracking-widest mb-3">
            Phạm vi thời gian
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { v: 1, l: "Hôm nay" },
              { v: 7, l: "7 ngày" },
              { v: 14, l: "14 ngày" },
              { v: 30, l: "1 tháng" },
              { v: 90, l: "3 tháng" },
              { v: 180, l: "6 tháng" },
              { v: 365, l: "1 năm" },
            ].map((d) => (
              <button
                key={d.v}
                onClick={() => setDays(d.v)}
                className={`px-3 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-tight transition-all ${
                  days === d.v
                    ? "bg-purple-600/10 border-purple-500/40 text-purple-600 dark:text-purple-300 shadow-[0_0_15px_rgba(147,51,234,0.1)]"
                    : "bg-bg-card border-border-primary text-text-secondary hover:bg-text-primary/5"
                }`}
              >
                {d.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Map ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden border border-border-primary shadow-lg"
        style={{ height: 480 }}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center bg-bg-card text-text-secondary text-sm gap-2">
            <div className="loader-ring" /> Đang tổng hợp dữ liệu...
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            {/* Dark tile layer */}
            <TileLayer
              url={isDark 
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              }
              attribution='&copy; <a href="https://carto.com/">CARTO</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              subdomains="abcd"
              maxZoom={19}
            />
            <HeatLayer points={points} />
          </MapContainer>
        )}
      </div>

      {/* ── Legend + Top hotspots ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Legend */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm">
          <h3 className="text-text-primary text-sm font-bold uppercase tracking-wider text-[10px] mb-5">
            Mức độ rủi ro (Theo màu sắc)
          </h3>
          <div className="space-y-3.5">
            {[
              { color: "bg-white", label: "Cực kỳ nguy hiểm (SOS/Vật cản sát bên)" },
              { color: "bg-red-500", label: "Nguy hiểm cao" },
              { color: "bg-amber-400", label: "Cảnh báo trung bình" },
              { color: "bg-blue-500", label: "Ghi nhận có vật cản" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full ${color} opacity-85 shrink-0 border border-border-primary shadow-sm`}
                />
                <span className="text-text-secondary text-xs">{label}</span>
              </div>
            ))}
          </div>
          <div
            className="mt-6 h-2.5 rounded-full"
            style={{
              background:
                "linear-gradient(to right, #3b82f6, #f59e0b, #ef4444, #ffffff)",
            }}
          />
          <p className="mt-4 text-[10px] text-text-secondary italic">Dữ liệu được tổng hợp từ AI và tín hiệu SOS của người dùng.</p>
        </div>

        {/* Top hotspots */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm">
          <h3 className="text-text-primary text-sm font-bold uppercase tracking-wider text-[10px] mb-5">
            🔥 Top 5 khu vực rủi ro nhất
          </h3>
          {top5.length === 0 ? (
            <p className="text-text-secondary text-xs">
              Chưa có dữ liệu ghi nhận trong khoảng thời gian này
            </p>
          ) : (
            <div className="space-y-4">
              {top5.map((p, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-text-secondary/25 text-[10px] font-bold w-4 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <a 
                      href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-primary text-xs font-mono truncate hover:text-indigo-500 transition-colors flex items-center gap-2"
                    >
                      <MapPin className="w-3 h-3 text-red-500" />
                      {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                    </a>
                    <div className="mt-1.5 h-1.5 bg-text-primary/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${(p.intensity / maxInt) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-red-500 text-xs font-bold shrink-0 tabular-nums">
                    {p.intensity} cảnh báo
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
