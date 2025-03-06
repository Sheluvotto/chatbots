import React, { useState } from 'react';
import { CircleSlash, Trash2, Menu, X, MessageSquare, Plus, Edit2, Check } from 'lucide-react';
import { ChatSession } from '../types/chat';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  onClearChat: () => void;
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  onCreateNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onClearChat, 
  chatSessions, 
  currentSessionId,
  onCreateNewSession,
  onSelectSession,
  onDeleteSession,
  onRenameSession
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionTitle, setEditSessionTitle] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleStartRenameSession = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditSessionTitle(session.title);
  };

  const handleSaveRename = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editSessionTitle.trim()) {
      onRenameSession(sessionId, editSessionTitle);
    }
    setEditingSessionId(null);
  };

  const handleDeleteConfirmation = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
  };

  const confirmDelete = (confirmed: boolean) => {
    if (confirmed && sessionToDelete) {
      onDeleteSession(sessionToDelete);
    }
    setSessionToDelete(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <header className="fixed top-0 left-0 w-full p-3 sm:p-4 flex justify-between items-center z-10 bg-black bg-opacity-90">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center"
      >
        <CircleSlash className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
        <span className="ml-2 text-gray-400 font-medium text-sm sm:text-base">Otto Chat Bots</span>
      </motion.div>
      <div className="flex items-center space-x-3 sm:space-x-4">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="text-gray-400 hover:text-white transition-colors"
          onClick={onClearChat}
          title="Clear chat history"
        >
          <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="text-gray-400 hover:text-white transition-colors"
          onClick={toggleMenu}
        >
          <AnimatePresence mode="wait">
            {menuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90 }}
                animate={{ rotate: 0 }}
                exit={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90 }}
                animate={{ rotate: 0 }}
                exit={{ rotate: -90 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-20 flex"
          >
            <div 
              className="bg-black bg-opacity-50 flex-grow"
              onClick={toggleMenu}
            />
            
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-64 sm:w-80 bg-gray-900 h-full overflow-y-auto flex flex-col"
            >
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-white text-lg font-medium">Chat History</h2>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onCreateNewSession();
                    toggleMenu();
                  }}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  title="New chat"
                >
                  <Plus className="h-5 w-5" />
                </motion.button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {chatSessions.length === 0 ? (
                  <div className="p-4 text-gray-400 text-center">
                    No chat history yet
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-800">
                    {chatSessions.map((session) => (
                      <motion.li 
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ backgroundColor: "rgba(31, 41, 55, 0.5)" }}
                        className={`transition-colors cursor-pointer ${
                          currentSessionId === session.id ? 'bg-gray-800' : ''
                        }`}
                        onClick={() => {
                          onSelectSession(session.id);
                          toggleMenu();
                        }}
                      >
                        <div className="p-3 flex flex-col">
                          <div className="flex justify-between items-center">
                            {editingSessionId === session.id ? (
                              <div className="flex items-center flex-1">
                                <input
                                  type="text"
                                  value={editSessionTitle}
                                  onChange={(e) => setEditSessionTitle(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-gray-700 text-white text-sm rounded px-2 py-1 flex-1 mr-1"
                                  autoFocus
                                />
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => handleSaveRename(session.id, e)}
                                  className="text-green-400 hover:text-green-300"
                                >
                                  <Check className="h-4 w-4" />
                                </motion.button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center">
                                  <MessageSquare className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-white text-sm font-medium truncate max-w-[120px]">
                                    {session.title}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => handleStartRenameSession(session, e)}
                                    className="text-gray-400 hover:text-white"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </motion.button>
                                  <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => handleDeleteConfirmation(session.id, e)}
                                    className="text-gray-400 hover:text-red-400"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </motion.button>
                                </div>
                              </>
                            )}
                          </div>
                          {editingSessionId !== session.id && (
                            <>
                              <p className="text-gray-400 text-xs mt-1 truncate">
                                {session.lastMessage}
                              </p>
                              <span className="text-gray-500 text-xs mt-1">
                                {formatDate(session.timestamp)}
                              </span>
                            </>
                          )}
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-800">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClearChat();
                    toggleMenu();
                  }}
                  className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors text-sm"
                >
                  Clear Current Chat
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        {sessionToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4"
            >
              <h3 className="text-lg font-medium text-white mb-4">Delete Chat?</h3>
              <p className="text-gray-300 mb-6">Are you sure you want to delete this chat? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => confirmDelete(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => confirmDelete(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;