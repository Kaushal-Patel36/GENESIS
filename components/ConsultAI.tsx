'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function ConsultAI() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'system', content: 'Hello. I am the AntropiX Logic Core. I can explain the spectral analysis, gravitational attractors, or shadow phenotypes. What would you like to know?' }
    ]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { role: 'user', content: input }]);
        setInput('');

        // Mock AI response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'system',
                content: `Based on the Riemannian Log-Map (κ=-1), the patient trajectory shows a 74% drift toward the Marfan attractor. This is driven by high instability in the TGF-beta pathway (Spectral Gap: 0.44). I recommend immediate functional validation.`
            }]);
        }, 1000);
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-gradient-to-tr from-rose-600 to-violet-600 rounded-full shadow-[0_0_30px_rgba(244,63,94,0.4)] flex items-center justify-center text-white border border-white/20"
            >
                <MessageSquare className="w-6 h-6" />
            </motion.button>

            {/* Chat Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-8 z-50 w-[380px] h-[500px]"
                    >
                        <Card className="w-full h-full bg-[#0a0a1a]/90 backdrop-blur-2xl border-white/10 shadow-3xl flex flex-col overflow-hidden relative">
                            {/* Header */}
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-violet-500 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">AntropiX Core</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="relative flex h-1.5 w-1.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                            </span>
                                            <span className="text-[10px] text-emerald-400 font-mono">ONLINE</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs" ref={scrollRef}>
                                {messages.map((m, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-slate-700' : 'bg-rose-500/20 text-rose-400'}`}>
                                            {m.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Sparkles className="w-4 h-4" />}
                                        </div>
                                        <div className={`p-3 rounded-2xl max-w-[80%] ${m.role === 'user' ? 'bg-slate-800 text-slate-200' : 'bg-rose-500/10 text-rose-100 border border-rose-500/20'}`}>
                                            {m.content}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-white/5 bg-black/20">
                                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask about the analysis..."
                                        className="bg-white/5 border-white/10 text-xs focus:ring-rose-500/20 focus:border-rose-500/50"
                                    />
                                    <Button type="submit" size="icon" className="bg-rose-600 hover:bg-rose-500 text-white shrink-0">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
