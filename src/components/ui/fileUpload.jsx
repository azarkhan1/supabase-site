import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Download } from 'lucide-react';
import { fileService } from '../../services/fileService';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export function FileUpload({
  value = [],
  onChange,
  maxFiles = 5,
  className
}) {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = async (newFiles) => {
    if (value.length + newFiles.length > maxFiles) {
      toast.error(`حداکثر تعداد فایل‌های مجاز ${maxFiles} عدد می‌باشد`);
      return;
    }

    const processedFiles = [];
    
    for (const file of newFiles) {
      const validation = fileService.validateFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        const base64 = await fileService.fileToBase64(file);
        processedFiles.push({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          base64,
          uploadedAt: new Date().toISOString()
        });
      } catch (err) {
        toast.error(`خطا در پردازش فایل ${file.name}`);
      }
    }

    if (processedFiles.length > 0) {
      onChange([...value, ...processedFiles]);
      toast.success(`${processedFiles.length} فایل با موفقیت اضافه شد`);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (id) => {
    onChange(value.filter(f => f.id !== id));
    toast.success('فایل با موفقیت حذف شد');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-[#1e40af] dark:hover:border-blue-500 transition-all bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center space-y-2",
          isDragActive && "border-[#1e40af] bg-blue-50/10 dark:bg-blue-950/10"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          multiple
        />
        <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-sm">
          <Upload className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            فایل را بکشید و رها کنید یا کلیک کنید
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
            حداکثر حجم فایل ۵ مگابایت
          </p>
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {value.map((file) => {
            const isImage = file.type.startsWith('image/');
            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-xs group"
              >
                <div className="flex items-center space-x-3 space-x-reverse min-w-0">
                  {isImage ? (
                    <img
                      src={file.base64}
                      alt={file.name}
                      className="h-10 w-10 object-cover rounded-md border border-slate-200 dark:border-slate-800"
                    />
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                      <FileText className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate pr-1">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5 pr-1">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 space-x-reverse">
                  <a
                    href={file.base64}
                    download={file.name}
                    className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="دانلود فایل"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    title="حذف فایل"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
