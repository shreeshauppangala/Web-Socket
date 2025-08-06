import { useEffect, useState } from 'react';
import { authAPI } from '../Services/api';
import type { UserI } from '../Constants/interface';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ProfileModal = ({ open, onClose }: Props) => {
  const [profile, setProfile] = useState<UserI|null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      authAPI.getCurrentUser()
        .then(res => setProfile(res.data.user))
        .finally(() => setLoading(false));
    }
  }, [open]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 300, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: 8, top: 8, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
        <h3 style={{ marginBottom: 16 }}>My Profile</h3>
        {loading ? <div>Loading...</div> : profile && (
          <div>
            <div><b>ID:</b> {profile._id}</div>
            <div><b>Username:</b> {profile.username}</div>
            <div><b>Email:</b> {profile.email}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
