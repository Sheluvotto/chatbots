import React from 'react';
import { Message, Attachment } from '../types/chat';
import { CircleSlash, User, Bot, Info, FileText, Download, Brain, Sparkles, Moon, Stars, Cpu, Zap, FileDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { exportToPDF, exportToWord } from '../utils/exportUtils';

interface ChatMessageProps {
  message: Message;
}

const getModelIcon = (modelName: string) => {
  if (modelName.includes('Gemini')) return <Zap className="h-4 w-4 text-emerald-400" />;
  if (modelName.includes('Dolphin')) return <Brain className="h-4 w-4 text-blue-400" />;
  if (modelName.includes('Midnight')) return <Moon className="h-4 w-4 text-purple-400" />;
  if (modelName.includes('Mistral Nemo')) return <Stars className="h-4 w-4 text-yellow-400" />;
  if (modelName.includes('Qwen')) return <Sparkles className="h-4 w-4 text-pink-400" />;
  if (modelName.includes('DeepSeek')) return <Cpu className="h-4 w-4 text-orange-400" />;
  if (modelName.includes('GPT')) return <Bot className="h-4 w-4 text-green-400" />;
  return <Bot className="h-4 w-4 text-gray-400" />;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const hasAttachments = message.attachments && message.attachments.length > 0;

  const handleExport = async (format: 'pdf' | 'word') => {
    // Extract a meaningful title from the user's question
    let title = '';
    const userMessage = message.content.toLowerCase();
    
    if (userMessage.includes('resumen')) {
      title = 'Resumen - ' + message.content.split(' ').slice(0, 5).join(' ');
    } else if (userMessage.includes('análisis')) {
      title = 'Análisis - ' + message.content.split(' ').slice(0, 5).join(' ');
    } else if (userMessage.includes('investigación')) {
      title = 'Investigación - ' + message.content.split(' ').slice(0, 5).join(' ');
    } else {
      title = message.content.split(' ').slice(0, 6).join(' ');
    }
    
    if (format === 'pdf') {
      await exportToPDF(title, message.content);
    } else {
      await exportToWord(title, message.content);
    }
  };

  if (isSystem) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center w-full max-w-4xl mx-auto py-2"
      >
        <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-800 bg-opacity-50 text-gray-400 text-xs sm:text-sm flex items-center">
          <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          {message.content}
        </div>
      </motion.div>
    );
  }

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-1">
        {message.attachments.map((attachment) => (
          <motion.div 
            key={attachment.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center bg-gray-700 bg-opacity-50 rounded p-1.5 sm:p-2 text-xs sm:text-sm"
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-gray-400" />
            <span className="flex-1 truncate">{attachment.name}</span>
            {attachment.url && (
              <a 
                href={attachment.url} 
                download={attachment.name}
                className="ml-1.5 sm:ml-2 text-blue-400 hover:text-blue-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              </a>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex w-full max-w-4xl mx-auto py-3 sm:py-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-2 sm:gap-4 max-w-[95%] sm:max-w-[90%]`}>
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
        >
          {isUser ? (
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shadow-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shadow-lg">
              {message.modelName ? getModelIcon(message.modelName) : <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />}
            </div>
          )}
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg shadow-lg ${
            isUser ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' : 'bg-gradient-to-br from-gray-800 to-gray-900 text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            {message.modelName && !isUser && (
              <div className="flex items-center text-xs text-gray-400 mb-1 font-medium">
                {getModelIcon(message.modelName)}
                <span className="ml-1">{message.modelName}</span>
                {message.modelName === 'AI Consensus' && (
                  <span className="ml-1 text-blue-400">(Combined insights from all models)</span>
                )}
              </div>
            )}
            {!isUser && (
              <div className="flex items-center gap-2 mb-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleExport('pdf')}
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  title="Export to PDF"
                >
                  <FileDown className="h-4 w-4" />
                  <span className="sr-only">PDF</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleExport('word')}
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  title="Export to Word"
                >
                  <FileText className="h-4 w-4" />
                  <span className="sr-only">Word</span>
                </motion.button>
              </div>
            )}
          </div>
          <ReactMarkdown className="prose prose-invert max-w-none">
            {message.content}
          </ReactMarkdown>
          {hasAttachments && renderAttachments()}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;