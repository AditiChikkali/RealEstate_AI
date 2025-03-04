import React, { useState } from 'react';
import './Signin.css';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // For navigation

const Signin = ({ onSigninSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Hook for navigation

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const endpoint = process.env.REACT_APP_BACKEND_URL;
      const response = await axios.post(`${endpoint}/auth/signin`, {
        email,
        password,
      });

      if (response.status === 200) {
        const { token, userName } = response.data; // Assuming userName is returned from backend
        console.log('response:', response.data);

        // Save the token and username locally
        localStorage.setItem('authToken', token);
        localStorage.setItem('userName', userName); // Store username

        // Call parent method on successful login
        onSigninSuccess(userName); // Pass userName to the context or parent

        // Navigate to dashboard after login success
        navigate('/'); // Redirect to a protected page
      } else {
        setError('Invalid credentials, please try again.');
      }
    } catch (err) {
      setError('Error during login. Please try again later.');
      console.error('Login error:', err); // Log error for debugging
    }
  };

  return (
    <div className='login-container'>
      <h2>Login</h2>
      {error && <p className='error-message'>{error}</p>}
      <form onSubmit={handleSubmit} className='login-form'>
        <div className='form-group'>
          <label>Email</label>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='Enter your email'
            required
          />
        </div>
        <div className='form-group'>
          <label>Password</label>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='Enter your password'
            required
          />
        </div>
        <button type='submit' className='login-button'>
          Login
        </button>
      </form>
      <p>
        Don't have an account?{' '}
        <Link to='/signup' style={{ color: 'red' }}>
          Sign Up
        </Link>
      </p>
    </div>
  );
};

export default Signin;
