import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface PhotoUploadFieldProps {
  id?: string;
  label?: string;
  photoUrl: string;
  onPhotoChange: (base64Url: string) => void;
  onError?: (errorMessage: string) => void;
  fallbackName?: string;
  required?: boolean;
}

export const PhotoUploadField: React.FC<PhotoUploadFieldProps> = ({
  id = 'photo-upload',
  label = 'Foto de Perfil',
  photoUrl,
  onPhotoChange,
  onError,
  fallbackName = 'Perfil',
  required = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setLocalError(null);

    // Validação estrita de tipo MIME (apenas imagens válidas)
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      const err = 'Formato de arquivo inválido. Por favor envie imagens nos formatos JPG, PNG ou WebP.';
      setLocalError(err);
      if (onError) onError(err);
      return;
    }

    // Limite de segurança de 4MB para persistência e performance
    const maxSizeBytes = 4 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const err = 'Tamanho da imagem excede o limite máximo permitido de 4MB.';
      setLocalError(err);
      if (onError) onError(err);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        // Redimensionar e comprimir no canvas para manter leve e seguro
        const img = new Image();
        img.onload = () => {
          const maxDimension = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            onPhotoChange(optimizedBase64);
            setLocalError(null);
          } else {
            onPhotoChange(result);
          }
        };
        img.onerror = () => {
          const err = 'Não foi possível processar a imagem. Verifique se o arquivo não está corrompido.';
          setLocalError(err);
          if (onError) onError(err);
        };
        img.src = result;
      }
    };
    reader.onerror = () => {
      const err = 'Erro na leitura do arquivo local.';
      setLocalError(err);
      if (onError) onError(err);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleRemovePhoto = () => {
    onPhotoChange('');
    setLocalError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const hasPhoto = Boolean(photoUrl && photoUrl.trim().length > 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[#243029]">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <span className="text-[10px] text-[#64736B] font-medium">
          Upload local ou Câmera (Máx. 4MB)
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 bg-[#F9FBF8] border border-[#DFE5DA] rounded-xl">
        {/* Preview Avatar */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-xl bg-[#EBF1ED] border-2 border-[#DFE5DA] overflow-hidden flex items-center justify-center shadow-xs">
            {hasPhoto ? (
              <img
                src={photoUrl}
                alt={fallbackName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-[#86958E]">
                <ImageIcon className="w-6 h-6 mb-0.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Sem foto</span>
              </div>
            )}
          </div>

          {hasPhoto && (
            <button
              id={`${id}-btn-remove`}
              type="button"
              onClick={handleRemovePhoto}
              title="Remover foto atual"
              className="absolute -top-1.5 -right-1.5 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Upload Zone (Drag & Drop + Buttons) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 w-full border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-[#5A7D6C] bg-[#EBF1ED]'
              : 'border-[#DFE5DA] hover:border-[#5A7D6C]/70 bg-white'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#3D564A]">
              <Upload className="w-4 h-4 text-[#5A7D6C]" />
              <span>Arraste uma foto aqui ou</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                id={`${id}-btn-select-file`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-2.5 py-1 bg-[#EBF1ED] hover:bg-[#DFEBE3] text-[#345143] text-xs font-semibold rounded-lg border border-[#C2D6CA] transition-colors cursor-pointer"
              >
                Procurar no Computador
              </button>

              <button
                id={`${id}-btn-capture-camera`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="px-2.5 py-1 bg-[#FAF1E8] hover:bg-[#F5E6D5] text-[#9A5222] text-xs font-semibold rounded-lg border border-[#ECD9C5] transition-colors flex items-center gap-1 cursor-pointer"
                title="Capturar foto usando a câmera do dispositivo"
              >
                <Camera className="w-3.5 h-3.5 text-[#C88346]" />
                <span>Câmera</span>
              </button>
            </div>
          </div>
          <p className="text-[10px] text-[#86958E] mt-1">
            Formatos suportados: JPG, PNG, WebP. URLs externas desabilitadas por segurança.
          </p>
        </div>
      </div>

      {/* Hidden Native File & Camera Inputs */}
      <input
        ref={fileInputRef}
        id={`${id}-file-input`}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        id={`${id}-camera-input`}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Error display */}
      {localError && (
        <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{localError}</span>
        </div>
      )}
    </div>
  );
};
