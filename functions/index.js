const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

const db = admin.firestore();

// Email configuration (you'll need to set up your own email service)
const transporter = nodemailer.createTransporter({
  service: 'gmail', // or your preferred email service
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass
  }
});

// Cloud Function to send emails
exports.sendEmail = functions.firestore
  .document('artifacts/{appId}/users/{userId}/emails/{emailId}')
  .onCreate(async (snap, context) => {
    const emailData = snap.data();
    const { appId, userId } = context.params;

    try {
      // Send email
      const mailOptions = {
        from: functions.config().email.user,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.body,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2ecc71;">Friends Reminder</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
              <h3>${emailData.subject}</h3>
              <p style="white-space: pre-line;">${emailData.body}</p>
            </div>
            <p style="color: #7f8c8d; font-size: 12px; margin-top: 20px;">
              This email was sent from your Friends Reminder app.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      // Update email status
      await snap.ref.update({
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('Email sent successfully:', emailData.subject);
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Update email status
      await snap.ref.update({
        status: 'failed',
        error: error.message,
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

// Cloud Function to send push notifications
exports.sendPushNotification = functions.firestore
  .document('artifacts/{appId}/users/{userId}/notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notificationData = snap.data();
    const { appId, userId } = context.params;

    try {
      // Get user's FCM tokens
      const tokensSnapshot = await db
        .collection(`artifacts/${appId}/users/${userId}/tokens`)
        .where('fcmToken', '==', notificationData.fcmToken)
        .get();

      if (tokensSnapshot.empty) {
        console.log('No FCM tokens found for user');
        return;
      }

      const message = {
        notification: {
          title: `Friends Reminder - ${notificationData.friendName}`,
          body: notificationData.message || 'You have a new reminder!'
        },
        data: {
          friendId: notificationData.friendId,
          friendName: notificationData.friendName,
          notificationType: notificationData.notificationType,
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        },
        token: notificationData.fcmToken
      };

      const response = await admin.messaging().send(message);
      console.log('Push notification sent successfully:', response);

      // Update notification status
      await snap.ref.update({
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
      
      // Update notification status
      await snap.ref.update({
        status: 'failed',
        error: error.message,
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

// Scheduled function to send daily digest emails
exports.sendDailyDigest = functions.pubsub
  .schedule('0 9 * * *') // Every day at 9 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      // Get all users with email settings
      const usersSnapshot = await db
        .collectionGroup('settings')
        .where('type', '==', 'emailSettings')
        .where('emailFrequency', '==', 'daily')
        .get();

      for (const userDoc of usersSnapshot.docs) {
        const emailSettings = userDoc.data();
        const userId = userDoc.ref.parent.parent.id;

        // Get friends that need attention
        const friendsSnapshot = await db
          .collection(`artifacts/friends-reminder-1b494/users/${userId}/friends`)
          .get();

        const friendsNeedingAttention = [];
        const upcomingBirthdays = [];
        const upcomingImportantDates = [];

        friendsSnapshot.forEach(doc => {
          const friend = { id: doc.id, ...doc.data() };
          
          // Check if friend needs messaging
          const lastInteraction = friend.interactions && friend.interactions.length > 0 
            ? friend.interactions[friend.interactions.length - 1].date 
            : null;
          
          if (!lastInteraction || needsMessaging(lastInteraction, friend.reminderFrequency)) {
            friendsNeedingAttention.push(friend);
          }

          // Check for upcoming birthdays
          if (friend.birthday) {
            const daysUntilBirthday = calculateDaysUntilBirthday(friend.birthday);
            if (daysUntilBirthday <= 7) {
              upcomingBirthdays.push({ ...friend, daysUntil: daysUntilBirthday });
            }
          }

          // Check for upcoming important dates
          if (friend.importantDates) {
            friend.importantDates.forEach(date => {
              const daysUntil = calculateDaysUntilDate(date.date);
              if (daysUntil <= 7) {
                upcomingImportantDates.push({ ...friend, date, daysUntil });
              }
            });
          }
        });

        // Generate digest email
        if (friendsNeedingAttention.length > 0 || upcomingBirthdays.length > 0 || upcomingImportantDates.length > 0) {
          const digestEmail = {
            to: emailSettings.emailAddress,
            subject: 'Friends Reminder - Daily Digest',
            body: generateDigestEmail(friendsNeedingAttention, upcomingBirthdays, upcomingImportantDates),
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          };

          await db
            .collection(`artifacts/friends-reminder-1b494/users/${userId}/emails`)
            .add(digestEmail);
        }
      }

      console.log('Daily digest emails processed');
    } catch (error) {
      console.error('Error processing daily digest:', error);
    }
  });

// Helper functions
function needsMessaging(lastInteractionDate, frequency) {
  if (!lastInteractionDate) return true;

  const lastDate = new Date(lastInteractionDate);
  const today = new Date();
  let intervalDays;

  switch (frequency) {
    case 'weekly': intervalDays = 7; break;
    case 'bi-weekly': intervalDays = 14; break;
    case 'quarterly': intervalDays = 90; break;
    case 'monthly':
    default: intervalDays = 30; break;
  }

  const thresholdDate = new Date(lastDate);
  thresholdDate.setDate(thresholdDate.getDate() + intervalDays);

  return today > thresholdDate;
}

function calculateDaysUntilBirthday(birthdayString) {
  const today = new Date();
  const [year, month, day] = birthdayString.split('-').map(Number);
  let nextBirthday = new Date(today.getFullYear(), month - 1, day);

  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
  }

  const diffTime = nextBirthday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateDaysUntilDate(dateString) {
  const targetDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function generateDigestEmail(friendsNeedingAttention, upcomingBirthdays, upcomingImportantDates) {
  let emailBody = 'Hello! Here\'s your daily Friends Reminder digest:\n\n';

  if (friendsNeedingAttention.length > 0) {
    emailBody += '📱 Friends to Message:\n';
    friendsNeedingAttention.forEach(friend => {
      emailBody += `• ${friend.name}\n`;
    });
    emailBody += '\n';
  }

  if (upcomingBirthdays.length > 0) {
    emailBody += '🎂 Upcoming Birthdays:\n';
    upcomingBirthdays.forEach(friend => {
      emailBody += `• ${friend.name} - ${friend.daysUntil} day${friend.daysUntil !== 1 ? 's' : ''} away\n`;
    });
    emailBody += '\n';
  }

  if (upcomingImportantDates.length > 0) {
    emailBody += '📅 Upcoming Important Dates:\n';
    upcomingImportantDates.forEach(friend => {
      emailBody += `• ${friend.name} - ${friend.date.description} in ${friend.daysUntil} day${friend.daysUntil !== 1 ? 's' : ''}\n`;
    });
    emailBody += '\n';
  }

  if (friendsNeedingAttention.length === 0 && upcomingBirthdays.length === 0 && upcomingImportantDates.length === 0) {
    emailBody += '✅ All caught up! No urgent reminders today.\n\n';
  }

  emailBody += 'Keep your friendships strong! 💪';
  return emailBody;
} 