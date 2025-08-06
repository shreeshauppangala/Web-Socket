import { useState, useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { messageAPI, roomAPI } from '../Services/api';
import { useAuth } from '../Context/Auth/useAuth';
import type { MessageI, RoomI, UserI } from '../Constants/interface';
import RoomJoiner from './RoomJoiner';
import ProfileModal from './ProfileModal';

const Chat = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<MessageI[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<RoomI[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomI | null>(null);
  const [roomUsers, setRoomUsers] = useState<UserI[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const { user, onSignOut, token } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {

    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_SERVER_URL, {
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
        content: data.message,
        messageType: 'system',
      }]);
    });

    newSocket.on('userLeft', (data) => {
      setMessages(prev => [...prev, {
        content: data.message,
        messageType: 'system',
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
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRooms = useCallback(async () => {
    const res = await roomAPI.listRooms();
    setRooms(res.data);
    if (!selectedRoom && res.data.length > 0) setSelectedRoom(res.data[0]);
  },[selectedRoom]);

  useEffect(() => {
    // Fetch rooms on mount
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.name);
      fetchRoomUsers(selectedRoom._id);
      if (socket) {
        socket.emit('joinRoom', selectedRoom.name);
      }
    }
  }, [selectedRoom, socket]);

  const loadMessages = async (roomName='general') => {
    try {
      const response = await messageAPI.getMessages(roomName);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  const fetchRoomUsers = async (roomId: string) => {
    const res = await roomAPI.getRoomUsers(roomId);
    setRoomUsers(res.data);
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    await roomAPI.createRoom(newRoomName.trim());
    setNewRoomName('');
    fetchRooms();
  };

  const handleSelectRoom = (room: RoomI) => {
    setSelectedRoom(room);
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

  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    const timestampDate = new Date(timestamp);
    return timestampDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <div style={styles.mainChat}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h2 style={styles.title}>Chat Room</h2>
            <span style={styles.status}>
              {socket?.connected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.username}>Welcome, {user.username}!</span>
            <button onClick={() => setProfileOpen(true)} style={{ ...styles.logoutBtn, background: '#007bff', marginRight: 8 }}>
              My Profile
            </button>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>
        <div style={styles.chatContainer}>
          <div style={styles.sidebar}>
            <div style={styles.roomsHeader}>Rooms</div>
            <div style={styles.roomsList}>
              {rooms.map((room) => (
                <div
                  key={room._id}
                  style={{
                    ...styles.roomItem,
                    ...(selectedRoom?._id === room._id ? styles.selectedRoom : {}),
                  }}
                  onClick={() => handleSelectRoom(room)}
                >
                  {room.name}
                </div>
              ))}
            </div>
            <div style={styles.createRoom}>
              <input
                type="text"
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                placeholder="New room name"
                style={styles.roomInput}
              />
              <button onClick={handleCreateRoom} style={styles.createRoomBtn}>+</button>
            </div>
            <div style={styles.usersHeader}>Users</div>
            <div style={styles.usersList}>
              {roomUsers.map(u => (
                <div key={u._id} style={styles.userItem}>
                  {u.username} {u.isOnline ? '🟢' : '🔴'}
                </div>
              ))}
            </div>
            <RoomJoiner onJoin={fetchRooms} />
          </div>
          <div>
          <div style={styles.messagesContainer}>
            {messages.map((message) => {
              const messageType = message.sender?._id === user._id ? 'ownMessage' : 'message';
              let alignStyle = {};
              if (message.messageType === 'system') {
                alignStyle = styles.centeredMessage;
              } else if (messageType === 'ownMessage') {
                alignStyle = styles.rightMessage;
              } else {
                alignStyle = styles.leftMessage;
              }
              return (
                <div
                  key={message._id}
                  style={{
                    ...styles.message,
                    ...(message.messageType === 'system' ? styles.systemMessage : {}),
                    ...(messageType === 'ownMessage' ? styles.ownMessage : {}),
                    ...alignStyle,
                  }}
                >
                  {message.messageType === 'system' ? (
                    <div style={styles.systemText}>{message.content}</div>
                  ) : (
                    <>
                      <div style={styles.messageHeader}>
                        <span style={styles.sender}>
                          {messageType === 'ownMessage' ? 'You' : message.sender?.username}
                        </span>
                        <span style={styles.timestamp}>
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                      <div style={styles.messageContent}>{message.content}</div>
                    </>
                  )}
                </div>
              )
            })}

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
      </div>
    </div>
  );
};

export default Chat;

const styles = {
  container: {
    height: '100vh',
  },
  sidebar: {
    background: '#f1f3f6',
    borderRight: '1px solid #e9ecef',
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem 0.5rem',
    gap: '1rem',
    margin: '4rem 0',
  },
  roomsHeader: {
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    fontSize: '1.1rem',
  },
  roomsList: {
    flex: '0 0 auto',
    marginBottom: '1rem',
    overflowY: 'auto',
    maxHeight: '150px',
  },
  roomItem: {
    padding: '0.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '0.25rem',
    background: '#fff',
  },
  selectedRoom: {
    background: '#007bff',
    color: '#fff',
    fontWeight: 'bold',
  },
  createRoom: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  roomInput: {
    flex: 1,
    padding: '0.25rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  createRoomBtn: {
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    border: 'none',
    background: '#28a745',
    color: '#fff',
    cursor: 'pointer',
  },
  usersHeader: {
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    fontSize: '1.1rem',
  },
  usersList: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '150px',
  },
  userItem: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    marginBottom: '0.25rem',
    background: '#fff',
    fontSize: '0.95rem',
  },
  mainChat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: ' 1rem',
    flexWrap: 'wrap',
    position: 'fixed',
    width: '100%',
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
    display: 'flex',
    width: '100%',
    height:'100vh',
    backgroundColor: 'white',
  },
  messagesContainer: {
    margin:'4rem 0', // Adjusted to account for fixed header height
    padding: '1rem',
    overflowY: 'auto',
  },
  message: {
    marginBottom: '1rem',
    padding: '0.75rem',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    width: 'fit-content'
  },
  ownMessage: {
    backgroundColor: '#e3f2fd',
    border: '1px solid #bbdefb'
  },
  systemMessage: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  rightMessage: {
    marginLeft: 'auto',
    marginRight: 0,
    textAlign: 'right',
    display: 'block',
  },
  leftMessage: {
    marginLeft: 0,
    marginRight: 'auto',
    textAlign: 'left',
    display: 'block',
  },
  centeredMessage: {
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
    display: 'block',
    width: 'fit-content',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.25rem',
    gap: '0.5rem'
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
    backgroundColor: '#f8f9fa',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0
  },
  messageInput: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginRight: '0.5rem',
    fontSize: '1rem',
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
