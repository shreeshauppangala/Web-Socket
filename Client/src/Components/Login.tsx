import { Link } from 'react-router-dom';
import { useAuth } from '../Context/Auth/useAuth';
import { Controller, useForm } from 'react-hook-form';
import type { LoginFormI } from '../Constants/interface';
import { pattern } from '../Constants';

const Login = () => {
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormI>({
    mode: 'all',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { onSignIn, isSigningIn } = useAuth();

  const onSubmit = (data: LoginFormI) => {
    onSignIn(data);
  };

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <h2 style={styles.title}>Login to Chat</h2>

        {errors.email && <div style={styles.error}>{errors.email.message}</div>}
        {errors.password && <div style={styles.error}>{errors.password.message}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email:</label>
            <Controller
              name='email'
              control={control}
              rules={{
                required: 'Email Is Required',
                pattern: { value: pattern.email, message: 'Invalid Email' },
              }}
              render={({ field, }) => (
                <input
                  {...field}
                  type="email"
                  name="email"
                  required
                  style={styles.input}
                  placeholder="Enter your email"
                />
              )}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password:</label>
            <Controller
              name='password'
              control={control}
              rules={{
                required: 'Password Is Required',
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="password"
                  name="password"
                  required
                  style={styles.input}
                  placeholder="Enter your password"
                />
              )
              }
            />
          </div>

          <button
            type="submit"
            disabled={isSigningIn}
            style={styles.button}
          >
            {isSigningIn ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={styles.link}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  form: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '2rem',
    color: '#333'
  },
  inputGroup: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#555'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1rem'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    border: '1px solid #f5c6cb'
  },
  link: {
    textAlign: 'center',
    marginTop: '1rem'
  }
} as const;

export default Login;