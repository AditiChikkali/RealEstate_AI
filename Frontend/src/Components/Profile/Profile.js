// src/components/Profile/Profile.js
import React, { useEffect, useState } from 'react';

const Profile = () => {
  const [userData, setUserData] = useState({ email: '', username: '' });

  useEffect(() => {
    // Assuming username and email are stored in localStorage after authentication
    const storedUsername = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('userEmail'); // Make sure this is saved in localStorage on login/signup

    if (storedUsername && storedEmail) {
      setUserData({
        email: storedEmail,
        username: storedUsername,
      });
    }
  }, []);

  return (
    <div className='profile-page'>
      <h2>Your Profile</h2>
      <div className='profile-info'>
        <p>
          <strong>Username:</strong> {userData.username}
        </p>
        <p>
          <strong>Email:</strong> {userData.email}
        </p>
      </div>
    </div>
  );
};

export default Profile;
