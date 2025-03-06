import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import ChatContainer from './components/ChatContainer';
import InputBar from './components/InputBar';
import FooterButtons from './components/FooterButtons';
import { Message, ChatState, ChatSession, Attachment } from './types/chat';
import { ModelOption } from './types/models';
import { 
  generateChatResponse, 
  generateMultiModelResponses, 
  generateConsensusResponse,
  AVAILABLE_MODELS 
} from './services/openRouterService';
import { processFile, extractTextFromAttachments } from './utils/fileUtils';
import { motion, AnimatePresence } from 'framer-motion';

// Local storage key for chat sessions
const CHAT_SESSIONS_STORAGE_KEY = 'otto_chat_sessions';
const CURRENT_SESSION_ID_KEY = 'otto_current_session_id';

function App() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    multiModelMode: false,
    consensusMode: false,
    attachments: [],
    selectedModels: []
  });
  
  const [selectedModel, setSelectedModel] = useState<ModelOption>(AVAILABLE_MODELS[0]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [selectedModels, setSelectedModels] = useState<ModelOption[]>([AVAILABLE_MODELS[0]]);

  // Load chat sessions from local storage
  useEffect(() => {
    const savedSessions = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
    const savedCurrentSessionId = localStorage.getItem(CURRENT_SESSION_ID_KEY);
    
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        // Convert string dates back to Date objects
        const sessionsWithDates = parsedSessions.map((session: any) => ({
          ...session,
          timestamp: new Date(session.timestamp),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChatSessions(sessionsWithDates);
        
        // Load current session if it exists
        if (savedCurrentSessionId) {
          setCurrentSessionId(savedCurrentSessionId);
          const currentSession = sessionsWithDates.find(
            (s: ChatSession) => s.id === savedCurrentSessionId
          );
          if (currentSession) {
            setChatState(prev => ({
              ...prev,
              messages: currentSession.messages
            }));
          }
        }
      } catch (error) {
        console.error('Error loading chat sessions:', error);
      }
    }
  }, []);

  // Save chat sessions to local storage whenever they change
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(chatSessions));
    }
    if (currentSessionId) {
      localStorage.setItem(CURRENT_SESSION_ID_KEY, currentSessionId);
    }
  }, [chatSessions, currentSessionId]);

  // Update current session with new messages
  useEffect(() => {
    if (currentSessionId && chatState.messages.length > 0) {
      updateSessionWithMessages(currentSessionId, chatState.messages);
    }
  }, [chatState.messages]);

  const createNewSession = () => {
    const newSessionId = uuidv4();
    const newSession: ChatSession = {
      id: newSessionId,
      title: `New Chat ${chatSessions.length + 1}`,
      lastMessage: '',
      timestamp: new Date(),
      messages: []
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setChatState(prev => ({
      ...prev,
      messages: []
    }));
  };

  const selectSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setChatState(prev => ({
        ...prev,
        messages: session.messages
      }));
    }
  };

  const deleteSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    
    // If we're deleting the current session, create a new one
    if (sessionId === currentSessionId) {
      createNewSession();
    }
  };

  const renameSession = (sessionId: string, newTitle: string) => {
    setChatSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, title: newTitle } 
          : session
      )
    );
  };

  const updateSessionWithMessages = (sessionId: string, messages: Message[]) => {
    if (messages.length === 0) return;
    
    setChatSessions(prev => {
      const updatedSessions = prev.map(session => {
        if (session.id === sessionId) {
          // Get the last non-system message for the session title
          const lastUserMessage = [...messages]
            .reverse()
            .find(m => m.role === 'user');
          
          const lastMessage = lastUserMessage 
            ? lastUserMessage.content.substring(0, 60) + (lastUserMessage.content.length > 60 ? '...' : '')
            : '';
          
          // If this is a new session with a default title, use the first user message as title
          let title = session.title;
          if (title.startsWith('New Chat') && lastUserMessage) {
            title = lastUserMessage.content.substring(0, 30) + (lastUserMessage.content.length > 30 ? '...' : '');
          }
          
          return {
            ...session,
            messages: messages,
            lastMessage: lastMessage,
            timestamp: new Date(),
            title: title
          };
        }
        return session;
      });
      
      // Sort sessions by timestamp (newest first)
      return updatedSessions.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
    });
  };

  const handleSendMessage = async (content: string, attachments: Attachment[] = []) => {
    if (!content.trim() && attachments.length === 0) return;

    // Create a session if none exists
    if (!currentSessionId) {
      createNewSession();
    }

    // Create a new user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };

    // Update state with user message and clear attachments
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      attachments: [] // Clear attachments after sending
    }));

    try {
      // Format messages for API
      let messageContent = content;
      
      // If there are attachments with text content, add them to the message
      if (attachments.length > 0) {
        const attachmentText = extractTextFromAttachments(attachments);
        if (attachmentText) {
          messageContent = content 
            ? `${content}\n\n--- ATTACHED FILES ---\n\n${attachmentText}`
            : `Please analyze the following files:\n\n${attachmentText}`;
        }
      }
      
      const apiMessages = [...chatState.messages.filter(msg => msg.role !== 'system'), {
        role: 'user',
        content: messageContent
      }];

      if (chatState.multiModelMode) {
        if (chatState.consensusMode) {
          // Get consensus response from all models
          const consensusResponse = await generateConsensusResponse(apiMessages);
          
          // Create assistant message for consensus
          const assistantMessage: Message = {
            id: uuidv4(),
            role: 'assistant',
            content: consensusResponse.content,
            timestamp: new Date(),
            modelName: consensusResponse.modelName
          };

          // Update state with consensus message
          setChatState(prev => ({
            ...prev,
            messages: [...prev.messages, assistantMessage],
            isLoading: false
          }));
        } else {
          // Get responses from selected models
          const modelResponses = await Promise.all(
            selectedModels.map(model =>
              client.chat.completions.create({
                model: model.id,
                messages: apiMessages,
                extra_headers: {
                  'HTTP-Referer': window.location.href,
                  'X-Title': 'Otto Chat Interface',
                },
              }).then(completion => ({
                modelId: model.id,
                modelName: model.name,
                content: completion.choices[0].message.content
              })).catch(error => ({
                modelId: model.id,
                modelName: model.name,
                content: `Error: Could not generate response from ${model.name}.`
              }))
            )
          );
          
          // Create assistant messages for each model
          const assistantMessages = modelResponses.map(response => ({
            id: uuidv4(),
            role: 'assistant' as const,
            content: response.content,
            timestamp: new Date(),
            modelName: response.modelName
          }));

          // Update state with all assistant messages
          setChatState(prev => ({
            ...prev,
            messages: [...prev.messages, ...assistantMessages],
            isLoading: false
          }));
        }
      } else {
        // Get response from single selected model
        const response = await generateChatResponse(apiMessages, selectedModel.id);

        // Create assistant message
        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: response || "I'm sorry, I couldn't generate a response.",
          timestamp: new Date(),
          modelName: selectedModel.name
        };

        // Update state with assistant message
        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to get response. Please try again.'
      }));
    }
  };

  const handleModelChange = (model: ModelOption) => {
    setSelectedModel(model);
    
    // Add a system message to indicate model change
    const systemMessage: Message = {
      id: uuidv4(),
      role: 'system',
      content: `Switched to ${model.name}`,
      timestamp: new Date()
    };
    
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, systemMessage]
    }));
  };

  const toggleMultiModelMode = () => {
    const newMultiModelMode = !chatState.multiModelMode;
    let newConsensusMode = chatState.consensusMode;
    
    // If turning off multi-model mode, also turn off consensus mode
    if (!newMultiModelMode) {
      newConsensusMode = false;
    }
    
    // Add a system message to indicate mode change
    const systemMessage: Message = {
      id: uuidv4(),
      role: 'system',
      content: newMultiModelMode 
        ? 'Multi-model mode activated. All models will respond to your messages.' 
        : `Multi-model mode deactivated. Only ${selectedModel.name} will respond.`,
      timestamp: new Date()
    };
    
    setChatState(prev => ({
      ...prev,
      multiModelMode: newMultiModelMode,
      consensusMode: newConsensusMode,
      messages: [...prev.messages, systemMessage]
    }));
  };

  const toggleConsensusMode = () => {
    // Only allow toggling consensus mode if multi-model mode is active
    if (!chatState.multiModelMode) return;
    
    const newConsensusMode = !chatState.consensusMode;
    
    // Add a system message to indicate mode change
    const systemMessage: Message = {
      id: uuidv4(),
      role: 'system',
      content: newConsensusMode 
        ? 'Consensus mode activated. Models will collaborate to provide a single best response.' 
        : 'Consensus mode deactivated. All models will provide individual responses.',
      timestamp: new Date()
    };
    
    setChatState(prev => ({
      ...prev,
      consensusMode: newConsensusMode,
      messages: [...prev.messages, systemMessage]
    }));
  };

  // Clear chat history
  const clearChat = () => {
    setChatState({
      messages: [],
      isLoading: false,
      error: null,
      multiModelMode: chatState.multiModelMode,
      consensusMode: chatState.consensusMode,
      attachments: [],
      selectedModels: selectedModels
    });
    
    // Update the current session if it exists
    if (currentSessionId) {
      updateSessionWithMessages(currentSessionId, []);
    }
  };

  const handleClearChatClick = () => {
    setShowClearConfirmation(true);
  };

  const handleConfirmClear = (confirmed: boolean) => {
    if (confirmed) {
      clearChat();
    }
    setShowClearConfirmation(false);
  };

  const handleModelSelection = (model: ModelOption) => {
    if (chatState.multiModelMode) {
      setSelectedModels(prev => {
        const isSelected = prev.some(m => m.id === model.id);
        if (isSelected) {
          // Don't allow deselecting if it's the last selected model
          if (prev.length === 1) return prev;
          return prev.filter(m => m.id !== model.id);
        } else {
          return [...prev, model];
        }
      });
    } else {
      setSelectedModel(model);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      const newAttachments: Attachment[] = [];
      
      for (const file of files) {
        try {
          const attachment = await processFile(file);
          if (attachment) {
            newAttachments.push(attachment);
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          // Add a system message about the error
          const errorMessage: Message = {
            id: uuidv4(),
            role: 'system',
            content: `Error uploading ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date()
          };
          
          setChatState(prev => ({
            ...prev,
            messages: [...prev.messages, errorMessage]
          }));
        }
      }
      
      if (newAttachments.length > 0) {
        setChatState(prev => ({
          ...prev,
          attachments: [...prev.attachments, ...newAttachments]
        }));
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setChatState(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== id)
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header 
        onClearChat={handleClearChatClick}
        chatSessions={chatSessions}
        currentSessionId={currentSessionId}
        onCreateNewSession={createNewSession}
        onSelectSession={selectSession}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
      />
      
      <main className="flex-1 flex flex-col pt-14 sm:pt-16 pb-28 sm:pb-32 overflow-hidden">
        <ChatContainer 
          messages={chatState.messages} 
          isLoading={chatState.isLoading} 
        />
      </main>
      
      <footer className="fixed bottom-0 left-0 right-0 p-3 sm:p-6 flex flex-col items-center bg-black bg-opacity-90">
        <InputBar 
          onSendMessage={handleSendMessage} 
          isLoading={chatState.isLoading}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          multiModelMode={chatState.multiModelMode}
          onToggleMultiModelMode={toggleMultiModelMode}
          consensusMode={chatState.consensusMode}
          onToggleConsensusMode={toggleConsensusMode}
          attachments={chatState.attachments}
          onAddAttachment={handleFileUpload}
          onRemoveAttachment={handleRemoveAttachment}
          availableModels={AVAILABLE_MODELS}
          selectedModels={selectedModels}
          onModelSelection={handleModelSelection}
        />
        <FooterButtons />
      </footer>

      {/* Clear Chat Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4"
            >
              <h3 className="text-lg font-medium text-white mb-4">Clear Chat?</h3>
              <p className="text-gray-300 mb-6">Are you sure you want to clear the current chat? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleConfirmClear(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleConfirmClear(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Clear
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;