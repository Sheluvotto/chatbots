import React, { useState } from 'react';
import { Paperclip, ChevronDown, ArrowUp, Layers, FileText, CheckSquare } from 'lucide-react';
import { AVAILABLE_MODELS } from '../services/openRouterService';
import { ModelOption, Attachment } from '../types/chat';
import FileUpload from './FileUpload';

interface InputBarProps {
  onSendMessage: (message: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
  multiModelMode: boolean;
  onToggleMultiModelMode: () => void;
  consensusMode: boolean;
  onToggleConsensusMode: () => void;
  attachments: Attachment[];
  onAddAttachment: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
}

const InputBar: React.FC<InputBarProps> = ({ 
  onSendMessage, 
  isLoading, 
  selectedModel, 
  onModelChange,
  multiModelMode,
  onToggleMultiModelMode,
  consensusMode,
  onToggleConsensusMode,
  attachments,
  onAddAttachment,
  onRemoveAttachment
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSendMessage = () => {
    if ((inputValue.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(inputValue, attachments);
      setInputValue('');
      setShowFileUpload(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectModel = (model: ModelOption) => {
    onModelChange(model);
    setIsDropdownOpen(false);
  };

  const toggleFileUpload = () => {
    setShowFileUpload(!showFileUpload);
  };

  const toggleToolbar = () => {
    setShowToolbar(!showToolbar);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {showFileUpload && (
        <div className="mb-3">
          <FileUpload 
            onFileUpload={onAddAttachment}
            attachments={attachments}
            onRemoveAttachment={onRemoveAttachment}
          />
        </div>
      )}
      
      <div className="relative flex flex-col bg-gray-800 rounded-lg">
        {/* Mobile toolbar toggle */}
        <div className="sm:hidden flex justify-center border-b border-gray-700">
          <button 
            onClick={toggleToolbar}
            className="text-gray-400 py-2"
          >
            {showToolbar ? 
              <ChevronDown className="h-5 w-5" /> : 
              <ChevronDown className="h-5 w-5 transform rotate-180" />
            }
          </button>
        </div>
        
        {/* Toolbar */}
        <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 ${showToolbar ? 'flex' : 'hidden sm:flex'}`}>
          <button 
            onClick={toggleFileUpload}
            className={`${showFileUpload || attachments.length > 0 ? 'text-blue-400' : 'text-gray-400'} hover:text-white transition-colors p-1.5`}
            title="Attach files"
          >
            <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button 
            className={`flex items-center space-x-1 ${multiModelMode ? 'text-blue-400' : 'text-gray-400'} hover:text-white transition-colors px-1.5 py-1 rounded`}
            onClick={onToggleMultiModelMode}
            title="Get responses from all models"
          >
            <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm hidden sm:inline">Multi-Model</span>
          </button>
          {multiModelMode && (
            <button 
              className={`flex items-center space-x-1 ${consensusMode ? 'text-blue-400' : 'text-gray-400'} hover:text-white transition-colors px-1.5 py-1 rounded`}
              onClick={onToggleConsensusMode}
              title="Generate consensus among models"
            >
              <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm hidden sm:inline">Consensus</span>
            </button>
          )}
        </div>
        
        {/* Input area */}
        <div className="flex items-center px-2 sm:px-4 py-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={attachments.length > 0 ? "Add a message or send files directly" : "What do you want to know?"}
            className="flex-1 bg-transparent border-none outline-none text-white py-2 px-2 text-sm sm:text-base"
            disabled={isLoading}
          />
          
          <div className="flex items-center">
            <div className="relative">
              <button 
                onClick={toggleDropdown}
                className={`flex items-center space-x-1 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors text-xs sm:text-sm ${
                  (multiModelMode || consensusMode) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={multiModelMode || consensusMode}
              >
                <span className="max-w-[80px] sm:max-w-[120px] truncate">
                  {consensusMode 
                    ? 'AI Consensus' 
                    : multiModelMode 
                      ? 'All Models' 
                      : selectedModel.name
                  }
                </span>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              
              {isDropdownOpen && !multiModelMode && !consensusMode && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden w-40 sm:w-48 z-10">
                  <ul>
                    {AVAILABLE_MODELS.map((model) => (
                      <li 
                        key={model.id}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 hover:bg-gray-700 cursor-pointer text-white text-xs sm:text-sm ${selectedModel.id === model.id ? 'bg-gray-700' : ''}`}
                        onClick={() => selectModel(model)}
                      >
                        {model.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <button 
              className={`ml-2 ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'} rounded-full p-1.5 sm:p-2 transition-colors`}
              onClick={handleSendMessage}
              disabled={isLoading || (!inputValue.trim() && attachments.length === 0)}
            >
              <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
      
      {attachments.length > 0 && !showFileUpload && (
        <div className="mt-2 flex items-center text-xs text-gray-400">
          <FileText className="h-3 w-3 mr-1" />
          <span>{attachments.length} file{attachments.length !== 1 ? 's' : ''} attached</span>
          <button 
            className="ml-2 text-blue-400 hover:text-blue-300"
            onClick={toggleFileUpload}
          >
            View
          </button>
        </div>
      )}
    </div>
  );
};

export default InputBar;