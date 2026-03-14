'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { api } from '../../lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Send, ArrowLeft, Search, MessageCircle } from 'lucide-react';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const socket = useSocket();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
    if (user) loadConversations();
  }, [user, authLoading]);

  useEffect(() => {
    const toId = searchParams.get('to');
    if (toId && user) {
      loadMessages(toId);
    }
  }, [searchParams, user]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('new_message', (msg) => {
      if (selectedUser && msg.sender_id === selectedUser.id) {
        setMessages(prev => [...prev, msg]);
      }
      loadConversations();
    });

    socket.on('message_sent', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off('new_message');
      socket.off('message_sent');
    };
  }, [socket, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadMessages = async (userId) => {
    try {
      const msgs = await api.getMessages(userId);
      setMessages(msgs);
      
      // If we don't have the partner info, find it or create it
      const conv = conversations.find(c => c.partner?.id === userId);
      if (conv) {
        setSelectedUser(conv.partner);
      } else {
        try {
          const profile = await api.getProfile(userId);
          setSelectedUser({ id: profile.id, name: profile.name, avatar: profile.avatar });
        } catch (err) { console.error(err); }
      }
    } catch (err) { console.error(err); }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    if (socket) {
      socket.emit('send_message', {
        receiver_id: selectedUser.id,
        content: newMessage
      });
    } else {
      try {
        const msg = await api.sendMessage({ receiver_id: selectedUser.id, content: newMessage });
        setMessages(prev => [...prev, msg]);
      } catch (err) { console.error(err); }
    }

    setNewMessage('');
  };

  const selectConversation = (conv) => {
    setSelectedUser(conv.partner);
    loadMessages(conv.partner.id);
  };

  if (authLoading) return <div className="loading-page page"><div className="spinner" /></div>;

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className={`chat-sidebar ${!selectedUser ? 'open' : ''}`}>
        <div className="chat-sidebar-header">
          <h2><MessageCircle size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />Messages</h2>
        </div>
        <ul className="chat-list">
          {conversations.map(conv => (
            <li key={conv.partner?.id} className={`chat-item ${selectedUser?.id === conv.partner?.id ? 'active' : ''}`} onClick={() => selectConversation(conv)}>
              <div className="avatar avatar-placeholder" style={{ width: '42px', height: '42px', flexShrink: 0 }}>
                {conv.partner?.avatar ? <img src={conv.partner.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : conv.partner?.name?.charAt(0)}
              </div>
              <div className="chat-item-meta">
                <div className="chat-item-name">{conv.partner?.name}</div>
                <div className="chat-item-preview">{conv.lastMessage?.content}</div>
              </div>
              {conv.unreadCount > 0 && <div className="chat-unread">{conv.unreadCount}</div>}
            </li>
          ))}
          {conversations.length === 0 && (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No conversations yet</p>
              <Link href="/discover" className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>Find Travelers</Link>
            </div>
          )}
        </ul>
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        {selectedUser ? (
          <>
            <div className="chat-main-header">
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedUser(null)} style={{ display: 'none' }}>
                <ArrowLeft size={20} />
              </button>
              <div className="avatar avatar-placeholder" style={{ width: '38px', height: '38px', flexShrink: 0 }}>
                {selectedUser.avatar ? <img src={selectedUser.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : selectedUser.name?.charAt(0)}
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem' }}>{selectedUser.name}</h4>
              </div>
              <Link href={`/profile/${selectedUser.id}`} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>View Profile</Link>
            </div>

            <div className="chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.sender_id === user?.id ? 'sent' : 'received'}`}>
                  {msg.content}
                  <div className="message-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                  <p>Start a conversation with {selectedUser.name}!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <input
                className="form-input"
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button className="btn btn-primary" onClick={handleSend}>
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the sidebar or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
