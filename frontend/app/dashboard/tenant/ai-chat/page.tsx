'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert } from '@/components/UIComponents';
import { LoadingPage } from '@/components/LoadingSpinner';
import { aiChatApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  MessageCircle,
  Send,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Bot,
  User,
  Sparkles,
  Clock,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { Conversation, ChatMessage } from '@/types';

// Simple Card component for chat UI
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm ${className}`}>
    {children}
  </div>
);

export default function AIChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const data = await aiChatApi.getConversations();
      setConversations(data);

      // Load the first conversation if available
      if (data.length > 0 && !activeConversation) {
        loadConversation(data[0].id);
      }
    } catch (error: any) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const data = await aiChatApi.getConversation(conversationId);
      setActiveConversation(data);
      setMessages(data.messages || []);
    } catch (error: any) {
      console.error('Error loading conversation:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const newConversation = await aiChatApi.createConversation('New Conversation');
      setConversations([newConversation, ...conversations]);
      setActiveConversation(newConversation);
      setMessages([]);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeConversation || isSending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await aiChatApi.sendMessage(activeConversation.id, messageText);
      
      // Add both user and assistant messages
      setMessages([
        ...messages,
        response.userMessage,
        response.assistantMessage
      ]);

      // Update conversation list (move to top)
      const updatedConversations = [
        activeConversation,
        ...conversations.filter(c => c.id !== activeConversation.id)
      ];
      setConversations(updatedConversations);
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        conversationId: activeConversation.id,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        createdAt: new Date().toISOString()
      };
      setMessages([...messages, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await aiChatApi.deleteConversation(conversationId);
      const updatedConversations = conversations.filter(c => c.id !== conversationId);
      setConversations(updatedConversations);

      if (activeConversation?.id === conversationId) {
        if (updatedConversations.length > 0) {
          loadConversation(updatedConversations[0].id);
        } else {
          setActiveConversation(null);
          setMessages([]);
        }
      }
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
    }
  };

  const startEditingTitle = (conversation: Conversation) => {
    setEditingTitle(conversation.id);
    setEditedTitle(conversation.title);
  };

  const saveTitle = async (conversationId: string) => {
    if (!editedTitle.trim()) {
      setEditingTitle(null);
      return;
    }

    try {
      const updated = await aiChatApi.updateConversation(conversationId, editedTitle.trim());
      setConversations(conversations.map(c => 
        c.id === conversationId ? { ...c, title: updated.title } : c
      ));
      if (activeConversation?.id === conversationId) {
        setActiveConversation({ ...activeConversation, title: updated.title });
      }
      setEditingTitle(null);
    } catch (error: any) {
      console.error('Error updating title:', error);
    }
  };

  const cancelEditingTitle = () => {
    setEditingTitle(null);
    setEditedTitle('');
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Financial Assistant</h1>
            <p className="text-gray-600 dark:text-gray-400">Chat about your expenses and financial insights</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={createNewConversation}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </motion.button>
      </motion.div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-250px)]">
        {/* Conversations Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="lg:col-span-1"
            >
              <Card className="h-full overflow-y-auto">
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversations</h2>
                  <div className="space-y-2">
                    {conversations.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No conversations yet</p>
                        <p className="text-xs mt-1">Start a new chat to begin</p>
                      </div>
                    ) : (
                      conversations.map((conversation) => (
                        <motion.div
                          key={conversation.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => loadConversation(conversation.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            activeConversation?.id === conversation.id
                              ? 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 shadow-md'
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {editingTitle === conversation.id ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                autoFocus
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') saveTitle(conversation.id);
                                  if (e.key === 'Escape') cancelEditingTitle();
                                }}
                              />
                              <button
                                onClick={() => saveTitle(conversation.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEditingTitle}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                                  {conversation.title}
                                </p>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingTitle(conversation);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteConversation(conversation.id);
                                    }}
                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(conversation.updatedAt)}
                                </p>
                              </div>
                              {conversation.messages && conversation.messages.length > 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                  {conversation.messages[0].content}
                                </p>
                              )}
                            </>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={showSidebar ? 'lg:col-span-3' : 'lg:col-span-4'}
        >
          <Card className="h-full flex flex-col">
            {!activeConversation ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Bot className="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Welcome to Your AI Financial Assistant
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                    I can help you understand your expenses, analyze spending patterns, and provide financial insights based on your data.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={createNewConversation}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Start a Conversation
                  </motion.button>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowSidebar(!showSidebar)}
                      className="lg:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {activeConversation.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        AI powered by Gemini 2.5 Flash
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Send a message to start the conversation</p>
                        <p className="text-xs mt-1">Ask me anything about your expenses and finances!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p
                            className={`text-xs mt-2 ${
                              message.role === 'user'
                                ? 'text-purple-100'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                  {isSending && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="flex gap-3 justify-start"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                        <Loader2 className="w-5 h-5 text-gray-600 dark:text-gray-300 animate-spin" />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about your expenses..."
                      disabled={isSending}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isSending}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send
                        </>
                      )}
                    </motion.button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    I have access to your expenses, bills, and rent plan to provide personalized insights.
                  </p>
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
