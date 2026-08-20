import React, { useState, useRef } from 'react';
import { useChatStorage } from '../hooks/useChatStorage';
import { processInHtml } from '../services/tagProcessorService';
import { sendAIChatMessage } from '../services/aiChatService';
import { ChatMessage } from '../types/aiType';
import { Button } from './atoms/Button';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documentData?: Record<string, any>;
  documentPayload?: Record<string, any>;
  lang?: string;
  style?: React.CSSProperties;
  onApplyStructuredData?: (data: any) => void;
  onApplyQuickFill?: (data: any) => void;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  documentData,
  documentPayload,
  lang = 'pt-BR',
  style,
  onApplyStructuredData,
  onApplyQuickFill
}) => {
  const [activeTab, setActiveTab] = useState<'quickFill' | 'fileImport' | 'chat'>('quickFill');
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const doc = documentData || documentPayload || {};
  const applyHandler = onApplyStructuredData || onApplyQuickFill || (() => {});

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
      const assistantResponse = await sendAIChatMessage({ document: doc, messages: updatedMessages });
      setMessages([...updatedMessages, assistantResponse]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: lang === 'pt-BR'
          ? '💡 <BOLD>Dica do Recrutador:</BOLD> Procure quantificar realizações com porcentagens ou métricas claras nas experiências profissionais.'
          : '💡 <BOLD>Recruiter Tip:</BOLD> To maximize resume impact, quantify your achievements with clear percentages or metrics.'
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setLoading('N');
    }
  };

  const handleExtractQuickFill = async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/ai/quick-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText, language: lang })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setExtractedPreview(json.data);
        setStatusMessage(lang === 'pt-BR' ? '✓ Dados estruturados com sucesso! Clique em "Aplicar no Formulário".' : '✓ Successfully structured! Click "Apply to Resume".');
      } else {
        throw new Error(json.error || 'Falha ao processar texto');
      }
    } catch (err: any) {
      setStatusMessage(`⚠️ ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsExtracting(true);
    setStatusMessage('Extraindo dados estruturados do arquivo com Llama 3.2...');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch('/api/ai/parse-resume-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64,
            fileName: file.name
          })
        });

        const json = await res.json();
        if (res.ok && json.success) {
          setExtractedPreview(json.data);
          setStatusMessage(`✓ Currículo de ${json.data.personalDetails?.name || 'candidato'} extraído com sucesso! Clique em "Aplicar no Formulário".`);
        } else {
          throw new Error(json.error || 'Falha ao analisar arquivo');
        }
      } catch (err: any) {
        setStatusMessage(`⚠️ ${err.message}`);
      } finally {
        setIsExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (!extractedPreview) return;
    applyHandler(extractedPreview);
    setStatusMessage(lang === 'pt-BR' ? '🎉 Todos os campos foram preenchidos no formulário!' : '🎉 Data applied to form!');
    setTimeout(() => onClose(), 1500);
  };

  return (
    <div
      style={style}
      className="fixed bottom-6 right-6 w-[94vw] sm:w-[460px] h-[600px] max-h-[85vh] border border-cyan-500/30 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.6)] z-50 flex flex-col bg-slate-950/95 backdrop-blur-2xl transition-all duration-300 overflow-hidden print:hidden text-slate-100 font-sans"
    >
      {/* HEADER */}
      <div className="p-3.5 border-b border-white/10 flex justify-between items-center bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('quickFill')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'quickFill' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Quick Fill
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fileImport')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'fileImport' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            📄 Importar Arquivo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'chat' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            💬 Chat
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* TAB 1: QUICK FILL VIA TEXT */}
        {activeTab === 'quickFill' && (
          <div className="space-y-3 animate-in fade-in text-xs">
            <div>
              <h4 className="font-bold text-cyan-300 uppercase tracking-wider mb-1">
                Preenchimento Rápido com IA
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Cole seu currículo em texto bruto ou descrição profissional. O Llama 3.2 estruturará automaticamente todos os campos.
              </p>
            </div>

            <textarea
              rows={8}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Cole aqui seu histórico, habilidades, experiências e contatos..."
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 leading-relaxed focus:outline-none focus:border-cyan-400 font-sans"
            />

            <Button
              variant="neon"
              size="sm"
              onClick={handleExtractQuickFill}
              isLoading={isExtracting}
              className="w-full font-bold min-h-[38px]"
            >
              Extrair e Estruturar Dados
            </Button>
          </div>
        )}

        {/* TAB 2: IMPORT RESUME FROM PDF OR DOCX FILE */}
        {activeTab === 'fileImport' && (
          <div className="space-y-3.5 animate-in fade-in text-xs">
            <div>
              <h4 className="font-bold text-cyan-300 uppercase tracking-wider mb-1">
                Importar Currículo Antigo (.PDF ou .DOCX)
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Carregue seu currículo existente em formato PDF ou Word. O motor de parsing extrairá nome, resumo, histórico e competências.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-slate-900/60 hover:bg-slate-900 transition flex flex-col items-center justify-center space-y-2 cursor-pointer text-center"
            >
              <span className="text-3xl">📁</span>
              <span className="font-bold text-slate-200 text-xs">
                {selectedFileName ? selectedFileName : 'Clique ou arraste seu arquivo .pdf ou .docx aqui'}
              </span>
              <span className="text-[10px] text-slate-400">
                Suporte nativo para PDF e Microsoft Word (.docx)
              </span>
            </div>

            <Button
              variant="glass"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              isLoading={isExtracting}
              className="w-full font-bold min-h-[38px]"
              leftIcon="📤"
            >
              {selectedFileName ? 'Trocar Arquivo' : 'Selecionar Arquivo do Computador'}
            </Button>
          </div>
        )}

        {/* TAB 3: RECRUITER AI CHAT */}
        {activeTab === 'chat' && (
          <div className="space-y-3 animate-in fade-in flex flex-col h-full">
            <div className="flex-1 space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="py-8 text-center space-y-2 text-xs text-slate-400">
                  <span className="text-2xl block">💬</span>
                  <p>Pergunte ao especialista de RH como melhorar seu resumo, otimizar palavras-chave ATS ou reescrever bullets.</p>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-none'
                          : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none'
                      }`}
                      dangerouslySetInnerHTML={{ __html: processInHtml(m.content) }}
                    />
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/10">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Pergunte ao recrutador..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
              <Button variant="neon" size="sm" onClick={handleSendMessage} isLoading={loading === 'Y'}>
                ➤
              </Button>
            </div>
          </div>
        )}

        {/* STATUS MESSAGE & APPLY BUTTON */}
        {statusMessage && (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs font-semibold text-cyan-300 animate-in fade-in">
            {statusMessage}
          </div>
        )}

        {extractedPreview && (activeTab === 'quickFill' || activeTab === 'fileImport') && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2 animate-in fade-in text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-emerald-400 uppercase tracking-wide">
                ✓ Estrutura Identificada
              </span>
              <span className="text-[10px] text-slate-400">
                {extractedPreview.personalDetails?.name || extractedPreview.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              Cargo: {extractedPreview.personalDetails?.title || extractedPreview.title || 'Especialista'}
            </p>
            <Button
              variant="neon"
              size="sm"
              onClick={handleApply}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.4)] min-h-[38px]"
            >
              🎉 Aplicar no Formulário Agora
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};