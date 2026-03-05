import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { fetchHeatmap } from "../services/api";

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
function Stat({ label, value, color = "text-white" }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-xl px-4 py-3">
      <p className="text-white/35 text-xs mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function HeatmapPage() {
  const [points, setPoints] = useState([]);
  const [type, setType] = useState("danger");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

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
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">
            🗺 Heatmap Khu Vực Nguy Hiểm
          </h2>
          <p className="text-white/40 text-sm mt-0.5">
            {points.length} vị trí · {totalHits} lượt phát hiện · {days} ngày
            qua
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 transition-all disabled:opacity-40 flex items-center gap-2"
        >
          {loading && (
            <span className="loader-ring" style={{ width: 14, height: 14 }} />
          )}
          🔄 Làm mới
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Vị trí ghi nhận"
          value={points.length}
          color="text-white"
        />
        <Stat
          label="Tổng lượt phát hiện"
          value={totalHits}
          color="text-orange-300"
        />
        <Stat
          label="Điểm nóng nhất"
          value={`${maxInt}x`}
          color="text-red-400"
        />
        <Stat
          label="Khoảng thời gian"
          value={`${days} ngày`}
          color="text-purple-300"
        />
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        {/* Type */}
        <div>
          <label className="block text-white/40 text-xs mb-2">
            Loại phát hiện
          </label>
          <div className="flex gap-2">
            {[
              { v: "danger", label: "⚠️ Nguy hiểm" },
              { v: "all", label: "📊 Tất cả" },
            ].map(({ v, label }) => (
              <button
                key={v}
                onClick={() => setType(v)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                  type === v
                    ? "bg-red-500/20 border-red-500/40 text-red-300"
                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Days */}
        <div>
          <label className="block text-white/40 text-xs mb-2">
            Khoảng thời gian
          </label>
          <div className="flex gap-2">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-2 rounded-xl border text-sm transition-all ${
                  days === d
                    ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Map ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden border border-white/10"
        style={{ height: 480 }}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center bg-white/4 text-white/40 text-sm gap-2">
            <div className="loader-ring" /> Đang tải dữ liệu...
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
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              subdomains="abcd"
              maxZoom={19}
            />
            <HeatLayer points={points} />
          </MapContainer>
        )}
      </div>

      {/* ── Legend + Top hotspots ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Legend */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
          <h3 className="text-white/70 text-sm font-semibold mb-4">
            Chú thích màu sắc
          </h3>
          <div className="space-y-2.5">
            {[
              { color: "bg-white", label: "Mật độ cực cao (đỉnh)" },
              { color: "bg-red-500", label: "Nguy hiểm cao" },
              { color: "bg-amber-400", label: "Nguy hiểm trung bình" },
              { color: "bg-blue-500", label: "Nguy hiểm thấp" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full ${color} opacity-85 shrink-0`}
                />
                <span className="text-white/50 text-xs">{label}</span>
              </div>
            ))}
          </div>
          <div
            className="mt-4 h-3 rounded-full"
            style={{
              background:
                "linear-gradient(to right, #3b82f6, #f59e0b, #ef4444, #ffffff)",
            }}
          />
        </div>

        {/* Top hotspots */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
          <h3 className="text-white/70 text-sm font-semibold mb-4">
            🔥 Top 5 điểm nóng
          </h3>
          {top5.length === 0 ? (
            <p className="text-white/30 text-xs">
              Chưa có dữ liệu GPS trong khoảng thời gian này
            </p>
          ) : (
            <div className="space-y-3">
              {top5.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-white/25 text-xs w-4 shrink-0">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/60 text-xs font-mono truncate">
                      {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                    </p>
                    <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${(p.intensity / maxInt) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-red-400 text-xs font-semibold shrink-0">
                    {p.intensity}x
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
