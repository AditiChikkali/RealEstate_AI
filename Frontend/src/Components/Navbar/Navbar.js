import React, { useContext } from 'react';
import './Navbar.css';
import { UserContext } from '../../contexts/UserContext';

const Navbar = () => {
  const { userName } = useContext(UserContext);

  return (
    <nav className='navbar'>
      <div className='navbar-main'>
        <h4 className='gradient-text'>Welcome, {userName || 'User'}!</h4>
      </div>
    </nav>
  );
};

export default Navbar;
