import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth, storage } from './firebase';
import {
  collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, setDoc, query, getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// Lazy load Tone.js only when needed
let Tone = null;
const loadTone = async () => {
  if (!Tone) {
    const toneModule = await import('tone');
    Tone = toneModule.default;
  }
  return Tone;
};
import Login from './Login';

const appId = "friends-reminder-1b494";

// Define theme colors for light and dark modes
const themes = {
    light: {
        background: '#f4f7f6',
        containerBg: '#ffffff',
        textColor: '#2c3e50',
        headerColor: '#2c3e50',
        sectionTitleColor: '#34495e',
        inputBorder: '#ddd',
        inputBg: 'white',
        buttonBg: '#2ecc71',
        buttonText: 'white',
        listItemBg: '#f9f9f9',
        listItemBorder: '#eee',
        birthdayItemBg: '#ffeaa7',
        birthdayItemBorder: '#feca57',
        reminderItemBg: '#a2d9ce',
        reminderItemBorder: '#76c7c0',
        userIdColor: '#7f8c8d',
        modalBg: 'white',
        modalCloseBtn: '#777',
        modeToggleActiveBg: '#3498db',
        modeToggleActiveText: 'white',
        modeToggleInactiveBg: '#ecf0f1',
        modeToggleInactiveText: '#333',
        shareInfoBg: '#e8f6f3',
        shareInfoBorder: '#2ecc71',
        copyButtonBg: '#1abc9c',
        dashboardCardBg: '#e0f2f7',
        progressBarBg: '#e0e0e0',
        progressBarFill: '#2ecc71',
        undoMessageBg: '#34495e',
        undoMessageText: 'white',
        undoButtonBg: '#f39c12',
        birthdayCountdownColor: '#d35400',
        interactionLogBg: '#f0f4f7', // Light blue-grey for interaction log
        interactionLogBorder: '#cce7f0',
        chartBarColor: '#3498db', // Color for chart bars
        chartAxisColor: '#7f8c8d', // Color for chart axes
        errorText: '#e74c3c', // Error text color
    },
    dark: {
        background: '#2c3e50',
        containerBg: '#34495e',
        textColor: '#ecf0f1',
        headerColor: '#ecf0f1',
        sectionTitleColor: '#bdc3c7',
        inputBorder: '#555',
        inputBg: '#444',
        buttonBg: '#27ae60',
        buttonText: 'white',
        listItemBg: '#444',
        listItemBorder: '#555',
        birthdayItemBg: '#c08a00',
        birthdayItemBorder: '#a07000',
        reminderItemBg: '#007a68',
        reminderItemBorder: '#006050',
        userIdColor: '#bdc3c7',
        modalBg: '#34495e',
        modalCloseBtn: '#bdc3c7',
        modeToggleActiveBg: '#2980b9',
        modeToggleActiveText: 'white',
        modeToggleInactiveBg: '#444',
        modeToggleInactiveText: '#ecf0f1',
        shareInfoBg: '#2e4a46',
        shareInfoBorder: '#1abc9c',
        copyButtonBg: '#16a085',
        dashboardCardBg: '#2a3b4c',
        progressBarBg: '#555',
        progressBarFill: '#27ae60',
        undoMessageBg: '#222',
        undoMessageText: '#ecf0f1',
        undoButtonBg: '#d35400',
        birthdayCountdownColor: '#f39c12',
        interactionLogBg: '#3a4e60', // Darker blue-grey for interaction log
        interactionLogBorder: '#4a6278',
        chartBarColor: '#2980b9',
        chartAxisColor: '#bdc3c7',
        errorText: '#e74c3c',
    }
};

// Define default reminder frequencies based on relationship tier
const tierFrequencies = {
    close: 'weekly',
    regular: 'monthly',
    distant: 'quarterly',
};

const App = () => {
    console.log('App component rendering...');
    
    // Authentication state
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // State variables for managing application data and UI
    const [friends, setFriends] = useState([]);
    const [name, setName] = useState('');
    const [birthday, setBirthday] = useState('');
    const [lastBirthdayWished, setLastBirthdayWished] = useState('');
    const [giftIdeas, setGiftIdeas] = useState('');
    const [giftStatus, setGiftStatus] = useState('Not Started');
    const [giftBudget, setGiftBudget] = useState('');
    const [reminderFrequency, setReminderFrequency] = useState('monthly');
    const [group, setGroup] = useState('');
    const [relationshipTier, setRelationshipTier] = useState('regular');
    const [interactionNotes, setInteractionNotes] = useState('');
    const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [tags, setTags] = useState('');
    const [quickAddName, setQuickAddName] = useState('');
    const [userId, setUserId] = useState(null);
    const [message, setMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showSnoozeModal, setShowSnoozeModal] = useState(false);
    const [snoozeFriendId, setSnoozeFriendId] = useState(null);
    const [snoozeDuration, setSnoozeDuration] = useState('1day');
    const [currentMode, setCurrentMode] = useState('private');
    const [editingFriendId, setEditingFriendId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOption, setFilterOption] = useState('all');
    const [sortOption, setSortOption] = useState('nameAsc');
    const [nameError, setNameError] = useState(false);
    const [birthdayError, setBirthdayError] = useState(false);
    const [availableGroups, setAvailableGroups] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const [undoAction, setUndoAction] = useState(null);
    const undoTimerRef = useRef(null);
    const [quietHoursStart, setQuietHoursStart] = useState('22:00');
    const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
    const [darkMode, setDarkMode] = useState(false);
    const fileInputRef = useRef(null);
    const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true);
    const [preferredNotificationTime, setPreferredNotificationTime] = useState('09:00');

    // States for enhanced friend profiles
    const [facebookUrl, setFacebookUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [twitterUrl, setTwitterUrl] = useState('');
    const [importantDates, setImportantDates] = useState([]);
    const [newImportantDate, setNewImportantDate] = useState('');
    const [newImportantDateDescription, setNewImportantDateDescription] = useState('');
    const [newImportantDateRecurrence, setNewImportantDateRecurrence] = useState('none'); // New state for recurrence
    const [enableReminders, setEnableReminders] = useState(true);
    const [enableBirthdayNotifications, setEnableBirthdayNotifications] = useState(true);

    // Interaction Logging Modal States
    const [showLogInteractionModal, setShowLogInteractionModal] = useState(false);
    const [loggingFriendId, setLoggingFriendId] = useState(null);
    const [interactionDate, setInteractionDate] = useState(new Date().toISOString().slice(0, 10));
    const [interactionMethod, setInteractionMethod] = useState('Text');
    const [interactionNotesLog, setInteractionNotesLog] = useState('');
    const [importStrategy, setImportStrategy] = useState('append');

    // Chart Modal States
    const [showChartModal, setShowChartModal] = useState(false);
    const [chartFriend, setChartFriend] = useState(null);

    // Activity Log Modal States
    const [showActivityLogModal, setShowActivityLogModal] = useState(false);
    const [activityLogFilterTerm, setActivityLogFilterTerm] = useState('');
    const [activityLogSortOption, setActivityLogSortOption] = useState('newest');

    // Tone.js Synth for notification sounds - lazy loaded
    const [synth, setSynth] = useState(null);
    
    // Initialize synth when needed
    const getSynth = useCallback(async () => {
        if (!synth) {
            const ToneInstance = await loadTone();
            const newSynth = new ToneInstance.Synth().toDestination();
            setSynth(newSynth);
            return newSynth;
        }
        return synth;
    }, [synth]);

    // Using useRef to store a Set of IDs for which notifications have been shown in the current session.
    const notifiedFriendsRef = useRef(new Set());

    // Function to request browser notification permission from the user.
    const requestNotificationPermission = async () => {
        if (!("Notification" in window)) {
            console.warn("This browser does not support desktop notification.");
            return;
        }
        if (Notification.permission === "granted") {
            console.log("Notification permission already granted.");
            return;
        }
        if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                console.log("Notification permission granted.");
            } else {
                console.warn("Notification permission denied.");
            }
        }
    };

    // Function to check if current time is within quiet hours.
    const isDuringQuietHours = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const [startHour, startMinute] = quietHoursStart.split(':').map(Number);
        const [endHour, endMinute] = quietHoursEnd.split(':').map(Number);

        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute; // Fixed typo here
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        if (startTimeInMinutes <= endTimeInMinutes) {
            return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
        } else {
            return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes;
        }
    };

    // Function to check if current time is near the preferred notification time.
    const isNearPreferredNotificationTime = useCallback(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const [prefHour, prefMinute] = preferredNotificationTime.split(':').map(Number);

        // Check if within +/- 1 minute of the preferred time
        const isHourMatch = currentHour === prefHour;
        const isMinuteMatch = currentMinute === prefMinute ||
                              currentMinute === prefMinute - 1 ||
                              currentMinute === prefMinute + 1;

        return isHourMatch && isMinuteMatch;
    }, [preferredNotificationTime]);

    // Function to display a browser notification and play sound.
    const showNotification = useCallback((title, body, friendId, notificationType) => {
        // Check global notification settings first
        if (Notification.permission === "granted" && !isDuringQuietHours() && isNearPreferredNotificationTime()) {
            const friend = friends.find(f => f.id === friendId);
            if (!friend) return;

            // Check per-friend notification settings
            let shouldNotify = false;
            if (notificationType === 'message' && friend.enableReminders) {
                shouldNotify = true;
            } else if (notificationType === 'birthday' && friend.enableBirthdayNotifications) {
                shouldNotify = true;
            } else if (notificationType === 'importantDate' && friend.enableReminders) { // Use enableReminders for important dates
                shouldNotify = true;
            }

            if (shouldNotify) {
                new Notification(title, { body });
                if (notificationSoundEnabled) {
                    getSynth().then(synthInstance => {
                        synthInstance.triggerAttackRelease("C5", "8n");
                    }).catch(error => {
                        console.error('Error playing notification sound:', error);
                    });
                }
            } else {
                console.log(`Notification suppressed by per-friend setting: ${title} - ${body}`);
            }
        } else if (isDuringQuietHours()) {
            console.log(`Notification suppressed due to quiet hours: ${title} - ${body}`);
        } else if (!isNearPreferredNotificationTime()) {
            console.log(`Notification suppressed: Not preferred notification time. ${title} - ${body}`);
        } else {
            console.log(`Notification blocked (permission not granted): ${title} - ${body}`);
        }
    }, [notificationSoundEnabled, quietHoursStart, quietHoursEnd, preferredNotificationTime, isNearPreferredNotificationTime, synth, friends]);

    // useEffect hook for Firebase authentication.
    useEffect(() => {
        console.log('Setting up Firebase auth...');
        
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            console.log('Auth state changed:', user ? 'User logged in' : 'No user');
            setUser(user);
            if (user) {
                setUserId(user.uid);
            } else {
                setUserId(null);
            }
            setIsAuthReady(true);
        }, (error) => {
            console.error('Firebase auth error:', error);
            setIsAuthReady(true); // Still set ready so we can show error
        });

        requestNotificationPermission();

        return () => unsubscribeAuth();
    }, []);

    // Helper function to get the latest interaction date
    const getLatestInteractionDate = (interactions) => {
        if (!interactions || interactions.length === 0) return null;
        // Sort by timestamp descending to get the latest
        const sortedInteractions = [...interactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return sortedInteractions[0].date;
    };

    // Helper function to calculate the next occurrence of an important date
    const getNextImportantDateOccurrence = (importantDate, currentYear) => {
        const baseDate = new Date(importantDate.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today to start of day for comparison

        let nextOccurrence = null;

        if (importantDate.recurrence === 'yearly') {
            const month = baseDate.getMonth();
            const day = baseDate.getDate();
            let candidateDate = new Date(currentYear, month, day);

            if (candidateDate < today) {
                candidateDate = new Date(currentYear + 1, month, day);
            }
            nextOccurrence = candidateDate;
        } else if (importantDate.recurrence === 'monthly') {
            const day = baseDate.getDate();
            let candidateDate = new Date(today.getFullYear(), today.getMonth(), day);

            if (candidateDate < today) {
                candidateDate = new Date(today.getFullYear(), today.getMonth() + 1, day);
            }
            nextOccurrence = candidateDate;
        } else { // 'none' or one-time event
            nextOccurrence = baseDate;
            if (nextOccurrence < today) { // If one-time event is in the past, consider it not upcoming
                return null;
            }
        }
        return nextOccurrence;
    };

    // Helper function to get upcoming important dates for a friend
    const getUpcomingImportantDatesForFriend = (friend) => {
        const upcomingEvents = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const next30Days = new Date();
        next30Days.setDate(today.getDate() + 30);
        next30Days.setHours(23, 59, 59, 999);

        friend.importantDates.forEach(event => {
            const nextOccurrence = getNextImportantDateOccurrence(event, today.getFullYear());
            if (nextOccurrence && nextOccurrence >= today && nextOccurrence <= next30Days) {
                upcomingEvents.push({
                    ...event,
                    nextOccurrenceDate: nextOccurrence.toISOString().slice(0, 10),
                    daysUntil: Math.ceil((nextOccurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                });
            }
        });
        return upcomingEvents.sort((a, b) => new Date(a.nextOccurrenceDate) - new Date(b.nextOccurrenceDate));
    };


    // useEffect hook for fetching friends data from Firestore and triggering notifications.
    useEffect(() => {
        if (!isAuthReady || !userId) {
            return;
        }

        const getCollectionPath = () => {
            if (currentMode === 'private') {
                return `artifacts/${appId}/users/${userId}/friends`;
            } else {
                return `artifacts/${appId}/public/data/sharedFriends`;
            }
        };

        const friendsCollectionRef = collection(db, getCollectionPath());

        const unsubscribe = onSnapshot(query(friendsCollectionRef), (snapshot) => {
            const friendsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Ensure interactions is always an array, even if null/undefined in DB
                interactions: doc.data().interactions || [],
                // Ensure new notification fields have default values
                enableReminders: doc.data().enableReminders !== undefined ? doc.data().enableReminders : true,
                enableBirthdayNotifications: doc.data().enableBirthdayNotifications !== undefined ? doc.data().enableBirthdayNotifications : true,
                importantDates: doc.data().importantDates || [],
                socialMediaLinks: doc.data().socialMediaLinks || {},
            }));
            setFriends(friendsData);

            const groups = new Set();
            const allTags = new Set();
            friendsData.forEach(friend => {
                if (friend.group) {
                    groups.add(friend.group);
                }
                if (friend.tags && Array.isArray(friend.tags)) {
                    friend.tags.forEach(tag => allTags.add(tag));
                }
            });
            setAvailableGroups(Array.from(groups).sort());
            setAvailableTags(Array.from(allTags).sort());

            const currentNotified = notifiedFriendsRef.current;

            friendsData.forEach(friend => {
                const latestInteractionDate = getLatestInteractionDate(friend.interactions);
                const effectiveReminderFrequency = friend.reminderFrequency || tierFrequencies[friend.relationshipTier] || 'monthly';

                if (needsMessaging(latestInteractionDate, effectiveReminderFrequency) && !currentNotified.has(`message-${friend.id}`)) {
                    showNotification(
                        "Time to message a friend!",
                        `Don't forget to message ${friend.name}!`,
                        friend.id,
                        'message'
                    );
                    currentNotified.add(`message-${friend.id}`);
                }

                // Check for upcoming important dates
                const upcomingImportantDates = getUpcomingImportantDatesForFriend(friend);
                upcomingImportantDates.forEach(event => {
                    if (!currentNotified.has(`importantDate-${friend.id}-${event.description}-${event.nextOccurrenceDate}`)) {
                        showNotification(
                            "Upcoming Important Date!",
                            `${friend.name}'s ${event.description} is on ${formatDate(event.nextOccurrenceDate)}!`,
                            friend.id,
                            'importantDate'
                        );
                        currentNotified.add(`importantDate-${friend.id}-${event.description}-${event.nextOccurrenceDate}`);
                    }
                });
            });

            const upcoming = getUpcomingBirthdays(friendsData);
            upcoming.forEach(friend => {
                if (friend.birthday) { // Ensure birthday exists before processing
                    const today = new Date();
                    const [year, month, day] = friend.birthday.split('-').map(Number);
                    let birthdayDate = new Date(today.getFullYear(), month - 1, day);
                    if (birthdayDate < today) {
                        birthdayDate = new Date(today.getFullYear() + 1, month - 1, day);
                    }
                    const formattedBirthday = birthdayDate.toLocaleDateString();

                    if (!currentNotified.has(`birthday-${friend.id}-${formattedBirthday}`)) {
                        showNotification(
                            "Upcoming Birthday!",
                            `${friend.name}'s birthday is on ${formattedBirthday}!`,
                            friend.id,
                            'birthday'
                        );
                        currentNotified.add(`birthday-${friend.id}-${formattedBirthday}`);
                    }
                }
            });

        }, (error) => {
            console.error("Error fetching friends:", error);
            setMessage("Failed to load friends. Please check your connection.");
            setShowModal(true);
        });

        return () => unsubscribe();
    }, [isAuthReady, userId, currentMode, quietHoursStart, quietHoursEnd, showNotification]);

    // Function to handle adding a new friend or updating an existing one (full form).
    const handleSaveFriend = async () => {
        setNameError(false);
        setBirthdayError(false);

        let hasError = false;
        if (!name) {
            setNameError(true);
            hasError = true;
        }
        if (!birthday) {
            setBirthdayError(true);
            hasError = true;
        }

        if (hasError) {
            setMessage("Please fill in all required fields (Name and Birthday).");
            setShowModal(true);
            return;
        }

        if (!userId) {
            setMessage("User not authenticated. Please wait.");
            setShowModal(true);
            return;
        }

        try {
            const collectionPath = currentMode === 'private'
                ? `artifacts/${appId}/users/${userId}/friends`
                : `artifacts/${appId}/public/data/sharedFriends`;

            let finalProfilePhotoUrl = profilePhotoUrl;

            // If a new file is selected, upload it
            if (profilePhotoFile) {
                setMessage("Uploading profile photo...");
                setShowModal(true);
                const storageRef = ref(storage, `profile_photos/${userId}/${editingFriendId || Date.now()}/${profilePhotoFile.name}`);
                const uploadTask = await uploadBytes(storageRef, profilePhotoFile);
                finalProfilePhotoUrl = await getDownloadURL(uploadTask.ref);
                setMessage("Profile photo uploaded!");
                setShowModal(false);
            }

            const finalRelationshipTier = relationshipTier || 'regular';
            const initialReminderFrequency = reminderFrequency || tierFrequencies[finalRelationshipTier] || 'monthly';
            const parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

            const friendData = {
                name,
                birthday,
                lastBirthdayWished: lastBirthdayWished || null,
                giftIdeas: giftIdeas || null,
                giftStatus: giftStatus,
                giftBudget: giftBudget ? parseFloat(giftBudget) : null,
                reminderFrequency: initialReminderFrequency,
                group: group || null,
                relationshipTier: finalRelationshipTier,
                interactionNotes: interactionNotes || null,
                profilePhotoUrl: finalProfilePhotoUrl,
                tags: parsedTags,
                socialMediaLinks: {
                    facebook: facebookUrl || null,
                    instagram: instagramUrl || null,
                    linkedin: linkedinUrl || null,
                    twitter: twitterUrl || null,
                },
                importantDates: importantDates, // importantDates now includes recurrence
                enableReminders: enableReminders,
                enableBirthdayNotifications: enableBirthdayNotifications,
            };

            if (editingFriendId) {
                const friendRef = doc(db, collectionPath, editingFriendId);
                await updateDoc(friendRef, friendData);
                setMessage("Friend updated successfully!");
                setEditingFriendId(null);
            } else {
                await addDoc(collection(db, collectionPath), {
                    ...friendData,
                    interactions: [],
                    createdAt: new Date().toISOString()
                });
                setMessage("Friend added successfully!");
            }
            // Clear input fields after successful operation
            setName('');
            setBirthday('');
            setLastBirthdayWished('');
            setGiftIdeas('');
            setGiftStatus('Not Started');
            setGiftBudget('');
            setReminderFrequency('monthly');
            setGroup('');
            setRelationshipTier('regular');
            setInteractionNotes('');
            setProfilePhotoUrl('');
            setProfilePhotoFile(null);
            setTags('');
            setFacebookUrl('');
            setInstagramUrl('');
            setLinkedinUrl('');
            setTwitterUrl('');
            setImportantDates([]);
            setNewImportantDate('');
            setNewImportantDateDescription('');
            setNewImportantDateRecurrence('none'); // Reset recurrence
            setEnableReminders(true);
            setEnableBirthdayNotifications(true);
            setShowModal(true);
        } catch (error) {
            console.error("Error saving friend:", error);
            setMessage("Failed to save friend. Please try again.");
            setShowModal(true);
        }
    };

    // Function to handle quick adding a friend.
    const handleQuickAddFriend = async () => {
        if (!quickAddName) {
            setMessage("Please enter a name for quick add.");
            setShowModal(true);
            return;
        }
        if (!userId) {
            setMessage("User not authenticated. Please wait.");
            setShowModal(true);
            return;
        }

        try {
            const collectionPath = currentMode === 'private'
                ? `artifacts/${appId}/users/${userId}/friends`
                : `artifacts/${appId}/public/data/sharedFriends`;

            await addDoc(collection(db, collectionPath), {
                name: quickAddName,
                birthday: null,
                interactions: [],
                lastBirthdayWished: null,
                giftIdeas: null,
                giftStatus: 'Not Started',
                giftBudget: null,
                reminderFrequency: reminderFrequency,
                group: null,
                relationshipTier: 'regular',
                interactionNotes: null,
                profilePhotoUrl: null,
                tags: [],
                socialMediaLinks: {},
                importantDates: [],
                enableReminders: true,
                enableBirthdayNotifications: true,
                createdAt: new Date().toISOString()
            });
            setMessage(`'${quickAddName}' added successfully! You can edit for more details.`);
            setQuickAddName('');
            setShowModal(true);
        } catch (error) {
            console.error("Error quick adding friend:", error);
            setMessage("Failed to quick add friend. Please try again.");
            setShowModal(true);
        }
    };


    // Function to set up the form for editing a specific friend.
    const handleEditFriend = (friend) => {
        setEditingFriendId(friend.id);
        setName(friend.name);
        setBirthday(friend.birthday);
        setLastBirthdayWished(friend.lastBirthdayWished || '');
        setGiftIdeas(friend.giftIdeas || '');
        setGiftStatus(friend.giftStatus || 'Not Started');
        setGiftBudget(friend.giftBudget || '');
        setReminderFrequency(friend.reminderFrequency || 'monthly');
        setGroup(friend.group || '');
        setRelationshipTier(friend.relationshipTier || 'regular');
        setInteractionNotes(friend.interactionNotes || '');
        setProfilePhotoUrl(friend.profilePhotoUrl || '');
        setProfilePhotoFile(null);
        setTags(friend.tags ? friend.tags.join(', ') : '');
        setFacebookUrl(friend.socialMediaLinks?.facebook || '');
        setInstagramUrl(friend.socialMediaLinks?.instagram || '');
        setLinkedinUrl(friend.socialMediaLinks?.linkedin || '');
        setTwitterUrl(friend.socialMediaLinks?.twitter || '');
        setImportantDates(friend.importantDates || []);
        setNewImportantDateRecurrence('none'); // Reset recurrence when editing
        setEnableReminders(friend.enableReminders !== undefined ? friend.enableReminders : true);
        setEnableBirthdayNotifications(friend.enableBirthdayNotifications !== undefined ? friend.enableBirthdayNotifications : true);
        setNameError(false);
        setBirthdayError(false);
    };

    // Function to cancel editing and clear the form.
    const handleCancelEdit = () => {
        setEditingFriendId(null);
        setName('');
        setBirthday('');
        setLastBirthdayWished('');
        setGiftIdeas('');
        setGiftStatus('Not Started');
        setGiftBudget('');
        setReminderFrequency('monthly');
        setGroup('');
        setRelationshipTier('regular');
        setInteractionNotes('');
        setProfilePhotoUrl('');
        setProfilePhotoFile(null);
        setTags('');
        setFacebookUrl('');
        setInstagramUrl('');
        setLinkedinUrl('');
        setTwitterUrl('');
        setImportantDates([]);
        setNewImportantDate('');
        setNewImportantDateDescription('');
        setNewImportantDateRecurrence('none'); // Reset recurrence on cancel
        setEnableReminders(true);
        setEnableBirthdayNotifications(true);
        setNameError(false);
        setBirthdayError(false);
    };

    // Add Important Date
    const handleAddImportantDate = () => {
        if (newImportantDate && newImportantDateDescription) {
            setImportantDates([...importantDates, {
                date: newImportantDate,
                description: newImportantDateDescription,
                recurrence: newImportantDateRecurrence // Save recurrence type
            }]);
            setNewImportantDate('');
            setNewImportantDateDescription('');
            setNewImportantDateRecurrence('none'); // Reset recurrence after adding
        } else {
            setMessage("Please enter both a date and description for the important event.");
            setShowModal(true);
        }
    };

    // Remove Important Date
    const handleRemoveImportantDate = (index) => {
        const updatedDates = importantDates.filter((_, i) => i !== index);
        setImportantDates(updatedDates);
    };

    // Function to immediately delete a friend from Firestore
    const deleteFriendImmediately = async (friendId) => {
        if (!userId) {
            console.error("User not authenticated for immediate delete.");
            return;
        }
        try {
            const collectionPath = currentMode === 'private'
                ? `artifacts/${appId}/users/${userId}/friends`
                : `artifacts/${appId}/public/data/sharedFriends`;
            await deleteDoc(doc(db, collectionPath, friendId));
            notifiedFriendsRef.current.delete(`message-${friendId}`);
        } catch (error) {
            console.error("Error during immediate delete:", error);
            setMessage("Failed to delete friend immediately. Please try again.");
            setShowModal(true);
        }
    };

    // Function to initiate the delete action with undo capability
    const confirmDeleteFriend = (friend) => {
        if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current);
        }

        deleteFriendImmediately(friend.id);

        setUndoAction({ type: 'delete', friend: friend });
        setMessage(`'${friend.name}' deleted. Undo?`);
        setShowModal(true);

        undoTimerRef.current = setTimeout(() => {
            setUndoAction(null);
            setShowModal(false);
        }, 5000);
    };

    // Function to undo the last delete action
    const handleUndoDelete = async () => {
        if (!undoAction || undoAction.type !== 'delete' || !userId) {
            setMessage("No delete action to undo.");
            setShowModal(true);
            return;
        }

        try {
            const collectionPath = currentMode === 'private'
                ? `artifacts/${appId}/users/${userId}/friends`
                : `artifacts/${appId}/public/data/sharedFriends`;

            await setDoc(doc(db, collectionPath, undoAction.friend.id), undoAction.friend);
            setMessage(`'${undoAction.friend.name}' restored successfully!`);
            setShowModal(true);
            clearTimeout(undoTimerRef.current);
            setUndoAction(null);
        } catch (error) {
            console.error("Error undoing delete:", error);
            setMessage("Failed to undo delete. Please try again.");
            setShowModal(true);
        }
    };

    // Function to open the Log Interaction Modal
    const handleLogInteractionClick = (friendId) => {
        setLoggingFriendId(friendId);
        setInteractionDate(new Date().toISOString().slice(0, 10)); // Reset date to today
        setInteractionMethod('Text'); // Default method
        setInteractionNotesLog(''); // Clear notes
        setShowLogInteractionModal(true);
    };

    // Function to save a new interaction
    const handleSaveInteraction = async () => {
        if (!loggingFriendId || !userId) {
            setMessage("Cannot log interaction. Friend or user not found.");
            setShowModal(true);
            return;
        }

        try {
            const collectionPath = currentMode === 'private'
                ? `artifacts/${appId}/users/${userId}/friends`
                : `artifacts/${appId}/public/data/sharedFriends`;

            const friendRef = doc(db, collectionPath, loggingFriendId);
            const friendToUpdate = friends.find(f => f.id === loggingFriendId);

            if (friendToUpdate) {
                const newInteraction = {
                    date: interactionDate,
                    method: interactionMethod,
                    notes: interactionNotesLog || null,
                    timestamp: new Date().toISOString(),
                };
                const updatedInteractions = [...(friendToUpdate.interactions || []), newInteraction];

                await updateDoc(friendRef, { interactions: updatedInteractions });
                setMessage(`Interaction logged for '${friendToUpdate.name}'!`);
                setShowLogInteractionModal(false);
                setShowModal(true);
                notifiedFriendsRef.current.delete(`message-${loggingFriendId}`);
            } else {
                setMessage("Friend not found to log interaction.");
                setShowModal(true);
            }
        } catch (error) {
            console.error("Error logging interaction:", error);
            setMessage("Failed to log interaction. Please try again.");
            setShowModal(true);
        }
    };

    // Function to mark a friend as messaged with undo capability (now logs an interaction)
    const markMessaged = async (friend) => {
        if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current);
        }

        const originalInteractions = friend.interactions || [];
        const newInteraction = {
            date: new Date().toISOString().slice(0, 10),
            method: 'Quick Mark',
            notes: 'Marked as messaged from list',
            timestamp: new Date().toISOString(),
        };
        const updatedInteractions = [...originalInteractions, newInteraction];

        try {
            const collectionPath = currentMode === 'private'
                ? `artifacts/${appId}/users/${userId}/friends`
                : `artifacts/${appId}/public/data/sharedFriends`;
            const friendRef = doc(db, collectionPath, friend.id);
            await updateDoc(friendRef, { interactions: updatedInteractions });

            setMessage(`'${friend.name}' marked as messaged. Undo?`);
            setShowModal(true);
            setUndoAction({
                type: 'markMessaged',
                friendId: friend.id,
                originalInteractions: originalInteractions
            });
            undoTimerRef.current = setTimeout(() => {
                setUndoAction(null);
                setShowModal(false);
            }, 5000);
            notifiedFriendsRef.current.delete(`message-${friend.id}`);
        } catch (error) {
            console.error("Error marking messaged:", error);
            setMessage("Failed to mark as messaged. Please try again.");
            setShowModal(true);
        }
    };

    // Function to undo the last mark messaged action (reverts interactions array)
    const handleUndoMarkMessaged = async () => {
        if (!undoAction || undoAction.type !== 'markMessaged' || !userId) {
            setMessage("No mark messaged action to undo.");
            setShowModal(true);
            return;
        }

        try {
            const collectionPath = currentMode === 'private'
                ? `artifacts/${appId}/users/${userId}/friends`
                : `artifacts/${appId}/public/data/sharedFriends`;

            const friendRef = doc(db, collectionPath, undoAction.friendId);
            await updateDoc(friendRef, {
                interactions: undoAction.originalInteractions
            });
            setMessage(`'${friends.find(f => f.id === undoAction.friendId)?.name || 'Friend'}' un-marked as messaged.`);
            setShowModal(true);
            clearTimeout(undoTimerRef.current);
            setUndoAction(null);
        } catch (error) {
            console.error("Error undoing mark messaged:", error);
            setMessage("Failed to undo mark messaged. Please try again.");
            setShowModal(true);
        }
    };


    // Function to handle snoozing a reminder.
    const handleSnoozeReminder = async () => {
        if (!snoozeFriendId || !snoozeDuration || !userId) {
            setMessage("Snooze failed. Please try again.");
            setShowModal(true);
            return;
        }

        try {
            const collectionPath = currentMode === 'private'
                ? `artifacts/${appId}/users/${userId}/friends`
                : `artifacts/${appId}/public/data/sharedFriends`;

            const friendRef = doc(db, collectionPath, snoozeFriendId);
            const friendToUpdate = friends.find(f => f.id === snoozeFriendId);
            if (!friendToUpdate) {
                setMessage("Friend not found for snooze.");
                setShowModal(true);
                return;
            }

            const today = new Date();
            let newSnoozeDate = new Date(today);

            switch (snoozeDuration) {
                case '1day': newSnoozeDate.setDate(today.getDate() + 1); break;
                case '1week': newSnoozeDate.setDate(today.getDate() + 7); break;
                case '2weeks': newSnoozeDate.setDate(today.getDate() + 14); break;
                case '1month': newSnoozeDate.setMonth(today.getMonth() + 1); break;
                default: newSnoozeDate.setDate(today.getDate() + 1);
            }

            // Log a "snooze" interaction to update the last contacted date for reminder logic
            const newInteraction = {
                date: newSnoozeDate.toISOString().slice(0, 10),
                method: 'Snooze',
                notes: `Reminder snoozed for ${snoozeDuration}`,
                timestamp: new Date().toISOString(),
            };
            const updatedInteractions = [...(friendToUpdate.interactions || []), newInteraction];

            await updateDoc(friendRef, { interactions: updatedInteractions });

            setMessage(`Reminder snoozed for ${snoozeDuration.replace('1', '1 ').replace('s', 's ')}!`);
            setShowSnoozeModal(false);
            setShowModal(true);
            setSnoozeFriendId(null);
            notifiedFriendsRef.current.delete(`message-${snoozeFriendId}`);
        } catch (error) {
            console.error("Error snoozing reminder:", error);
            setMessage("Failed to snooze reminder. Please try again.");
            setShowModal(true);
        }
    };


    // Helper function to format ISO date strings into a readable local date string.
    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleDateString();
    };

    // Helper function to calculate age from a birthday string.
    const calculateAge = (birthdayString) => {
        if (!birthdayString) return 'N/A';
        const birthDate = new Date(birthdayString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Helper function to calculate days until next birthday.
    const calculateDaysUntilBirthday = (birthdayString) => {
        if (!birthdayString) return null;
        const today = new Date();
        const [year, month, day] = birthdayString.split('-').map(Number);
        let nextBirthday = new Date(today.getFullYear(), month - 1, day);

        if (nextBirthday < today) {
            nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
        }

        const diffTime = nextBirthday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Helper function to calculate days until a generic date
    const calculateDaysUntilDate = (dateString) => {
        if (!dateString) return null;
        const targetDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day

        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Helper function to check if a friend needs to be messaged based on frequency.
    const needsMessaging = (lastInteractionDateIso, frequency) => {
        if (!lastInteractionDateIso) return true;

        const lastDate = new Date(lastInteractionDateIso);
        const today = new Date();
        let intervalDays;

        switch (frequency) {
            case 'weekly':
                intervalDays = 7;
                break;
            case 'bi-weekly':
                intervalDays = 14;
                break;
            case 'quarterly':
                intervalDays = 90;
                break;
            case 'monthly':
            default:
                intervalDays = 30;
                break;
        }

        const thresholdDate = new Date(lastDate);
        thresholdDate.setDate(thresholdDate.getDate() + intervalDays);

        return today > thresholdDate;
    };

    // Helper function to calculate messaging streak (now based on interactions)
    const calculateMessagingStreak = (friend) => {
        if (!friend.interactions || friend.interactions.length < 2) return 0;

        // Sort interactions by timestamp to ensure correct order
        const sortedInteractions = [...friend.interactions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        let streak = 0;
        let lastInteractionTime = null;
        const intervalDays = getIntervalDays(friend.reminderFrequency || tierFrequencies[friend.relationshipTier] || 'monthly');

        for (let i = 0; i < sortedInteractions.length; i++) {
            const currentInteractionTime = new Date(sortedInteractions[i].date).getTime(); // Use interaction date for streak

            if (lastInteractionTime === null) {
                streak = 1;
            } else {
                const daysSinceLast = (currentInteractionTime - lastInteractionTime) / (1000 * 60 * 60 * 24);
                // Allow a small buffer (e.g., 1 day) for streak continuity
                if (daysSinceLast <= intervalDays + 1) { // +1 day tolerance
                    streak++;
                } else {
                    streak = 1; // Reset streak if gap is too large
                }
            }
            lastInteractionTime = currentInteractionTime;
        }
        return streak;
    };

    // Helper to get interval days from frequency (re-used from needsMessaging)
    const getIntervalDays = (frequency) => {
        switch (frequency) {
            case 'weekly': return 7;
            case 'bi-weekly': return 14;
            case 'quarterly': return 90;
            case 'monthly': return 30;
            default: return 30;
        }
    };


    // Filter the `friends` list to get only those who need messaging.
    const friendsToMessage = friends.filter(friend => {
        const latestInteractionDate = getLatestInteractionDate(friend.interactions);
        const effectiveReminderFrequency = friend.reminderFrequency || tierFrequencies[friend.relationshipTier] || 'monthly';
        return needsMessaging(latestInteractionDate, effectiveReminderFrequency);
    });

    // Helper function to get upcoming birthdays within the next 30 days.
    const getUpcomingBirthdays = (currentFriends) => {
        const today = new Date();
        const next30Days = new Date();
        next30Days.setDate(today.getDate() + 30);

        return currentFriends.filter(friend => {
            if (!friend.birthday) return false;
            const [year, month, day] = friend.birthday.split('-').map(Number);
            let birthdayThisYear = new Date(today.getFullYear(), month - 1, day);

            if (birthdayThisYear < today) {
                birthdayThisYear = new Date(today.getFullYear() + 1, month - 1, day);
            }

            return birthdayThisYear >= today && birthdayThisYear <= next30Days;
        }).sort((a, b) => {
            const [aYear, aMonth, aDay] = a.birthday.split('-').map(Number);
            const [bYear, bMonth, bDay] = b.birthday.split('-').map(Number);
            let aDate = new Date(today.getFullYear(), aMonth - 1, aDay);
            let bDate = new Date(today.getFullYear() + 1, bMonth - 1, bDay);
            if (aDate < today) aDate = new Date(today.getFullYear() + 1, aMonth - 1, aDay);
            if (bDate < today) bDate = new Date(today.getFullYear() + 1, bMonth - 1, bDay);
            return aDate - bDate;
        });
    };

    const upcomingBirthdays = getUpcomingBirthdays(friends);

    // Function to copy the App ID to the clipboard.
    const copyAppIdToClipboard = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(appId)
                .then(() => {
                    setMessage("App ID copied to clipboard!");
                    setShowModal(true);
                })
                .catch(err => {
                    console.error('Failed to copy App ID:', err);
                    setMessage("Failed to copy App ID. Please copy manually: " + appId);
                    setShowModal(true);
                });
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = appId;
            textArea.style.position = "fixed";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setMessage("App ID copied to clipboard!");
                setShowModal(true);
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
                setMessage("Failed to copy App ID. Please copy manually: " + appId);
                setShowModal(true);
            }
            document.body.removeChild(textArea);
        }
    };

    // Function to export friends data to JSON
    const exportFriendsData = () => {
        const dataStr = JSON.stringify(friends, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `friends_data_${new Date().toISOString().slice(0, 10)}.json`;

        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        setMessage("Friends data exported successfully!");
        setShowModal(true);
    };

    // Function to handle importing friends data from a JSON file
    const handleImportFriendsData = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            setMessage("No file selected for import.");
            setShowModal(true);
            return;
        }

        if (file.type !== "application/json") {
            setMessage("Invalid file type. Please select a JSON file.");
            setShowModal(true);
            return;
        }

        if (!userId) {
            setMessage("User not authenticated. Cannot import data.");
            setShowModal(true);
            return;
        }

        const collectionPath = currentMode === 'private'
            ? `artifacts/${appId}/users/${userId}/friends`
            : `artifacts/${appId}/public/data/sharedFriends`;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                if (!Array.isArray(importedData)) {
                    setMessage("Invalid JSON format. Expected an array of friends.");
                    setShowModal(true);
                    return;
                }

                if (importStrategy === 'overwrite') {
                    // Delete all existing friends first
                    const existingFriendsSnapshot = await getDocs(collection(db, collectionPath));
                    const deletePromises = existingFriendsSnapshot.docs.map(d => deleteDoc(doc(db, collectionPath, d.id)));
                    await Promise.all(deletePromises);
                }

                const existingFriendsMap = new Map();
                if (importStrategy === 'merge') {
                    const existingFriendsSnapshot = await getDocs(collection(db, collectionPath));
                    existingFriendsSnapshot.docs.forEach(d => {
                        const data = d.data();
                        if (data.name) {
                            existingFriendsMap.set(data.name, d.id);
                        }
                    });
                }

                let importedCount = 0;
                for (const friendData of importedData) {
                    if (friendData.name && friendData.birthday) {
                        const friendToSave = {
                            name: friendData.name,
                            birthday: friendData.birthday,
                            interactions: friendData.interactions || (friendData.lastMessaged ? [{ date: friendData.lastMessaged, method: 'Imported', notes: 'Legacy last messaged date', timestamp: new Date().toISOString() }] : []),
                            lastBirthdayWished: friendData.lastBirthdayWished || null,
                            giftIdeas: friendData.giftIdeas || null,
                            giftStatus: friendData.giftStatus || 'Not Started',
                            giftBudget: friendData.giftBudget ? parseFloat(friendData.giftBudget) : null,
                            reminderFrequency: friendData.reminderFrequency || tierFrequencies[friendData.relationshipTier] || 'monthly',
                            group: friendData.group || null,
                            relationshipTier: friendData.relationshipTier || 'regular',
                            interactionNotes: friendData.interactionNotes || null,
                            profilePhotoUrl: friendData.profilePhotoUrl || null,
                            tags: friendData.tags || [],
                            socialMediaLinks: friendData.socialMediaLinks || {},
                            importantDates: friendData.importantDates || [], // Ensure recurrence is imported if present
                            enableReminders: friendData.enableReminders !== undefined ? friendData.enableReminders : true,
                            enableBirthdayNotifications: friendData.enableBirthdayNotifications !== undefined ? friendData.enableBirthdayNotifications : true,
                            createdAt: friendData.createdAt || new Date().toISOString(),
                        };

                        if (importStrategy === 'merge' && existingFriendsMap.has(friendData.name)) {
                            const friendIdToUpdate = existingFriendsMap.get(friendData.name);
                            await updateDoc(doc(db, collectionPath, friendIdToUpdate), friendToSave);
                        } else {
                            await addDoc(collection(db, collectionPath), friendToSave);
                        }
                        importedCount++;
                    } else {
                        console.warn("Skipping invalid friend data during import:", friendData);
                    }
                }
                setMessage(`Successfully imported ${importedCount} friends with '${importStrategy}' strategy!`);
                setShowModal(true);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

            } catch (error) {
                console.error("Error importing data:", error);
                setMessage("Failed to import data. Please check the file format.");
                setShowModal(true);
            }
        };
        reader.readAsText(file);
    };


    // Filtered and Sorted friends list based on search term, filter option, and sort option
    const filteredAndSortedFriends = useMemo(() => {
        return friends
            .filter(friend => {
                const latestInteractionDate = getLatestInteractionDate(friend.interactions);
                const matchesSearch = friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      (friend.giftIdeas && friend.giftIdeas.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                      (friend.interactionNotes && friend.interactionNotes.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                      (friend.tags && friend.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

                if (filterOption === 'all') {
                    return matchesSearch;
                } else if (filterOption === 'needsMessaging') {
                    const effectiveReminderFrequency = friend.reminderFrequency || tierFrequencies[friend.relationshipTier] || 'monthly';
                    return matchesSearch && needsMessaging(latestInteractionDate, effectiveReminderFrequency);
                } else if (filterOption === 'upcomingBirthdays') {
                    const upcoming = getUpcomingBirthdays([friend]);
                    return matchesSearch && upcoming.length > 0;
                } else if (filterOption.startsWith('group-')) {
                    const selectedGroup = filterOption.substring(6);
                    return matchesSearch && friend.group === selectedGroup;
                } else if (filterOption.startsWith('tier-')) {
                    const selectedTier = filterOption.substring(5);
                    return matchesSearch && friend.relationshipTier === selectedTier;
                } else if (filterOption.startsWith('tag-')) {
                    const selectedTag = filterOption.substring(4);
                    return matchesSearch && friend.tags && friend.tags.includes(selectedTag);
                } else if (filterOption.startsWith('giftStatus-')) {
                    const selectedStatus = filterOption.substring(11);
                    return matchesSearch && friend.giftStatus === selectedStatus;
                }
                return matchesSearch;
            })
            .sort((a, b) => {
                if (sortOption === 'nameAsc') {
                    return a.name.localeCompare(b.name);
                } else if (sortOption === 'birthdayAsc') {
                    const [aYear, aMonth, aDay] = a.birthday.split('-').map(Number);
                    const [bYear, bMonth, bDay] = b.birthday.split('-').map(Number);

                    const today = new Date();
                    let aDate = new Date(today.getFullYear(), aMonth - 1, aDay);
                    let bDate = new Date(today.getFullYear() + 1, bMonth - 1, bDay);
                    if (aDate < today) aDate = new Date(today.getFullYear() + 1, aMonth - 1, aDay);
                    if (bDate < today) bDate = new Date(today.getFullYear() + 1, bMonth - 1, bDay);
                    return aDate - bDate;
                } else if (sortOption === 'lastMessagedAsc') {
                    const latestA = getLatestInteractionDate(a.interactions);
                    const latestB = getLatestInteractionDate(b.interactions);
                    const dateA = latestA ? new Date(latestA).getTime() : 0;
                    const dateB = latestB ? new Date(latestB).getTime() : 0;
                    return dateA - dateB;
                }
                return 0;
            });
    }, [friends, searchTerm, filterOption, sortOption]);

    // Helper function to generate a consistent color for avatars based on name
    const getAvatarColor = (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    };

    // Helper component for avatar
    const FriendAvatar = ({ name, profilePhotoUrl }) => {
        const initial = name ? name.charAt(0).toUpperCase() : '?';
        const bgColor = getAvatarColor(name);
        const placeholderImage = `https://placehold.co/40x40/${bgColor.substring(1)}/ffffff?text=${initial}`;

        return (
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: bgColor,
                color: 'white',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '1.2em',
                fontWeight: 'bold',
                marginRight: '10px',
                flexShrink: 0,
                overflow: 'hidden',
                border: profilePhotoUrl ? '2px solid #2ecc71' : 'none',
            }}>
                {profilePhotoUrl ? (
                    <img
                        src={profilePhotoUrl}
                        alt={`${name}'s profile`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                    />
                ) : (
                    initial
                )}
            </div>
        );
    };

    // Calculate messaging consistency for the dashboard
    const friendsNeedingAttention = friends.filter(friend => {
        const latestInteractionDate = getLatestInteractionDate(friend.interactions);
        const effectiveReminderFrequency = friend.reminderFrequency || tierFrequencies[friend.relationshipTier] || 'monthly';
        return needsMessaging(latestInteractionDate, effectiveReminderFrequency);
    }).length;
    const friendsOnTrack = friends.length - friendsNeedingAttention;
    const totalFriends = friends.length;
    const onTrackPercentage = totalFriends > 0 ? (friendsOnTrack / totalFriends) * 100 : 0;

    // Relationship Insights: Calculate total interactions and average interactions per friend
    const totalInteractions = friends.reduce((sum, friend) => sum + (friend.interactions ? friend.interactions.length : 0), 0);
    const avgInteractionsPerFriend = totalFriends > 0 ? (totalInteractions / totalFriends).toFixed(1) : 0;

    // Relationship Insights: Calculate "Consistency Score"
    const calculateConsistencyScore = (friend) => {
        if (!friend.interactions || friend.interactions.length === 0) return 0;

        const effectiveFrequencyDays = getIntervalDays(friend.reminderFrequency || tierFrequencies[friend.relationshipTier] || 'monthly');
        const sortedInteractions = [...friend.interactions].sort((a, b) => new Date(a.date) - new Date(b.date));

        let periodsMet = 0;
        let lastCheckDate = new Date(friend.createdAt || sortedInteractions[0].date);
        
        if (new Date(lastCheckDate) > new Date(sortedInteractions[0].date)) {
            lastCheckDate = new Date(sortedInteractions[0].date);
        }

        let interactionIndex = 0;
        const now = new Date();

        while (lastCheckDate < now) {
            const nextPeriodEndDate = new Date(lastCheckDate);
            nextPeriodEndDate.setDate(nextPeriodEndDate.getDate() + effectiveFrequencyDays);

            let interactedInPeriod = false;
            while (interactionIndex < sortedInteractions.length && new Date(sortedInteractions[interactionIndex].date) <= nextPeriodEndDate) {
                if (new Date(sortedInteractions[interactionIndex].date) >= lastCheckDate) {
                    interactedInPeriod = true;
                    break;
                }
                interactionIndex++;
            }

            if (interactedInPeriod) {
                periodsMet++;
            }

            lastCheckDate = nextPeriodEndDate;
            if (interactionIndex < sortedInteractions.length && new Date(sortedInteractions[interactionIndex].date) > lastCheckDate) {
                lastCheckDate = new Date(sortedInteractions[interactionIndex].date);
            }
        }

        const totalPossiblePeriods = Math.ceil((now.getTime() - new Date(friend.createdAt || sortedInteractions[0].date).getTime()) / (1000 * 60 * 60 * 24 * effectiveFrequencyDays));
        
        if (totalPossiblePeriods === 0) return 100;
        return Math.min(100, (periodsMet / totalPossiblePeriods) * 100).toFixed(0);
    };

    // Prepare data for the interaction frequency chart
    const getInteractionChartData = (friend) => {
        if (!friend || !friend.interactions || friend.interactions.length === 0) {
            return { labels: [], data: [] };
        }

        const monthlyCounts = {};
        const today = new Date();
        // Go back 12 months from current month
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear() % 100}`;
            monthlyCounts[monthYear] = 0;
        }

        friend.interactions.forEach(interaction => {
            const interactionDate = new Date(interaction.date);
            const monthYear = `${interactionDate.toLocaleString('default', { month: 'short' })} ${interactionDate.getFullYear() % 100}`;
            if (monthlyCounts.hasOwnProperty(monthYear)) {
                monthlyCounts[monthYear]++;
            }
        });

        return {
            labels: Object.keys(monthlyCounts),
            data: Object.values(monthlyCounts)
        };
    };

    // Component for the Interaction Chart
    const InteractionChart = ({ friend, currentTheme }) => {
        const chartData = getInteractionChartData(friend);
        const chartHeight = 200;
        const chartWidth = 350;
        const barWidth = (chartWidth / chartData.labels.length) * 0.7;
        const maxDataValue = Math.max(...chartData.data, 1);

        return (
            <div style={{ padding: '10px', backgroundColor: currentTheme.containerBg, borderRadius: '10px', marginTop: '20px' }}>
                <h4 style={{ color: currentTheme.textColor, marginBottom: '10px', textAlign: 'center' }}>
                    Interaction Frequency ({friend.name})
                </h4>
                <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    {/* Y-axis line */}
                    <line x1="30" y1="0" x2="30" y2={chartHeight - 20} stroke={currentTheme.chartAxisColor} strokeWidth="1" />
                    {/* X-axis line */}
                    <line x1="30" y1={chartHeight - 20} x2={chartWidth} y2={chartHeight - 20} stroke={currentTheme.chartAxisColor} strokeWidth="1" />

                    {/* Bars */}
                    {chartData.data.map((value, index) => {
                        const x = 30 + (index * (chartWidth - 30) / chartData.labels.length) + ((chartWidth - 30) / chartData.labels.length - barWidth) / 2;
                        const barHeight = (value / maxDataValue) * (chartHeight - 40);
                        const y = chartHeight - 20 - barHeight;
                        return (
                            <rect
                                key={index}
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill={currentTheme.chartBarColor}
                                rx="3" ry="3"
                            />
                        );
                    })}

                    {/* X-axis labels (Months) */}
                    {chartData.labels.map((label, index) => {
                        const x = 30 + (index * (chartWidth - 30) / chartData.labels.length) + ((chartWidth - 30) / chartData.labels.length) / 2;
                        return (
                            <text
                                key={index}
                                x={x}
                                y={chartHeight - 5}
                                textAnchor="middle"
                                fontSize="10"
                                fill={currentTheme.chartAxisColor}
                            >
                                {label}
                            </text>
                        );
                    })}

                    {/* Y-axis labels (Counts) - simplified, just max value */}
                    <text x="25" y="15" textAnchor="end" fontSize="10" fill={currentTheme.chartAxisColor}>
                        {maxDataValue}
                    </text>
                    <text x="25" y={chartHeight - 20} textAnchor="end" fontSize="10" fill={currentTheme.chartAxisColor}>
                        0
                    </text>
                </svg>
            </div>
        );
    };

    // Prepare data for the comprehensive activity log
    const allInteractions = useMemo(() => {
        let interactions = [];
        friends.forEach(friend => {
            if (friend.interactions) {
                friend.interactions.forEach(interaction => {
                    interactions.push({
                        friendName: friend.name,
                        friendId: friend.id,
                        ...interaction
                    });
                });
            }
        });

        // Filter activity log
        const filteredInteractions = interactions.filter(interaction =>
            interaction.friendName.toLowerCase().includes(activityLogFilterTerm.toLowerCase()) ||
            interaction.method.toLowerCase().includes(activityLogFilterTerm.toLowerCase()) ||
            (interaction.notes && interaction.notes.toLowerCase().includes(activityLogFilterTerm.toLowerCase()))
        );

        // Sort activity log
        return filteredInteractions.sort((a, b) => {
            if (activityLogSortOption === 'newest') {
                return new Date(b.timestamp) - new Date(a.timestamp);
            } else if (activityLogSortOption === 'oldest') {
                return new Date(a.timestamp) - new Date(b.timestamp);
            } else if (activityLogSortOption === 'friendNameAsc') {
                return a.friendName.localeCompare(b.friendName);
            }
            return 0;
        });
    }, [friends, activityLogFilterTerm, activityLogSortOption]);

    // Export Activity Log to CSV
    const exportActivityLog = () => {
        if (allInteractions.length === 0) {
            setMessage("No activity to export.");
            setShowModal(true);
            return;
        }

        const headers = ["Friend Name", "Date", "Method", "Notes"];
        const rows = allInteractions.map(interaction => [
            `"${interaction.friendName.replace(/"/g, '""')}"`,
            `"${formatDate(interaction.date).replace(/"/g, '""')}"`,
            `"${interaction.method.replace(/"/g, '""')}"`,
            `"${(interaction.notes || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `activity_log_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setMessage("Activity log exported successfully to CSV!");
        setShowModal(true);
    };


    // Get current theme colors
    const currentTheme = darkMode ? themes.dark : themes.light;

    // Inline styles for the application components.
    const appStyles = {
        fontFamily: 'Inter, Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: currentTheme.background,
        minHeight: '100vh',
        boxSizing: 'border-box',
        transition: 'background-color 0.3s ease',
    };

    const containerStyles = {
        backgroundColor: currentTheme.containerBg,
        borderRadius: '15px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
        padding: 'clamp(15px, 5vw, 30px)',
        maxWidth: '800px',
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: '20px',
        transition: 'background-color 0.3s ease',
    };

    const headerStyles = {
        color: currentTheme.headerColor,
        marginBottom: '25px',
        textAlign: 'center',
        fontSize: 'clamp(1.8em, 5vw, 2.2em)',
        fontWeight: 'bold',
        transition: 'color 0.3s ease',
    };

    const sectionTitleStyles = {
        color: currentTheme.sectionTitleColor,
        marginBottom: '15px',
        fontSize: 'clamp(1.3em, 4vw, 1.5em)',
        borderBottom: `2px solid ${currentTheme.inputBorder}`,
        paddingBottom: '5px',
        marginTop: '25px',
        transition: 'color 0.3s ease, border-color 0.3s ease',
    };

    const formStyles = {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '20px',
    };

    const inputStyles = (hasError) => ({
        padding: 'clamp(10px, 3vw, 12px)',
        borderRadius: '8px',
        border: `1px solid ${hasError ? currentTheme.errorText : currentTheme.inputBorder}`,
        fontSize: 'clamp(0.9em, 2.5vw, 1em)',
        width: '100%',
        boxSizing: 'border-box',
        minHeight: '44px',
        backgroundColor: currentTheme.inputBg,
        color: currentTheme.textColor,
        transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
    });

    const errorTextStyle = {
        color: currentTheme.errorText,
        fontSize: '0.85em',
        marginTop: '-10px',
        marginBottom: '5px',
        textAlign: 'left',
    };

    const buttonStyles = {
        padding: 'clamp(10px, 3vw, 12px) clamp(15px, 5vw, 20px)',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: currentTheme.buttonBg,
        color: currentTheme.buttonText,
        fontSize: 'clamp(1em, 3vw, 1.1em)',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease, transform 0.2s ease',
        alignSelf: 'flex-start',
        boxShadow: '0 4px 8px rgba(46, 204, 113, 0.2)',
        minHeight: '44px',
        width: 'auto',
    };

    const buttonHoverStyles = {
        backgroundColor: darkMode ? '#1e8449' : '#27ae60',
        transform: 'translateY(-2px)',
    };

    const listStyles = {
        listStyle: 'none',
        padding: '0',
    };

    const listItemStyles = {
        backgroundColor: currentTheme.listItemBg,
        border: `1px solid ${currentTheme.listItemBorder}`,
        borderRadius: '10px',
        padding: 'clamp(10px, 3vw, 15px)',
        marginBottom: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        flexWrap: 'wrap',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease, opacity 0.3s ease',
        animation: 'fadeInUp 0.5s ease-out',
    };

    const listItemInfoStyles = {
        display: 'flex',
        flexDirection: 'column',
        flex: '1',
        minWidth: '150px',
    };

    const listItemTextStyles = {
        fontSize: 'clamp(1em, 2.5vw, 1.1em)',
        color: currentTheme.textColor,
        transition: 'color 0.3s ease',
    };

    const listItemActionsStyles = {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
    };

    const actionButtonStyles = {
        padding: 'clamp(8px, 2vw, 12px) clamp(8px, 2vw, 12px)',
        borderRadius: '6px',
        border: 'none',
        fontSize: 'clamp(0.85em, 2vw, 0.9em)',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease',
        minWidth: '80px',
        minHeight: '38px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '5px',
        flexShrink: 0,
        color: 'white',
        flex: '1 1 100px',
    };

    const messageButtonStyles = {
        ...actionButtonStyles,
        backgroundColor: darkMode ? '#206a9e' : '#3498db',
    };

    const snoozeButtonStyles = {
        ...actionButtonStyles,
        backgroundColor: darkMode ? '#7d3c98' : '#9b59b6',
    };

    const editButtonStyles = {
        ...actionButtonStyles,
        backgroundColor: darkMode ? '#c07a00' : '#f39c12',
    };

    const deleteButtonStyles = {
        ...actionButtonStyles,
        backgroundColor: darkMode ? '#b03a2e' : '#e74c3c',
    };

    const viewChartButtonStyles = {
        ...actionButtonStyles,
        backgroundColor: darkMode ? '#5c6c7c' : '#7f8c8d',
    };

    const birthdayItemStyles = {
        backgroundColor: currentTheme.birthdayItemBg,
        border: `1px solid ${currentTheme.birthdayItemBorder}`,
        borderRadius: '10px',
        padding: 'clamp(10px, 3vw, 15px)',
        marginBottom: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        flexWrap: 'wrap',
        gap: '10px',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease, opacity 0.3s ease',
        animation: 'fadeInUp 0.5s ease-out',
    };

    const reminderItemStyles = {
        backgroundColor: currentTheme.reminderItemBg,
        border: `1px solid ${currentTheme.reminderItemBorder}`,
        borderRadius: '10px',
        padding: 'clamp(10px, 3vw, 15px)',
        marginBottom: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        flexWrap: 'wrap',
        gap: '10px',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease, opacity 0.3s ease',
        animation: 'fadeInUp 0.5s ease-out',
    };

    const userIdDisplayStyles = {
        fontSize: 'clamp(0.8em, 2vw, 0.9em)',
        color: currentTheme.userIdColor,
        textAlign: 'center',
        marginTop: '20px',
        wordBreak: 'break-all',
        transition: 'color 0.3s ease',
    };

    const modalOverlayStyles = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    };

    const modalContentStyles = {
        backgroundColor: currentTheme.modalBg,
        padding: 'clamp(20px, 5vw, 30px)',
        borderRadius: '15px',
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%',
        position: 'relative',
        color: currentTheme.textColor,
        transition: 'background-color 0.3s ease, color 0.3s ease',
    };

    const closeModalButtonStyles = {
        position: 'absolute',
        top: '10px',
        right: '15px',
        background: 'none',
        border: 'none',
        fontSize: '1.5em',
        cursor: 'pointer',
        color: currentTheme.modalCloseBtn,
        transition: 'color 0.3s ease',
    };

    const modalButtonContainerStyles = {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginTop: '20px',
        flexWrap: 'wrap',
    };

    const modeToggleContainerStyles = {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '20px',
        marginTop: '20px',
        flexWrap: 'wrap',
    };

    const modeToggleButtonStyles = (isActive) => ({
        padding: 'clamp(10px, 3vw, 10px) clamp(12px, 4vw, 20px)',
        borderRadius: '8px',
        border: '1px solid #ccc',
        backgroundColor: isActive ? currentTheme.modeToggleActiveBg : currentTheme.modeToggleInactiveBg,
        color: isActive ? currentTheme.modeToggleActiveText : currentTheme.modeToggleInactiveText,
        fontSize: 'clamp(0.9em, 2.5vw, 1em)',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        boxShadow: isActive ? '0 4px 8px rgba(52, 152, 219, 0.2)' : 'none',
        minHeight: '44px',
        flex: '1 1 auto',
        minWidth: '150px',
    });

    const shareInfoStyles = {
        backgroundColor: currentTheme.shareInfoBg,
        border: `1px dashed ${currentTheme.shareInfoBorder}`,
        borderRadius: '10px',
        padding: 'clamp(15px, 4vw, 20px)',
        marginBottom: '20px',
        textAlign: 'center',
        wordBreak: 'break-all',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
        fontSize: 'clamp(0.9em, 2.5vw, 1em)',
    };

    const copyButtonStyles = {
        ...buttonStyles,
        marginTop: '15px',
        backgroundColor: currentTheme.copyButtonBg,
        boxShadow: `0 4px 8px ${darkMode ? 'rgba(22, 160, 133, 0.2)' : 'rgba(26, 188, 156, 0.2)'}`,
    };

    const copyButtonHoverStyles = {
        backgroundColor: darkMode ? '#117a65' : '#16a085',
        transform: 'translateY(-2px)',
    };

    const filterSortContainerStyles = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    };

    const searchInputStyles = {
        padding: 'clamp(10px, 3vw, 10px)',
        borderRadius: '8px',
        border: `1px solid ${currentTheme.inputBorder}`,
        fontSize: 'clamp(0.9em, 2.5vw, 1em)',
        flex: '1 1 150px',
        minHeight: '44px',
        backgroundColor: currentTheme.inputBg,
        color: currentTheme.textColor,
        transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
        width: '100%',
    };

    const selectStyles = {
        padding: 'clamp(10px, 3vw, 10px)',
        borderRadius: '8px',
        border: `1px solid ${currentTheme.inputBorder}`,
        fontSize: 'clamp(0.9em, 2.5vw, 1em)',
        backgroundColor: currentTheme.inputBg,
        color: currentTheme.textColor,
        cursor: 'pointer',
        flex: '0 1 auto',
        minHeight: '44px',
        transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
        width: '100%',
    };

    const statusIndicatorStyles = (color) => ({
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: color,
        position: 'absolute',
        top: '8px',
        right: '8px',
        border: `2px solid ${currentTheme.containerBg}`,
        boxShadow: '0 0 5px rgba(0,0,0,0.2)',
        transition: 'border-color 0.3s ease',
    });

    const dashboardCardStyles = {
        backgroundColor: currentTheme.dashboardCardBg,
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        transition: 'background-color 0.3s ease',
    };

    const dashboardItemStyles = {
        textAlign: 'center',
        fontSize: 'clamp(1em, 3vw, 1.2em)',
        color: currentTheme.textColor,
        transition: 'color 0.3s ease',
    };

    const dashboardNumberStyles = (color) => ({
        fontSize: 'clamp(1.8em, 5vw, 2em)',
        fontWeight: 'bold',
        color: color,
        marginBottom: '5px',
    });

    const progressBarContainerStyles = {
        width: '100%',
        backgroundColor: currentTheme.progressBarBg,
        borderRadius: '5px',
        height: '10px',
        marginTop: '10px',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease',
    };

    const progressBarFillStyles = (percentage) => ({
        height: '100%',
        width: `${percentage}%`,
        backgroundColor: currentTheme.progressBarFill,
        borderRadius: '5px',
        transition: 'width 0.5s ease-in-out, background-color 0.3s ease',
    });

    const quickAddFormStyles = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap',
    };

    const quickAddInputStyles = {
        ...inputStyles(false),
        flex: '1 1 150px',
        width: '100%',
    };

    const quickAddButtonStyles = {
        ...buttonStyles,
        flex: '0 1 auto',
        padding: 'clamp(10px, 3vw, 10px) clamp(15px, 5vw, 15px)',
        fontSize: 'clamp(0.9em, 2.5vw, 1em)',
        width: '100%',
    };

    const undoMessageStyles = {
        backgroundColor: currentTheme.undoMessageBg,
        color: currentTheme.undoMessageText,
        padding: 'clamp(10px, 3vw, 10px) clamp(15px, 4vw, 20px)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px',
        position: 'fixed',
        bottom: 'clamp(10px, 3vw, 20px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1001,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        flexWrap: 'wrap',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        width: 'calc(100% - clamp(20px, 6vw, 40px))',
    };

    const undoButtonStyles = {
        backgroundColor: currentTheme.undoButtonBg,
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: 'clamp(8px, 2vw, 8px) clamp(15px, 4vw, 15px)',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        minHeight: '38px',
        width: '100%',
    };

    const settingsSectionStyles = {
        marginTop: '30px',
        borderTop: `1px solid ${currentTheme.inputBorder}`,
        paddingTop: '20px',
        transition: 'border-color 0.3s ease',
    };

    const settingsGroupStyles = {
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
    };

    const settingsLabelStyles = {
        fontWeight: 'bold',
        minWidth: '120px',
        color: currentTheme.textColor,
        transition: 'color 0.3s ease',
    };

    const toggleSwitchStyles = {
        position: 'relative',
        display: 'inline-block',
        width: '60px',
        height: '34px',
    };

    const toggleSliderStyles = (checked) => ({
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: checked ? '#2ecc71' : '#ccc',
        transition: '.4s',
        borderRadius: '34px',
    });

    const toggleSliderBeforeStyles = (checked) => ({
        position: 'absolute',
        content: '""',
        height: '26px',
        width: '26px',
        left: '4px',
        bottom: '4px',
        backgroundColor: 'white',
        transition: '.4s',
        borderRadius: '50%',
        transform: checked ? 'translateX(26px)' : 'translateX(0)',
    });

    const birthdayCountdownStyles = {
        fontWeight: 'bold',
        color: currentTheme.birthdayCountdownColor,
        fontSize: 'clamp(1em, 2.5vw, 1.1em)',
        marginLeft: '5px',
        transition: 'color 0.3s ease, font-size 0.3s ease',
    };

    const importantDateCountdownStyles = {
        fontWeight: 'bold',
        color: darkMode ? '#f39c12' : '#d35400', // Similar to birthday, but distinct
        fontSize: 'clamp(0.9em, 2.2vw, 1em)',
        marginLeft: '5px',
        transition: 'color 0.3s ease, font-size 0.3s ease',
    };

    const interactionLogStyles = {
        backgroundColor: currentTheme.interactionLogBg,
        border: `1px solid ${currentTheme.interactionLogBorder}`,
        borderRadius: '8px',
        padding: '10px',
        marginTop: '10px',
        maxHeight: '150px',
        overflowY: 'auto',
        color: currentTheme.textColor,
        fontSize: '0.9em',
        textAlign: 'left',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
    };

    const interactionItemStyles = {
        marginBottom: '5px',
        paddingBottom: '5px',
        borderBottom: `1px dashed ${currentTheme.interactionLogBorder}`,
    };

    const tagStyles = {
        display: 'inline-block',
        backgroundColor: currentTheme.buttonBg,
        color: currentTheme.buttonText,
        borderRadius: '5px',
        padding: '3px 8px',
        fontSize: '0.8em',
        marginRight: '5px',
        marginBottom: '5px',
        transition: 'background-color 0.3s ease, color 0.3s ease',
    };

    const socialMediaIconStyles = {
        width: '20px',
        height: '20px',
        marginRight: '5px',
        verticalAlign: 'middle',
    };

    const socialMediaLinkContainerStyles = {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: '5px',
    };

    const socialMediaLinkStyles = {
        color: currentTheme.textColor,
        textDecoration: 'none',
        fontSize: '0.9em',
        marginRight: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
    };

    const importantDateItemStyles = {
        backgroundColor: darkMode ? '#3a4e60' : '#e0f4f7',
        borderRadius: '5px',
        padding: '5px 10px',
        marginBottom: '5px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.9em',
        color: currentTheme.textColor,
    };

    const importantDateRemoveButtonStyles = {
        background: 'none',
        border: 'none',
        color: currentTheme.errorText,
        cursor: 'pointer',
        fontSize: '1em',
        marginLeft: '10px',
    };

    const activityLogItemStyles = {
        backgroundColor: currentTheme.listItemBg,
        border: `1px solid ${currentTheme.listItemBorder}`,
        borderRadius: '10px',
        padding: '10px 15px',
        marginBottom: '10px',
        color: currentTheme.textColor,
        fontSize: '0.95em',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    };

    const fileInputContainerStyles = {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '15px',
        alignItems: 'flex-start',
    };

    const fileInputLabelStyles = {
        fontWeight: 'bold',
        color: currentTheme.textColor,
        fontSize: '0.9em',
    };

    const profilePhotoPreviewStyles = {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: `2px solid ${currentTheme.inputBorder}`,
        marginTop: '10px',
        marginBottom: '5px',
    };


    // Authentication gate
    if (!isAuthReady) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f4f7f6',
                color: '#2c3e50',
                fontSize: '1.2rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '4px solid #e1e5e9',
                    borderTop: '4px solid #007AFF',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '20px'
                }}></div>
                <div style={{ marginBottom: '10px', fontWeight: '600' }}>Loading Friends Reminder...</div>
                <div style={{ fontSize: '0.9rem', color: '#7f8c8d', textAlign: 'center' }}>
                    Initializing your app
                </div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }
    if (!user) return <Login />;

    return (
        <div style={appStyles}>
            <div style={containerStyles}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={headerStyles}>Friends Reminder</h1>
                    <button 
                        onClick={() => signOut(auth)}
                        style={{
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        Sign Out
                    </button>
                </div>

                {/* User ID Display - Useful for debugging and understanding multi-user data */}
                {userId && (
                    <p style={userIdDisplayStyles}>
                        Your User ID: <strong>{userId}</strong> (Share this for multi-user apps)
                    </p>
                )}

                {/* Mode Toggle Buttons: Switch between private and shared lists */}
                <div style={modeToggleContainerStyles}>
                    <button
                        onClick={() => setCurrentMode('private')}
                        style={modeToggleButtonStyles(currentMode === 'private')}
                    >
                        My Private Friends
                    </button>
                    <button
                        onClick={() => setCurrentMode('shared')}
                        style={modeToggleButtonStyles(currentMode === 'shared')}
                    >
                        Shared Friends
                    </button>
                </div>

                {/* Shared App ID Information - Displayed only in shared mode */}
                {currentMode === 'shared' && (
                    <div style={shareInfoStyles}>
                        <p>Share this App ID with your friends to collaborate on this list:</p>
                        <p><strong>{appId}</strong></p>
                        <button
                            onClick={copyAppIdToClipboard}
                            style={copyButtonStyles}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = copyButtonHoverStyles.backgroundColor}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = copyButtonStyles.backgroundColor}
                        >
                            Copy App ID
                        </button>
                    </div>
                )}

                {/* Messaging Consistency Dashboard */}
                <h2 style={sectionTitleStyles}>Messaging Overview</h2>
                <div style={dashboardCardStyles}>
                    <div style={dashboardItemStyles}>
                        <div style={dashboardNumberStyles('#2ecc71')}>{friendsOnTrack}</div>
                        <div>On Track</div>
                    </div>
                    <div style={dashboardItemStyles}>
                        <div style={dashboardNumberStyles('#e74c3c')}>{friendsNeedingAttention}</div>
                        <div>Needs Attention</div>
                    </div>
                    <div style={dashboardItemStyles}>
                        <div style={dashboardNumberStyles('#34495e')}>{totalFriends}</div>
                        <div>Total Friends</div>
                    </div>
                    {totalFriends > 0 && (
                        <div style={progressBarContainerStyles}>
                            <div style={progressBarFillStyles(onTrackPercentage)}></div>
                        </div>
                    )}
                </div>

                {/* Relationship Insights */}
                <h2 style={sectionTitleStyles}>Relationship Insights</h2>
                <div style={dashboardCardStyles}>
                    <div style={dashboardItemStyles}>
                        <div style={dashboardNumberStyles('#3498db')}>{totalInteractions}</div>
                        <div>Total Interactions</div>
                    </div>
                    <div style={dashboardItemStyles}>
                        <div style={dashboardNumberStyles('#9b59b6')}>{avgInteractionsPerFriend}</div>
                        <div>Avg. Interactions/Friend</div>
                    </div>
                    <div style={dashboardItemStyles}>
                        <div style={dashboardNumberStyles('#f39c12')}>
                            {totalFriends > 0 ? (friends.reduce((sum, friend) => sum + parseFloat(calculateConsistencyScore(friend)), 0) / totalFriends).toFixed(0) : 0}%
                        </div>
                        <div>Avg. Consistency Score</div>
                    </div>
                </div>


                {/* Primary Action - Add Friend/Reminder */}
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '32px',
                    marginBottom: '32px',
                    border: '2px solid #e1e5e9',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#2c3e50',
                        marginBottom: '8px',
                        textAlign: 'center'
                    }}>
                        {friends.length === 0 ? 'Add Your First Friend' : 'Add Friend & Set Reminder'}
                    </h2>
                    <p style={{
                        color: '#6c757d',
                        marginBottom: '24px',
                        fontSize: '16px',
                        textAlign: 'center'
                    }}>
                        {friends.length === 0 
                            ? 'Start tracking your relationships with reminders'
                            : 'Add a new friend or select existing friend to set reminders'
                        }
                    </p>
                    
                    {/* Enhanced Add Friend Form */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        {/* Friend Selection */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <input
                                type="text"
                                value={quickAddName}
                                onChange={(e) => setQuickAddName(e.target.value)}
                                style={{
                                    ...inputStyles(false),
                                    flex: '1',
                                    minWidth: '200px'
                                }}
                                placeholder="Friend's name"
                            />
                            {friends.length > 0 && (
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const friend = friends.find(f => f.id === e.target.value);
                                            if (friend) {
                                                setQuickAddName(friend.name);
                                            }
                                        }
                                    }}
                                    style={{
                                        ...inputStyles(false),
                                        minWidth: '150px'
                                    }}
                                >
                                    <option value="">Or select existing friend</option>
                                    {friends.map(friend => (
                                        <option key={friend.id} value={friend.id}>{friend.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Reminder Settings */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '12px'
                        }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '4px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#2c3e50'
                                }}>
                                    Reminder Frequency
                                </label>
                                <select
                                    value={reminderFrequency}
                                    onChange={(e) => setReminderFrequency(e.target.value)}
                                    style={inputStyles(false)}
                                >
                                    <option value="weekly">Weekly</option>
                                    <option value="bi-weekly">Every 2 weeks</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Every 3 months</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                            
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '4px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#2c3e50'
                                }}>
                                    Preferred Time
                                </label>
                                <input
                                    type="time"
                                    value={preferredNotificationTime}
                                    onChange={(e) => setPreferredNotificationTime(e.target.value)}
                                    style={inputStyles(false)}
                                />
                            </div>
                        </div>

                        {/* Message/Notes */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#2c3e50'
                            }}>
                                Reminder Message (Optional)
                            </label>
                            <textarea
                                value={interactionNotes}
                                onChange={(e) => setInteractionNotes(e.target.value)}
                                placeholder="e.g., 'Check in about work project' or 'Ask about vacation plans'"
                                style={{
                                    ...inputStyles(false),
                                    minHeight: '80px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center',
                            marginTop: '8px'
                        }}>
                            <button
                                onClick={handleQuickAddFriend}
                                style={{
                                    ...buttonStyles,
                                    backgroundColor: '#28a745',
                                    minWidth: '140px',
                                    fontSize: '16px',
                                    fontWeight: '600'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                            >
                                {friends.length === 0 ? 'Add First Friend' : 'Add Friend & Reminder'}
                            </button>
                        </div>
                    </div>
                </div>


                {/* Add/Edit New Friend Section */}
                <h2 style={sectionTitleStyles}>
                    {editingFriendId ? 'Edit Friend' : 'Add New Friend'} ({currentMode === 'private' ? 'Private' : 'Shared'})
                </h2>
                <div style={formStyles}>
                    <input
                        type="text"
                        placeholder="Friend's Name"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setNameError(false); }}
                        style={inputStyles(nameError)}
                        required
                    />
                    {nameError && <p style={errorTextStyle}>Name is required.</p>}
                    <input
                        type="date"
                        value={birthday}
                        onChange={(e) => { setBirthday(e.target.value); setBirthdayError(false); }}
                        style={inputStyles(birthdayError)}
                        required
                    />
                    {birthdayError && <p style={errorTextStyle}>Birthday is required.</p>}
                    <input
                        type="date"
                        value={lastBirthdayWished}
                        onChange={(e) => setLastBirthdayWished(e.target.value)}
                        style={inputStyles(false)}
                        placeholder="Last Birthday Wished (Optional)"
                    />
                    <input
                        type="text"
                        placeholder="Gift Ideas (e.g., Book, Coffee Mug)"
                        value={giftIdeas}
                        onChange={(e) => setGiftIdeas(e.target.value)}
                        style={inputStyles(false)}
                    />
                    <select
                        value={giftStatus}
                        onChange={(e) => setGiftStatus(e.target.value)}
                        style={selectStyles}
                    >
                        <option value="Not Started">Gift: Not Started</option>
                        <option value="Idea">Gift: Idea</option>
                        <option value="Purchased">Gift: Purchased</option>
                        <option value="Wrapped">Gift: Wrapped</option>
                        <option value="Given">Gift: Given</option>
                    </select>
                    <input
                        type="number"
                        placeholder="Gift Budget (Optional, e.g., 50.00)"
                        value={giftBudget}
                        onChange={(e) => setGiftBudget(e.target.value)}
                        style={inputStyles(false)}
                        step="0.01"
                    />
                    <select
                        value={reminderFrequency}
                        onChange={(e) => setReminderFrequency(e.target.value)}
                        style={selectStyles}
                    >
                        <option value="monthly">Remind Monthly</option>
                        <option value="bi-weekly">Remind Bi-Weekly</option>
                        <option value="weekly">Remind Weekly</option>
                        <option value="quarterly">Remind Quarterly</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Group (e.g., Family, Work, College)"
                        value={group}
                        onChange={(e) => setGroup(e.target.value)}
                        style={inputStyles(false)}
                    />
                    <select
                        value={relationshipTier}
                        onChange={(e) => setRelationshipTier(e.target.value)}
                        style={selectStyles}
                    >
                        <option value="close">Close Friend</option>
                        <option value="regular">Regular Friend</option>
                        <option value="distant">Distant Acquaintance</option>
                    </select>

                    {/* Profile Photo Upload */}
                    <div style={fileInputContainerStyles}>
                        <label style={fileInputLabelStyles}>Profile Photo:</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files[0]) {
                                    setProfilePhotoFile(e.target.files[0]);
                                    setProfilePhotoUrl(URL.createObjectURL(e.target.files[0]));
                                } else {
                                    setProfilePhotoFile(null);
                                    if (!editingFriendId) {
                                        setProfilePhotoUrl('');
                                    }
                                }
                            }}
                            style={inputStyles(false)}
                        />
                        {(profilePhotoUrl || (editingFriendId && friends.find(f => f.id === editingFriendId)?.profilePhotoUrl)) && (
                            <img
                                src={profilePhotoUrl || friends.find(f => f.id === editingFriendId)?.profilePhotoUrl}
                                alt="Profile Preview"
                                style={profilePhotoPreviewStyles}
                            />
                        )}
                        {profilePhotoUrl && (
                            <button
                                onClick={() => {
                                    setProfilePhotoUrl('');
                                    setProfilePhotoFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                style={{ ...buttonStyles, backgroundColor: currentTheme.errorText, fontSize: '0.9em', padding: '8px 12px' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#b03a2e' : '#c0392b'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.errorText}
                            >
                                Remove Photo
                            </button>
                        )}
                    </div>

                    <input
                        type="text"
                        placeholder="Tags (comma-separated, e.g., 'gamer, coworker')"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        style={inputStyles(false)}
                    />
                    {/* Social Media Links */}
                    <h3 style={{...sectionTitleStyles, fontSize: '1.1em', marginTop: '10px'}}>Social Media Links</h3>
                    <input
                        type="url"
                        placeholder="Facebook URL"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        style={inputStyles(false)}
                    />
                    <input
                        type="url"
                        placeholder="Instagram URL"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        style={inputStyles(false)}
                    />
                    <input
                        type="url"
                        placeholder="LinkedIn URL"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        style={inputStyles(false)}
                    />
                    <input
                        type="url"
                        placeholder="Twitter URL"
                        value={twitterUrl}
                        onChange={(e) => setTwitterUrl(e.target.value)}
                        style={inputStyles(false)}
                    />
                    {/* Important Dates */}
                    <h3 style={{...sectionTitleStyles, fontSize: '1.1em', marginTop: '10px'}}>Important Dates</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                            type="date"
                            value={newImportantDate}
                            onChange={(e) => setNewImportantDate(e.target.value)}
                            style={{...inputStyles(false), flex: '1 1 120px'}}
                        />
                        <input
                            type="text"
                            placeholder="Description (e.g., Anniversary)"
                            value={newImportantDateDescription}
                            onChange={(e) => setNewImportantDateDescription(e.target.value)}
                            style={{...inputStyles(false), flex: '1 1 150px'}}
                        />
                        <select
                            value={newImportantDateRecurrence}
                            onChange={(e) => setNewImportantDateRecurrence(e.target.value)}
                            style={{...selectStyles, flex: '0 1 auto', minWidth: '100px', padding: '10px'}}
                        >
                            <option value="none">One-time</option>
                            <option value="yearly">Yearly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                        <button
                            onClick={handleAddImportantDate}
                            style={{...buttonStyles, flex: '0 1 auto', minWidth: '100px', padding: '10px'}}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyles.backgroundColor}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor}
                        >
                            Add Event
                        </button>
                    </div>
                    <ul style={listStyles}>
                        {importantDates.map((event, index) => {
                            const nextOccurrenceDate = getNextImportantDateOccurrence(event, new Date().getFullYear());
                            const daysUntilEvent = nextOccurrenceDate ? calculateDaysUntilDate(nextOccurrenceDate.toISOString().slice(0, 10)) : null;

                            return (
                                <li key={index} style={importantDateItemStyles}>
                                    <span>
                                        {formatDate(event.date)}: {event.description}
                                        {event.recurrence !== 'none' && ` (${event.recurrence.charAt(0).toUpperCase() + event.recurrence.slice(1)} Recurring)`}
                                        {nextOccurrenceDate && daysUntilEvent !== null && daysUntilEvent >= 0 && (
                                            <span style={importantDateCountdownStyles}>
                                                {daysUntilEvent === 0 ? ' (Today!)' : ` (${daysUntilEvent} day${daysUntilEvent === 1 ? '' : 's'} left)`}
                                            </span>
                                        )}
                                    </span>
                                    <button onClick={() => handleRemoveImportantDate(index)} style={importantDateRemoveButtonStyles}>
                                        &times;
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    {/* Per-friend Notification Settings */}
                    <h3 style={{...sectionTitleStyles, fontSize: '1.1em', marginTop: '10px'}}>Notification Settings</h3>
                    <div style={settingsGroupStyles}>
                        <label style={settingsLabelStyles}>Enable Reminders:</label>
                        <label style={toggleSwitchStyles}>
                            <input
                                type="checkbox"
                                checked={enableReminders}
                                onChange={() => setEnableReminders(!enableReminders)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={toggleSliderStyles(enableReminders)}>
                                <span style={toggleSliderBeforeStyles(enableReminders)}></span>
                            </span>
                        </label>
                    </div>
                    <div style={settingsGroupStyles}>
                        <label style={settingsLabelStyles}>Enable Birthday Notifs:</label>
                        <label style={toggleSwitchStyles}>
                            <input
                                type="checkbox"
                                checked={enableBirthdayNotifications}
                                onChange={() => setEnableBirthdayNotifications(!enableBirthdayNotifications)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={toggleSliderStyles(enableBirthdayNotifications)}>
                                <span style={toggleSliderBeforeStyles(enableBirthdayNotifications)}></span>
                            </span>
                        </label>
                    </div>

                    <textarea
                        placeholder="Interaction Notes (e.g., talked about their new job, vacation plans)"
                        value={interactionNotes}
                        onChange={(e) => setInteractionNotes(e.target.value)}
                        style={{ ...inputStyles(false), minHeight: '80px', resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleSaveFriend}
                            style={buttonStyles}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyles.backgroundColor}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor}
                        >
                            {editingFriendId ? 'Update Friend' : 'Add Friend'}
                        </button>
                        {editingFriendId && (
                            <button
                                onClick={handleCancelEdit}
                                style={{ ...buttonStyles, backgroundColor: '#7f8c8d' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6c7a89'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7f8c8d'}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </div>

                {/* Friends to Message Section */}
                <h2 style={sectionTitleStyles}>Friends to Message</h2>
                <ul style={listStyles}>
                    {friendsToMessage.length === 0 ? (
                        <p style={{color: currentTheme.textColor}}>No friends need messaging right now. Keep up the great work! Add friends or log an interaction to update their status.</p>
                    ) : (
                        friendsToMessage.map((friend) => (
                            <li key={friend.id} style={reminderItemStyles}>
                                <FriendAvatar name={friend.name} profilePhotoUrl={friend.profilePhotoUrl} />
                                <span style={listItemTextStyles}>
                                    <strong>{friend.name}</strong> - Last Contacted: {formatDate(getLatestInteractionDate(friend.interactions))}
                                </span>
                                <div style={listItemActionsStyles}>
                                    <button
                                        onClick={() => handleLogInteractionClick(friend.id)}
                                        style={messageButtonStyles}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#1a5276' : '#2980b9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = messageButtonStyles.backgroundColor}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                                        </svg>
                                        Log Interaction
                                    </button>
                                    <button
                                        onClick={() => { setSnoozeFriendId(friend.id); setShowSnoozeModal(true); }}
                                        style={snoozeButtonStyles}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#6c3483' : '#8e44ad'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = snoozeButtonStyles.backgroundColor}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                                                <path d="M.5 9.905a.5.5 0 0 0 .5.5h14a.5.5 0 0 0 0-1H1a.5.5 0 0 0-.5.5z"/>
                                                <path d="M8 12.5a4.5 4.5 0 1 1 4.5-4.5 4.5 4.5 0 0 1-4.5 4.5zm0-9a3.5 3.5 0 1 0 3.5 3.5A3.5 3.5 0 0 0 8 3.5z"/>
                                            </svg>
                                            Snooze
                                        </button>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>

                    {/* Upcoming Birthdays Section */}
                    <h2 style={sectionTitleStyles}>Upcoming Birthdays</h2>
                    <ul style={listStyles}>
                        {upcomingBirthdays.length === 0 ? (
                            <p style={{color: currentTheme.textColor}}>No upcoming birthdays in the next 30 days. Add more friends with birthdays to track them!</p>
                        ) : (
                            upcomingBirthdays.map((friend) => {
                                const daysUntil = calculateDaysUntilBirthday(friend.birthday);
                                return (
                                    <li key={friend.id} style={birthdayItemStyles}>
                                        <FriendAvatar name={friend.name} profilePhotoUrl={friend.profilePhotoUrl} />
                                        <span style={listItemTextStyles}>
                                            <strong>{friend.name}</strong> - Birthday: {formatDate(friend.birthday)} ({calculateAge(friend.birthday)} years old)
                                            {daysUntil !== null && daysUntil >= 0 && (
                                                <span style={birthdayCountdownStyles}>
                                                    {daysUntil === 0 ? ' (Today!)' : ` (${daysUntil} day${daysUntil === 1 ? '' : 's'} left)`}
                                                </span>
                                            )}
                                            {friend.lastBirthdayWished && ` - Last Wished: ${formatDate(friend.lastBirthdayWished)}`}
                                        </span>
                                    </li>
                                );
                            })
                        )}
                    </ul>

                    {/* All Friends List Section with Search and Filter */}
                    <h2 style={sectionTitleStyles}>All Friends ({currentMode === 'private' ? 'Private' : 'Shared'})</h2>
                    <div style={filterSortContainerStyles}>
                        <input
                            type="text"
                            placeholder="Search by name, gift ideas, notes, or tags..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={searchInputStyles}
                        />
                        <select
                            value={filterOption}
                            onChange={(e) => setFilterOption(e.target.value)}
                            style={selectStyles}
                        >
                            <option value="all">All Friends</option>
                            <option value="needsMessaging">Needs Messaging</option>
                            <option value="upcomingBirthdays">Upcoming Birthdays</option>
                            {availableGroups.map(g => (
                                <option key={g} value={`group-${g}`}>Group: {g}</option>
                            ))}
                            <optgroup label="Filter by Tier">
                                <option value="tier-close">Tier: Close Friend</option>
                                <option value="tier-regular">Tier: Regular Friend</option>
                                <option value="tier-distant">Tier: Distant Acquaintance</option>
                            </optgroup>
                            {availableTags.length > 0 && (
                                <optgroup label="Filter by Tag">
                                    {availableTags.map(tag => (
                                        <option key={`tag-${tag}`} value={`tag-${tag}`}>Tag: {tag}</option>
                                    ))}
                                </optgroup>
                            )}
                            <optgroup label="Filter by Gift Status">
                                <option value="giftStatus-Not Started">Gift: Not Started</option>
                                <option value="giftStatus-Idea">Gift: Idea</option>
                                <option value="giftStatus-Purchased">Gift: Purchased</option>
                                <option value="giftStatus-Wrapped">Gift: Wrapped</option>
                                <option value="giftStatus-Given">Gift: Given</option>
                            </optgroup>
                        </select>
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            style={selectStyles}
                        >
                            <option value="nameAsc">Sort by Name (A-Z)</option>
                            <option value="birthdayAsc">Sort by Birthday (Soonest)</option>
                            <option value="lastMessagedAsc">Sort by Last Contacted (Oldest)</option>
                        </select>
                    </div>
                    <ul style={listStyles}>
                        {filteredAndSortedFriends.length === 0 ? (
                            <p style={{color: currentTheme.textColor}}>No friends match your current search or filter criteria. Try adjusting them!</p>
                        ) : (
                            filteredAndSortedFriends.map((friend) => {
                                const latestInteractionDate = getLatestInteractionDate(friend.interactions);
                                const effectiveReminderFrequency = friend.reminderFrequency || tierFrequencies[friend.relationshipTier] || 'monthly';
                                const needsMsg = needsMessaging(latestInteractionDate, effectiveReminderFrequency);
                                const isBirthdayUpcoming = getUpcomingBirthdays([friend]).length > 0;
                                let statusColor = '#ccc';
                                if (needsMsg) statusColor = '#e74c3c';
                                if (isBirthdayUpcoming) statusColor = '#feca57';
                                const streak = calculateMessagingStreak(friend);
                                const daysUntil = calculateDaysUntilBirthday(friend.birthday);
                                const consistencyScore = calculateConsistencyScore(friend);
                                const upcomingImportantDatesForFriend = getUpcomingImportantDatesForFriend(friend);

                                return (
                                    <li key={friend.id} style={listItemStyles}>
                                        <FriendAvatar name={friend.name} profilePhotoUrl={friend.profilePhotoUrl} />
                                        <div style={listItemInfoStyles}>
                                            <span style={listItemTextStyles}>
                                                <strong>{friend.name}</strong>
                                            </span>
                                            <span style={listItemTextStyles}>
                                                Birthday: {formatDate(friend.birthday)} ({calculateAge(friend.birthday)} years old)
                                                {daysUntil !== null && daysUntil >= 0 && (
                                                    <span style={birthdayCountdownStyles}>
                                                        {daysUntil === 0 ? ' (Today!)' : ` (${daysUntil} day${daysUntil === 1 ? '' : 's'} left)`}
                                                    </span>
                                                )}
                                            </span>
                                            <span style={listItemTextStyles}>
                                                Last Contacted: {formatDate(latestInteractionDate)}
                                            </span>
                                            {friend.lastBirthdayWished && (
                                                <span style={listItemTextStyles}>
                                                    Last Wished: {formatDate(friend.lastBirthdayWished)}
                                                </span>
                                            )}
                                            {friend.giftIdeas && (
                                                <span style={listItemTextStyles}>
                                                    Gift Ideas: {friend.giftIdeas}
                                                </span>
                                            )}
                                            {friend.giftStatus && (
                                                <span style={listItemTextStyles}>
                                                    Gift Status: {friend.giftStatus}
                                                </span>
                                            )}
                                            {friend.giftBudget !== null && friend.giftBudget !== undefined && (
                                                <span style={listItemTextStyles}>
                                                    Gift Budget: ${friend.giftBudget.toFixed(2)}
                                                </span>
                                            )}
                                            <span style={listItemTextStyles}>
                                                Reminder Freq: {friend.reminderFrequency ? friend.reminderFrequency.charAt(0).toUpperCase() + friend.reminderFrequency.slice(1) : 'Monthly'}
                                            </span>
                                            {friend.group && (
                                                <span style={listItemTextStyles}>
                                                    Group: {friend.group}
                                                </span>
                                            )}
                                            {friend.relationshipTier && (
                                                <span style={listItemTextStyles}>
                                                    Tier: {friend.relationshipTier.charAt(0).toUpperCase() + friend.relationshipTier.slice(1)}
                                                </span>
                                            )}
                                            {friend.tags && friend.tags.length > 0 && (
                                                <span style={listItemTextStyles}>
                                                    Tags: {friend.tags.map(tag => <span key={tag} style={tagStyles}>{tag}</span>)}
                                                </span>
                                            )}
                                            {friend.interactionNotes && (
                                                <span style={listItemTextStyles}>
                                                    Notes: {friend.interactionNotes.substring(0, 50)}{friend.interactionNotes.length > 50 ? '...' : ''}
                                                </span>
                                            )}
                                            {streak > 0 && (
                                                <span style={{ ...listItemTextStyles, color: currentTheme.progressBarFill, fontWeight: 'bold' }}>
                                                    🔥 Streak: {streak} {streak === 1 ? 'period' : 'periods'}!
                                                </span>
                                            )}
                                            <span style={{ ...listItemTextStyles, color: currentTheme.sectionTitleColor, fontWeight: 'bold' }}>
                                                Consistency: {consistencyScore}%
                                            </span>

                                            {/* Social Media Links Display */}
                                            {(friend.socialMediaLinks?.facebook || friend.socialMediaLinks?.instagram || friend.socialMediaLinks?.linkedin || friend.socialMediaLinks?.twitter) && (
                                                <div style={socialMediaLinkContainerStyles}>
                                                    {friend.socialMediaLinks.facebook && (
                                                        <a href={friend.socialMediaLinks.facebook} target="_blank" rel="noopener noreferrer" style={socialMediaLinkStyles}>
                                                            <img src="https://img.icons8.com/ios-filled/20/000000/facebook-new.png" alt="Facebook" style={socialMediaIconStyles} />
                                                            Facebook
                                                        </a>
                                                    )}
                                                    {friend.socialMediaLinks.instagram && (
                                                        <a href={friend.socialMediaLinks.instagram} target="_blank" rel="noopener noreferrer" style={socialMediaLinkStyles}>
                                                            <img src="https://img.icons8.com/ios-filled/20/000000/instagram-new.png" alt="Instagram" style={socialMediaIconStyles} />
                                                            Instagram
                                                        </a>
                                                    )}
                                                    {friend.socialMediaLinks.linkedin && (
                                                        <a href={friend.socialMediaLinks.linkedin} target="_blank" rel="noopener noreferrer" style={socialMediaLinkStyles}>
                                                            <img src="https://img.icons8.com/ios-filled/20/000000/linkedin.png" alt="LinkedIn" style={socialMediaIconStyles} />
                                                            LinkedIn
                                                        </a>
                                                    )}
                                                    {friend.socialMediaLinks.twitter && (
                                                        <a href={friend.socialMediaLinks.twitter} target="_blank" rel="noopener noreferrer" style={socialMediaLinkStyles}>
                                                            <img src="https://img.icons8.com/ios-filled/20/000000/twitterx--v1.png" alt="Twitter" style={socialMediaIconStyles} />
                                                            Twitter
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {/* Important Dates Display */}
                                            {friend.importantDates && friend.importantDates.length > 0 && (
                                                <div style={interactionLogStyles}>
                                                    <strong>Important Dates:</strong>
                                                    {friend.importantDates.slice().sort((a,b) => {
                                                        const nextA = getNextImportantDateOccurrence(a, new Date().getFullYear());
                                                        const nextB = getNextImportantDateOccurrence(b, new Date().getFullYear());
                                                        if (!nextA) return 1;
                                                        if (!nextB) return -1;
                                                        return nextA.getTime() - nextB.getTime();
                                                    }).map((event, index) => {
                                                        const nextOccurrenceDate = getNextImportantDateOccurrence(event, new Date().getFullYear());
                                                        const daysUntilEvent = nextOccurrenceDate ? calculateDaysUntilDate(nextOccurrenceDate.toISOString().slice(0, 10)) : null;
                                                        return (
                                                            <div key={index} style={interactionItemStyles}>
                                                                {formatDate(event.date)}: {event.description}
                                                                {event.recurrence !== 'none' && ` (${event.recurrence.charAt(0).toUpperCase() + event.recurrence.slice(1)} Recurring)`}
                                                                {nextOccurrenceDate && daysUntilEvent !== null && daysUntilEvent >= 0 && (
                                                                    <span style={importantDateCountdownStyles}>
                                                                        {daysUntilEvent === 0 ? ' (Today!)' : ` (${daysUntilEvent} day${daysUntilEvent === 1 ? '' : 's'} left)`}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Interaction Log Display */}
                                            {friend.interactions && friend.interactions.length > 0 && (
                                                <div style={interactionLogStyles}>
                                                    <strong>Interaction History:</strong>
                                                    {friend.interactions.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 3).map((interaction, index) => (
                                                        <div key={index} style={interactionItemStyles}>
                                                            {formatDate(interaction.date)} - {interaction.method}
                                                            {interaction.notes && `: ${interaction.notes.substring(0, 30)}${interaction.notes.length > 30 ? '...' : ''}`}
                                                        </div>
                                                    ))}
                                                    {friend.interactions.length > 3 && <div>...</div>}
                                                </div>
                                            )}
                                        </div>
                                        <div style={statusIndicatorStyles(statusColor)}></div>
                                    </li>
                                );
                            })
                        )}
                    </ul>

                    {/* Settings Section */}
                    <h2 style={{ ...sectionTitleStyles, ...settingsSectionStyles }}>Settings</h2>
                    <div style={formStyles}>
                        <div style={settingsGroupStyles}>
                            <label style={settingsLabelStyles} htmlFor="quietHoursStart">Quiet Hours Start:</label>
                            <input
                                type="time"
                                id="quietHoursStart"
                                value={quietHoursStart}
                                onChange={(e) => setQuietHoursStart(e.target.value)}
                                style={inputStyles(false)}
                            />
                        </div>
                        <div style={settingsGroupStyles}>
                            <label style={settingsLabelStyles} htmlFor="quietHoursEnd">Quiet Hours End:</label>
                            <input
                                type="time"
                                id="quietHoursEnd"
                                value={quietHoursEnd}
                                onChange={(e) => setQuietHoursEnd(e.target.value)}
                                style={inputStyles(false)}
                            />
                        </div>
                        <div style={settingsGroupStyles}>
                            <label style={settingsLabelStyles} htmlFor="preferredNotificationTime">Preferred Notification Time:</label>
                            <input
                                type="time"
                                id="preferredNotificationTime"
                                value={preferredNotificationTime}
                                onChange={(e) => setPreferredNotificationTime(e.target.value)}
                                style={inputStyles(false)}
                            />
                        </div>
                        <div style={settingsGroupStyles}>
                            <label style={settingsLabelStyles}>Dark Mode:</label>
                            <label style={toggleSwitchStyles}>
                                <input
                                    type="checkbox"
                                    checked={darkMode}
                                    onChange={() => setDarkMode(!darkMode)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={toggleSliderStyles(darkMode)}>
                                    <span style={toggleSliderBeforeStyles(darkMode)}></span>
                                </span>
                            </label>
                        </div>
                        <div style={settingsGroupStyles}>
                            <label style={settingsLabelStyles}>Notification Sound:</label>
                            <label style={toggleSwitchStyles}>
                                <input
                                    type="checkbox"
                                    checked={notificationSoundEnabled}
                                    onChange={() => setNotificationSoundEnabled(!notificationSoundEnabled)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={toggleSliderStyles(notificationSoundEnabled)}>
                                    <span style={toggleSliderBeforeStyles(notificationSoundEnabled)}></span>
                                </span>
                            </label>
                        </div>
                        <button
                            onClick={exportFriendsData}
                            style={{ ...buttonStyles, backgroundColor: darkMode ? '#206a9e' : '#2980b9' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#1a5276' : '#2471a3'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#206a9e' : '#2980b9'}
                        >
                            Export All Friends Data (JSON)
                        </button>
                        <div style={settingsGroupStyles}>
                            <label style={settingsLabelStyles}>Import Strategy:</label>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <label style={{ color: currentTheme.textColor, fontSize: '0.9em' }}>
                                    <input
                                        type="radio"
                                        name="importStrategy"
                                        value="append"
                                        checked={importStrategy === 'append'}
                                        onChange={(e) => setImportStrategy(e.target.value)}
                                        style={{ marginRight: '5px' }}
                                    />
                                    Append
                                </label>
                                <label style={{ color: currentTheme.textColor, fontSize: '0.9em' }}>
                                    <input
                                        type="radio"
                                        name="importStrategy"
                                        value="merge"
                                        checked={importStrategy === 'merge'}
                                        onChange={(e) => setImportStrategy(e.target.value)}
                                        style={{ marginRight: '5px' }}
                                    />
                                    Merge (by Name)
                                </label>
                                <label style={{ color: currentTheme.textColor, fontSize: '0.9em' }}>
                                    <input
                                        type="radio"
                                        name="importStrategy"
                                        value="overwrite"
                                        checked={importStrategy === 'overwrite'}
                                        onChange={(e) => setImportStrategy(e.target.value)}
                                        style={{ marginRight: '5px' }}
                                    />
                                    Overwrite All
                                </label>
                            </div>
                        </div>
                        <div style={settingsGroupStyles}>
                            <label style={settingsLabelStyles} htmlFor="importFile">Import Friends (JSON):</label>
                            <input
                                type="file"
                                id="importFile"
                                accept=".json"
                                onChange={handleImportFriendsData}
                                ref={fileInputRef}
                                style={{ ...inputStyles(false), border: 'none', padding: '0', flex: '1' }}
                            />
                        </div>
                        <button
                            onClick={() => setShowActivityLogModal(true)}
                            style={{ ...buttonStyles, backgroundColor: darkMode ? '#8e44ad' : '#9b59b6' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#7d3c98' : '#8e44ad'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#8e44ad' : '#9b59b6'}
                        >
                            View Activity Log
                        </button>
                    </div>
                </div>

                {/* General Message Modal */}
                {showModal && !undoAction && (
                    <div style={modalOverlayStyles}>
                        <div style={modalContentStyles}>
                            <button onClick={() => setShowModal(false)} style={closeModalButtonStyles}>
                                &times;
                            </button>
                            <p>{message}</p>
                            <button
                                onClick={() => setShowModal(false)}
                                style={buttonStyles}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyles.backgroundColor}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                )}

                {/* Undo Action Message */}
                {undoAction && (
                    <div style={undoMessageStyles}>
                        <span>{message}</span>
                        {undoAction.type === 'delete' && (
                            <button
                                onClick={handleUndoDelete}
                                style={undoButtonStyles}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#c07a00' : '#e67e22'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = undoButtonStyles.backgroundColor}
                            >
                                Undo Delete
                            </button>
                        )}
                        {undoAction.type === 'markMessaged' && (
                            <button
                                onClick={handleUndoMarkMessaged}
                                style={undoButtonStyles}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#c07a00' : '#e67e22'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = undoButtonStyles.backgroundColor}
                            >
                                Undo Mark Messaged
                            </button>
                        )}
                    </div>
                )}

                {/* Log Interaction Modal */}
                {showLogInteractionModal && (
                    <div style={modalOverlayStyles}>
                        <div style={modalContentStyles}>
                            <button onClick={() => setShowLogInteractionModal(false)} style={closeModalButtonStyles}>
                                &times;
                            </button>
                            <h3>Log Interaction for {friends.find(f => f.id === loggingFriendId)?.name}</h3>
                            <div style={formStyles}>
                                <label style={{textAlign: 'left', color: currentTheme.textColor}}>Date:</label>
                                <input
                                    type="date"
                                    value={interactionDate}
                                    onChange={(e) => setInteractionDate(e.target.value)}
                                    style={inputStyles(false)}
                                />
                                <label style={{textAlign: 'left', color: currentTheme.textColor}}>Method:</label>
                                <select
                                    value={interactionMethod}
                                    onChange={(e) => setInteractionMethod(e.target.value)}
                                    style={selectStyles}
                                >
                                    <option value="Text">Text</option>
                                    <option value="Call">Call</option>
                                    <option value="Email">Email</option>
                                    <option value="In-person">In-person</option>
                                    <option value="Social Media">Social Media</option>
                                    <option value="Other">Other</option>
                                </select>
                                <label style={{textAlign: 'left', color: currentTheme.textColor}}>Notes (Optional):</label>
                                <textarea
                                    placeholder="Brief notes about this interaction"
                                    value={interactionNotesLog}
                                    onChange={(e) => setInteractionNotesLog(e.target.value)}
                                    style={{ ...inputStyles(false), minHeight: '60px', resize: 'vertical' }}
                                />
                                <div style={modalButtonContainerStyles}>
                                    <button
                                        onClick={handleSaveInteraction}
                                        style={buttonStyles}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyles.backgroundColor}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor}
                                    >
                                        Save Interaction
                                    </button>
                                    <button
                                        onClick={() => setShowLogInteractionModal(false)}
                                        style={{ ...buttonStyles, backgroundColor: darkMode ? '#555' : '#7f8c8d' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#444' : '#6c7a89'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#555' : '#7f8c8d'}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* Snooze Reminder Modal */}
                {showSnoozeModal && (
                    <div style={modalOverlayStyles}>
                        <div style={modalContentStyles}>
                            <button onClick={() => setShowSnoozeModal(false)} style={closeModalButtonStyles}>
                                &times;
                            </button>
                            <h3>Snooze Reminder</h3>
                            <p style={{color: currentTheme.textColor}}>Snooze reminder for this friend for:</p>
                            <select
                                value={snoozeDuration}
                                onChange={(e) => setSnoozeDuration(e.target.value)}
                                style={{ ...selectStyles, width: 'auto', marginBottom: '20px' }}
                            >
                                <option value="1day">1 Day</option>
                                <option value="1week">1 Week</option>
                                <option value="2weeks">2 Weeks</option>
                                <option value="1month">1 Month</option>
                            </select>
                            <div style={modalButtonContainerStyles}>
                                <button
                                    onClick={handleSnoozeReminder}
                                    style={buttonStyles}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyles.backgroundColor}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor}
                                >
                                    Snooze
                                </button>
                                <button
                                    onClick={() => setShowSnoozeModal(false)}
                                    style={{ ...buttonStyles, backgroundColor: darkMode ? '#555' : '#7f8c8d' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#444' : '#6c7a89'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#555' : '#7f8c8d'}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Interaction Chart Modal */}
                {showChartModal && chartFriend && (
                    <div style={modalOverlayStyles}>
                        <div style={{ ...modalContentStyles, maxWidth: '450px' }}>
                            <button onClick={() => setShowChartModal(false)} style={closeModalButtonStyles}>
                                &times;
                            </button>
                            <InteractionChart friend={chartFriend} currentTheme={currentTheme} />
                            <button
                                onClick={() => setShowChartModal(false)}
                                style={{ ...buttonStyles, marginTop: '20px' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyles.backgroundColor}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor}
                            >
                                Close Chart
                            </button>
                        </div>
                    </div>
                )}

                {/* Activity Log Modal */}
                {showActivityLogModal && (
                    <div style={modalOverlayStyles}>
                        <div style={{ ...modalContentStyles, maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                            <button onClick={() => setShowActivityLogModal(false)} style={closeModalButtonStyles}>
                                &times;
                            </button>
                            <h3>Activity Log</h3>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="Filter by name, method, or notes..."
                                    value={activityLogFilterTerm}
                                    onChange={(e) => setActivityLogFilterTerm(e.target.value)}
                                    style={{ ...inputStyles(false), flex: '1 1 200px' }}
                                />
                                <select
                                    value={activityLogSortOption}
                                    onChange={(e) => setActivityLogSortOption(e.target.value)}
                                    style={{ ...selectStyles, flex: '0 1 150px' }}
                                >
                                    <option value="newest">Sort by Newest</option>
                                    <option value="oldest">Sort by Oldest</option>
                                    <option value="friendNameAsc">Sort by Friend Name (A-Z)</option>
                                </select>
                                <button
                                    onClick={exportActivityLog}
                                    style={{ ...buttonStyles, flex: '0 1 auto', padding: '10px 15px', backgroundColor: darkMode ? '#16a085' : '#1abc9c' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#117a65' : '#16a085'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#16a085' : '#1abc9c'}
                                >
                                    Export CSV
                                </button>
                            </div>
                            <ul style={{ ...listStyles, overflowY: 'auto', flexGrow: 1 }}>
                                {allInteractions.length === 0 ? (
                                    <p style={{color: currentTheme.textColor}}>No interactions found matching your criteria.</p>
                                ) : (
                                    allInteractions.map((interaction, index) => (
                                        <li key={index} style={activityLogItemStyles}>
                                            <span style={{ fontWeight: 'bold' }}>{interaction.friendName}</span>
                                            <span>Date: {formatDate(interaction.date)}</span>
                                            <span>Method: {interaction.method}</span>
                                            {interaction.notes && <span>Notes: {interaction.notes}</span>}
                                        </li>
                                    ))
                                )}
                            </ul>
                            <button
                                onClick={() => setShowActivityLogModal(false)}
                                style={{ ...buttonStyles, marginTop: '20px' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyles.backgroundColor}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor}
                            >
                                Close Log
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    export default App;
