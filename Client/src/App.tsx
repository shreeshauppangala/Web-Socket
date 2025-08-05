import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Chat from './Components/Chat';
import Login from './Components/Login';
import Register from './Components/Register';
import { AuthProvider } from './Context/Auth/authProvider';
import { useAuth } from './Context/Auth/useAuth';

const ProtectedRoute = () => {
  const { isSigningIn } = useAuth();

  const isAuthenticated = !!localStorage.getItem('user');

  if (isSigningIn) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

const PublicRoute = () => {
  const { isSigningIn } = useAuth();

  const isAuthenticated = !!localStorage.getItem('user');


  if (isSigningIn) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return !isAuthenticated ? <Outlet /> : <Navigate to="/chat" />;
};

const App = () => (
  <Router>
    <AuthProvider>
      <div style={styles.app}>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" />} />
          <Route element={<PublicRoute />}>
            <Route
              path="/login"
              element={<Login />}
            />
            <Route
              path="/register"
              element={<Register />}
            />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route
              path="/"
              element={<Chat />}
            />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  </Router>
);

const styles = {
  app: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.2rem'
  }
};

export default App;