import React from 'react';
import { Message } from '../types/chat';
import ChatMessage from './ChatMessage';
import { Bot } from 'lucide-react';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, isLoading }) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="w-full h-full overflow-y-auto py-4 px-2 sm:px-4 pb-20">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="text-white text-xl sm:text-2xl font-normal mb-2">Welcome to Otto Chat</h1>
          <p className="text-gray-300 text-lg sm:text-xl font-light">How can I help you today?</p>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start w-full max-w-4xl mx-auto py-4">
              <div className="flex flex-row gap-2 sm:gap-4 max-w-[90%]">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-800 flex items-center justify-center">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-gray-800 text-white">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default ChatContainer;