import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Scan } from 'lucide-react'
import Modal from './Modal.jsx'

export default function BarcodeScanner({ isOpen, onClose, onScan }) {
  const scannerRef = useRef(null)
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    let scanner = null
    const startScanner = async () => {
      try {
        setScanning(true)
        scanner = new Html5Qrcode('barcode-reader')
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onScan(decodedText)
            if (scanner) {
              scanner.stop().catch(() => {})
            }
            onClose()
          },
          () => {}
        )
      } catch (err) {
        setError('تعذر الوصول إلى الكاميرا. تأكد من السماح بالوصول.')
        setScanning(false)
      }
    }

    startScanner()

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {})
      }
    }
  }, [isOpen, onClose, onScan])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="مسح الباركود" size="md">
      <div className="text-center">
        {error ? (
          <div className="text-red-600 py-8">{error}</div>
        ) : (
          <>
            <div id="barcode-reader" className="w-full max-w-sm mx-auto rounded-lg overflow-hidden" />
            {scanning && (
              <p className="text-sm text-gray-500 mt-3 flex items-center justify-center gap-2">
                <Scan className="w-4 h-4 animate-pulse" />
                جارٍ المسح...
              </p>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
