import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';
import FooterChat from '../FooterChat/FooterChat';
import botIcon from '../../assets/botIcon-white.png';
import TypingGif from '../../assets/typing.gif';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import userprofile from '../../assets/userprofile.png';

function Chat({ chatMessages, onSendMessage, botTyping, setChatMessages }) {
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef(null);
  const location = useLocation();
  const endpoint = process.env.REACT_APP_BACKEND_URL;

  // Fetch previous chat history
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      axios
        .get(`${endpoint}/api/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => setChatMessages(response.data.chats))
        .catch((error) => console.error('Error fetching chat history:', error));
    }
  }, [endpoint, setChatMessages]);

  // Check for pre-filled questions
  useEffect(() => {
    if (location.state?.question) {
      const question = location.state.question;
      const alreadyExists = chatMessages.some(
        (msg) => msg.message === question && msg.role === 'user'
      );

      if (!alreadyExists) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'user', message: question },
        ]);
        onSendMessage(question);
      }

      window.history.replaceState({}, document.title);
    }
  }, [location.state, chatMessages, onSendMessage, setChatMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle message submission
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  return (
    <div className='chat-page'>
      <div className='chat-container'>
        <div className='chat-box'>
          {chatMessages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className='chat-avatar'>
                  <img
                    src={userprofile}
                    alt='bot'
                    className='chat-avatar-icon'
                  />
                </div>
              )}
              <div className='chat-text'>
                {msg.role === 'user' ? (
                  <strong>{msg.message}</strong>
                ) : (
                  <ReactMarkdown>{msg.message}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {botTyping && (
            <div className='chat-message assistant'>
              <div className='chat-avatar'>
                <img src={botIcon} alt='bot' className='chat-avatar-icon' />
              </div>
              <div className='chat-text'>
                <p>Looking up...</p>
                <img src={TypingGif} alt='Typing...' className='gif' />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
      <form className='chat-input-form' onSubmit={handleSendMessage}>
        <FooterChat
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSend={onSendMessage}
        />
      </form>
    </div>
  );
}

export default Chat;
