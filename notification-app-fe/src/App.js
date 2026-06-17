import React, { useState, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
  Chip
  , Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import {
  Assignment,
  BarChart,
  Bolt,
  Campaign,
  CheckCircle,
  EventNote,
  Notifications,
  RadioButtonUnchecked,
  Search as SearchIcon,
  School,
  SupervisorAccount,
  TrendingUp,
  Work
  , Edit, Delete
} from '@mui/icons-material';

const API_URL = 'http://4.224.186.213/evaluation-service/notifications';

const TYPE_CONFIG = {
  Placement: {
    label: 'Placement',
    color: '#1d4ed8',
    bg: '#dbeafe',
    icon: <Work sx={{ color: '#1d4ed8' }} />
  },
  Result: {
    label: 'Result',
    color: '#7c3aed',
    bg: '#ede9fe',
    icon: <Assignment sx={{ color: '#7c3aed' }} />
  },
  Event: {
    label: 'Event',
    color: '#16a34a',
    bg: '#dcfce7',
    icon: <EventNote sx={{ color: '#16a34a' }} />
  }
};

const SAMPLE_NOTIFICATIONS = [
  {
    ID: 'VTU10021',
    Type: 'Placement',
    Message: 'HexaTech pre-placement talk on Monday; RSVP before Friday evening.',
    Timestamp: '2026-06-18 09:10:00',
    Target: 'Students',
    Author: 'Career Services',
    weight: 3
  },
  {
    ID: 'VTU10023',
    Type: 'Result',
    Message: 'Mid-semester grades are live for all CSE and IT sections.',
    Timestamp: '2026-06-17 14:55:00',
    Target: 'All',
    Author: 'Exam Cell',
    weight: 2
  },
  {
    ID: 'VTU10024',
    Type: 'Event',
    Message: 'AI bootcamp registration closes tomorrow; join the Innovation Lab group.',
    Timestamp: '2026-06-16 11:45:00',
    Target: 'All',
    Author: 'Tech Club',
    weight: 1
  },
  {
    ID: 'VTU10026',
    Type: 'Placement',
    Message: 'Urgent: BrightLabs hiring drive postponed to 4 PM in Seminar Hall.',
    Timestamp: '2026-06-15 08:30:00',
    Target: 'Students',
    Author: 'Placement Cell',
    weight: 3
  },
  {
    ID: 'VTU10028',
    Type: 'Event',
    Message: 'Annual cultural fest auditions open for all departments.',
    Timestamp: '2026-06-14 15:20:00',
    Target: 'All',
    Author: 'Student Affairs',
    weight: 1
  },
  {
    ID: 'VTU10032',
    Type: 'Result',
    Message: 'Project review dates published for final-year students.',
    Timestamp: '2026-06-13 10:05:00',
    Target: 'Students',
    Author: 'Academic Office',
    weight: 2
  },
  {
    ID: 'VTU10034',
    Type: 'Placement',
    Message: 'Campus hiring alert: early-bird registration for IIT Alumni hiring drive.',
    Timestamp: '2026-06-12 17:40:00',
    Target: 'Students',
    Author: 'Training Office',
    weight: 3
  }
];

const normalizeNotification = (item) => ({
  ID: item.ID || item.id || `VTU${10000 + Math.floor(Math.random() * 90000)}`,
  Type: item.Type || item.type || 'Event',
  Message: item.Message || item.message || 'No message available.',
  Timestamp: item.Timestamp || item.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
  Target: item.Target || item.target || 'All',
  Author: item.Author || item.author || 'Campus Admin',
  // normalize student id to format VTU12345 when present
  StudentID: (() => {
    const raw = item.StudentID || item.studentId || item.student_id || '';
    if (!raw) return '';
    const digits = String(raw).replace(/\D/g, '');
    const lastFive = digits.slice(-5).padStart(5, '0');
    return `VTU${lastFive}`;
  })(),
  weight: item.weight || (item.Type === 'Placement' || item.type === 'Placement' ? 3 : item.Type === 'Result' || item.type === 'Result' ? 2 : 1)
});

export default function App() {
  const [role, setRole] = useState('student');
  const [currentTab, setCurrentTab] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [viewedIds, setViewedIds] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [typeInput, setTypeInput] = useState('Event');
  const [audienceInput, setAudienceInput] = useState('All');
  const bcRef = useRef(null);
  const [currentStudentID, setCurrentStudentID] = useState('');
  const [broadcastStudentID, setBroadcastStudentID] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editNotification, setEditNotification] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await axios.get(API_URL);
        const rawArray = response.data.notifications || [];
        setNotifications(rawArray.map(normalizeNotification));
      } catch (error) {
        console.error('Notification fetch failed:', error);
        setNotifications(SAMPLE_NOTIFICATIONS.map(normalizeNotification));
      }
    };

    loadNotifications();

    // Setup BroadcastChannel or storage listener for cross-tab updates
    if (typeof BroadcastChannel !== 'undefined') {
      bcRef.current = new BroadcastChannel('campus_notifications');
      bcRef.current.onmessage = (ev) => {
        try {
          const data = ev.data;
          if (data && data.action) {
            if (data.action === 'create') {
              const notif = normalizeNotification(data.payload);
              setNotifications((prev) => [notif, ...prev]);
            } else if (data.action === 'update') {
              const notif = normalizeNotification(data.payload);
              setNotifications((prev) => prev.map((n) => (n.ID === notif.ID ? notif : n)));
            } else if (data.action === 'delete') {
              const id = data.payload;
              setNotifications((prev) => prev.filter((n) => n.ID !== id));
            }
          } else {
            // legacy: raw notification
            const notif = normalizeNotification(data);
            setNotifications((prev) => [notif, ...prev]);
          }
        } catch (e) {
          // ignore malformed messages
        }
      };
    } else {
      const storageHandler = (e) => {
        if (e.key === 'campus_broadcast' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && parsed.action) {
              if (parsed.action === 'create') {
                const notif = normalizeNotification(parsed.payload);
                setNotifications((prev) => [notif, ...prev]);
              } else if (parsed.action === 'update') {
                const notif = normalizeNotification(parsed.payload);
                setNotifications((prev) => prev.map((n) => (n.ID === notif.ID ? notif : n)));
              } else if (parsed.action === 'delete') {
                const id = parsed.payload;
                setNotifications((prev) => prev.filter((n) => n.ID !== id));
              }
            } else {
              const notif = normalizeNotification(parsed);
              setNotifications((prev) => [notif, ...prev]);
            }
          } catch (err) {
            // ignore
          }
        }
      };
      window.addEventListener('storage', storageHandler);
      bcRef.current = { close: () => window.removeEventListener('storage', storageHandler) };
    }

    return () => {
      if (bcRef.current && typeof bcRef.current.close === 'function') bcRef.current.close();
    };
  }, []);

  const filteredNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return notifications
      .filter((item) => categoryFilter === 'All' ? true : item.Type === categoryFilter)
      .filter((item) => {
        if (role === 'student') {
              // show if targeted to all/students or specifically to this student
              const normalizedCurrent = (() => {
                if (!currentStudentID) return '';
                const d = String(currentStudentID).replace(/\D/g, '');
                return `VTU${d.slice(-5).padStart(5, '0')}`;
              })();
              if (item.StudentID) return item.StudentID === normalizedCurrent || item.Target === 'All' || item.Target.toLowerCase().includes('student');
              return item.Target === 'All' || item.Target.toLowerCase().includes('student');
            }
        return true;
      })
      .filter((item) => {
        if (!query) return true;
        return [item.ID, item.Type, item.Message, item.Target, item.Author]
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        if (currentTab === 1) {
          const priorityDiff = (b.weight || 0) - (a.weight || 0);
          return priorityDiff !== 0 ? priorityDiff : new Date(b.Timestamp) - new Date(a.Timestamp);
        }
        return new Date(b.Timestamp) - new Date(a.Timestamp);
      });
  }, [notifications, categoryFilter, currentTab, role, searchQuery]);

  const totalBroadcasts = notifications.length;
  const urgentAlerts = notifications.filter((item) => item.Type === 'Placement').length;
  const readCount = notifications.filter((item) => viewedIds.has(item.ID)).length;
  const unreadCount = totalBroadcasts - readCount;
  const readPercentage = totalBroadcasts ? Math.round((readCount / totalBroadcasts) * 100) : 0;

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const toggleReadStatus = (id) => {
    setViewedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleOpenEdit = (notif) => {
    setEditNotification(notif);
    setEditDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setEditNotification(null);
  };

  const handleOpenDetails = (notif) => {
    setSelectedNotification(notif);
    setDetailsDialogOpen(true);
    toggleReadStatus(notif.ID);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedNotification(null);
  };

  const handleSaveEdit = () => {
    if (!editNotification) return;
    const updated = normalizeNotification(editNotification);
    setNotifications((prev) => prev.map((n) => (n.ID === updated.ID ? updated : n)));
    // broadcast update
    const envelope = { action: 'update', payload: updated };
    try {
      if (bcRef.current && typeof bcRef.current.postMessage === 'function') {
        bcRef.current.postMessage(envelope);
      } else if (typeof BroadcastChannel !== 'undefined') {
        const tmp = new BroadcastChannel('campus_notifications');
        tmp.postMessage(envelope);
        tmp.close();
      } else {
        localStorage.setItem('campus_broadcast', JSON.stringify(envelope));
        setTimeout(() => localStorage.removeItem('campus_broadcast'), 500);
      }
    } catch (e) {}
    handleCloseEdit();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this notification?')) return;
    setNotifications((prev) => prev.filter((n) => n.ID !== id));
    const envelope = { action: 'delete', payload: id };
    try {
      if (bcRef.current && typeof bcRef.current.postMessage === 'function') {
        bcRef.current.postMessage(envelope);
      } else if (typeof BroadcastChannel !== 'undefined') {
        const tmp = new BroadcastChannel('campus_notifications');
        tmp.postMessage(envelope);
        tmp.close();
      } else {
        localStorage.setItem('campus_broadcast', JSON.stringify(envelope));
        setTimeout(() => localStorage.removeItem('campus_broadcast'), 500);
      }
    } catch (e) {}
  };

  const handleBroadcast = (event) => {
    event.preventDefault();
    if (!messageInput.trim()) return;

    const newNotification = normalizeNotification({
      ID: `VTU${10000 + Math.floor(Math.random() * 90000)}`,
      Type: typeInput,
      Message: messageInput.trim(),
      Timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      Target: audienceInput,
      Author: 'Faculty Admin',
      StudentID: broadcastStudentID || ''
    });

    setNotifications((prev) => [newNotification, ...prev]);
    // Broadcast to other tabs/clients so students receive updates immediately
    const envelope = { action: 'create', payload: newNotification };
    try {
      if (bcRef.current && typeof bcRef.current.postMessage === 'function') {
        bcRef.current.postMessage(envelope);
      } else if (typeof BroadcastChannel !== 'undefined') {
        const tmp = new BroadcastChannel('campus_notifications');
        tmp.postMessage(envelope);
        tmp.close();
      } else {
        // fallback via localStorage event
        localStorage.setItem('campus_broadcast', JSON.stringify(envelope));
        // cleanup to avoid cluttering storage
        setTimeout(() => localStorage.removeItem('campus_broadcast'), 500);
      }
    } catch (e) {
      // ignore broadcast errors
    }
    setMessageInput('');
    setBroadcastStudentID('');
    setPage(0);
  };

  const currentPageItems = filteredNotifications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#eef2ff' }}>
      <AppBar position="sticky" sx={{ background: 'linear-gradient(90deg, #0f172a, #1e293b)', boxShadow: '0 18px 65px rgba(15,23,42,0.18)' }}>
        <Toolbar sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Notifications sx={{ color: '#60a5fa', fontSize: 30 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Campus Alerts Dashboard
              </Typography>
              <Typography variant="body2" color="rgba(226,232,240,0.84)">
                Elite notification management for students and faculty.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant={role === 'student' ? 'contained' : 'outlined'}
              color="primary"
              startIcon={<School />}
              onClick={() => {
                setRole('student');
                setPage(0);
              }}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Student Portal
            </Button>
            <Button
              variant={role === 'faculty' ? 'contained' : 'outlined'}
              color="secondary"
              startIcon={<SupervisorAccount />}
              onClick={() => {
                setRole('faculty');
                setPage(0);
              }}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Admin Dashboard
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
            {role === 'student' ? 'Student Notice Center' : 'Admin Analytics & Broadcast'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {role === 'student'
              ? 'Search notices instantly and keep your campus updates organized.'
              : 'Review urgent alerts, broadcast updates, and monitor read metrics.'}
          </Typography>
        </Box>
        {role === 'student' && (
          <Box sx={{ mb: 3 }}>
            <TextField
              label="Your Student ID"
              placeholder="VTU12345"
              value={currentStudentID}
              onChange={(e) => setCurrentStudentID(e.target.value)}
              helperText="Enter your VTU ID (we'll normalize it to VTU12345)."
              size="small"
            />
          </Box>
        )}

        {role === 'faculty' && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {[
              {
                title: 'Total Broadcasts',
                value: totalBroadcasts,
                subtitle: 'Notices available across the dashboard',
                gradient: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                icon: <BarChart sx={{ color: '#fff' }} />
              },
              {
                title: 'Urgent Alerts',
                value: urgentAlerts,
                subtitle: 'Placement messages requiring immediate action',
                gradient: 'linear-gradient(135deg, #dc2626, #f97316)',
                icon: <Bolt sx={{ color: '#fff' }} />
              },
              {
                title: 'Read vs Unread',
                value: `${readCount}/${totalBroadcasts} read`,
                subtitle: `${unreadCount} unread pending`,
                gradient: 'linear-gradient(135deg, #0f766e, #14b8a6)',
                icon: <TrendingUp sx={{ color: '#fff' }} />
              }
            ].map((metric) => (
              <Grid item xs={12} md={4} key={metric.title}>
                <Card sx={{ borderRadius: 3, overflow: 'hidden', background: metric.gradient, color: '#fff', position: 'relative' }}>
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2" sx={{ opacity: 0.9, letterSpacing: 0.8 }}>
                          {metric.title}
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 800 }}>
                          {metric.value}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.18)', width: 48, height: 48 }}>
                        {metric.icon}
                      </Avatar>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 2, opacity: 0.88 }}>
                      {metric.subtitle}
                    </Typography>
                  </CardContent>
                  {metric.title === 'Read vs Unread' && (
                    <Box sx={{ height: 8, width: '100%', bgcolor: 'rgba(255,255,255,0.15)' }}>
                      <Box sx={{ width: `${readPercentage}%`, height: '100%', bgcolor: '#ffffff' }} />
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder='Search notices: "hiring", "mid-sem", "auditorium"'
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(event) => {
                    setCategoryFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="All">All Categories</MenuItem>
                  <MenuItem value="Placement">Placements</MenuItem>
                  <MenuItem value="Result">Results</MenuItem>
                  <MenuItem value="Event">Events</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {role === 'faculty' && (
          <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Campaign color="warning" />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
                Publish a campus broadcast
              </Typography>
            </Stack>
            <Box component="form" onSubmit={handleBroadcast}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Notice Type</InputLabel>
                    <Select value={typeInput} label="Notice Type" onChange={(event) => setTypeInput(event.target.value)}>
                      <MenuItem value="Placement">Placement</MenuItem>
                      <MenuItem value="Result">Result</MenuItem>
                      <MenuItem value="Event">Event</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Audience</InputLabel>
                    <Select value={audienceInput} label="Audience" onChange={(event) => setAudienceInput(event.target.value)}>
                      <MenuItem value="All">All</MenuItem>
                      <MenuItem value="Students">Students</MenuItem>
                      <MenuItem value="Faculty">Faculty</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Write broadcast message"
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Student ID (optional)"
                    placeholder="VTU12345"
                    value={broadcastStudentID}
                    onChange={(e) => setBroadcastStudentID(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button type="submit" fullWidth variant="contained" color="warning" sx={{ height: 56, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
                    Broadcast
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        )}

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Tabs value={currentTab} onChange={(_, value) => { setCurrentTab(value); setPage(0); }} sx={{ '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' } }}>
            <Tab label="Live Inbox Feed" />
            <Tab label="🔥 Priority Inbox" />
          </Tabs>
          <Typography sx={{ color: 'text.secondary', alignSelf: 'center' }}>
            Showing {filteredNotifications.length} notice{filteredNotifications.length === 1 ? '' : 's'}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {currentPageItems.map((item) => {
            const meta = TYPE_CONFIG[item.Type] || TYPE_CONFIG.Event;
            const isUnread = !viewedIds.has(item.ID);
            return (
              <Grid item xs={12} md={6} key={item.ID}>
                <Card
                  onClick={() => handleOpenDetails(item)}
                  sx={{
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    border: '1px solid #e2e8f0',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 24px 60px rgba(15,23,42,0.12)'
                    }
                  }}
                >
                  <CardContent sx={{ px: 3, py: 3.5 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: meta.bg, color: meta.color }}>{meta.icon}</Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 700 }}>{item.Type}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.Target} • {item.Author}{item.StudentID ? ` • Student: ${item.StudentID}` : ''}
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip
                        label={item.Type}
                        size="small"
                        sx={{
                          bgcolor: meta.bg,
                          color: meta.color,
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}
                      />
                                {role === 'faculty' && (
                          <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
                            <IconButton size="small" onClick={() => handleOpenEdit(item)}>
                              <Edit sx={{ color: '#374151' }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(item.ID)}>
                              <Delete sx={{ color: '#ef4444' }} />
                            </IconButton>
                          </Stack>
                        )}
                    </Stack>
                    <Typography variant="body1" sx={{ fontWeight: 700, mb: 1.5, color: '#111827' }}>
                      {item.Message}
                    </Typography>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2" color="text.secondary">
                        {item.Timestamp}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: isUnread ? '#4ade80' : '#cbd5e1',
                            boxShadow: isUnread ? '0 0 12px rgba(74,222,128,0.45)' : 'none'
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {isUnread ? 'Unread' : 'Viewed'}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Dialog open={editDialogOpen} onClose={handleCloseEdit} fullWidth maxWidth="sm">
          <DialogTitle>Edit Notification</DialogTitle>
          <DialogContent>
            {editNotification && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField label="ID" value={editNotification.ID} disabled />
                <TextField
                  label="Message"
                  value={editNotification.Message}
                  onChange={(e) => setEditNotification((prev) => ({ ...prev, Message: e.target.value }))}
                  multiline
                />
                <FormControl>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={editNotification.Type}
                    label="Type"
                    onChange={(e) => setEditNotification((prev) => ({ ...prev, Type: e.target.value }))}
                  >
                    <MenuItem value="Placement">Placement</MenuItem>
                    <MenuItem value="Result">Result</MenuItem>
                    <MenuItem value="Event">Event</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Target"
                  value={editNotification.Target}
                  onChange={(e) => setEditNotification((prev) => ({ ...prev, Target: e.target.value }))}
                />
                <TextField
                  label="Student ID (optional)"
                  value={editNotification.StudentID || ''}
                  onChange={(e) => setEditNotification((prev) => ({ ...prev, StudentID: e.target.value }))}
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEdit}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleSaveEdit}>Save</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={detailsDialogOpen} onClose={handleCloseDetails} fullWidth maxWidth="sm">
          <DialogTitle>Notification Details</DialogTitle>
          <DialogContent>
            {selectedNotification && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField label="Notification ID" value={selectedNotification.ID} disabled fullWidth />
                <TextField label="Student ID" value={selectedNotification.StudentID || 'All students'} disabled fullWidth />
                <TextField label="Type" value={selectedNotification.Type} disabled fullWidth />
                <TextField label="Target" value={selectedNotification.Target} disabled fullWidth />
                <TextField label="Author" value={selectedNotification.Author} disabled fullWidth />
                <TextField label="Timestamp" value={selectedNotification.Timestamp} disabled fullWidth />
                <TextField
                  label="Message"
                  value={selectedNotification.Message}
                  disabled
                  multiline
                  minRows={3}
                  fullWidth
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetails}>Close</Button>
          </DialogActions>
        </Dialog>

        <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography color="text.secondary">
            Page {page + 1} of {Math.max(1, Math.ceil(filteredNotifications.length / rowsPerPage))}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              disabled={page === 0}
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            >
              Previous
            </Button>
            <Button
              variant="contained"
              disabled={(page + 1) * rowsPerPage >= filteredNotifications.length}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
