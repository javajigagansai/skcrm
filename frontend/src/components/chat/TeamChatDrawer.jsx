import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  MessageSquare, Send, X, Users, AtSign, Sparkles, CheckCheck, User, Bell, Clock, ShieldCheck 
} from 'lucide-react';
import { db } from '../../config/firebaseClient';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

export const TeamChatDrawer = ({ isOpen, onClose, initialHighlightTag = null }) => {
  const { user } = useAuth();
  const { staffList: rawStaff = [] } = useData();
  
  const staffMembers = useMemo(() => {
    return (rawStaff || []).map((s, idx) => ({
      id: s.uid || s.id || `staff-${idx}`,
      name: s.name || 'Staff Member',
      role: s.title || s.role || 'Staff Advisor'
    }));
  }, [rawStaff]);

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('crm_v2_team_chat_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [inputText, setInputText] = useState('');
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [tagIndex, setTagIndex] = useState(-1);

  const chatEndRef = useRef(null);

  // Firestore Real-Time Listener (onSnapshot) + BroadcastChannel
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const chatRef = collection(db, 'team_chats');
      const q = query(chatRef, orderBy('createdAt', 'asc'));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const liveList = [];
        snapshot.forEach((docSnap) => {
          liveList.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (liveList.length > 0) {
          setMessages(liveList);
          localStorage.setItem('crm_v2_team_chat_messages', JSON.stringify(liveList));
        }
      }, (err) => {
        console.warn("Firestore live chat subscription warning:", err.message);
      });
    } catch (e) {
      console.warn("Firestore team chat fallback:", e.message);
    }

    let bc;
    try {
      bc = new BroadcastChannel('crm_v2_team_chat_channel');
      bc.onmessage = (event) => {
        if (event.data && Array.isArray(event.data.messages)) {
          setMessages(event.data.messages);
        }
      };
    } catch (e) {}

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (bc) bc.close();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    const lastAtIndex = val.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = val.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setShowTagMenu(true);
        setTagSearchTerm(textAfterAt.toLowerCase());
        setTagIndex(lastAtIndex);
        return;
      }
    }
    setShowTagMenu(false);
  };

  const handleSelectStaffTag = (staffName) => {
    if (tagIndex !== -1) {
      const beforeAt = inputText.slice(0, tagIndex);
      const updatedText = `${beforeAt}@${staffName} `;
      setInputText(updatedText);
    }
    setShowTagMenu(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const taggedStaff = staffMembers.filter(s => 
      inputText.toLowerCase().includes(`@${s.name.toLowerCase()}`)
    ).map(s => s.name);

    const newMsg = {
      id: `MSG-${Date.now()}`,
      senderName: user?.name || 'Staff User',
      senderRole: user?.roleDisplayName || user?.role || 'Staff',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      taggedStaff
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    localStorage.setItem('crm_v2_team_chat_messages', JSON.stringify(updatedMessages));

    try {
      addDoc(collection(db, 'team_chats'), {
        ...newMsg,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Firestore chat post warning:", err.message);
    }

    try {
      const bc = new BroadcastChannel('crm_v2_team_chat_channel');
      bc.postMessage({ messages: updatedMessages });
      bc.close();
    } catch (err) {}

    if (taggedStaff.length > 0) {
      const savedNotifs = localStorage.getItem('crm_v2_admin_manager_notifications');
      let notifList = [];
      if (savedNotifs) {
        try { notifList = JSON.parse(savedNotifs); } catch (err) {}
      }

      taggedStaff.forEach(taggedName => {
        const notifItem = {
          id: `CHAT-TAG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'chat_tag',
          title: `💬 You were tagged by ${newMsg.senderName} in Team Chat`,
          desc: `"${newMsg.text}"`,
          time: 'Just now',
          read: false,
          path: '/dashboard',
          targetStaffName: taggedName
        };
        notifList.unshift(notifItem);
      });

      localStorage.setItem('crm_v2_admin_manager_notifications', JSON.stringify(notifList));
    }

    setInputText('');
    setShowTagMenu(false);
  };

  const renderMessageTextWithTags = (text) => {
    const parts = text.split(/(@[A-Za-z\s]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        const matchingStaff = staffMembers.find(s => 
          part.toLowerCase().startsWith(`@${s.name.toLowerCase()}`)
        );
        if (matchingStaff) {
          return (
            <span key={idx} className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-lg text-xs border border-blue-200 mx-0.5 shadow-2xs">
              <AtSign className="h-3 w-3 text-blue-600 shrink-0" />
              <span>{matchingStaff.name}</span>
            </span>
          );
        }
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const filteredStaffList = staffMembers.filter(s => 
    s.name.toLowerCase().includes(tagSearchTerm) || s.role.toLowerCase().includes(tagSearchTerm)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 relative">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center space-x-2">
                <span>Employee Team Chat &amp; Tagging</span>
                <span className="badge bg-emerald-400 text-slate-950 text-[9px] font-black uppercase">Live</span>
              </h3>
              <p className="text-[11px] text-slate-300">Tag colleagues with <strong>@Name</strong> to send instant alerts!</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
              <MessageSquare className="h-8 w-8 text-slate-300 stroke-1" />
              <p className="text-xs font-semibold">No team messages yet.</p>
              <p className="text-[11px] text-slate-400">Type a message below to start a discussion with your team.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderName?.toLowerCase() === user?.name?.toLowerCase();
              const initial = msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'U';

              return (
                <div 
                  key={msg.id} 
                  className={`flex items-start space-x-3 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
                    {initial}
                  </div>

                  <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end text-right' : ''}`}>
                    <div className="flex items-center space-x-2 text-[11px]">
                      <span className="font-extrabold text-slate-900">{msg.senderName}</span>
                      <span className="badge badge-brand text-[9px] px-2 py-0.5">{msg.senderRole}</span>
                      <span className="text-slate-400 text-[10px]">{msg.timestamp}</span>
                    </div>

                    <div className={`p-3.5 rounded-2xl text-xs font-semibold shadow-sm leading-relaxed ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                    }`}>
                      {renderMessageTextWithTags(msg.text)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Box & Tag Suggestions Popup */}
        <div className="p-4 bg-white border-t border-slate-200 relative">
          {/* @Mention Tag Auto-Complete Dropdown Menu */}
          {showTagMenu && (
            <div className="absolute left-4 right-4 bottom-full mb-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
              <div className="px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                <AtSign className="h-3.5 w-3.5 text-blue-400" />
                <span>Tag a Colleague for Instant Notification ({filteredStaffList.length}):</span>
              </div>
              {filteredStaffList.map(staff => (
                <div
                  key={staff.id}
                  onClick={() => handleSelectStaffTag(staff.name)}
                  className="p-2.5 hover:bg-blue-50 transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="h-7 w-7 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 group-hover:text-blue-700">{staff.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{staff.role}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Tag @{staff.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input 
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Type a message... Type @ to tag a team member"
                className="w-full pl-3.5 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setInputText(prev => prev + '@');
                  setShowTagMenu(true);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition"
                title="Tag colleague (@)"
              >
                <AtSign className="h-4 w-4" />
              </button>
            </div>

            <button 
              type="submit"
              className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
