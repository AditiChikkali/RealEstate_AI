import React from 'react';
import './Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignOutAlt,
  faUser,
  faHome,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import botIcon from '../../assets/botIcon-white.png';

const Sidebar = ({ onLogOut, onChatClick }) => {
  return (
    <div className='sidebar'>
      {/* Logo Section */}
      <div className='logo-section'>
        <img
          src={require('../../assets/Picture1.png')}
          alt='Logo'
          className='sidebar-logo'
        />
        <p className='powered-by-text'>REALESTATE-AI</p>
      </div>

      {/* Menu Items */}
      <div className='menu'>
        <div className='menu-item'>
          <Link to='/' className='home-link'>
            <FontAwesomeIcon icon={faHome} className='icon' />
          </Link>
        </div>
        <div className='menu-item' onClick={onChatClick}>
          <img src={botIcon} alt='bot' className='chat-avatar-sidebar' />
        </div>
        <div className='menu-item' onClick={onLogOut}>
          <FontAwesomeIcon icon={faSignOutAlt} className='icon' />
        </div>
        <div className='menu-item'>
          <Link to='/profile'>
            <FontAwesomeIcon icon={faUser} className='icon' />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
