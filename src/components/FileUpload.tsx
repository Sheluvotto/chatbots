import React, { useRef, useState } from 'react';
import { FileText, X } from 'lucide-react';
import { Attachment } from '../types/chat';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  attachments: Attachment[];
  onRemoveAttachment: (id: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload, 
  attachments, 
  onRemoveAttachment 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFileUpload(filesArray);
      // Reset the input value so the same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFileUpload(filesArray);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5 sm:gap-2">
          {attachments.map((file) => (
            <div 
              key={file.id} 
              className="flex items-center bg-gray-700 rounded-md px-1.5 sm:px-2 py-1 text-xs sm:text-sm"
            >
              <FileText className="h-3 w-3 mr-1" />
              <span className="truncate max-w-[100px] sm:max-w-[150px]">{file.name}</span>
              {file.size && <span className="ml-1 text-gray-400 text-xs">({formatFileSize(file.size)})</span>}
              <button 
                onClick={() => onRemoveAttachment(file.id)}
                className="ml-1 text-gray-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div 
        className={`border-2 border-dashed rounded-md p-3 sm:p-4 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-500 bg-opacity-10' : 'border-gray-600 hover:border-gray-500'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-gray-400 text-xs sm:text-sm">
          {isDragging ? 'Drop files here' : 'Drop files here or click to upload'}
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept=".pdf,.txt,.html,.css,.js,.json,.md,.csv"
        />
      </div>
    </div>
  );
};

export default FileUpload;