import { useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { Mail, LogOut, ShieldCheck, User, Phone, Edit2, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updateMyProfile } from "../services/api";
import { useToast } from "../components/Toast";
import { cn } from "@/lib/utils";
import PageHeader from "../components/ui/PageHeader";
import Avatar from "../components/ui/Avatar";
import { RoleBadge } from "../components/ui/Badge";
import Loading from "../components/ui/Loading";

export default function ProfilePage() {
  const { email, role, name, phone, logout, updateProfileContext } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: name || "",
    phone: phone || "",
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateMyProfile(formData);
      updateProfileContext(formData.full_name, formData.phone);
      toast.success("Cập nhật thông tin thành công");
      setIsEditing(false);
    } catch (error) {
      toast.error("Không thể cập nhật thông tin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col pb-6">
      <PageHeader
        title="HỒ SƠ"
        highlight="CÁ NHÂN"
        description="Quản lý thông tin tài khoản và trạng thái bảo mật của bạn"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left Column: User Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 flex flex-col items-center text-center shadow-lg relative group">
            <button
              onClick={() => {
                if (isEditing) {
                  setFormData({ full_name: name || "", phone: phone || "" });
                  setIsEditing(false);
                } else {
                  setIsEditing(true);
                }
              }}
              className="absolute top-4 right-4 p-2 flex items-center gap-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 hover:text-indigo-600 transition-all font-medium text-xs"
            >
              {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
              <span>{isEditing ? "Hủy" : "Chỉnh sửa"}</span>
            </button>

            <Avatar 
              email={email} 
              className="w-24 h-24 rounded-full border-4 border-bg-card shadow-xl ring-2 ring-indigo-500/20 mb-4" 
            />
            
            {isEditing ? (
              <div className="w-full space-y-3 mt-2">
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block text-left mb-1">Họ và Tên</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input 
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full bg-bg-primary border border-border-primary rounded-xl pl-9 pr-3 py-2 text-sm text-text-primary focus:border-indigo-500 outline-none transition-colors"
                      placeholder="Nhập họ và tên..."
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block text-left mb-1">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input 
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-bg-primary border border-border-primary rounded-xl pl-9 pr-3 py-2 text-sm text-text-primary focus:border-indigo-500 outline-none transition-colors"
                      placeholder="Nhập số điện thoại..."
                    />
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-bold text-sm disabled:opacity-50"
                >
                  {loading ? <Loading size="sm" variant="inline" /> : <Check className="w-4 h-4" />}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-text-primary mb-1 truncate w-full px-2">
                  {name || email?.split("@")[0] || "User"}
                </h2>
                <p className="text-sm text-text-secondary mb-2 truncate w-full px-2">
                  {email || "Không xác định"}
                </p>
                {phone && (
                  <p className="text-xs text-text-secondary mb-4 truncate w-full px-2 flex items-center justify-center gap-1">
                    <Phone className="w-3 h-3" /> {phone}
                  </p>
                )}
                {!phone && <div className="mb-4"></div>}
                <RoleBadge role={role || "USER"} />
              </>
            )}
          </div>

          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border-primary pb-3">
              Cài đặt Tài khoản
            </h3>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-all font-bold text-sm group"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Right Column: Details & Sessions */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Security Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-bg-card border border-border-primary rounded-2xl p-5 flex items-start gap-4 hover:border-indigo-500/30 transition-colors">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-1">Email Liên Hệ</p>
                <p className="text-sm font-bold text-text-primary truncate">{email || "Không xác định"}</p>
              </div>
            </div>
            
            <div className="bg-bg-card border border-border-primary rounded-2xl p-5 flex items-start gap-4 hover:border-emerald-500/30 transition-colors">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-1">Bảo Mật</p>
                <p className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Trạng thái an toàn
                </p>
              </div>
            </div>
          </div>

          {/* System Permissions */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 flex-1 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-border-primary pb-3">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Quyền hạn Hệ thống
              </h3>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Tài khoản của bạn có quyền truy cập vào các tính năng sau dựa trên vai trò <span className="font-bold text-indigo-400">{role || "USER"}</span>:
              </p>
              <ul className="list-disc pl-5 text-sm text-text-secondary space-y-2 marker:text-indigo-500/50">
                <li>Xem Dashboard tổng quan & Phân tích hệ thống</li>
                <li>Gửi thông báo khẩn cấp Broadcast TTS</li>
                <li>Giám sát Bản đồ nguy hiểm (Heatmap)</li>
                <li>Xem Lịch sử hoạt động và Phản hồi người dùng</li>
                {(role === "SUPER_ADMIN" || role === "ADMIN") && (
                  <li className="font-medium text-text-primary">
                    Quản lý tài khoản người dùng & Cài đặt nâng cao hệ thống
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
