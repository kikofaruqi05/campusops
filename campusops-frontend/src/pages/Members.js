import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMembers, updateMemberRole } from '../services/api';

const roleColours = {
  president: { bg: '#fefce8', text: '#854d0e' },
  treasurer: { bg: '#eff6ff', text: '#1d4ed8' },
  committee_member: { bg: '#f3f4f6', text: '#374151' },
};

const Members = () => {
  const { user } = useAuth();
  const isPresident = user?.role === 'president';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingRole, setEditingRole] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await getMembers();
      setMembers(res.data);
    } catch {
      setError('Failed to load members.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (member) => {
    setEditingId(member.id);
    setEditingRole(member.role);
    setSaveSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingRole('');
  };

  const handleSaveRole = async (id) => {
    try {
      await updateMemberRole(id, editingRole);
      setSaveSuccess('Role updated successfully.');
      setEditingId(null);
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const formatRole = (role) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

  // Split members by role group
  const leadership = members.filter((m) => ['president', 'treasurer'].includes(m.role));
  const committee = members.filter((m) => m.role === 'committee_member');

  if (loading) return <div style={styles.loading}>Loading members...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.heading}>Members</h2>
          <p style={styles.subtitle}>{members.length} member{members.length !== 1 ? 's' : ''} in {user?.society}</p>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}
      {saveSuccess && <p style={styles.success}>{saveSuccess}</p>}

      {/* Admin section */}
      <p style={styles.sectionLabel}>ADMIN</p>
      <div style={styles.memberList}>
        {leadership.map((member) => (
          <div key={member.id} style={styles.memberCard}>
            <div style={styles.cardAccent} />
            <div style={styles.memberLeft}>
              <div style={styles.avatar}>
                {member.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={styles.memberName}>
                  {member.full_name}
                  {member.id === user.id && <span style={styles.youBadge}>You</span>}
                </div>
                <div style={styles.memberEmail}>{member.email}</div>
                <div style={styles.memberJoined}>Joined {formatDate(member.created_at)}</div>
              </div>
            </div>
            <div style={styles.memberRight}>
              {editingId === member.id ? (
                <div style={styles.editRow}>
                  <select
                    style={styles.roleSelect}
                    value={editingRole}
                    onChange={(e) => setEditingRole(e.target.value)}
                  >
                    <option value="president">President</option>
                    <option value="treasurer">Treasurer</option>
                    <option value="committee_member">Committee Member</option>
                  </select>
                  <button style={styles.saveBtn} onClick={() => handleSaveRole(member.id)}>Save</button>
                  <button style={styles.cancelBtn} onClick={handleCancelEdit}>Cancel</button>
                </div>
              ) : (
                <div style={styles.roleRow}>
                  <span style={{
                    ...styles.roleBadge,
                    backgroundColor: roleColours[member.role]?.bg,
                    color: roleColours[member.role]?.text,
                  }}>
                    {formatRole(member.role)}
                  </span>
                  {isPresident && member.id !== user.id && (
                    <button style={styles.editBtn} onClick={() => handleEditClick(member)}>
                      Edit Role
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Committee section */}
      <p style={{ ...styles.sectionLabel, marginTop: '1.5rem' }}>COMMITTEE MEMBERS</p>
      {committee.length === 0 ? (
        <p style={styles.empty}>No committee members yet.</p>
      ) : (
        <div style={styles.memberList}>
          {committee.map((member) => (
            <div key={member.id} style={styles.memberCard}>
              <div style={styles.cardAccent} />
              <div style={styles.memberLeft}>
                <div style={styles.avatar}>
                  {member.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={styles.memberName}>
                    {member.full_name}
                    {member.id === user.id && <span style={styles.youBadge}>You</span>}
                  </div>
                  <div style={styles.memberEmail}>{member.email}</div>
                  <div style={styles.memberJoined}>Joined {formatDate(member.created_at)}</div>
                </div>
              </div>
              <div style={styles.memberRight}>
                {editingId === member.id ? (
                  <div style={styles.editRow}>
                    <select
                      style={styles.roleSelect}
                      value={editingRole}
                      onChange={(e) => setEditingRole(e.target.value)}
                    >
                      <option value="president">President</option>
                      <option value="treasurer">Treasurer</option>
                      <option value="committee_member">Committee Member</option>
                    </select>
                    <button style={styles.saveBtn} onClick={() => handleSaveRole(member.id)}>Save</button>
                    <button style={styles.cancelBtn} onClick={handleCancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <div style={styles.roleRow}>
                    <span style={{
                      ...styles.roleBadge,
                      backgroundColor: roleColours[member.role]?.bg,
                      color: roleColours[member.role]?.text,
                    }}>
                      {formatRole(member.role)}
                    </span>
                    {isPresident && member.id !== user.id && (
                      <button style={styles.editBtn} onClick={() => handleEditClick(member)}>
                        Edit Role
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '0' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e5e5' },
  heading: { fontSize: '2rem', fontWeight: '800', color: '#111111', letterSpacing: '-0.5px', marginBottom: '0.25rem' },
  subtitle: { fontSize: '0.9rem', color: '#9ca3af', fontWeight: '400' },
  loading: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
  error: { color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' },
  success: { color: '#16a34a', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' },
  sectionLabel: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em', color: '#9ca3af', marginBottom: '0.75rem' },
  memberList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  memberCard: { backgroundColor: '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#111111', borderRadius: '12px 0 0 12px' },
  memberLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  avatar: { width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#111111', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '700', flexShrink: 0 },
  memberName: { fontSize: '0.95rem', fontWeight: '700', color: '#111111', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  youBadge: { fontSize: '0.65rem', fontWeight: '700', backgroundColor: '#fef3c7', color: '#d97706', padding: '0.1rem 0.5rem', borderRadius: '20px', letterSpacing: '0.05em' },
  memberEmail: { fontSize: '0.825rem', color: '#6b7280', marginBottom: '0.15rem' },
  memberJoined: { fontSize: '0.775rem', color: '#d1d5db', fontWeight: '500' },
  memberRight: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 },
  roleRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  roleBadge: { fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '20px', letterSpacing: '0.03em' },
  editRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  roleSelect: { padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', cursor: 'pointer' },
  saveBtn: { padding: '0.4rem 0.9rem', backgroundColor: '#d97706', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { padding: '0.4rem 0.9rem', backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' },
  editBtn: { padding: '0.35rem 0.8rem', backgroundColor: 'transparent', color: '#111111', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' },
  empty: { color: '#6b7280', textAlign: 'center', padding: '2rem', fontWeight: '500', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e5e5' },
};

export default Members;