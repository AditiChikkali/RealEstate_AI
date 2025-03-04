import React, { useState, useRef } from 'react';
import './FooterChat.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const FooterChat = ({ inputMessage, setInputMessage, onSend }) => {
  const [file, setFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setShowPreview(true);
    }
  };

  // Handle file upload
  const handleFileUpload = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found. User might not be authenticated.');
      return;
    }
    setIsLoading(true);
    const endpoint = process.env.REACT_APP_BACKEND_URL;
    axios
      .post(endpoint + '/api/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setIsLoading(false);
        console.log('File uploaded successfully:', response.data);
      })
      .catch((error) => {
        setIsLoading(false);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        console.error('Error uploading file:', error);
      });
  };

  const handleUploadConfirm = () => {
    if (file) {
      handleFileUpload(file);
      setShowPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    setFile(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    if (inputMessage.trim()) {
      onSend(inputMessage.trim());
      setInputMessage(''); // Clear the input after sending
    }
  };

  return (
    <>
      {isLoading && (
        <div className='file-loader-overlay'>
          <div className='file-loader'></div>
        </div>
      )}
      <div className='footer-chat'>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className='footer-form'
        >
          <input
            type='text'
            className='chat-input'
            placeholder='Type a message...'
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <input
            type='file'
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id='file-upload'
            ref={fileInputRef}
          />
          <label htmlFor='file-upload' className='upload-button'>
            <FontAwesomeIcon icon={faPaperclip} className='fa-icon-upload' />
          </label>
          <button
            type='submit'
            className='send-button'
            onClick={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <FontAwesomeIcon icon={faPaperPlane} className='send-icon' />
          </button>
        </form>

        {showPreview && (
          <div className='file-preview-popup'>
            <div className='file-preview-content'>
              <h3>File Preview</h3>
              <p>File Name: {file.name}</p>
              <p>File Size: {(file.size / 1024).toFixed(2)} KB</p>
              <div className='button-container'>
                <button className='cancel-upload' onClick={handleCancel}>
                  Cancel
                </button>
                <button
                  className='confirm-upload'
                  onClick={handleUploadConfirm}
                >
                  Confirm Upload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FooterChat;
