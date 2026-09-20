import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { getTasks, getEvents, getBudgetSummary, createEvent, createTask, getUsers, createBudgetEntry, getCommitteeStats } from '../services/api';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const sections = [
  {
    title: 'Tasks',
    path: '/tasks',
    description: 'Create and assign tasks to committee members. Set priorities, deadlines, and track progress from To Do through to Done.',
    icon: '✓',
  },
  {
    title: 'Events',
    path: '/events',
    description: 'Plan society events from start to finish. Link tasks to events and monitor preparation progress in one place.',
    icon: '◎',
  },
  {
    title: 'Budget',
    path: '/budget',
    description: 'Log income and expenses, associate transactions with events, and view a live financial summary for the society.',
    icon: '£',
  },
  {
    title: 'Calendar',
    path: '/calendar',
    description: 'View all society events on a monthly or yearly calendar. Click any event to see its full details.',
    icon: '▦',
  },
  {
    title: 'Notes',
    path: '/notes',
    description: 'Document processes, contacts, and important information. Built for committee handover so nothing gets lost year to year.',
    icon: '≡',
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date();

  const [stats, setStats] = useState({
    activeTasks: 0,
    upcomingEvents: 0,
    totalEvents: 0,
    netBalance: 0,
    nextEvent: null,
    upcomingEventsList: [],
    committeeCount: 0,
    membersCount: 0,
  });

  const [nextEventIndex, setNextEventIndex] = useState(0);
  const [bannerKey, setBannerKey] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [createdEventId, setCreatedEventId] = useState(null);
  const [users, setUsers] = useState([]);
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    location: '',
    event_time: '',
    event_date: '',
    status: 'upcoming',
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    deadline: '',
    assigned_to: '',
  });

  const [budgetForm, setBudgetForm] = useState({
    type: 'income',
    amount: '',
    category: '',
    description: '',
  });

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, eventsRes, usersRes] = await Promise.all([
        getTasks(),
        getEvents(),
        getCommitteeStats(),
      ]);

      let netBalance = 0;
      try {
        const summaryRes = await getBudgetSummary();
        netBalance = summaryRes.data.net_balance || 0;
      } catch (err) {
        // Committee members can't see budget so will see 0
      }

      const allUsers = usersRes.data;
      const committeeCount = allUsers.filter((u) => u.role !== 'committee_member').length;
      const membersCount = allUsers.filter((u) => u.role === 'committee_member').length;

      const tasks = tasksRes.data;
      const events = eventsRes.data;

      const activeTasks = tasks.filter((t) => t.status !== 'done').length;

      const today = new Date();
      const upcomingEvents = events.filter(
        (e) => new Date(e.event_date) >= today && e.status !== 'cancelled'
      );

      const sortedUpcoming = upcomingEvents.sort(
        (a, b) => new Date(a.event_date) - new Date(b.event_date)
      );

      const recentEvents = [...events]
        .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
        .slice(0, 6);

      setStats({
        activeTasks,
        upcomingEvents: upcomingEvents.length,
        totalEvents: events.length,
        netBalance,
        nextEvent: sortedUpcoming[0] || null,
        upcomingEventsList: sortedUpcoming,
        committeeCount,
        membersCount,
      });

      setRecentActivity(recentEvents);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const getDaysUntil = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days away`;
  };

  const statusColour = {
    todo: '#9ca3af',
    in_progress: '#d97706',
    done: '#16a34a',
  };

  const openModal = () => {
    setShowModal(true);
    setStep(1);
    setCreatedEventId(null);
    setModalError('');
    setEventForm({ name: '', description: '', location: '', event_time: '', event_date: '', status: 'upcoming' });
    setTaskForm({ title: '', description: '', priority: 'medium', deadline: '', assigned_to: '' });
    setBudgetForm({ type: 'income', amount: '', category: '', description: '' });
  };

  const closeModal = () => {
    setShowModal(false);
    setStep(1);
    setCreatedEventId(null);
    setModalError('');
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      const res = await createEvent(eventForm);
      setCreatedEventId(res.data.eventId);
      setStep(2);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create event.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      await createTask({
        ...taskForm,
        assigned_to: taskForm.assigned_to || null,
        deadline: taskForm.deadline || null,
        event_id: createdEventId,
      });
      setStep(3);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      await createBudgetEntry({
        ...budgetForm,
        event_id: createdEventId,
      });
      setStep(4);
      fetchDashboardData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to log budget entry.');
    } finally {
      setModalLoading(false);
    }
  };

  const stepLabels = ['Create Event', 'Add Task', 'Log Budget', 'Done'];

  return (
    <div>
      {/* Welcome header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.greeting}>
            {getGreeting()}, {user?.full_name}
          </h2>
          <p style={styles.role}>{user?.role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
        </div>
        {['president', 'treasurer'].includes(user?.role) && (
          <button style={styles.quickAddBtn} onClick={openModal}>+</button>
        )}
      </div>

      {/* Quick action button */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Quick Setup</h3>
              <button style={styles.modalClose} onClick={closeModal}>✕</button>
            </div>

            <div style={styles.stepRow}>
              {stepLabels.map((label, i) => (
                <div key={i} style={styles.stepItem}>
                  <div style={{
                    ...styles.stepDot,
                    backgroundColor: step > i + 1 ? '#16a34a' : step === i + 1 ? '#111111' : '#e5e5e5',
                    color: step >= i + 1 ? '#ffffff' : '#9ca3af',
                  }}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span style={{
                    ...styles.stepLabel,
                    color: step === i + 1 ? '#111111' : '#9ca3af',
                    fontWeight: step === i + 1 ? '600' : '400',
                  }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {modalError && <p style={styles.modalError}>{modalError}</p>}

            {/* Step 1: Create Event */}
            {step === 1 && (
              <form onSubmit={handleCreateEvent}>
                <p style={styles.stepDesc}>Start by creating an event for your society.</p>

                <label style={styles.label}>Event Name *</label>
                <input
                  style={styles.input}
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  placeholder="e.g. Freshers Fair 2026"
                  required
                />

                <label style={styles.label}>Description</label>
                <textarea
                  style={styles.textarea}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                />

                <label style={styles.label}>Location</label>
                <input
                  style={styles.input}
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="e.g. Student Union, Room 2B"
                />

                <div style={styles.row}>
                  <div style={styles.halfField}>
                    <label style={styles.label}>Date *</label>
                    <input
                      type="date"
                      style={styles.input}
                      value={eventForm.event_date}
                      onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.halfField}>
                    <label style={styles.label}>Time</label>
                    <input
                      type="time"
                      style={styles.input}
                      value={eventForm.event_time}
                      onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                    />
                  </div>
                </div>

                <div style={styles.halfField}>
                  <label style={styles.label}>Status</label>
                  <select
                    style={styles.input}
                    value={eventForm.status}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" style={styles.skipBtn} onClick={() => setStep(2)}>Skip</button>
                  <button type="submit" style={styles.nextBtn} disabled={modalLoading}>
                    {modalLoading ? 'Creating...' : 'Create Event →'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Add Task */}
            {step === 2 && (
              <form onSubmit={handleCreateTask}>
                <p style={styles.stepDesc}>Add a task linked to this event.</p>

                <label style={styles.label}>Task Title *</label>
                <input
                  style={styles.input}
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Book the venue"
                  required
                />

                <label style={styles.label}>Description</label>
                <textarea
                  style={styles.textarea}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                />

                <div style={styles.row}>
                  <div style={styles.halfField}>
                    <label style={styles.label}>Priority</label>
                    <select
                      style={styles.input}
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div style={styles.halfField}>
                    <label style={styles.label}>Deadline</label>
                    <input
                      type="date"
                      style={styles.input}
                      value={taskForm.deadline}
                      onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    />
                  </div>
                </div>

                <label style={styles.label}>Assign To</label>
                <select
                  style={styles.input}
                  value={taskForm.assigned_to}
                  onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                  ))}
                </select>

                <div style={styles.modalFooter}>
                  <button type="button" style={styles.skipBtn} onClick={() => setStep(3)}>Skip</button>
                  <button type="submit" style={styles.nextBtn} disabled={modalLoading}>
                    {modalLoading ? 'Adding...' : 'Add Task →'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Log Budget */}
            {step === 3 && (
              <form onSubmit={handleCreateBudget}>
                <p style={styles.stepDesc}>Log an initial budget entry for this event.</p>

                <div style={styles.row}>
                  <div style={styles.halfField}>
                    <label style={styles.label}>Type *</label>
                    <select
                      style={styles.input}
                      value={budgetForm.type}
                      onChange={(e) => setBudgetForm({ ...budgetForm, type: e.target.value })}
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                  <div style={styles.halfField}>
                    <label style={styles.label}>Amount (£) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      style={styles.input}
                      value={budgetForm.amount}
                      onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <label style={styles.label}>Category *</label>
                <input
                  style={styles.input}
                  value={budgetForm.category}
                  onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                  placeholder="e.g. Venue, Ticket Sales"
                  required
                />

                <label style={styles.label}>Description</label>
                <textarea
                  style={styles.textarea}
                  value={budgetForm.description}
                  onChange={(e) => setBudgetForm({ ...budgetForm, description: e.target.value })}
                  placeholder="Optional details"
                  rows={2}
                />

                <div style={styles.modalFooter}>
                  <button type="button" style={styles.skipBtn} onClick={() => { setStep(4); fetchDashboardData(); }}>Skip</button>
                  <button type="submit" style={styles.nextBtn} disabled={modalLoading}>
                    {modalLoading ? 'Logging...' : 'Log Entry →'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Done */}
            {step === 4 && (
              <div style={styles.doneStep}>
                <div style={styles.doneIcon}>✓</div>
                <h3 style={styles.doneTitle}>All done!</h3>
                <p style={styles.doneDesc}>Your event, task, and budget entry have been created successfully.</p>
                <div style={styles.doneActions}>
                  <button style={styles.skipBtn} onClick={() => navigate('/events')}>View Events</button>
                  <button style={styles.nextBtn} onClick={closeModal}>Back to Dashboard</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next event banner + Calendar widget row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {stats.upcomingEventsList.length > 0 && (
          <div style={{ ...styles.eventBanner, flex: 1 }}>
            <div key={bannerKey} className="banner-flip" style={styles.bannerLeft}>
              <span style={styles.bannerLabel}>NEXT EVENT</span>
              <span style={styles.bannerName}>
                {stats.upcomingEventsList[nextEventIndex]?.name}
              </span>
              <div style={styles.bannerDetails}>
                {stats.upcomingEventsList[nextEventIndex]?.location && (
                  <span style={styles.bannerDetail}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {stats.upcomingEventsList[nextEventIndex]?.location}
                  </span>
                )}
                {stats.upcomingEventsList[nextEventIndex]?.event_time && (
                  <span style={styles.bannerDetail}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {stats.upcomingEventsList[nextEventIndex]?.event_time?.slice(0, 5)}
                  </span>
                )}
              </div>
            </div>
            <div style={styles.bannerRight}>
              <span style={styles.bannerDays}>
                {getDaysUntil(stats.upcomingEventsList[nextEventIndex]?.event_date)}
              </span>
              {stats.upcomingEventsList.length > 1 && (
                <div style={styles.bannerArrows}>
                  <button
                    style={styles.arrowBtn}
                    onClick={() => {
                      setNextEventIndex((prev) =>
                        prev === 0 ? stats.upcomingEventsList.length - 1 : prev - 1
                      );
                      setBannerKey(k => k + 1);
                    }}
                  >←</button>
                  <span style={styles.bannerCounter}>
                    {nextEventIndex + 1}/{stats.upcomingEventsList.length}
                  </span>
                  <button
                    style={styles.arrowBtn}
                    onClick={() => {
                      setNextEventIndex((prev) =>
                        prev === stats.upcomingEventsList.length - 1 ? 0 : prev + 1
                      );
                      setBannerKey(k => k + 1);
                    }}
                  >→</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calendar widget */}
        <div
          style={styles.calendarWidget}
          onClick={() => navigate('/calendar')}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f1f1f'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111111'}
        >
          <span style={styles.calendarWidgetDay}>
            {today.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}
          </span>
          <span style={styles.calendarWidgetDate}>{today.getDate()}</span>
          <span style={styles.calendarWidgetMonth}>
            {today.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}
          </span>
          <span style={styles.calendarWidgetHint}>View Calendar</span>
        </div>
      </div>

      {/* Live stats bar */}
      {!statsLoading && (
        <div style={styles.statsBar}>
          <div style={styles.statCard} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <svg style={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <span style={styles.statNumber}>{stats.activeTasks}</span>
            <span style={styles.statLabel}>ACTIVE TASKS</span>
          </div>

          <div style={styles.statCard} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <svg style={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span style={styles.statNumber}>{stats.upcomingEvents}</span>
            <span style={styles.statLabel}>UPCOMING EVENTS</span>
          </div>

          <div style={styles.statCard} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <svg style={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
            </svg>
            <span style={styles.statNumber}>{stats.totalEvents}</span>
            <span style={styles.statLabel}>TOTAL EVENTS</span>
          </div>

          <div style={styles.statCard} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <svg style={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <span style={styles.statNumber}>{stats.committeeCount}</span>
            <span style={styles.statLabel}>ADMIN</span>
          </div>

          <div style={styles.statCard} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <svg style={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="3"/><path d="M2 20c0-3 3-5.5 7-5.5s7 2.5 7 5.5"/><circle cx="17" cy="8" r="3"/><path d="M22 20c0-3-2.5-5.5-6-5.5"/>
            </svg>
            <span style={styles.statNumber}>{stats.membersCount}</span>
            <span style={styles.statLabel}>MEMBERS</span>
          </div>

          <div style={{
            ...styles.statCard,
            backgroundColor: stats.netBalance >= 0 ? '#f0fdf4' : '#fef2f2',
            border: stats.netBalance >= 0 ? '1px solid #bbf7d0' : '1px solid #fecaca',
            justifyContent: 'center',
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{
              ...styles.statNumber,
              color: stats.netBalance >= 0 ? '#16a34a' : '#dc2626',
            }}>
              £{parseFloat(stats.netBalance).toFixed(2)}
            </span>
            <span style={styles.statLabel}>NET BALANCE</span>
          </div>
        </div>
      )}

      {/* Two column layout */}
      <div style={styles.twoCol}>
        <div style={styles.leftCol}>
          <p style={styles.sectionLabel}>WHERE WOULD YOU LIKE TO GO?</p>
          <div style={styles.cardStack}>
            {sections
              .filter((section) => !(section.path === '/budget' && user?.role === 'committee_member'))
              .map((section) => (
                <div
                  key={section.path}
                  style={styles.card}
                  onClick={() => navigate(section.path)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#111111';
                    e.currentTarget.style.backgroundColor = '#fafafa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e5e5';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <div style={styles.cardAccent} />
                  <div style={styles.cardLeft}>
                    <span style={styles.cardBigNumber}>{section.icon}</span>
                    <div>
                      <h3 style={styles.cardTitle}>{section.title}</h3>
                      <p style={styles.cardDesc}>{section.description}</p>
                    </div>
                  </div>
                  <span style={styles.arrow}>→</span>
                </div>
              ))}
          </div>
        </div>

        <div style={styles.rightCol}>
          <p style={styles.sectionLabel}>RECENT ACTIVITY</p>
          {recentActivity.length === 0 ? (
            <div style={styles.emptyActivity}>
              <p style={styles.emptyActivityText}>No recent activity yet.</p>
            </div>
          ) : (
            <div style={styles.activityList}>
              {recentActivity.map((event) => (
                <div
                  key={event.id}
                  style={styles.activityRow}
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div style={styles.activityLeft}>
                    <span style={{
                      ...styles.activityDot,
                      backgroundColor: event.status === 'confirmed' ? '#16a34a' :
                        event.status === 'upcoming' ? '#d97706' :
                        event.status === 'cancelled' ? '#dc2626' : '#9ca3af',
                    }} />
                    <div>
                      <span style={styles.activityTitle}>{event.name}</span>
                      <span style={styles.activityMeta}>
                        {new Date(event.event_date).toLocaleDateString('en-GB')} · {event.status}
                      </span>
                    </div>
                  </div>
                  <span style={styles.activityPriority}>
                    {event.task_count} {event.task_count === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  header: {
    marginBottom: '1.5rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: '3.5rem',
    fontWeight: '700',
    color: '#111111',
    marginBottom: '0.3rem',
    letterSpacing: '-2px',
    fontFamily: "'Outfit', sans-serif",
  },
  role: {
    fontSize: '0.95rem',
    color: '#9ca3af',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  quickAddBtn: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    backgroundColor: '#d97706',
    color: '#ffffff',
    fontSize: '1.6rem',
    fontWeight: '200',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    lineHeight: 1,
    letterSpacing: '-1px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#111111',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '1rem',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '0.25rem',
  },
  stepRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0',
    marginBottom: '1.75rem',
    justifyContent: 'space-between',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4rem',
    flex: 1,
  },
  stepDot: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: '0.72rem',
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '1.25rem',
  },
  modalError: {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '0.65rem 0.9rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#111111',
    display: 'block',
    marginBottom: '0.4rem',
  },
  input: {
    width: '100%',
    padding: '0.65rem 0.9rem',
    marginBottom: '1rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '0.65rem 0.9rem',
    marginBottom: '1rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  row: {
    display: 'flex',
    gap: '1rem',
  },
  halfField: {
    flex: 1,
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  skipBtn: {
    padding: '0.6rem 1.25rem',
    backgroundColor: 'transparent',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  nextBtn: {
    padding: '0.6rem 1.25rem',
    backgroundColor: '#111111',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  doneStep: {
    textAlign: 'center',
    padding: '1rem 0',
  },
  doneIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    fontSize: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
    fontWeight: '700',
  },
  doneTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#111111',
    marginBottom: '0.5rem',
  },
  doneDesc: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '1.5rem',
    lineHeight: '1.6',
  },
  doneActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.75rem',
  },
  eventBanner: {
    backgroundColor: '#111111',
    borderRadius: '10px',
    padding: '1.25rem 1.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    perspective: '600px',
  },
  bannerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  bannerLabel: {
    fontSize: '0.7rem',
    fontWeight: '700',
    letterSpacing: '0.12em',
    color: '#6b7280',
  },
  bannerName: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '-0.25px',
  },
  bannerDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '0.4rem',
  },
  bannerDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.8rem',
    color: '#9ca3af',
    fontWeight: '500',
  },
  bannerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  bannerDays: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#9ca3af',
    backgroundColor: '#1f1f1f',
    padding: '0.35rem 1rem',
    borderRadius: '20px',
  },
  bannerArrows: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  arrowBtn: {
    backgroundColor: '#1f1f1f',
    border: '1px solid #3a3a3a',
    color: '#ffffff',
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCounter: {
    fontSize: '0.8rem',
    color: '#6b7280',
    fontWeight: '500',
    minWidth: '28px',
    textAlign: 'center',
  },
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '0.75rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '1.25rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.35rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    cursor: 'default',
  },
  statIcon: {
    width: '22px',
    height: '22px',
    marginBottom: '0.15rem',
  },
  statNumber: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#111111',
    letterSpacing: '-0.5px',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: '0.1em',
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.12em',
    color: '#9ca3af',
    marginBottom: '1rem',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: '2rem',
    alignItems: 'start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '1.75rem 2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'border-color 0.15s, background-color 0.15s',
    position: 'relative',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    backgroundColor: '#d97706',
    borderRadius: '12px 0 0 12px',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1.25rem',
    flex: 1,
  },
  cardBigNumber: {
    fontSize: '1.4rem',
    color: '#d1d5db',
    fontWeight: '700',
    minWidth: '28px',
    marginTop: '0.1rem',
  },
  cardTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#111111',
    marginBottom: '0.4rem',
    letterSpacing: '-0.25px',
  },
  cardDesc: {
    fontSize: '0.9rem',
    color: '#6b7280',
    lineHeight: '1.6',
    maxWidth: '600px',
    fontWeight: '400',
  },
  arrow: {
    fontSize: '1.25rem',
    color: '#9ca3af',
    marginLeft: '1rem',
    flexShrink: 0,
  },
  activityList: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  activityRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
  },
  activityLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.9rem',
  },
  activityDot: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  activityTitle: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#111111',
    marginBottom: '0.2rem',
  },
  activityMeta: {
    display: 'block',
    fontSize: '0.775rem',
    color: '#9ca3af',
    textTransform: 'capitalize',
    fontWeight: '400',
  },
  activityPriority: {
    fontSize: '0.775rem',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  emptyActivity: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '2rem',
    textAlign: 'center',
  },
  emptyActivityText: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    fontWeight: '500',
  },
  calendarWidget: {
    backgroundColor: '#111111',
    borderRadius: '10px',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    minWidth: '100px',
    transition: 'background-color 0.15s',
    flexShrink: 0,
  },
  calendarWidgetDay: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: '0.1em',
  },
  calendarWidgetDate: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 1.1,
    letterSpacing: '-1px',
  },
  calendarWidgetMonth: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: '0.1em',
  },
  calendarWidgetHint: {
    fontSize: '0.6rem',
    color: '#4b5563',
    fontWeight: '500',
    marginTop: '0.5rem',
    letterSpacing: '0.05em',
  },
};

export default Dashboard;