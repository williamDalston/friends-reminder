// src/PushNotificationService.jsx
import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, getFCMToken, requestNotificationPermission, onMessageListener } from './firebase';

export default function PushNotificationService({ userId, currentMode, appId }) {
  const [pushSettings, setPushSettings] = useState({
    enablePushNotifications: true,
    fcmToken: null,
    notificationTypes: {
      birthdayReminders: true,
      messageReminders: true,
      importantDateReminders: true,
      weeklyDigest: false
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Initialize push notifications
  useEffect(() => {
    initializePushNotifications();
  }, [userId]);

  const initializePushNotifications = async () => {
    if (!userId) return;

    try {
      // Request notification permission
      const permissionGranted = await requestNotificationPermission();
      
      if (permissionGranted) {
        // Get FCM token
        const token = await getFCMToken();
        
        if (token) {
          setPushSettings(prev => ({
            ...prev,
            fcmToken: token
          }));

          // Save token to Firestore
          await saveFCMToken(token);
        }
      }

      // Set up message listener for foreground messages
      onMessageListener().then(payload => {
        console.log('Foreground message received:', payload);
        // Handle foreground message if needed
      }).catch(err => {
        console.error('Error setting up message listener:', err);
      });

    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  // Save FCM token to Firestore
  const saveFCMToken = async (token) => {
    if (!userId) return;

    try {
      const collectionPath = currentMode === 'private'
        ? `artifacts/${appId}/users/${userId}/tokens`
        : `artifacts/${appId}/public/tokens`;

      await addDoc(collection(db, collectionPath), {
        fcmToken: token,
        userId: userId,
        createdAt: new Date().toISOString(),
        platform: 'web',
        appVersion: '1.0.0'
      });

      console.log('FCM token saved successfully');
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  };

  // Save push notification settings
  const savePushSettings = async () => {
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
        type: 'pushSettings',
        ...pushSettings,
        updatedAt: new Date().toISOString()
      });

      setMessage('Push notification settings saved successfully!');
    } catch (error) {
      console.error('Error saving push settings:', error);
      setMessage('Failed to save push settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Send push notification (this would typically be done from a backend)
  const sendPushNotification = async (friend, notificationType, customMessage = '') => {
    if (!pushSettings.enablePushNotifications || !pushSettings.fcmToken) {
      return;
    }

    try {
      const notificationData = {
        friendId: friend.id,
        friendName: friend.name,
        notificationType,
        message: customMessage,
        timestamp: new Date().toISOString(),
        fcmToken: pushSettings.fcmToken
      };

      const collectionPath = currentMode === 'private'
        ? `artifacts/${appId}/users/${userId}/notifications`
        : `artifacts/${appId}/public/notifications`;

      await addDoc(collection(db, collectionPath), notificationData);
      
      console.log('Push notification queued for sending:', notificationData);
    } catch (error) {
      console.error('Error queuing push notification:', error);
    }
  };

  // Test push notification
  const testPushNotification = async () => {
    if (!pushSettings.fcmToken) {
      setMessage('No FCM token available. Please check notification permissions.');
      return;
    }

    try {
      await sendPushNotification(
        { id: 'test', name: 'Test Friend' },
        'test',
        'This is a test push notification from Friends Reminder!'
      );
      setMessage('Test notification sent! Check your device.');
    } catch (error) {
      console.error('Error sending test notification:', error);
      setMessage('Failed to send test notification');
    }
  };

  // Push notification settings form component
  const PushNotificationSettingsForm = () => (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Push Notifications</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          <input
            type="checkbox"
            checked={pushSettings.enablePushNotifications}
            onChange={(e) => setPushSettings({
              ...pushSettings,
              enablePushNotifications: e.target.checked
            })}
            style={{ marginRight: '8px' }}
          />
          Enable Push Notifications
        </label>
      </div>

      {pushSettings.fcmToken && (
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#e8f5e8', 
          borderRadius: '5px',
          fontSize: '12px',
          wordBreak: 'break-all'
        }}>
          <strong>FCM Token:</strong> {pushSettings.fcmToken.substring(0, 50)}...
        </div>
      )}

      {pushSettings.enablePushNotifications && (
        <>
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
              Notification Types:
            </h4>
            {Object.entries(pushSettings.notificationTypes).map(([type, enabled]) => (
              <label key={type} style={{ display: 'block', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setPushSettings({
                    ...pushSettings,
                    notificationTypes: {
                      ...pushSettings.notificationTypes,
                      [type]: e.target.checked
                    }
                  })}
                  style={{ marginRight: '8px' }}
                />
                {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
            ))}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
              Quiet Hours:
            </h4>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              <input
                type="checkbox"
                checked={pushSettings.quietHours.enabled}
                onChange={(e) => setPushSettings({
                  ...pushSettings,
                  quietHours: {
                    ...pushSettings.quietHours,
                    enabled: e.target.checked
                  }
                })}
                style={{ marginRight: '8px' }}
              />
              Enable Quiet Hours
            </label>
            
            {pushSettings.quietHours.enabled && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>
                    Start Time:
                  </label>
                  <input
                    type="time"
                    value={pushSettings.quietHours.start}
                    onChange={(e) => setPushSettings({
                      ...pushSettings,
                      quietHours: {
                        ...pushSettings.quietHours,
                        start: e.target.value
                      }
                    })}
                    style={{
                      padding: '5px',
                      borderRadius: '3px',
                      border: '1px solid #ddd',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>
                    End Time:
                  </label>
                  <input
                    type="time"
                    value={pushSettings.quietHours.end}
                    onChange={(e) => setPushSettings({
                      ...pushSettings,
                      quietHours: {
                        ...pushSettings.quietHours,
                        end: e.target.value
                      }
                    })}
                    style={{
                      padding: '5px',
                      borderRadius: '3px',
                      border: '1px solid #ddd',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={savePushSettings}
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
              {isLoading ? 'Saving...' : 'Save Push Settings'}
            </button>

            <button
              onClick={testPushNotification}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test Notification
            </button>
          </div>
        </>
      )}
    </div>
  );

  return {
    pushSettings,
    setPushSettings,
    sendPushNotification,
    PushNotificationSettingsForm
  };
} 