import { useState } from 'react';
import { roomAPI } from '../Services/api';

interface Props {
  onJoin?: () => void;
}

const RoomJoiner = ({ onJoin }: Props) => {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleJoin = async () => {
    setError('');
    setSuccess('');
    if (!roomId.trim()) return setError('Room ID required');
    try {
      await roomAPI.joinRoom(roomId.trim());
      setSuccess('Joined room!');
      setRoomId('');
      onJoin?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Failed to join room');
    }
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <input
        type="text"
        value={roomId}
        onChange={e => setRoomId(e.target.value)}
        placeholder="Room ID"
        style={{ padding: '0.25rem', borderRadius: 4, border: '1px solid #ccc', marginRight: 4 }}
      />
      <button onClick={handleJoin} style={{ padding: '0.25rem 0.75rem', borderRadius: 4, border: 'none', background: '#007bff', color: '#fff', cursor: 'pointer' }}>
        Join
      </button>
      {error && <div style={{ color: '#dc3545', fontSize: 12 }}>{error}</div>}
      {success && <div style={{ color: '#28a745', fontSize: 12 }}>{success}</div>}
    </div>
  );
};

export default RoomJoiner;
