import Modal from "../ui/Modal";
import { Button } from "../ui/button";
import { AlertCircle } from "lucide-react";

export default function SessionExpiredModal({ isOpen, onConfirm }) {
  if (!isOpen) return null;

  return (
    <Modal
      title="Phiên đăng nhập hết hạn"
      icon={<AlertCircle className="w-5 h-5 text-red-500" />}
      onClose={onConfirm}
      footer={
        <div className="w-full flex justify-end">
          <Button variant="default" onClick={onConfirm} className="bg-purple-600 hover:bg-purple-700 text-white">
            Đăng nhập lại
          </Button>
        </div>
      }
    >
      <div className="text-text-secondary text-sm">
        Phiên làm việc của bạn đã hết hạn do lâu không hoạt động hoặc token đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống.
      </div>
    </Modal>
  );
}
