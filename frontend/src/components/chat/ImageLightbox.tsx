import { X } from "lucide-react"

interface ImageLightboxProps {
  src: string
  alt: string
  onClose: () => void
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 animate-in fade-in duration-200" />
      <div className="relative max-w-[90vw] max-h-[90vh] animate-in fade-in zoom-in-90 duration-300">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 flex items-center justify-center h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[90vh] rounded-lg object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}
