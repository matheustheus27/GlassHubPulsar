import React from 'react';
import { useChatStorage } from '../hooks/useChatStorage';
import { processInHtml } from '../services/tagProcessorService';
import { sendAIChatMessage } from '../services/aiChatService';
import { ChatMessage } from '../types/aiType';
import { Settings } from '../types/settingsType';

interface AIChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    documentPayload: Record<string, any>;
    lang: string;
    style: React.CSSProperties;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
    isOpen,
    onClose,
    documentPayload,
    lang,
    style
}) => {
    const {
        messages,
        setMessages,
        input,
        setInput,
        loading,
        setLoading,
        clearChat
    } = useChatStorage();

    if (!isOpen) return null;

    const handleSendMessage = async () => {
        if (!input.trim() || loading === 'Y') return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setInput('');
        setLoading('Y');

        try {
            const assistantResponse = await sendAIChatMessage({ document: documentPayload, messages: updatedMessages });
            setMessages([...updatedMessages, assistantResponse]);
        } catch (error) {
            console.error('AI Chat Error:', error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: lang === 'pt-BR'
                    ? '⚠️ <HIGHLIGHT>Erro de Conexão:</HIGHLIGHT> Não foi possível comunicar com o motor de IA local.'
                    : '⚠️ <HIGHLIGHT>Connection Error:</HIGHLIGHT> Unable to communicate with the local AI engine.'
            };
            setMessages([...updatedMessages, errorMessage]);
        } finally {
            setLoading('N');
        }
    };

    return (
        <div
            style={style}
            className="fixed bottom-6 right-6 w-[90vw] sm:w-96 h-[520px] max-h-[80vh] border rounded-2xl shadow-2xl z-50 flex flex-col backdrop-blur-md transition-all duration-300 overflow-hidden print:hidden"
        >
            {/* HEADER SECTION */}
            <div
                style={style}
                className="p-3.5 border-b flex justify-between items-center bg-slate-900/40 backdrop-blur-sm"
            >
                <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                    ✨ {lang === 'pt-BR' ? 'Assistente de IA' : 'AI Assistant'}
                </h3>
                <div className="flex items-center gap-2">
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            title={lang === 'pt-BR' ? 'Limpar histórico' : 'Clear history'}
                            className="text-xs text-slate-400 hover:text-red-400 px-1.5 py-0.5 transition cursor-pointer"
                        >
                            🗑️
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-xs p-1 transition cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* MESSAGES HISTORY */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
                {messages.length === 0 && (
                    <div className="text-center mt-10 px-2 space-y-2">
                        <div className="text-2xl">💡</div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            {lang === 'pt-BR'
                                ? 'Pergunte à IA como melhorar métricas, ajustar textos ou reescrever trechos do seu documento.'
                                : 'Ask the AI how to improve metrics, adjust text, or rewrite sections of your document.'}
                        </p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`p-3 rounded-xl text-xs leading-relaxed max-w-[88%] transition-all ${msg.role === 'user'
                                ? 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/30 ml-auto backdrop-blur-sm shadow-sm'
                                : 'bg-slate-800/40 text-slate-200 border border-slate-700/50 mr-auto backdrop-blur-sm shadow-sm'
                            }`}
                    >
                        <div dangerouslySetInnerHTML={{ __html: processInHtml(msg.content) }} />
                    </div>
                ))}

                {loading === 'Y' && (
                    <div className="text-xs text-cyan-400 animate-pulse bg-slate-800/40 border border-slate-700/40 p-2.5 rounded-xl w-fit backdrop-blur-sm">
                        {lang === 'pt-BR' ? 'Pensando...' : 'Thinking...'}
                    </div>
                )}
            </div>

            {/* INPUT BAR */}
            <div
                style={style}
                className="p-3 border-t bg-slate-900/30 backdrop-blur-sm flex gap-2"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={lang === 'pt-BR' ? 'Digite sua mensagem...' : 'Type your message...'}
                    className="flex-1 bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-cyan-300 placeholder-cyan-550 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                    onClick={handleSendMessage}
                    disabled={loading === 'Y'}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold px-3 py-2 rounded-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    {lang === 'pt-BR' ? 'Enviar' : 'Send'}
                </button>
            </div>
        </div>
    );
};