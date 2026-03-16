import { useState, useEffect, useRef, FormEvent } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, where, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Message, UserProfile } from '../types';
import { Send, Search, User, MessageSquare, Phone, Video, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function Messaging() {
  const { t, isRTL } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [selectedContact, setSelectedContact] = useState<UserProfile | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!auth.currentUser) return;
      const q = query(collection(db, 'users'), limit(20));
      const snap = await onSnapshot(q, (s) => {
        setContacts(s.docs.map(doc => doc.data() as UserProfile).filter(u => u.uid !== auth.currentUser?.uid));
      });
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    if (!selectedContact || !auth.currentUser) return;

    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const allMsgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      // Filter client-side for simplicity in this demo (real app would use complex query)
      const filtered = allMsgs.filter(m => 
        (m.senderId === auth.currentUser?.uid && m.receiverId === selectedContact.uid) ||
        (m.senderId === selectedContact.uid && m.receiverId === auth.currentUser?.uid)
      );
      setMessages(filtered);
    });

    return () => unsubscribe();
  }, [selectedContact]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: auth.currentUser.uid,
        receiverId: selectedContact.uid,
        content: newMessage,
        timestamp: new Date().toISOString()
      });
      setNewMessage('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={`h-[calc(100vh-12rem)] bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden flex ${isRTL ? 'flex-row-reverse' : ''}`}>
      {/* Contacts Sidebar */}
      <div className={`w-80 border-stone-100 flex flex-col ${isRTL ? 'border-l' : 'border-r'}`}>
        <div className="p-6 border-b border-stone-100">
          <h3 className={`text-xl font-bold text-stone-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('messages')}</h3>
          <div className="relative">
            <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-stone-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input 
              type="text" 
              placeholder={t('search')}
              className={`w-full py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'}`}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {contacts.map((contact) => (
            <button
              key={contact.uid}
              onClick={() => setSelectedContact(contact)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                selectedContact?.uid === contact.uid ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-stone-50 text-stone-600'
              } ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-bold text-xs shrink-0">
                {contact.displayName ? contact.displayName[0] : 'U'}
              </div>
              <div className={`min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-sm font-bold truncate">{contact.displayName || contact.email}</p>
                <p className="text-xs opacity-70 capitalize">{contact.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-stone-50/30">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className={`h-16 bg-white border-b border-stone-100 px-6 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                  {selectedContact.displayName ? selectedContact.displayName[0] : 'U'}
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-bold text-stone-900">{selectedContact.displayName || selectedContact.email}</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">{t('online')}</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button className="p-2 text-stone-400 hover:text-emerald-600 transition-colors"><Phone className="w-5 h-5" /></button>
                <button className="p-2 text-stone-400 hover:text-emerald-600 transition-colors"><Video className="w-5 h-5" /></button>
                <button className="p-2 text-stone-400 hover:text-emerald-600 transition-colors"><Info className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.senderId === auth.currentUser?.uid ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}
                >
                  <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                    msg.senderId === auth.currentUser?.uid 
                      ? 'bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-100' 
                      : 'bg-white text-stone-800 rounded-tl-none border border-stone-100 shadow-sm'
                  } ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 opacity-60 ${msg.senderId === auth.currentUser?.uid ? (isRTL ? 'text-left' : 'text-right') : (isRTL ? 'text-right' : 'text-left')}`}>
                      {new Date(msg.timestamp).toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-stone-100">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('typeMessage')}
                  className={`flex-1 px-6 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isRTL ? 'text-right' : 'text-left'}`}
                />
                <button 
                  type="submit"
                  className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                >
                  <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10" />
            </div>
            <p className="font-medium">{t('selectContact')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
