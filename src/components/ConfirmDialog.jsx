import { AlertTriangle } from 'lucide-react'
import Modal from './Modal.jsx'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            إلغاء
          </button>
          <button onClick={() => { onConfirm(); onClose() }} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
            تأكيد
          </button>
        </div>
      </div>
    </Modal>
  )
}
