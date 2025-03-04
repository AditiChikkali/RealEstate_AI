// src/components/Signup.js

import React, { useState } from 'react';
import './Signup.css';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // For navigation

const Signup = ({ onSignupSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Hook for navigation

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password || !name) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const endpoint = process.env.REACT_APP_BACKEND_URL;

      // const endpoint = "http://localhost:5000"
      const response = await axios.post(endpoint + '/auth/signup', {
        name,
        email,
        password,
      }); // Adjusted API endpoint
      if (response.status === 201) {
        const { token } = response.data;

        // Save the token locally if needed
        localStorage.setItem('authToken', token);
        localStorage.setItem('userName', name); // Store username

        // Call parent method on successful signup
        onSignupSuccess(name); // Pass the name to the context

        // Navigate to login after successful signup
        navigate('/signin'); // Redirect to login page
      } else {
        setError('Signup failed. Please try again.');
      }
    } catch (err) {
      setError('Error during signup. Please try again later.');
    }
  };

  return (
    <div className='signup-container'>
      <h2>Sign Up</h2>
      {error && <p className='error-message'>{error}</p>}
      <form onSubmit={handleSubmit} className='signup-form'>
        <div className='form-group'>
          <label>Name</label>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Enter your name'
            required
          />
        </div>
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
        <div className='form-group'>
          <label>Confirm Password</label>
          <input
            type='password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder='Confirm your password'
            required
          />
        </div>
        <button type='submit' className='signup-button'>
          Sign Up
        </button>
      </form>
      <p>
        Already have an account?{' '}
        <Link to='/signin' style={{ color: 'red' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Signup;
