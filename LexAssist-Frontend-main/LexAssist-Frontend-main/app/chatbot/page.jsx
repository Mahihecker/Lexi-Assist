// app/chatbot/page.js
"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useRef, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import apiClient from "@/lib/apiClient";
import { useDocument } from '@/context/DocumentContext';
import ReactMarkdown from 'react-markdown';

function ConversationItem({ conversation, onClick, isActive, onDelete }) {
    const firstUserMessage = conversation.messages.find(m => m.role === 'user');
    const title = firstUserMessage ? firstUserMessage.content.substring(0, 30) + '...' : 'New Conversation';

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(conversation._id);
    };

    return (
        <div
            onClick={onClick}
            className={`p-3 my-1 cursor-pointer rounded-lg text-sm flex items-center justify-between group ${
                isActive ? 'bg-[var(--legal-navy-hover)]' : 'hover:bg-[var(--legal-navy-light)]'
            }`}
        >
            <div className="flex-1 truncate">{title}</div>
            <button
                onClick={handleDelete}
                className="ml-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete conversation"
            >
                🗑️
            </button>
        </div>
    );
}

function SummaryModal({ summary, onClose, isLoading }) {
    if (!summary && !isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--legal-navy-light)] rounded-xl shadow-2xl p-6 max-w-2xl w-full border border-[var(--legal-navy-hover)]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Conversation Summary</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                {isLoading ? (
                    <div className="text-center text-gray-400">
                        <div className="animate-pulse">Generating summary...</div>
                    </div>
                ) : (
                    <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                        <ReactMarkdown>{summary}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ChatbotPage() {
    const [user] = useAuthState(auth);
    const { documentContext, setDocumentContext } = useDocument();

    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const chatBoxRef = useRef(null);
    
    // Store document info separately for this conversation
    const [attachedDocument, setAttachedDocument] = useState(null);
    const [documentSentToBackend, setDocumentSentToBackend] = useState(false);

    const [summary, setSummary] = useState(null);
    const [isSummarizing, setIsSummarizing] = useState(false);

    // Load conversations on mount
    useEffect(() => {
        if (!user) return;
        
        const loadPage = async () => {
            setIsLoading(true);
            try {
                const { data } = await apiClient.get("/chats");
                const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setConversations(sorted);

                if (documentContext?.chatId) {
                    // If we are arriving with a document...
                    setCurrentConversationId(documentContext.chatId);
                    setAttachedDocument({ filename: documentContext.filename });
                    // Use the starter message passed from the analyzer
                    if (documentContext.starterMessage) {
                        setMessages([documentContext.starterMessage]);
                    }
                    setDocumentContext(null); // Clear context after use
                } else if (sorted.length > 0) {
                    // Otherwise, just select the most recent conversation
                    setCurrentConversationId(sorted[0]._id);
                }
            } catch (error) {
                console.error("Failed to load conversations:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadPage();
    }, [user]);

    // Sync messages when conversation changes (e.g. user switched chat or initial load)
    useEffect(() => {
        if (currentConversationId) {
            const currentConvo = conversations.find(c => c._id === currentConversationId);
            if (currentConvo) {
                setMessages(Array.isArray(currentConvo.messages) ? currentConvo.messages : []);
            }
        }
    }, [currentConversationId, conversations]);

    const handleNewChat = async () => {
        try {
            const { data: newConvo } = await apiClient.post("/chats");
            setConversations(prev => [newConvo, ...prev]);
            setCurrentConversationId(newConvo._id);
            setAttachedDocument(null); // Clear any document attachment
            setDocumentSentToBackend(false);
        } catch (error) {
            console.error("Failed to create new chat:", error);
        }
    };

    const handleDeleteChat = async (chatId) => {
        if (!confirm("Are you sure you want to delete this conversation?")) return;

        try {
            await apiClient.delete(`/chats/${chatId}`);
            
            const updatedConversations = conversations.filter(c => c._id !== chatId);
            setConversations(updatedConversations);
            
            if (currentConversationId === chatId) {
                if (updatedConversations.length > 0) {
                    setCurrentConversationId(updatedConversations[0]._id);
                } else {
                    setCurrentConversationId(null);
                    setMessages([]);
                }
                setAttachedDocument(null);
                setDocumentSentToBackend(false);
            }
        } catch (error) {
            console.error("Failed to delete conversation:", error);
            alert("Failed to delete conversation. Please try again.");
        }
    };

    const handleRemoveDocument = () => {
        if (confirm("Are you sure you want to remove the attached document? This will start a new chat without the document.")) {
            handleNewChat();
        }
    };

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (input.trim() === "" || isSending) return;

        setIsSending(true);
        const userMessageContent = input;
        setInput("");
        
        // Optimistic UI update - show only the user's actual message
        const tempUserMessage = { _id: `temp-${Date.now()}`, role: 'user', content: userMessageContent };
        setMessages(prev => [...prev, tempUserMessage]);
        
        try {
            let chatId = currentConversationId;
            // If no conversation selected, create one first (don't add to list yet - avoids sync effect wiping messages)
            if (!chatId) {
                const { data: newConvo } = await apiClient.post("/chats");
                chatId = newConvo._id;
                setCurrentConversationId(chatId);
            }

            let messageToSend = userMessageContent;
            
            // Only prepend document context on the FIRST message when document is attached
            if (attachedDocument && !documentSentToBackend) {
                messageToSend = `[DOCUMENT CONTEXT - "${attachedDocument.filename}"]\n${attachedDocument.text}\n\n[USER QUESTION]\n${userMessageContent}`;
                setDocumentSentToBackend(true); // Mark that document has been sent
            }
            
            const { data: botMessage } = await apiClient.post(`/chats/${chatId}/messages`, { 
                message_content: messageToSend 
            });
            
            // Append the assistant reply so the full chat stays visible without being overwritten
            setMessages(prev => {
                const withoutTemp = prev.filter(m => m._id !== tempUserMessage._id);
                const userMsg = { _id: tempUserMessage._id, role: 'user', content: userMessageContent };
                const assistantMsg = { _id: botMessage?.id ?? botMessage?._id ?? `msg-${Date.now()}`, role: 'assistant', content: botMessage?.content ?? '' };
                return [...withoutTemp, userMsg, assistantMsg];
            });
            
            // Re-fetch conversations so sidebar list and current convo stay in sync
            const { data } = await apiClient.get("/chats");
            const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setConversations(sorted);
            
        } catch (error) {
            const status = error.response?.status;
            const rawDetail = error.response?.data?.detail ?? error.response?.data?.message ?? error.message;
            console.error("Failed to send message:", status, rawDetail, error.response?.data);
            const detailStr = Array.isArray(rawDetail) ? rawDetail.map(d => d?.msg ?? d).join(" ") : (typeof rawDetail === "string" ? rawDetail : "");
            const userMessage = detailStr && detailStr.length < 300 ? detailStr : "Sorry, an error occurred.";
            setMessages(prev => [...prev.filter(m => m._id !== tempUserMessage._id), { 
                _id: `err-${Date.now()}`, 
                role: 'assistant', 
                content: userMessage 
            }]);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // --- 3. ADD THE SUMMARIZATION HANDLER FUNCTION ---
    const handleSummarize = async () => {
        if (!currentConversationId) {
            alert("Please select a conversation to summarize.");
            return;
        }
        setIsSummarizing(true);
        setSummary(null); // Clear previous summary

        try {
            const { data } = await apiClient.post(`/chats/${currentConversationId}/summarize`);
            setSummary(data.summary);
        } catch (error) {
            console.error("Failed to generate summary:", error);
            setSummary("Sorry, an error occurred while generating the summary.");
        } finally {
            // No need to set isSummarizing to false here,
            // as the modal will be displayed with the result or error.
        }
    };
    
    const closeSummaryModal = () => {
        setSummary(null);
        setIsSummarizing(false);
    };


    return (
        <ProtectedRoute>
             {/* --- 4. RENDER THE MODAL --- */}
             <SummaryModal 
                summary={summary} 
                onClose={closeSummaryModal}
                isLoading={isSummarizing && !summary}
            />
            <div className="flex h-[calc(100vh-80px)] min-h-[480px] bg-[var(--legal-navy)] text-white">
                <div className="w-1/5 bg-[var(--legal-navy-light)] p-4 flex flex-col border-r border-[var(--legal-navy-hover)]">
                    <h2 className="text-lg font-semibold pb-4 border-b border-[var(--legal-navy-hover)]">Your Chats</h2>
                    <button 
                        onClick={handleNewChat} 
                        className="my-4 w-full bg-[var(--legal-gold)] text-white py-2.5 rounded-lg font-semibold hover:bg-[var(--legal-gold-hover)] disabled:opacity-50 transition-colors" 
                        disabled={isLoading || isSending}
                    >
                        + New Chat
                    </button>
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? ( 
                            <p className="text-gray-400">Loading...</p>
                        ) : (
                            conversations.map(convo => (
                                <ConversationItem
                                    key={convo._id}
                                    conversation={convo}
                                    onClick={() => {
                                        setCurrentConversationId(convo._id);
                                        // Clear document when switching to a different conversation
                                        if (convo._id !== currentConversationId) {
                                            setAttachedDocument(null);
                                            setDocumentSentToBackend(false);
                                        }
                                    }}
                                    isActive={currentConversationId === convo._id}
                                    onDelete={handleDeleteChat}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col relative bg-gray-50">

                     {/* --- 5. ADD THE SUMMARIZE BUTTON TO THE CHAT HEADER --- */}
                     <header className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
                        <button 
                            onClick={handleSummarize}
                            disabled={isSummarizing || !currentConversationId || messages.length < 2}
                            className="text-sm bg-[var(--legal-gold)] text-white px-3 py-1.5 rounded-lg hover:bg-[var(--legal-gold-hover)] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                            title="Generate a summary of this conversation"
                        >
                            Summarize
                        </button>
                    </header>

                    {/* Chat Messages Area */}
                    <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-gray-50" ref={chatBoxRef}>
                        {isLoading ? ( 
                            <div className="text-center text-gray-500 m-auto">Loading...</div> 
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <p className="text-gray-600 text-lg mb-2">
                                    {attachedDocument 
                                        ? `Document "${attachedDocument.filename}" is attached.`
                                        : "Start a conversation"
                                    }
                                </p>
                                <p className="text-gray-500 text-sm">
                                    {attachedDocument 
                                        ? "Ask me anything about this document!"
                                        : "Type a message below to begin."
                                    }
                                </p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                // Filter out the document context from display
                                if (msg.role === 'user' && msg.content.startsWith('[DOCUMENT CONTEXT')) {
                                    // Extract only the user question part
                                    const userQuestionMatch = msg.content.match(/\[USER QUESTION\]\n([\s\S]*)/);
                                    if (userQuestionMatch) {
                                        return (
                                            <div 
                                                key={msg._id || `msg-${index}`} 
                                                className="max-w-[70%] p-3 rounded-lg leading-relaxed whitespace-pre-wrap bg-[var(--legal-gold)] text-white self-end"
                                            >
                                                {userQuestionMatch[1]}
                                            </div>
                                        );
                                    }
                                    return null; // Skip if can't parse
                                }
                                
                                // Display regular messages
                                if (msg.role === 'user' || msg.role === 'assistant') {
                                    return (
                                        <div 
                                            key={msg._id || `msg-${index}`} 
                                            className={`max-w-[70%] p-3 rounded-lg leading-relaxed whitespace-pre-wrap ${
                                                msg.role === "user" 
                                                    ? "bg-[var(--legal-gold)] text-white self-end" 
                                                    : "bg-gray-200/80 text-gray-900 self-start"
                                            }`}
                                        >
                                            <div className="prose max-w-none text-gray-900">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })
                        )}
                        {isSending && ( 
                            <div className="max-w-[70%] p-3 rounded-lg leading-relaxed bg-gray-200/80 text-gray-900 self-start animate-pulse">
                                ...
                            </div> 
                        )}
                    </div>

                    {/* Input Area with Document Popup */}
                    <div className="relative">
                        {/* Document Attachment Popup - Compact and positioned at bottom left */}
                        {attachedDocument && (
                            <div className="absolute bottom-full left-4 mb-2 bg-gray-100 border border-gray-300 rounded-lg shadow-lg p-2.5 flex items-center gap-2 max-w-md">
                                <span className="text-green-600 text-lg flex-shrink-0">📎</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-900 text-sm font-medium truncate">
                                        {attachedDocument.filename}
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        Document attached
                                    </p>
                                </div>
                                <button
                                    onClick={handleRemoveDocument}
                                    className="ml-2 text-gray-500 hover:text-red-500 transition-colors flex-shrink-0"
                                    title="Remove document"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Input Bar */}
                        <div className="flex items-center p-4 bg-gray-50 border-t border-gray-200">
                            <input
                                type="text"
                                placeholder={attachedDocument ? "Ask about the document..." : "Type your message..."}
                                className="flex-1 p-3 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--legal-gold)] disabled:opacity-50"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                disabled={isLoading || isSending}
                            />
                            <button
                                onClick={handleSend}
                                className="ml-3 px-4 py-3 rounded-lg bg-[var(--legal-gold)] hover:bg-[var(--legal-gold-hover)] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                disabled={isLoading || isSending}
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}