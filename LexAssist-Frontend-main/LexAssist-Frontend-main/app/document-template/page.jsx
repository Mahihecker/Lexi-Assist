// app/doc-analyzer/page.js
"use client";
import { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useDocument } from '@/context/DocumentContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DocAnalyzerPage() {
    const [file, setFile] = useState(null);
    const [analysisResult, setAnalysisResult] = useState("");
    const [originalText, setOriginalText] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState("");

    const { setDocumentContext } = useDocument();
    const router = useRouter();

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleAnalyze = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }
        setIsAnalyzing(true);
        setError("");
        setAnalysisResult("");
        setOriginalText("");

        const formData = new FormData();
        formData.append('file', file);
        formData.append('prompt_text', "Explain this legal document in simple terms for a non-lawyer, and create a bulleted list of the most important key points (like parties involved, key dates, and obligations).");

        try {
            const { data } = await apiClient.post('/documents/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAnalysisResult(data.analysis_result);
            setOriginalText(data.original_text);
        } catch (err) {
            console.error("Analysis failed:", err);
            setError(err.response?.data?.detail || "An error occurred during analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleUseInChatbot = async () => {
        if (!originalText || !file) return;

        try {
            // Create a new chat session
            const { data: newChat } = await apiClient.post("/chats");
            
            // Set the document context with the chat ID
            // The document will be sent as context with EVERY user message
            setDocumentContext({
                text: originalText,
                filename: file.name,
                chatId: newChat._id
            });
            
            // Navigate to chatbot
            router.push('/chatbot');

        } catch (error) {
            console.error("Failed to create new chat for document:", error);
            setError("Could not start a new chat session. Please try again.");
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-[calc(100vh-128px)] bg-[var(--legal-cream)] p-6 md:p-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-semibold text-[var(--legal-ink)] mb-6 text-center">Document Templates</h1>
                    
                    <div className="bg-white p-6 rounded-xl shadow-md border border-[var(--legal-border)] mb-8">
                        <h2 className="text-xl font-medium text-[var(--legal-ink)] mb-4">Upload Your Document</h2>
                        <input 
                            type="file" 
                            accept=".pdf,.docx"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--legal-gold)] file:text-white hover:file:bg-[var(--legal-gold-hover)] file:cursor-pointer"
                        />
                        <button 
                            onClick={handleAnalyze} 
                            disabled={isAnalyzing || !file}
                            className="mt-4 w-full bg-[var(--legal-navy)] text-white py-3 rounded-lg font-semibold hover:bg-[var(--legal-navy-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isAnalyzing ? "Analyzing..." : "Analyze Document"}
                        </button>
                    </div>

                    {error && <p className="text-red-600 text-center mb-4">{error}</p>}
                    
                    {analysisResult && (
                        <div className="bg-white p-6 rounded-xl shadow-inner border border-[var(--legal-border)]">
                            <h2 className="text-2xl font-semibold text-[var(--legal-ink)] mb-4">Analysis Result</h2>
                            <div className="prose max-w-none whitespace-pre-wrap text-[var(--legal-ink)]">
                                {analysisResult}
                            </div>
                            <button
                                onClick={handleUseInChatbot}
                                className="mt-6 w-full bg-[var(--legal-gold)] text-white py-3 rounded-lg font-semibold hover:bg-[var(--legal-gold-hover)] transition-colors"
                            >
                                Use this Document in the Chatbot
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}