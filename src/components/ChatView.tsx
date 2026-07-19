import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, CheckCheck, Award, Lock, Smartphone, ArrowLeft, Smile } from "lucide-react";
import { ClientAccount } from "../utils/weddingData";
import { SmartImage } from "./Shared";

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  reaction?: string;
}

interface ChatViewProps {
  activeClient: ClientAccount;
  onBack?: () => void;
}

const REACTIONS = ["❤️", "👍", "🙏", "✨", "🎉"];

export default function ChatView({ activeClient, onBack }: ChatViewProps) {
  const [typedMessage, setTypedMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [openReactionFor, setOpenReactionFor] = useState<string | null>(null);

  const storageKey = `wedding_chat_history_${activeClient.id}`;
  const [messages, setMessages] = useState<Message[]>(() => {
    const data = localStorage.getItem(storageKey);
    if (data) {
      try { return JSON.parse(data); } catch (e) { /* noop */ }
    }
    return [
      { id: '1', text: `Félicitations encore pour votre merveilleux mariage, ${activeClient.name} ! 🎉`, sender: 'them', time: 'Hier, 10:00' },
      { id: '2', text: `J'ai terminé le tri des photos de votre journée d'exception. J'ai chargé les clichés dans votre espace de tri. Votre objectif de sélection est de ${activeClient.targetCount} photos favorites.`, sender: 'them', time: 'Hier, 10:02' },
      { id: '3', text: `Faites simplement glisser à droite ("PRENDRE") les photos que vous voulez absolument dans votre album physique final. Écrivez-moi ici si vous voulez des retouches sur un cliché !`, sender: 'them', time: 'Hier, 10:05' }
    ];
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = { id: Date.now().toString(), text: typedMessage.trim(), sender: 'me', time: timeString };
    setMessages(prev => [...prev, newMsg]);
    setTypedMessage('');

    fetch(`/api/chats/${activeClient.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "client", text: newMsg.text })
    }).catch(() => { /* noop */ });

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const photographerReplies = [
        `Bien reçu ! Je prends note de votre demande. Je ferai ces retouches sur l'album final dès que votre sélection de ${activeClient.targetCount} photos sera validée ! 👍`,
        `C'est noté ! Pour vos favoris, vous pouvez les revoir ou les supprimer à tout moment dans l'onglet "Globale" (votre sélection).`,
        `Merci pour votre retour. Je ferai attention aux cadrages et aux lumières sur cette série de clichés. Bon tri !`,
        `Parfait ! Si vous rencontrez un souci de cadrage ou de couleurs, indiquez-moi juste le numéro ou le nom de la photo en question.`
      ];
      const chosenReply = photographerReplies[Math.floor(Math.random() * photographerReplies.length)];
      const replyMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: chosenReply,
        sender: 'them',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, replyMsg]);
      fetch(`/api/chats/${activeClient.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "photographer", text: chosenReply })
      }).catch(() => { /* noop */ });
    }, 1500);
  };

  const handleReact = (msgId: string, reaction: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reaction: m.reaction === reaction ? undefined : reaction } : m));
    setOpenReactionFor(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-app)] text-brand-moss min-h-0">
      <div className="h-16 border-b border-brand-sand px-4 flex items-center justify-between bg-[var(--bg-panel)] sticky top-0 backdrop-blur shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button type="button" onClick={onBack} aria-label="Retour"
              className="p-1 mr-0.5 text-brand-sage hover:text-brand-olive hover:bg-brand-cream rounded-full cursor-pointer transition-colors active:scale-90">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="relative">
            <SmartImage src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150" alt="Damien" fit="cover" className="w-10 h-10 rounded-full border-2 border-brand-sand p-0.5 shadow-sm" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div className="text-left select-text">
            <div className="flex items-center gap-1">
              <span className="font-serif-display font-bold text-[13px] text-brand-olive">Damien (Atelier)</span>
              <Award className="w-3.5 h-3.5 text-brand-gold" />
            </div>
            <span className="text-[10px] text-brand-sage font-bold block">{typing ? "En train d'écrire..." : "En ligne · Prêt à retoucher"}</span>
          </div>
        </div>
        <div className="bg-brand-sand border border-brand-sage/20 text-brand-olive text-[9px] px-3 py-1 rounded-full uppercase tracking-wider font-extrabold max-md:hidden">
          Album Privé
        </div>
      </div>

      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3 no-scrollbar min-h-0 bg-[var(--bg-app)]">
        <div className="text-center py-1.5 shrink-0">
          <span className="inline-flex items-center gap-1 bg-[var(--bg-panel)] border border-brand-sage/15 px-3 py-1 rounded-full text-[9px] text-brand-sage font-extrabold uppercase tracking-widest shadow-sm">
            <Lock className="w-2.5 h-2.5 text-brand-gold" />
            Espace Sécurisé de l'Auteur
          </span>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isSenderMe = msg.sender === 'me';
            return (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 18, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 22, stiffness: 250 }}
                className={`flex flex-col max-w-[85%] relative group ${isSenderMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className="relative">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setOpenReactionFor(openReactionFor === msg.id ? null : msg.id)}
                    className={`p-3 rounded-2xl text-xs leading-relaxed select-text text-left shadow-sm ${
                      isSenderMe ? 'bg-brand-olive text-brand-cream rounded-br-none' : 'bg-[var(--bg-panel)] text-brand-moss border border-brand-sand rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                    {msg.reaction && <span className="ml-1.5 text-base">{msg.reaction}</span>}
                  </motion.button>

                  <AnimatePresence>
                    {openReactionFor === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.85 }}
                        transition={{ type: "spring", damping: 18, stiffness: 280 }}
                        className={`absolute z-20 ${isSenderMe ? 'right-0' : 'left-0'} -top-10 bg-[var(--bg-panel)] border border-brand-sand rounded-full shadow-xl px-2 py-1 flex gap-1`}
                      >
                        {REACTIONS.map(r => (
                          <motion.button
                            key={r}
                            whileTap={{ scale: 0.8 }}
                            whileHover={{ scale: 1.2 }}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleReact(msg.id, r); }}
                            className="text-lg hover:bg-brand-cream rounded-full w-7 h-7 flex items-center justify-center cursor-pointer"
                          >{r}</motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-brand-sage mt-1 select-none font-bold">
                  <span>{msg.time}</span>
                  {isSenderMe && <CheckCheck className={`w-3 h-3 stroke-[2.5] ${msg.reaction ? "text-emerald-500" : "text-brand-gold"}`} />}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center gap-2 mr-auto bg-[var(--bg-panel)] border border-brand-sand rounded-2xl rounded-bl-none px-3 py-2.5 shadow-sm w-fit"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-sage typing-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-sage typing-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-sage typing-dot" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSendMessage} className="shrink-0 p-3 bg-[var(--bg-panel)] border-t border-brand-sand flex items-center gap-2 safe-bottom">
        <input
          type="text"
          placeholder="Écrivez à votre photographe..."
          value={typedMessage}
          onChange={(e) => setTypedMessage(e.target.value)}
          aria-label="Message au photographe"
          className="flex-1 bg-brand-cream border border-brand-sand rounded-full px-4 py-2.5 text-xs text-brand-olive focus:outline-none focus:border-brand-sage placeholder:text-brand-sage/75"
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.9 }}
          disabled={!typedMessage.trim()}
          aria-label="Envoyer"
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all ${
            typedMessage.trim() ? "bg-brand-olive hover:bg-brand-moss text-brand-cream cursor-pointer" : "bg-brand-sand text-brand-sage/40 cursor-not-allowed"
          }`}
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </form>
    </div>
  );
}
