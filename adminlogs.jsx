import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, deleteDoc, setDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Trash2, Loader, Home, List, AlertTriangle, CheckCircle } from 'lucide-react';

// --- Global Variables (Provided by Canvas Environment) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- Firebase Initialization and Services ---
let app, db, auth;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    // You can setLogLevel here if needed for debugging
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

// --- Utility Functions ---

/**
 * Ensures the user is authenticated, either with a custom token or anonymously.
 */
const initializeAuth = async () => {
    if (auth && initialAuthToken) {
        try {
            await signInWithCustomToken(auth, initialAuthToken);
        } catch (error) {
            console.error("Error signing in with custom token:", error);
            await signInAnonymously(auth);
        }
    } else if (auth) {
        await signInAnonymously(auth);
    }
};

// --- Log Management Functions ---

const logCollectionPath = (uid) => `artifacts/${appId}/users/${uid}/log-entries`;

/**
 * Creates a new log entry (used for demonstration on the Home page).
 */
const createLogEntry = async (uid, logData) => {
    if (!db || !uid) return;
    try {
        const newLogRef = doc(collection(db, logCollectionPath(uid)));
        await setDoc(newLogRef, {
            ...logData,
            timestamp: serverTimestamp(),
            uid: uid,
        });
        return true;
    } catch (error) {
        console.error("Error creating log entry:", error);
        return false;
    }
};

// --- Components ---

const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-8">
        <Loader className="animate-spin text-indigo-500 h-8 w-8" />
        <span className="ml-3 text-lg text-gray-600">Loading...</span>
    </div>
);

const LogEntryCard = ({ log, handleDelete }) => {
    // Check if the log status indicates an error for red highlight
    const isError = log.data.status === 'error';
    const cardClasses = isError
        ? "bg-red-50 border-red-300 text-red-800"
        : "bg-white border-gray-200 text-gray-800";
    const icon = isError ? <AlertTriangle className="h-6 w-6 mr-3 text-red-500" /> : <CheckCircle className="h-6 w-6 mr-3 text-green-500" />;

    return (
        <div className={`p-4 rounded-xl shadow-lg transition-all mb-4 border-l-4 ${cardClasses}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                    {icon}
                    <h3 className="text-lg font-semibold">Log ID: {log.id}</h3>
                </div>
                <button
                    onClick={() => handleDelete(log.id)}
                    className="flex items-center text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 p-2 rounded-lg transition duration-200 text-sm font-medium"
                    aria-label={`Delete log ${log.id}`}
                >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                </button>
            </div>
            
            <p className="text-sm mb-2 font-mono">
                {log.data.timestamp ? new Date(log.data.timestamp.toDate()).toLocaleString() : 'Pending/No Timestamp'}
            </p>

            <pre className={`p-3 rounded-lg overflow-x-auto text-sm ${isError ? 'bg-red-100/70 text-red-900' : 'bg-gray-50 text-gray-700'}`}>
                {JSON.stringify(log.data, null, 2)}
            </pre>
        </div>
    );
};

// --- Main Application Component ---

const App = () => {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentPage, setCurrentPage] = useState('home');
    const [logs, setLogs] = useState([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [statusMessage, setStatusMessage] = useState(null);

    // 1. Authentication and Initialization
    useEffect(() => {
        initializeAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // If user is authenticated (even anonymously)
                setUserId(user.uid);
            } else {
                setUserId(null);
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []); // Run only once

    // 2. Real-time Log Data Subscription
    useEffect(() => {
        if (!db || !userId) {
            setLogs([]);
            setIsLoadingLogs(false);
            return;
        }
        
        setIsLoadingLogs(true);
        const logsCollectionRef = collection(db, logCollectionPath(userId));
        // Order by timestamp descending (newest first)
        const q = query(logsCollectionRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLogs = snapshot.docs.map(doc => ({
                id: doc.id,
                data: doc.data()
            }));
            setLogs(fetchedLogs);
            setIsLoadingLogs(false);
        }, (error) => {
            console.error("Error fetching logs:", error);
            setIsLoadingLogs(false);
        });

        return () => unsubscribe();
    }, [db, userId, appId]);

    // 3. Log Deletion Handler
    const handleDeleteLog = useCallback(async (id) => {
        if (!db || !userId) return;
        
        setStatusMessage({ type: 'info', text: 'Deleting log entry...' });

        try {
            const logDocRef = doc(db, logCollectionPath(userId), id);
            await deleteDoc(logDocRef);
            setStatusMessage({ type: 'success', text: 'Log entry deleted successfully!' });
        } catch (error) {
            console.error("Error deleting log:", error);
            setStatusMessage({ type: 'error', text: `Failed to delete log: ${error.message}` });
        }
        setTimeout(() => setStatusMessage(null), 3000);
    }, [db, userId]);

    // --- Page Views ---

    const HomePage = () => {
        const [message, setMessage] = useState('');
        const [isError, setIsError] = useState(false);
        const [isSubmitting, setIsSubmitting] = useState(false);
        
        const handleSubmit = async (e) => {
            e.preventDefault();
            if (!userId) {
                alert("Authentication not ready. Please wait.");
                return;
            }
            
            setIsSubmitting(true);
            const logData = {
                status: isError ? 'error' : 'success',
                message: message || (isError ? 'A simulated error occurred.' : 'A successful operation completed.'),
                source: 'User Input Form',
                details: {
                    ip_address: '192.168.1.1', // Mock detail
                    error_flag: isError,
                }
            };
            
            const success = await createLogEntry(userId, logData);
            setIsSubmitting(false);

            if (success) {
                setStatusMessage({ type: 'success', text: `Log created as: ${isError ? 'ERROR' : 'SUCCESS'}.` });
                setMessage('');
                setIsError(false);
            } else {
                setStatusMessage({ type: 'error', text: 'Failed to create log entry.' });
            }
            setTimeout(() => setStatusMessage(null), 3000);
        };

        return (
            <div className="max-w-3xl mx-auto p-4 md:p-8 bg-white shadow-xl rounded-xl">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-3">Log Entry Creator</h2>
                <p className="text-gray-600 mb-6">Use this form to add new log entries (success or error) to your private Firestore collection. Check the **Logs** tab to see them appear in real-time.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message (Optional)</label>
                        <textarea
                            id="message"
                            rows="3"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 transition duration-150 ease-in-out"
                            placeholder="Describe the operation or event..."
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            id="is-error"
                            type="checkbox"
                            checked={isError}
                            onChange={(e) => setIsError(e.target.checked)}
                            className="h-5 w-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <label htmlFor="is-error" className="ml-3 text-sm font-medium text-gray-700 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                            Mark as **ERROR**
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !userId}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white transition duration-300 ${
                            isSubmitting || !userId
                                ? 'bg-indigo-300 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        }`}
                    >
                        {isSubmitting ? <Loader className="animate-spin h-6 w-6 mr-2" /> : 'Create Log Entry'}
                    </button>
                    {!userId && <p className="text-sm text-red-500 text-center">Waiting for authentication...</p>}
                </form>
            </div>
        );
    };

    const LogsPage = () => {
        if (!isAuthReady) {
            return <LoadingSpinner />;
        }
        
        if (isLoadingLogs) {
            return <LoadingSpinner />;
        }

        return (
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2 flex items-center">
                    <List className="h-7 w-7 mr-3 text-indigo-600" />
                    Application Logs
                </h2>
                <p className="text-gray-600 mb-6">
                    Displaying **{logs.length}** log entries for user ID:
                    <code className="bg-gray-100 p-1 rounded ml-2 font-mono text-xs md:text-sm text-indigo-700 break-all">{userId}</code>
                </p>

                <div className="grid gap-4">
                    {logs.length > 0 ? (
                        logs.map(log => (
                            <LogEntryCard key={log.id} log={log} handleDelete={handleDeleteLog} />
                        ))
                    ) : (
                        <div className="p-10 text-center bg-gray-50 rounded-xl shadow-inner text-gray-500">
                            <p className="text-lg font-medium">No log entries found.</p>
                            <p className="text-sm mt-2">Add new logs using the **Home** tab.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- Main Render Structure ---

    let content;
    switch (currentPage) {
        case 'home':
            content = <HomePage />;
            break;
        case 'logs':
            content = <LogsPage />;
            break;
        default:
            content = <HomePage />;
    }

    const navigationItem = (page, Icon, label) => (
        <button
            onClick={() => setCurrentPage(page)}
            className={`flex items-center space-x-2 py-2 px-4 rounded-xl transition duration-200 font-semibold ${
                currentPage === page
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-indigo-600 hover:bg-indigo-100'
            }`}
        >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
        </button>
    );

    const StatusNotification = ({ status, text }) => {
        if (!text) return null;
        const baseClasses = "fixed bottom-5 right-5 p-4 rounded-xl shadow-2xl transition-opacity duration-300 flex items-center";
        const typeClasses = status === 'success' ? 'bg-green-500 text-white' : status === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white';
        return <div className={`${baseClasses} ${typeClasses}`}>{text}</div>;
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans antialiased">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <h1 className="text-2xl font-bold text-gray-800">
                            App Monitoring
                        </h1>
                        <nav className="flex space-x-3">
                            {navigationItem('home', Home, 'Home')}
                            {navigationItem('logs', List, 'Logs')}
                        </nav>
                    </div>
                </div>
            </header>

            <main className="py-10">
                {isAuthReady ? (
                    content
                ) : (
                    <LoadingSpinner />
                )}
            </main>

            <StatusNotification status={statusMessage?.type} text={statusMessage?.text} />
        </div>
    );
};

export default App;
