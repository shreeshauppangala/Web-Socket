import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { messageAPI } from '../Services/api';
import { useAuth } from '../Context/Auth/useAuth';
import type { MessageI } from '../Constants/interface';

const Chat = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<MessageI[]>([]);
  const [newMessage, setNewMessage] = useState('');
  // const [onlineUsers, setOnlineUsers] = useState([]);
  const [typing, setTyping] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

  const { user, onSignOut } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {

    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_API_SERVER_URL, {
      auth: { token }
    });

    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('userJoined', (data) => {
      setMessages(prev => [...prev, {
        _id: data._id,
        content: data.message,
        messageType: 'system',
        createdAt: new Date(),
        sender: data.sender,
        room: data.room
      }]);
    });

    newSocket.on('userLeft', (data) => {
      setMessages(prev => [...prev, {
        _id: data._id,
        content: data.message,
        messageType: 'system',
        createdAt: new Date(),
        sender: data.sender,
        room: data.room
      }]);
    });

    newSocket.on('userTyping', (data) => {
      if (data.isTyping) {
        setTyping(prev => [...prev.filter(u => u !== data.username), data.username]);
      } else {
        setTyping(prev => prev.filter(u => u !== data.username));
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Load initial messages
    loadMessages();

    return () => {
      newSocket.close();
    };
  }, [token, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await messageAPI.getMessages('general');
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('sendMessage', {
      content: newMessage.trim(),
      room: 'general'
    });

    setNewMessage('');

    // Stop typing indicator
    socket.emit('typing', { room: 'general', isTyping: false });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!socket) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    socket.emit('typing', { room: 'general', isTyping: true });

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { room: 'general', isTyping: false });
    }, 2000);
  };

  const handleLogout = async () => {
    if (socket) {
      socket.disconnect();
    }
     onSignOut();
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.title}>Chat Room</h2>
          <span style={styles.status}>
            {socket?.connected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.username}>Welcome, {user.username}!</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.chatContainer}>
        <div style={styles.messagesContainer}>
          {messages.map((message) => (
            <div
              key={message._id}
              style={{
                ...styles.message,
                ...(message.messageType === 'system' ? styles.systemMessage : {}),
                ...(message.sender?._id === user._id ? styles.ownMessage : {})
              }}
            >
              {message.messageType === 'system' ? (
                <div style={styles.systemText}>{message.content}</div>
              ) : (
                <>
                  <div style={styles.messageHeader}>
                    <span style={styles.sender}>
                      {message.sender?._id === user._id ? 'You' : message.sender?.username}
                    </span>
                    <span style={styles.timestamp}>
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  <div style={styles.messageContent}>{message.content}</div>
                </>
              )}
            </div>
          ))}

          {typing.length > 0 && (
            <div style={styles.typingIndicator}>
              {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} style={styles.messageForm}>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type your message..."
            style={styles.messageInput}
            disabled={!connected}
          />
          <button
            type="submit"
            disabled={!connected || !newMessage.trim()}
            style={styles.sendButton}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  title: {
    margin: 0,
    fontSize: '1.5rem'
  },
  status: {
    fontSize: '0.9rem',
    opacity: 0.9
  },
  username: {
    fontSize: '0.9rem'
  },
  logoutBtn: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
    backgroundColor: 'white',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)'
  },
  messagesContainer: {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 200px)'
  },
  message: {
    marginBottom: '1rem',
    padding: '0.75rem',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef'
  },
  ownMessage: {
    backgroundColor: '#e3f2fd',
    marginLeft: '2rem',
    border: '1px solid #bbdefb'
  },
  systemMessage: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.25rem'
  },
  sender: {
    fontWeight: 'bold',
    color: '#007bff'
  },
  timestamp: {
    fontSize: '0.8rem',
    color: '#6c757d'
  },
  messageContent: {
    color: '#333'
  },
  systemText: {
    color: '#856404'
  },
  typingIndicator: {
    fontStyle: 'italic',
    color: '#6c757d',
    padding: '0.5rem',
    animation: 'pulse 1.5s ease-in-out infinite alternate'
  },
  messageForm: {
    display: 'flex',
    padding: '1rem',
    borderTop: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa'
  },
  messageInput: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginRight: '0.5rem',
    fontSize: '1rem'
  },
  sendButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem'
  }
} as const;
