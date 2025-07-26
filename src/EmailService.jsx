// src/EmailService.jsx
import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

export default function EmailService({ userId, currentMode, appId }) {
  const [emailSettings, setEmailSettings] = useState({
    enableEmailNotifications: true,
    emailAddress: '',
    emailFrequency: 'daily', // daily, weekly, immediate
    emailTypes: {
      birthdayReminders: true,
      messageReminders: true,
      importantDateReminders: true,
      weeklyDigest: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Save email settings to Firestore
  const saveEmailSettings = async () => {
    if (!userId) {
      setMessage('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const collectionPath = currentMode === 'private'
        ? `artifacts/${appId}/users/${userId}/settings`
        : `artifacts/${appId}/public/settings`;

      await addDoc(collection(db, collectionPath), {
        type: 'emailSettings',
        ...emailSettings,
        updatedAt: new Date().toISOString()
      });

      setMessage('Email settings saved successfully!');
    } catch (error) {
      console.error('Error saving email settings:', error);
      setMessage('Failed to save email settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Send immediate email notification
  const sendImmediateEmail = async (friend, notificationType, customMessage = '') => {
    if (!emailSettings.enableEmailNotifications || !emailSettings.emailAddress) {
      return;
    }

    try {
      const emailData = {
        to: emailSettings.emailAddress,
        subject: `Friends Reminder - ${friend.name}`,
        body: generateEmailBody(friend, notificationType, customMessage),
        friendId: friend.id,
        friendName: friend.name,
        notificationType,
        timestamp: new Date().toISOString()
      };

      const collectionPath = currentMode === 'private'
        ? `artifacts/${appId}/users/${userId}/emails`
        : `artifacts/${appId}/public/emails`;

      await addDoc(collection(db, collectionPath), emailData);
      
      console.log('Email queued for sending:', emailData);
    } catch (error) {
      console.error('Error queuing email:', error);
    }
  };

  // Generate email body based on notification type
  const generateEmailBody = (friend, notificationType, customMessage) => {
    const baseMessage = `Hello! This is a reminder about your friend ${friend.name}.`;
    
    switch (notificationType) {
      case 'birthday':
        return `${baseMessage}\n\n${friend.name}'s birthday is coming up! Don't forget to send them a birthday message.\n\nBirthday: ${friend.birthday}\n\n${customMessage}`;
      
      case 'message':
        return `${baseMessage}\n\nIt's been a while since you last messaged ${friend.name}. Consider reaching out to maintain your friendship!\n\nLast contact: ${friend.lastInteractionDate || 'Unknown'}\n\n${customMessage}`;
      
      case 'importantDate':
        return `${baseMessage}\n\n${friend.name} has an important date coming up! Check your app for details.\n\n${customMessage}`;
      
      default:
        return `${baseMessage}\n\n${customMessage}`;
    }
  };

  // Email settings form component
  const EmailSettingsForm = () => (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Email Notifications</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          <input
            type="checkbox"
            checked={emailSettings.enableEmailNotifications}
            onChange={(e) => setEmailSettings({
              ...emailSettings,
              enableEmailNotifications: e.target.checked
            })}
            style={{ marginRight: '8px' }}
          />
          Enable Email Notifications
        </label>
      </div>

      {emailSettings.enableEmailNotifications && (
        <>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email Address:
            </label>
            <input
              type="email"
              value={emailSettings.emailAddress}
              onChange={(e) => setEmailSettings({
                ...emailSettings,
                emailAddress: e.target.value
              })}
              placeholder="your-email@example.com"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email Frequency:
            </label>
            <select
              value={emailSettings.emailFrequency}
              onChange={(e) => setEmailSettings({
                ...emailSettings,
                emailFrequency: e.target.value
              })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              <option value="immediate">Immediate</option>
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Digest</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
              Notification Types:
            </h4>
            {Object.entries(emailSettings.emailTypes).map(([type, enabled]) => (
              <label key={type} style={{ display: 'block', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEmailSettings({
                    ...emailSettings,
                    emailTypes: {
                      ...emailSettings.emailTypes,
                      [type]: e.target.checked
                    }
                  })}
                  style={{ marginRight: '8px' }}
                />
                {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
            ))}
          </div>

          <button
            onClick={saveEmailSettings}
            disabled={isLoading}
            style={{
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isLoading ? 'Saving...' : 'Save Email Settings'}
          </button>
        </>
      )}
    </div>
  );

  return {
    emailSettings,
    setEmailSettings,
    sendImmediateEmail,
    EmailSettingsForm
  };
} 