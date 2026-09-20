import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Budget from './pages/Budget';
import Notes from './pages/Notes';
import Calendar from './pages/Calendar';
import Members from './pages/Members';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Layout><Dashboard /></Layout>
            </PrivateRoute>
          } />
          <Route path="/tasks" element={
            <PrivateRoute>
              <Layout><Tasks /></Layout>
            </PrivateRoute>
          } />
          <Route path="/events" element={
            <PrivateRoute>
              <Layout><Events /></Layout>
            </PrivateRoute>
          } />
          <Route path="/events/:id" element={
            <PrivateRoute>
              <Layout><EventDetail /></Layout>
            </PrivateRoute>
          } />
          <Route path="/budget" element={
            <PrivateRoute>
              <Layout><Budget /></Layout>
            </PrivateRoute>
          } />
          <Route path="/notes" element={
            <PrivateRoute>
              <Layout><Notes /></Layout>
            </PrivateRoute>
          } />
          <Route path="/calendar" element={
            <PrivateRoute>
              <Layout><Calendar /></Layout>
            </PrivateRoute>
          } />
          <Route path="/members" element={
            <PrivateRoute>
              <Layout><Members /></Layout>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;