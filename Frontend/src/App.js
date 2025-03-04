import React, { useState, useEffect, useContext } from 'react';
import {
  Route,
  Routes,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import Signup from './Components/SignUp/Signup';
import Signin from './Components/SignIn/Signin';
import Homepage from './Components/HomePage/HomePage';
import Chat from './Components/Chat/Chat';
import Profile from './Components/Profile/Profile';
import Navbar from './Components/Navbar/Navbar';
import Sidebar from './Components/Sidebar/Sidebar';
import { UserContext } from './contexts/UserContext';
import axios from 'axios';
import './App.css';

function App() {
  const { userName, setUserName } = useContext(UserContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [botTyping, setBotTyping] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('userName');
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUserName(storedUser);
    }
  }, [setUserName]);

  const handleSigninSuccess = (name) => {
    setUserName(name);
    localStorage.setItem('userName', name);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setChatMessages([]);
    navigate('/signin');
  };

  const onChatClick = () => navigate('/chat');

  const sendMessage = (userMessage) => {
    setChatMessages((prevMessages) => [
      ...prevMessages,
      { role: 'user', message: userMessage },
    ]);
    setBotTyping(true);

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found. User might not be authenticated.');
      return;
    }

    const endpoint = process.env.REACT_APP_BACKEND_URL;
    axios
      .post(
        `${endpoint}/api/chat`,
        { message: userMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        const botReply = response.data.reply;
        if (botReply && botReply.trim() !== '') {
          setChatMessages((prevMessages) => [
            ...prevMessages,
            { role: 'assistant', message: botReply },
          ]);
        }
      })
      .catch((error) => {
        console.error('Error communicating with server:', error);
        setChatMessages((prevMessages) => [
          ...prevMessages,
          {
            role: 'assistant',
            message: 'Error communicating with the server.',
          },
        ]);
      })
      .finally(() => setBotTyping(false));
  };

  return (
    <div className='app-container'>
      {isAuthenticated && location.pathname !== '/chat' && <Navbar />}
      {isAuthenticated && (
        <Sidebar onLogOut={handleLogout} onChatClick={onChatClick} />
      )}

      <div className={`content ${isAuthenticated ? 'main-layout' : ''}`}>
        <Routes>
          <Route
            path='/signin'
            element={
              isAuthenticated ? (
                <Navigate to='/' />
              ) : (
                <Signin onSigninSuccess={handleSigninSuccess} />
              )
            }
          />
          <Route
            path='/signup'
            element={
              isAuthenticated ? (
                <Navigate to='/' />
              ) : (
                <Signup onSignupSuccess={handleSigninSuccess} />
              )
            }
          />
          {isAuthenticated ? (
            <>
              <Route path='/' element={<Homepage />} />
              <Route
                path='/chat'
                element={
                  <Chat
                    chatMessages={chatMessages}
                    onSendMessage={sendMessage}
                    botTyping={botTyping}
                    setChatMessages={setChatMessages}
                  />
                }
              />
              <Route path='/profile' element={<Profile />} />
            </>
          ) : (
            <Route path='*' element={<Navigate to='/signin' />} />
          )}
        </Routes>
      </div>
    </div>
  );
}

export default App;
