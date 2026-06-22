import React, { useState, useEffect, createContext, useContext, useRef } from 'react';

// --- FIREBASE IMPORTS (Must always be at the top) ---
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// --- ICON IMPORTS ---
import { Home, Scan, TrendingUp, BookOpen, Settings, LogOut, User, Send, Users, Phone, Award, Camera, XCircle, Sun, Cloud, Droplets, Wind, ExternalLink, ShieldCheck, Search, Languages, Brain, Mic } from 'lucide-react';

// Load Tailwind CSS script via CDN for quick local styling
const tailwindScriptId = 'tailwind-cdn-script';
if (!document.getElementById(tailwindScriptId)) {
    const script = document.createElement('script');
    script.id = tailwindScriptId;
    script.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(script);
}

// Create a context for Firebase and user data
const AppContext = createContext(null);
const APP_ID = 'local-agri-guard-app';

const createDefaultProfile = (user) => ({
    email: user?.email || null,
    targetLanguage: 'English',
    preferredCrops: [],
    savedScans: []
});

const loadOrCreateUserProfile = async (firestoreDb, user) => {
    const userDocRef = doc(firestoreDb, `artifacts/${APP_ID}/users/${user.uid}/profile/data`);

    try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            return userDocSnap.data();
        }

        const newProfile = createDefaultProfile(user);
        await setDoc(userDocRef, newProfile);
        return newProfile;
    } catch (error) {
        console.error("Error loading user profile. Continuing with local defaults:", error);
        return createDefaultProfile(user);
    }
};

// Main App Component
function App() {
    const [app, setApp] = useState(null);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentPage, setCurrentPage] = useState('login'); // State for navigation
    const [userProfile, setUserProfile] = useState(null); // State for user-specific data
    const [targetLanguage, setTargetLanguage] = useState('English'); // Default language for translation

    // English will be the base language.
    const translations = {
        en: {
            appName: "AgriGuard",
            loginTitle: "Welcome to AgriGuard",
            loginGuest: "Continue as Guest",
            loginEmail: "Login with Email",
            dashboard: "Dashboard",
            diseaseDetector: "Disease Detector",
            marketTracker: "Market Insights",
            farmingGuide: "Farming Guide",
            govSchemes: "Govt. Schemes",
            settings: "Settings",
            logout: "Logout",
            welcome: "Welcome, ",
            guestUser: "Guest User",
            savedScans: "Saved Scans",
            preferredCrops: "Preferred Crops",
            changeLanguage: "Set Target Translation Language",
            selectLanguage: "Enter any language (e.g., Hindi, Tamil, Spanish)",
            aboutDiseaseDetector: "Upload an image or use your camera to detect crop diseases.",
            aboutMarketTracker: "Check live crop market rates searchable by crop and region.",
            aboutFarmingGuide: "Access a comprehensive guide on soil, irrigation, pest control, and more.",
            diseaseName: "Disease Name:",
            symptoms: "Symptoms:",
            cause: "Cause:",
            treatment: "Treatment Options:",
            uploadImage: "Upload Image",
            useCamera: "Use Camera",
            marketPlaceholder: "Live market rates will be displayed here.",
            guideContent: "This section will contain comprehensive farming tips. It will be accessible offline.",
            noSavedScans: "No saved scans yet.",
            noPreferredCrops: "No preferred crops set yet.",
            loading: "Loading...",
            error: "Error:",
            userId: "User ID:",
            diseaseDetectionResult: "Disease Detection Result",
            liveCropMarketRates: "Live Crop Market Rates",
            comprehensiveFarmingGuide: "Comprehensive Farming Guide",
            loginPrompt: "Please login to save your preferences and scans.",
            askFarmingQuestion: "Ask a farming question...",
            getAnswer: "Get Answer",
            aiResponse: "AI Response:",
            aiPoweredDiseaseAnalysis: "AI-Powered Disease Analysis",
            interactiveFarmingAssistant: "Interactive Farming Assistant",
            cropName: "Crop Name",
            region: "Region",
            analyzeMarket: "Analyze Market",
            marketAnalysisResult: "Market Analysis Result",
            personalizedPlantingSchedule: "Personalized Planting Schedule",
            crop: "Crop",
            location: "Location",
            generateSchedule: "Generate Schedule",
            plantingScheduleResult: "Planting Schedule Result",
            enterCropAndRegion: "Enter crop name and region to get market insights.",
            enterCropAndLocation: "Enter crop name and your location to get a personalized planting schedule.",
            email: "Email",
            password: "Password",
            login: "Login",
            register: "Register",
            loginSuccess: "Logged in successfully!",
            registerSuccess: "Registered successfully! Please log in.",
            loginError: "Login failed: ",
            registerError: "Registration failed: ",
            invalidEmailError: "Please enter a valid email address.",
            cameraAccessDenied: "Camera access denied. Please enable camera permissions in your browser settings.",
            cameraNotAvailable: "No camera found or camera is not available.",
            capturePhoto: "Capture Photo",
            stopCamera: "Stop Camera",
            cameraPreview: "Camera Preview",
            capturedImage: "Captured Image",
            weatherReport: "Future Weather Forecast & Suggestions",
            enterDistrict: "Enter a district or city",
            getWeather: "Get Forecast",
            govSchemesTitle: "Government Schemes for Farmers",
            aboutGovSchemes: "Explore various government schemes designed to support farmers.",
            viewDetails: "View Details",
            weatherSuggestions: "Weather-based Suggestions:",
            suggestionsLoading: "Generating suggestions...",
            invalidLocation: "Could not find weather data for the specified location.",
            translate: "Translate",
            translationLoading: "Translating...",
            showOriginal: "Show Original",
        }
    };

    const t = (key) => translations['en'][key] || key;

    useEffect(() => {
        try {
            // --- YOUR FIREBASE CONFIGURATION GOES HERE ---
            const firebaseConfig = {
                apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
                authDomain: "agriguard-4fc9b.firebaseapp.com",
                projectId: "agriguard-4fc9b",
                storageBucket: "agriguard-4fc9b.firebasestorage.app",
                messagingSenderId: "696510897466",
                appId: "1:696510897466:web:a8c2b5d5c9b006727b8403",
                measurementId: "G-H00QX09142"
            };

            const initializedApp = initializeApp(firebaseConfig);
            const analytics = getAnalytics(initializedApp);
            const firestoreDb = getFirestore(initializedApp);
            const firebaseAuth = getAuth(initializedApp);

            setApp(initializedApp);
            setDb(firestoreDb);
            setAuth(firebaseAuth);
            
            getRedirectResult(firebaseAuth)
                .then(async (result) => {
                    if (result) {
                        await loadOrCreateUserProfile(firestoreDb, result.user);
                        setCurrentPage('dashboard');
                    }
                })
                .catch((error) => {
                    console.error("Error getting redirect result:", error);
                });

            const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                try {
                    if (user) {
                        setUserId(user.uid);
                        const profile = await loadOrCreateUserProfile(firestoreDb, user);
                        setUserProfile(profile);
                        setTargetLanguage(profile.targetLanguage || 'English');
                    } else {
                        setUserId(null);
                        setUserProfile(null);
                        setCurrentPage('login');
                    }
                } catch (error) {
                    console.error("Error handling auth state:", error);
                } finally {
                    setIsAuthReady(true);
                }
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Error initializing Firebase:", error);
            setIsAuthReady(true);
        }
    }, []);

    useEffect(() => {
        if (db && userId && isAuthReady) {
            const userDocRef = doc(db, `artifacts/${APP_ID}/users/${userId}/profile/data`);
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data());
                    setTargetLanguage(docSnap.data().targetLanguage || 'English');
                }
            }, (error) => {
                console.error("Error listening to user profile:", error);
            });
            return () => unsubscribe();
        }
    }, [db, userId, isAuthReady]);

    const handleTargetLanguageChange = async (newLang) => {
        setTargetLanguage(newLang);
        if (db && userId && userProfile) {
            const userDocRef = doc(db, `artifacts/${APP_ID}/users/${userId}/profile/data`);
            await setDoc(userDocRef, { ...userProfile, targetLanguage: newLang }, { merge: true });
        }
    };

    const handleLogout = async () => {
        if (auth) {
            try {
                await signOut(auth);
                setUserId(null);
                setUserProfile(null);
                setCurrentPage('login');
            } catch (error) {
                console.error("Error signing out:", error);
            }
        }
    };

    if (!isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                <p className="text-xl text-emerald-700 font-inter">{t('loading')}</p>
            </div>
        );
    }
    
    const contextValue = { app, db, auth, userId, userProfile, setUserProfile, targetLanguage, t, handleTargetLanguageChange, appId: APP_ID };

    return (
        <AppContext.Provider value={contextValue}>
            <div className="min-h-screen flex flex-col font-inter bg-gradient-to-br from-green-50 to-emerald-100 text-gray-800">
                {userId && currentPage !== 'login' ? (
                    <>
                        <Header setCurrentPage={setCurrentPage} />
                        <main className="flex-1 p-4 md:p-8 overflow-auto">
                            {currentPage === 'dashboard' && <Dashboard />}
                            {currentPage === 'diseaseDetector' && <DiseaseDetector />}
                            {currentPage === 'marketTracker' && <MarketTracker />}
                            {currentPage === 'farmingGuide' && <FarmingGuide />}
                            {currentPage === 'govSchemes' && <GovSchemes />}
                            {currentPage === 'advisor' && <AIFarmAdvisor />}
                            {currentPage === 'settings' && <SettingsPage handleLogout={handleLogout} />}
                        </main>
                    </>
                ) : (
                    <Login setCurrentPage={setCurrentPage} />
                )}
            </div>
        </AppContext.Provider>
    );
}

// Header Component
function Header({ setCurrentPage }) {
    const { t } = useContext(AppContext);
    return (
        <header className="bg-emerald-700 text-white p-4 shadow-md flex flex-col md:flex-row items-center justify-between rounded-b-lg">
            <h1 className="text-3xl font-bold mb-2 md:mb-0">{t('appName')}</h1>
            <nav className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-4">
                <NavItem icon={<Home size={20} />} text={t('dashboard')} onClick={() => setCurrentPage('dashboard')} />
                <NavItem icon={<Scan size={20} />} text={t('diseaseDetector')} onClick={() => setCurrentPage('diseaseDetector')} />
                <NavItem icon={<TrendingUp size={20} />} text={t('marketTracker')} onClick={() => setCurrentPage('marketTracker')} />
                <NavItem icon={<BookOpen size={20} />} text={t('farmingGuide')} onClick={() => setCurrentPage('farmingGuide')} />
                <NavItem icon={<ShieldCheck size={20} />} text={t('govSchemes')} onClick={() => setCurrentPage('govSchemes')} />
                <NavItem icon={<Brain size={20} />} text="AI Advisor" onClick={() => setCurrentPage('advisor')} highlight />
                <NavItem icon={<Settings size={20} />} text={t('settings')} onClick={() => setCurrentPage('settings')} />
            </nav>
        </header>
    );
}

// Navigation Item Component
function NavItem({ icon, text, onClick, highlight }) {
    return (
        <button
            className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors duration-200 text-sm font-medium shadow-sm ${highlight ? 'bg-purple-600 hover:bg-purple-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white`}
            onClick={onClick}
        >
            {icon}
            <span>{text}</span>
        </button>
    );
}

// Login Component
function Login({ setCurrentPage }) {
    const { auth, db, t, setUserProfile, appId } = useContext(AppContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const handleGuestLogin = async () => {
        try {
            await signInAnonymously(auth);
            setCurrentPage('dashboard');
            showMessage(t('loginSuccess'), 'success');
        } catch (error) {
            console.error("Error signing in anonymously:", error);
            showMessage(t('loginError') + error.message, 'error');
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithRedirect(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google:", error);
            showMessage(t('loginError') + error.message, 'error');
        }
    };

    const handleEmailLogin = async () => {
        if (!validateEmail(email)) {
            showMessage(t('invalidEmailError'), 'error');
            return;
        }
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                setUserProfile(userDocSnap.data());
            } else {
                await setDoc(userDocRef, {
                    language: 'en',
                    preferredCrops: [],
                    savedScans: []
                });
                setUserProfile({ language: 'en', preferredCrops: [], savedScans: [] });
            }
            setCurrentPage('dashboard');
            showMessage(t('loginSuccess'), 'success');
        } catch (error) {
            console.error("Error signing in with email:", error);
            showMessage(t('loginError') + error.message, 'error');
        }
    };

    const handleRegister = async () => {
        if (!validateEmail(email)) {
            showMessage(t('invalidEmailError'), 'error');
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
            await setDoc(userDocRef, {
                email: user.email,
                targetLanguage: 'en',
                preferredCrops: [],
                savedScans: []
            });
            showMessage(t('registerSuccess'), 'success');
        } catch (error) {
            console.error("Error registering:", error);
            showMessage(t('registerError') + error.message, 'error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-emerald-200">
                <h2 className="text-4xl font-bold text-center text-emerald-700 mb-2">{t('loginTitle')}</h2>
                <p className="text-center text-gray-600 mb-8">Your personal farming assistant.</p>
                
                {message && (
                    <div className={`p-4 mb-4 text-sm rounded-lg ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message}
                    </div>
                )}

                <div className="space-y-4">
                    <input
                        type="email"
                        placeholder={t('email')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus-outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                        type="password"
                        placeholder={t('password')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus-outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div className="flex flex-col space-y-3 mt-6">
                    <button onClick={handleEmailLogin} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        {t('login')}
                    </button>
                    <button onClick={handleRegister} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        {t('register')}
                    </button>
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-500">OR</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    <button onClick={handleGoogleLogin} className="w-full bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C41.38,36.148,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                        </svg>
                        <span>Continue with Google</span>
                    </button>

                    <button onClick={handleGuestLogin} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        {t('loginGuest')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper function for fetching with exponential backoff
const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response; // Success
            }
            if (response.status >= 400 && response.status < 500) {
                const errorBody = await response.text();
                throw new Error(`API request failed with client error: ${response.status}. Body: ${errorBody}`);
            }
            // Do not log retries in the console
        } catch (error) {
            // This catches network errors (fetch promise rejection)
            if (i === retries - 1) throw error; // Rethrow last error
        }
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
    }
    throw new Error(`API request failed after ${retries} attempts.`);
};

const CROP_COMMODITY_CANDIDATES = {
    tomato: ['Tomato'],
    onion: ['Onion'],
    wheat: ['Wheat'],
    rice: ['Paddy(Dhan)(Common)', 'Rice'],
    paddy: ['Paddy(Dhan)(Common)', 'Paddy'],
    banana: ['Banana'],
    potato: ['Potato'],
    maize: ['Maize'],
    corn: ['Maize'],
    cotton: ['Cotton'],
    chilli: ['Chilli', 'Green Chilli'],
    chili: ['Chilli', 'Green Chilli'],
    groundnut: ['Groundnut'],
    sugarcane: ['Sugarcane']
};

const CITY_TO_STATE = {
    bangalore: 'Karnataka',
    bengaluru: 'Karnataka',
    mysore: 'Karnataka',
    mysuru: 'Karnataka',
    pune: 'Maharashtra',
    mumbai: 'Maharashtra',
    hyderabad: 'Telangana',
    chennai: 'Tamil Nadu',
    coimbatore: 'Tamil Nadu',
    delhi: 'Delhi'
};

const toTitleCase = (value) =>
    value
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

const normalizeCropName = (value) => {
    const cleaned = (value || '')
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleaned || cleaned === 'unknown') return '';

    for (const cropKey of Object.keys(CROP_COMMODITY_CANDIDATES)) {
        const plural = `${cropKey}s`;
        if (cleaned === cropKey || cleaned === plural || cleaned.includes(cropKey) || cleaned.includes(plural)) {
            return toTitleCase(cropKey);
        }
    }

    return toTitleCase(cleaned.split(' ')[0]);
};

const inferCropFromText = (text) => {
    const cleaned = (text || '').toLowerCase();
    for (const cropKey of Object.keys(CROP_COMMODITY_CANDIDATES)) {
        if (cleaned.includes(cropKey) || cleaned.includes(`${cropKey}s`)) {
            return toTitleCase(cropKey);
        }
    }
    return '';
};

const normalizeRegionForMarket = (value) => {
    const cleaned = (value || '').trim();
    const state = CITY_TO_STATE[cleaned.toLowerCase()];
    return state || toTitleCase(cleaned);
};

const getCommodityCandidates = (cropName) => {
    const normalized = normalizeCropName(cropName);
    const key = normalized.toLowerCase();
    return CROP_COMMODITY_CANDIDATES[key] || (normalized ? [normalized] : []);
};

const fetchAgmarknetPrices = async ({ cropName, region = '', limit = 10 }) => {
    const apiKey = import.meta.env.VITE_AGMARKNET_API_KEY;
    const candidates = getCommodityCandidates(cropName);
    const normalizedRegion = normalizeRegionForMarket(region);

    if (!apiKey || candidates.length === 0) {
        return { records: [], commodity: normalizeCropName(cropName), region: normalizedRegion };
    }

    const buildUrl = (commodity, includeRegion) => {
        const params = new URLSearchParams({
            'api-key': apiKey,
            format: 'json',
            limit: String(limit)
        });
        params.append('filters[commodity]', commodity);
        if (includeRegion && normalizedRegion) {
            params.append('filters[state]', normalizedRegion);
        }
        return `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?${params.toString()}`;
    };

    for (const commodity of candidates) {
        const attempts = normalizedRegion
            ? [buildUrl(commodity, true), buildUrl(commodity, false)]
            : [buildUrl(commodity, false)];

        for (const url of attempts) {
            const response = await fetch(url);
            if (!response.ok) continue;

            const data = await response.json();
            if (data.records?.length > 0) {
                return { records: data.records, commodity, region: normalizedRegion };
            }
        }
    }

    return { records: [], commodity: candidates[0] || normalizeCropName(cropName), region: normalizedRegion };
};

const formatMandiRecords = (records, cropName) => {
    if (!records?.length) return '';
    const cropLabel = normalizeCropName(cropName) || 'Crop';
    return `${cropLabel} prices - ` + records.slice(0, 5).map(row =>
        `${row.market || row.district}: ₹${row.modal_price}/quintal (${row.arrival_date || 'latest'})`
    ).join(', ');
};

const getFallbackDiseaseInfo = ({ query, cropName, hasImage }) => {
    const crop = normalizeCropName(cropName) || inferCropFromText(query) || 'crop';
    if (hasImage) {
        return `Photo received. If ${crop} leaves show spreading yellowing, spots, wilting, or soft stems, isolate affected plants and check drainage, pests, and nutrient stress before spraying.`;
    }
    if (/yellow|leaf|leaves|spot|spots|wilt|disease|pest|rot/i.test(query)) {
        return `${crop} may be facing nutrient stress, water stress, pest damage, or fungal infection. Inspect the underside of leaves, soil moisture, and spread pattern before treatment.`;
    }
    return 'No clear disease concern was described. Keep monitoring leaf color, spots, wilting, and pest activity.';
};

const getFallbackSchemesInfo = ({ query }) => {
    const lower = (query || '').toLowerCase();
    const schemes = ['PM-KISAN: income support for eligible farmers.', 'PMFBY: crop insurance for weather or disease-related losses.', 'KCC: short-term crop credit through banks.'];
    if (/solar|pump|electric|irrigation/.test(lower)) schemes.push('PM-KUSUM: support for solar pumps and renewable irrigation.');
    if (/sell|price|market|mandi/.test(lower)) schemes.push('e-NAM: online mandi access and price discovery.');
    return schemes.join('\n');
};

const buildLocalAdvisorSummary = ({ diseaseInfo, weatherInfo, marketInfo, schemesInfo }) =>
    `Direct answer: ${diseaseInfo}\n\nKey recommendation: Use the weather and field condition together before acting. ${weatherInfo}\n\nMarket and support: ${marketInfo} ${schemesInfo}`;


function TranslatableText({ text, as: Component = 'p', className = '' }) {
    const { t, targetLanguage } = useContext(AppContext);
    const [translatedText, setTranslatedText] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleTranslate = async () => {
        if (!text) return;
        setIsLoading(true);
        setError(null);
        setTranslatedText(null);

        try {
            const prompt = `Translate the following text to ${targetLanguage}. Return only the translated text, without any additional formatting or introductory phrases.\n\nText: "${text}"`;
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

            const response = await fetchWithRetry(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                setTranslatedText(result.candidates[0].content.parts[0].text);
            } else {
                setError(new Error("Failed to get a valid translation."));
            }
        } catch (err) {
            console.error("Translation Error:", err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const showOriginal = () => {
        setTranslatedText(null);
        setError(null);
    };

    return (
        <div className="translatable-container relative group pr-12">
            <Component className={`whitespace-pre-wrap ${className}`}>
                {(translatedText || text).replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
            </Component>
            <div className="absolute top-0 right-0 flex items-start space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {translatedText && (
                     <button onClick={showOriginal} className="p-1 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors text-xs">
                        {t('showOriginal')}
                    </button>
                )}
                <button 
                    onClick={handleTranslate} 
                    disabled={isLoading || !targetLanguage || targetLanguage.toLowerCase() === 'english'}
                    className="p-1 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!targetLanguage || targetLanguage.toLowerCase() === 'english' ? "Set a different target language in Settings" : `Translate to ${targetLanguage}`}
                >
                    {isLoading ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : <Languages size={14} />}
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{t('error')} {error.message}</p>}
        </div>
    );
}

// Weather Report Component
function WeatherReport() {
    const { t } = useContext(AppContext);
    const [district, setDistrict] = useState('');
    const [rawWeatherData, setRawWeatherData] = useState(null);
    const [weatherReport, setWeatherReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

    const handleGetWeather = async () => {
        if (!district.trim()) {
            setError(new Error(t('enterDistrict')));
            return;
        }
        setLoading(true);
        setRawWeatherData(null);
        setWeatherReport(null);
        setError(null);

        try {
            // Step 1: Fetch 5-day forecast from WeatherAPI.com
            const weatherResponse = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${district}&days=5&aqi=no&alerts=no`);

            if (!weatherResponse.ok) {
                const errorData = await weatherResponse.json();
                if (errorData?.error?.code === 1006) {
                     setError(new Error(t('invalidLocation')));
                } else {
                    throw new Error(errorData?.error?.message || 'Failed to fetch weather data.');
                }
                setLoading(false);
                return;
            }
            
            const weatherData = await weatherResponse.json();
            setRawWeatherData(weatherData);

            if (!weatherData.forecast || !weatherData.forecast.forecastday) {
                throw new Error('Invalid data structure received from weather API.');
            }

            // Step 2: Format weather data for the LLM
            const forecastSummary = weatherData.forecast.forecastday
                .map(day => {
                    return `Date: ${day.date}, Avg Temp: ${day.day.avgtemp_c}°C, Weather: ${day.day.condition.text}, Wind: ${day.day.maxwind_kph} kph, Humidity: ${day.day.avghumidity}%`;
                }).join('\n');

            // Step 3: Call Gemini API with the structured weather data
            const query = `
                Based on the following weather forecast for a farmer in ${district}, first provide a brief summary of today's weather and the upcoming week's forecast.
                Then, provide a separate section with actionable, practical suggestions for the farmer.
                Structure the entire response with clear headings like "Weather Summary" and "Farming Suggestions".
                Format the suggestions as a bulleted list (e.g., using '-' or '*' for each point).

                Weather Data:
                ${forecastSummary}
            `;
            const payload = {
                contents: [{ parts: [{ text: query }] }],
            };
            const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

            const geminiResponse = await fetchWithRetry(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await geminiResponse.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                let text = result.candidates[0].content.parts[0].text.replace(/\*\*/g, '').replace(/###/g, '');
                setWeatherReport(text);
            } else {
                setError(new Error("No valid response from AI."));
            }
        } catch (err) {
            console.error("Error in handleGetWeather:", err);
            setError(new Error(err.message || "Failed to get weather data. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-emerald-200">
            <h3 className="text-2xl font-semibold text-emerald-600 mb-4 flex items-center space-x-2">
                <Sun size={24} />
                <span>{t('weatherReport')}</span>
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <input
                    type="text"
                    placeholder={t('enterDistrict')}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                    onClick={handleGetWeather}
                    disabled={loading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Search size={20} />
                    <span>{t('getWeather')}</span>
                </button>
            </div>
            {loading && (
                <div className="text-center mt-4">
                    <p className="text-emerald-700 text-lg font-semibold">{t('loading')}</p>
                </div>
            )}
            {error && <p className="text-center text-red-600 mt-4">{t('error')} {error.message}</p>}
            
            {rawWeatherData && !loading && (
                 <div className="bg-blue-50 p-6 rounded-lg mt-6 border border-blue-200">
                    <h4 className="text-xl font-semibold text-blue-700 mb-4">Weather Forecast for {rawWeatherData.location.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h5 className="font-semibold text-lg mb-2">Today ({new Date(rawWeatherData.forecast.forecastday[0].date).toLocaleDateString()})</h5>
                            <div className="flex items-center space-x-4">
                                <img src={rawWeatherData.current.condition.icon} alt={rawWeatherData.current.condition.text} className="w-16 h-16"/>
                                <div>
                                    <p className="text-3xl font-bold">{rawWeatherData.current.temp_c}°C</p>
                                    <p className="text-gray-600">{rawWeatherData.current.condition.text}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                             <h5 className="font-semibold text-lg mb-2">This Week's Outlook</h5>
                             <div className="space-y-2">
                                 {rawWeatherData.forecast.forecastday.slice(1).map(day => (
                                     <div key={day.date_epoch} className="flex items-center justify-between text-sm p-1 bg-white rounded-md">
                                         <span className="font-medium">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                                         <img src={day.day.condition.icon} alt={day.day.condition.text} className="w-8 h-8"/>
                                         <span className="text-gray-600">{day.day.mintemp_c}°C / {day.day.maxtemp_c}°C</span>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {weatherReport && (
                <div className="bg-emerald-50 p-6 rounded-lg mt-4">
                    <TranslatableText text={weatherReport} className="text-gray-800" />
                </div>
            )}
        </div>
    );
}


// Dashboard Component
function Dashboard() {
    const { userId, userProfile, t } = useContext(AppContext);

    return (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white p-6 rounded-lg shadow-md border border-emerald-200">
                <h2 className="text-3xl font-bold text-emerald-700 mb-4 flex items-center space-x-2">
                    <Home size={28} />
                    <span>{t('dashboard')}</span>
                </h2>
                <p className="text-xl text-gray-700 mb-2">
                    {t('welcome')} {userProfile?.email || t('guestUser')}!
                </p>
                <p className="text-sm text-gray-500 break-words">
                    {t('userId')} {userId}
                </p>
            </div>
            
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <WeatherReport />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-emerald-200">
                <h3 className="text-2xl font-semibold text-emerald-600 mb-4 flex items-center space-x-2">
                    <Scan size={24} />
                    <span>{t('savedScans')}</span>
                </h3>
                {userProfile?.savedScans && userProfile.savedScans.length > 0 ? (
                    <ul className="list-disc list-inside text-gray-700">
                        {userProfile.savedScans.map((scan, index) => (
                            <li key={index} className="mb-1">{scan.name} (Detected: {new Date(scan.date).toLocaleDateString()})</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">{t('noSavedScans')}</p>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-emerald-200">
                <h3 className="text-2xl font-semibold text-emerald-600 mb-4 flex items-center space-x-2">
                    <BookOpen size={24} />
                    <span>{t('preferredCrops')}</span>
                </h3>
                {userProfile?.preferredCrops && userProfile.preferredCrops.length > 0 ? (
                    <ul className="list-disc list-inside text-gray-700">
                        {userProfile.preferredCrops.map((crop, index) => (
                            <li key={index} className="mb-1">{crop}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">{t('noPreferredCrops')}</p>
                )}
            </div>
        </div>
    );
}

// Disease Detector Component
function DiseaseDetector() {
    const { t } = useContext(AppContext);
    const [image, setImage] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const mediaStreamRef = useRef(null); // To store the MediaStream object

    useEffect(() => {
        if (isCameraActive && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(playError => {
                console.error("Error trying to play video stream:", playError);
                setError(new Error("Could not start camera feed. Please check permissions."));
                stopCamera(); // Clean up if play fails
            });
        }
    }, [isCameraActive, stream]);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Data = reader.result.split(',')[1];
                setImage(reader.result);
                await analyzeImage(base64Data);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = async (base64Data) => {
        setLoading(true);
        setResult(null);
        setError(null);

        const prompt = `Analyze the image of a plant/leaf. Identify any potential disease, provide the disease name, common symptoms, cause, and a list of treatment options. Return the response in a structured JSON format. Example: {"diseaseName": "Early Blight", "symptoms": "Dark spots on older leaves, concentric rings, yellowing around spots.", "cause": "Fungus (Alternaria solani)", "treatment": "Fungicide application, crop rotation, proper spacing."}`;
        
        const payload = {
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: "image/png",
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "diseaseName": { "type": "STRING" },
                        "symptoms": { "type": "STRING" },
                        "cause": { "type": "STRING" },
                        "treatment": { "type": "STRING" }
                    },
                    "propertyOrdering": ["diseaseName", "symptoms", "cause", "treatment"]
                }
            }
        };
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetchWithRetry(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const resultData = await response.json();
            if (resultData.candidates && resultData.candidates.length > 0 &&
                resultData.candidates[0].content && resultData.candidates[0].content.parts &&
                resultData.candidates[0].content.parts.length > 0) {
                const jsonText = resultData.candidates[0].content.parts[0].text;
                const parsedJson = JSON.parse(jsonText);
                setResult(parsedJson);
            } else {
                setError(new Error("No valid response from AI."));
            }
        } catch (err) {
            console.error("Error calling Gemini API:", err);
            setError(new Error("Failed to get AI response. Please try again."));
        } finally {
            setLoading(false);
        }
    }

    const startCamera = async () => {
        setError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError(new Error("Camera functionality is not supported by your browser."));
            return;
        }

        const videoConstraints = {
            facingMode: { exact: "environment" }
        };

        try {
            // First, try to get the rear camera specifically
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
            setStream(mediaStream);
            mediaStreamRef.current = mediaStream;
            setIsCameraActive(true);
        } catch (err) {
            console.warn("Could not get rear camera, trying any available camera:", err);
            // If the rear camera isn't available or fails, try getting any video source
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                setStream(mediaStream);
                mediaStreamRef.current = mediaStream;
                setIsCameraActive(true);
            } catch (finalErr) {
                console.error("Error accessing any camera:", finalErr);
                if (finalErr.name === "NotAllowedError" || finalErr.name === "PermissionDeniedError") {
                    setError(new Error(t('cameraAccessDenied') + ' Please enable camera permissions in your browser settings.'));
                } else if (finalErr.name === "NotFoundError" || finalErr.name === "DevicesNotFoundError") {
                    setError(new Error(t('cameraNotAvailable')));
                } else {
                    setError(new Error(t('error') + ' An unexpected error occurred while starting the camera.'));
                }
            }
        }
    };

    const stopCamera = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setStream(null);
        mediaStreamRef.current = null;
        setIsCameraActive(false);
        setImage(null); // Clear captured image when camera is stopped
    };

    const capturePhoto = async () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageDataUrl = canvas.toDataURL('image/png');
            setImage(imageDataUrl);
            stopCamera();

            const base64Data = imageDataUrl.split(',')[1];
            await analyzeImage(base64Data);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-emerald-200">
            <h2 className="text-3xl font-bold text-emerald-700 mb-6 flex items-center space-x-2">
                <Scan size={28} />
                <span>{t('aiPoweredDiseaseAnalysis')}</span>
            </h2>
            <p className="text-gray-700 mb-4">{t('aboutDiseaseDetector')}</p>

            <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4 mb-8">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                />
                <label
                    htmlFor="image-upload"
                    className="cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center space-x-2"
                >
                    <Scan size={20} />
                    <span>{t('uploadImage')}</span>
                </label>
                <button
                    onClick={startCamera}
                    disabled={isCameraActive}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Camera size={20} />
                    <span>{t('useCamera')}</span>
                </button>
            </div>

            {error && (
                <div className="text-center text-red-600 text-lg font-semibold mb-4">
                    <p>{t('error')} {error.message}</p>
                </div>
            )}

            {isCameraActive && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full relative">
                        <button
                            onClick={stopCamera}
                            className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
                        >
                            <XCircle size={28} />
                        </button>
                        <h3 className="text-2xl font-bold text-emerald-700 mb-4">{t('cameraPreview')}</h3>
                        <video ref={videoRef} className="w-full h-auto rounded-lg shadow-lg mb-4" autoPlay playsInline></video>
                        <button
                            onClick={capturePhoto}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                            <Camera size={20} />
                            <span>{t('capturePhoto')}</span>
                        </button>
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                    </div>
                </div>
            )}

            {image && (
                <div className="mb-8 text-center">
                    <h3 className="text-xl font-semibold text-emerald-600 mb-2">{t('capturedImage')}:</h3>
                    <img src={image} alt="Captured for detection" className="max-w-full h-auto mx-auto rounded-lg shadow-lg" style={{ maxHeight: '300px' }} />
                </div>
            )}

            {loading && (
                <div className="text-center text-emerald-700 text-lg font-semibold">
                    <p>{t('loading')}</p>
                </div>
            )}

            {result && !loading && (
                <div className="bg-emerald-50 p-6 rounded-lg shadow-inner border border-emerald-300">
                    <h3 className="text-2xl font-bold text-emerald-700 mb-4">{t('diseaseDetectionResult')}</h3>
                    <div className="space-y-4 text-left">
                        <div>
                            <strong className="block font-semibold text-gray-800 mb-1">{t('diseaseName')}</strong>
                            <TranslatableText text={result.diseaseName} className="text-gray-700" />
                        </div>
                        <div>
                            <strong className="block font-semibold text-gray-800 mb-1">{t('symptoms')}</strong>
                            <TranslatableText text={result.symptoms} className="text-gray-700" />
                        </div>
                        <div>
                            <strong className="block font-semibold text-gray-800 mb-1">{t('cause')}</strong>
                            <TranslatableText text={result.cause} className="text-gray-700" />
                        </div>
                        <div>
                            <strong className="block font-semibold text-gray-800 mb-1">{t('treatment')}</strong>
                            <TranslatableText text={result.treatment} className="text-gray-700" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Market Tracker Component — Real AGMARKNET prices + Gemini analysis
function MarketTracker() {
    const { t } = useContext(AppContext);
    const [cropName, setCropName] = useState('');
    const [region, setRegion] = useState('');
    const [mandiData, setMandiData] = useState([]);
    const [marketAnalysis, setMarketAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAnalyzeMarket = async () => {
        if (!cropName.trim() || !region.trim()) {
            setError(new Error(t('enterCropAndRegion')));
            return;
        }
        setLoading(true);
        setMandiData([]);
        setMarketAnalysis('');
        setError(null);

        try {
            // Step 1: Fetch live mandi prices from data.gov.in AGMARKNET API
            let livePriceText = '';
            try {
                const marketResult = await fetchAgmarknetPrices({ cropName, region, limit: 10 });
                if (marketResult.records.length > 0) {
                    setMandiData(marketResult.records);
                    livePriceText = marketResult.records.map(r =>
                        `Mandi: ${r.market}, District: ${r.district}, Min: ₹${r.min_price}/quintal, Max: ₹${r.max_price}/quintal, Modal: ₹${r.modal_price}/quintal, Date: ${r.arrival_date}`
                    ).join('\n');
                }
            } catch (agErr) {
                console.warn('AGMARKNET fetch failed, continuing with AI analysis only:', agErr);
            }

            // Step 2: Send live prices + context to Gemini for analysis
            const prompt = livePriceText
                ? `Here are live mandi prices for ${cropName} in ${region} from AGMARKNET:\n${livePriceText}\n\nBased on these real prices, provide a brief market analysis with: 1) Price summary, 2) Price trend insight, 3) Selling recommendation for the farmer. Keep it concise and practical.`
                : `Provide a market insights analysis for ${cropName} in ${region}. Include price trends, key factors affecting price, and a selling recommendation. Note that live mandi data was unavailable, so provide general market guidance.`;

            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

            const response = await fetchWithRetry(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                let text = result.candidates[0].content.parts[0].text.replace(/##\s*|\*\*|\*|^-?\s*/gm, '');
                setMarketAnalysis(text);
            } else {
                setError(new Error("No valid response from AI."));
            }
        } catch (err) {
            console.error("Error analyzing market:", err);
            setError(new Error("Failed to get market data. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-emerald-200">
            <h2 className="text-3xl font-bold text-emerald-700 mb-2 flex items-center space-x-2">
                <TrendingUp size={28} />
                <span>{t('marketTracker')}</span>
            </h2>
            <p className="text-sm text-gray-500 mb-6">Live mandi prices from AGMARKNET + AI analysis</p>
            <div className="flex flex-col space-y-4 mb-6">
                <input type="text" placeholder="Crop name (e.g. Tomato, Wheat, Onion)" value={cropName} onChange={(e) => setCropName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm" />
                <input type="text" placeholder="State (e.g. Karnataka, Maharashtra)" value={region} onChange={(e) => setRegion(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm" />
                <button onClick={handleAnalyzeMarket} disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-md disabled:opacity-50">
                    {loading ? t('loading') : 'Get Live Prices + Analysis'}
                </button>
            </div>
            {loading && <p className="text-center text-emerald-700">{t('loading')}</p>}
            {error && <p className="text-center text-red-600">{t('error')} {error.message}</p>}

            {mandiData.length > 0 && (
                <div className="mt-6 mb-4">
                    <h4 className="text-lg font-semibold text-emerald-700 mb-3">Live Mandi Prices (AGMARKNET)</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-emerald-100 text-emerald-800">
                                    <th className="p-2 text-left border border-emerald-200">Market</th>
                                    <th className="p-2 text-left border border-emerald-200">District</th>
                                    <th className="p-2 text-right border border-emerald-200">Min ₹</th>
                                    <th className="p-2 text-right border border-emerald-200">Max ₹</th>
                                    <th className="p-2 text-right border border-emerald-200">Modal ₹</th>
                                    <th className="p-2 text-left border border-emerald-200">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mandiData.map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-emerald-50'}>
                                        <td className="p-2 border border-emerald-100">{row.market}</td>
                                        <td className="p-2 border border-emerald-100">{row.district}</td>
                                        <td className="p-2 border border-emerald-100 text-right">₹{row.min_price}</td>
                                        <td className="p-2 border border-emerald-100 text-right">₹{row.max_price}</td>
                                        <td className="p-2 border border-emerald-100 text-right font-semibold text-emerald-700">₹{row.modal_price}</td>
                                        <td className="p-2 border border-emerald-100">{row.arrival_date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="text-xs text-gray-400 mt-1">Prices per quintal (100 kg)</p>
                    </div>
                </div>
            )}

            {marketAnalysis && (
                <div className="bg-emerald-50 p-6 rounded-lg mt-2">
                    <h4 className="text-xl font-semibold text-emerald-600 mb-2">AI Market Analysis</h4>
                    <TranslatableText text={marketAnalysis} className="text-gray-800" />
                </div>
            )}
        </div>
    );
}

// Farming Guide Component
function FarmingGuide() {
    const { t } = useContext(AppContext);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [cropForSchedule, setCropForSchedule] = useState('');
    const [locationForSchedule, setLocationForSchedule] = useState('');
    const [plantingSchedule, setPlantingSchedule] = useState('');
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [errorSchedule, setErrorSchedule] = useState(null);

    const handleAskQuestion = async () => {
        if (!question.trim()) { setError(new Error("Please enter a question.")); return; }
        setLoading(true); setAnswer(''); setError(null);
        try {
            const prompt = `Answer the following farming question. Where appropriate, use bullet points or numbered lists to structure the answer for clarity. Keep the response comprehensive but concise: ${question}`;
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const response = await fetchWithRetry(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                setAnswer(result.candidates[0].content.parts[0].text);
            } else { setError(new Error("No valid response from AI.")); }
        } catch (err) {
            console.error("Error asking question:", err);
            setError(new Error("Failed to get AI response. Please try again."));
        } finally { setLoading(false); }
    };

    const handleGenerateSchedule = async () => {
        if (!cropForSchedule.trim() || !locationForSchedule.trim()) { setErrorSchedule(new Error(t('enterCropAndLocation'))); return; }
        setLoadingSchedule(true); setPlantingSchedule(''); setErrorSchedule(null);
        try {
            const prompt = `Generate a planting schedule for ${cropForSchedule} in ${locationForSchedule}. Format the key stages of the schedule as a bulleted or numbered list. Keep the response concise.`;
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const response = await fetchWithRetry(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                let text = result.candidates[0].content.parts[0].text.replace(/##\s*|\*\*|\*|^-?\s*/gm, '');
                setPlantingSchedule(text);
            } else { setErrorSchedule(new Error("No valid response from AI.")); }
        } catch (err) {
            console.error("Error generating schedule:", err);
            setErrorSchedule(new Error("Failed to generate schedule. Please try again."));
        } finally { setLoadingSchedule(false); }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-emerald-200 space-y-8">
            <div>
                <h3 className="text-2xl font-bold text-emerald-700 mb-4">{t('interactiveFarmingAssistant')}</h3>
                <div className="flex flex-col space-y-4">
                    <textarea className="w-full p-3 border rounded-lg" rows="4" placeholder={t('askFarmingQuestion')} value={question} onChange={(e) => setQuestion(e.target.value)}></textarea>
                    <button onClick={handleAskQuestion} disabled={loading} className="bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50">{loading ? t('loading') : t('getAnswer')}</button>
                </div>
                {loading && <p className="text-center mt-4">{t('loading')}</p>}
                {error && <p className="text-center text-red-600 mt-4">{t('error')} {error.message}</p>}
                {answer && <div className="bg-emerald-50 p-4 rounded-lg mt-4"><h4 className="font-semibold">{t('aiResponse')}</h4><TranslatableText text={answer} /></div>}
            </div>

            <div>
                <h3 className="text-2xl font-bold text-emerald-700 mb-4">{t('personalizedPlantingSchedule')}</h3>
                <div className="flex flex-col space-y-4">
                    <input type="text" placeholder={t('crop')} value={cropForSchedule} onChange={(e) => setCropForSchedule(e.target.value)} className="w-full p-3 border rounded-lg" />
                    <input type="text" placeholder={t('location')} value={locationForSchedule} onChange={(e) => setLocationForSchedule(e.target.value)} className="w-full p-3 border rounded-lg" />
                    <button onClick={handleGenerateSchedule} disabled={loadingSchedule} className="bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50">{loadingSchedule ? t('loading') : t('generateSchedule')}</button>
                </div>
                {loadingSchedule && <p className="text-center mt-4">{t('loading')}</p>}
                {errorSchedule && <p className="text-center text-red-600 mt-4">{t('error')} {errorSchedule.message}</p>}
                {plantingSchedule && <div className="bg-emerald-50 p-4 rounded-lg mt-4"><h4 className="font-semibold">{t('plantingScheduleResult')}</h4><TranslatableText text={plantingSchedule} /></div>}
            </div>
        </div>
    );
}

// Government Schemes Component
function GovSchemes() {
    const { t } = useContext(AppContext);

    const schemes = [
        {
            name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
            description: "A central sector scheme with 100% funding from the Government of India. It provides income support of Rs. 6,000 per year in three equal installments to all landholding farmer families.",
            guidelines: "Farmers need to register on the PM-KISAN portal with their land records and bank details. The amount is directly transferred to their bank accounts.",
            link: "https://pmkisan.gov.in/"
        },
        {
            name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
            description: "An insurance service for farmers for their yields. It aims to provide comprehensive insurance cover against failure of the crop thus helping in stabilising the income of the farmers.",
            guidelines: "Enrollment can be done through banks, CSC centers, or the national crop insurance portal. Farmers pay a uniform premium.",
            link: "https://pmfby.gov.in/"
        },
        {
            name: "Kisan Credit Card (KCC) Scheme",
            description: "The scheme aims at providing adequate and timely credit support from the banking system under a single window with flexible and simplified procedure to the farmers for their cultivation and other needs.",
            guidelines: "Farmers can apply for a KCC at any commercial bank, regional rural bank, or cooperative bank. It covers term credit for agriculture and allied activities.",
            link: "https://www.sbi.co.in/web/agri-rural/agriculture-banking/crop-finance/kisan-credit-card"
        }
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-emerald-200">
            <h2 className="text-3xl font-bold text-emerald-700 mb-6 flex items-center space-x-2">
                <ShieldCheck size={28} />
                <span>{t('govSchemesTitle')}</span>
            </h2>
            <p className="text-gray-700 mb-6">{t('aboutGovSchemes')}</p>
            <div className="space-y-6">
                {schemes.map((scheme, index) => (
                    <div key={index} className="bg-emerald-50 p-6 rounded-lg shadow-inner border border-emerald-200">
                        <h3 className="text-2xl font-semibold text-emerald-600 mb-2">{scheme.name}</h3>
                        <TranslatableText text={scheme.description} className="text-gray-700 mb-4" />
                        <TranslatableText text={scheme.guidelines} as="p" className="text-gray-600 mb-4">
                            <strong className="font-semibold">Guidelines:</strong> {scheme.guidelines}
                        </TranslatableText>
                        <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <ExternalLink size={18} />
                            <span>{t('viewDetails')}</span>
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}


// Settings Page Component
function SettingsPage({ handleLogout }) {
    const { userId, targetLanguage, handleTargetLanguageChange, t } = useContext(AppContext);
    const [localLanguage, setLocalLanguage] = useState(targetLanguage);
    const [saveMessage, setSaveMessage] = useState('');

    const handleSave = () => {
        handleTargetLanguageChange(localLanguage);
        setSaveMessage("Target language updated!");
        setTimeout(() => setSaveMessage(''), 3000);
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-emerald-200">
            <h2 className="text-3xl font-bold text-emerald-700 mb-6 flex items-center space-x-2">
                <Settings size={28} />
                <span>{t('settings')}</span>
            </h2>

            <div className="mb-6">
                <label htmlFor="language-input" className="block text-lg font-semibold text-emerald-600 mb-2">{t('changeLanguage')}:</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                        id="language-input" 
                        type="text"
                        value={localLanguage} 
                        onChange={(e) => setLocalLanguage(e.target.value)} 
                        placeholder={t('selectLanguage')}
                        className="block w-full md:w-1/2 p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button 
                        onClick={handleSave}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                    >
                        Save Language
                    </button>
                </div>
                 {saveMessage && <p className="text-green-600 mt-2">{saveMessage}</p>}
                <p className="text-sm text-gray-500 mt-2">Set the language you want text to be translated into.</p>
            </div>

            <div className="mb-6">
                <p className="text-lg font-semibold text-emerald-600 mb-2">{t('userId')}</p>
                <p className="text-gray-700 break-words bg-gray-50 p-3 rounded-md border">{userId}</p>
            </div>
            
            <button onClick={handleLogout} className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center space-x-2">
                <LogOut size={20} />
                <span>{t('logout')}</span>
            </button>
        </div>
    );
}

// AI Farm Advisor Component — NVIDIA NIM Nemotron + 4 Agents + Voice Input + Photo
function AIFarmAdvisor() {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [voiceSupported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    const [agentOutputs, setAgentOutputs] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [uploadedImageBase64, setUploadedImageBase64] = useState(null);
    const recognitionRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setUploadedImage(ev.target.result);
            setUploadedImageBase64(ev.target.result.split(',')[1]);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setUploadedImage(null);
        setUploadedImageBase64(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const startVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event) => {
            setQuery(event.results[0][0].transcript);
        };
        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopVoiceInput = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
    };

    const handleAdvisorQuery = async () => {
        if (!query.trim() && !uploadedImageBase64) { setError(new Error("Please enter a question, speak it, or upload a crop photo.")); return; }
        setLoading(true);
        setResponse('');
        setError(null);
        setAgentOutputs(null);

        try {
            const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const delay = (ms) => new Promise(r => setTimeout(r, ms));
            const advisorQuestion = query.trim() || 'Please inspect this crop photo and give practical farming advice.';

            const geminiCall = async (parts) => {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ role: "user", parts }] })
                });
                const data = await res.json();
                if (!res.ok || data.error?.code === 429) {
                    throw new Error(data.error?.code === 429 ? 'rate_limit' : 'gemini_unavailable');
                }
                return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            };

            // Agent 1: Disease — supports image (separate call only if image uploaded)
            let diseaseInfo = '';
            let cropName = inferCropFromText(advisorQuestion);
            try {
                const parts = uploadedImageBase64
                    ? [
                        { inline_data: { mime_type: 'image/jpeg', data: uploadedImageBase64 } },
                        { text: `This farmer uploaded a crop photo and asks: "${advisorQuestion}". Identify any visible disease, pest, nutrient, or water-stress issue. Give a 2-sentence practical assessment with severity.` }
                      ]
                    : null;
                if (parts) {
                    diseaseInfo = await geminiCall(parts) || 'No disease concern identified.';
                    await delay(2000);
                }
            } catch (error) {
                console.warn('Disease photo analysis fallback:', error);
                diseaseInfo = getFallbackDiseaseInfo({ query: advisorQuestion, cropName, hasImage: Boolean(uploadedImageBase64) });
            }

            // Agent 2: Weather (no Gemini needed — runs in parallel)
            let weatherInfo = '';
            const weatherKey = import.meta.env.VITE_WEATHER_API_KEY;
            const locationMatch = advisorQuestion.match(/in\s+([A-Za-z\s]+)/i);
            const location = locationMatch ? locationMatch[1].trim() : 'Karnataka';

            // SINGLE Gemini call — handles Disease (text), Crop extraction, AND Schemes together
            let schemesInfo = '';
            try {
                const combinedPrompt = `A farmer asks: "${advisorQuestion}"

Answer these 3 questions in this EXACT format with these EXACT labels:

DISEASE: [2-sentence crop disease/health assessment based on the query. If no disease mentioned, say "No disease concern identified."]

CROP: [Single crop/vegetable/fruit name from the query with first letter capitalized, e.g. Tomato, Wheat, Onion. If no crop mentioned, say "Unknown".]

SCHEMES: [List relevant govt schemes from: PM-KISAN (₹6000/yr), PMFBY (crop insurance), KCC (credit), PM-KUSUM (solar pump), e-NAM (online mandi). One line each. If none relevant, say "No specific scheme applies."]`;

                const combined = await geminiCall([{ text: combinedPrompt }]);

                // Parse the response
                const diseaseMatch = combined.match(/DISEASE:\s*(.+?)(?=\nCROP:|$)/s);
                const cropMatch = combined.match(/CROP:\s*(.+?)(?=\nSCHEMES:|$)/s);
                const schemesMatch = combined.match(/SCHEMES:\s*(.+?)$/s);

                if (!uploadedImageBase64) {
                    diseaseInfo = diseaseMatch?.[1]?.trim() || getFallbackDiseaseInfo({ query: advisorQuestion, cropName, hasImage: false });
                }
                cropName = normalizeCropName(cropMatch?.[1]?.trim().split('\n')[0]) || cropName;
                schemesInfo = schemesMatch?.[1]?.trim() || getFallbackSchemesInfo({ query: advisorQuestion });

            } catch (error) {
                console.warn('Combined Gemini agent fallback:', error);
                cropName = cropName || inferCropFromText(advisorQuestion);
                if (!uploadedImageBase64) {
                    diseaseInfo = getFallbackDiseaseInfo({ query: advisorQuestion, cropName, hasImage: false });
                }
                schemesInfo = getFallbackSchemesInfo({ query: advisorQuestion });
            }

            // Agent 2: Weather fetch (no Gemini)
            try {
                const wRes = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${weatherKey}&q=${location}&days=3&aqi=no&alerts=no`);
                if (wRes.ok) {
                    const wData = await wRes.json();
                    weatherInfo = `${wData.current.temp_c}°C, ${wData.current.condition.text}. Next 3 days: ${wData.forecast.forecastday.map(d => `${d.date}: ${d.day.condition.text}, ${d.day.avgtemp_c}°C`).join('; ')}`;
                } else { weatherInfo = 'Weather data unavailable.'; }
            } catch (e) { weatherInfo = 'Weather agent unavailable.'; }

            await delay(2000);

            // Agent 3: Market — use crop name from combined call, fetch AGMARKNET
            let marketInfo = '';
            try {
                const normalizedCrop = normalizeCropName(cropName);
                if (normalizedCrop) {
                    const marketResult = await fetchAgmarknetPrices({ cropName: normalizedCrop, region: location, limit: 5 });
                    marketInfo = formatMandiRecords(marketResult.records, normalizedCrop);
                }
                if (!marketInfo) {
                    const cropLabel = normalizeCropName(cropName) || 'this crop';
                    marketInfo = `Live mandi data was not available for ${cropLabel}. Compare the nearest mandi price before selling and avoid distress sale if crop quality is still good.`;
                }
            } catch (error) {
                console.warn('Market agent fallback:', error);
                marketInfo = 'Market lookup is temporarily unavailable. Use nearest mandi price, crop quality, and weather risk before deciding to sell.';
            }

            setAgentOutputs({ diseaseInfo, weatherInfo, marketInfo, schemesInfo });

            // Agent 5: NVIDIA NIM Nemotron — Synthesis
            const imageContext = uploadedImageBase64 ? ' (Farmer also uploaded a crop photo for disease analysis.)' : '';
            try {
                const nimRes = await fetch('/api/nim-proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [{
                            role: 'user',
                            content: `You are AgriGuard AI Farm Advisor powered by NVIDIA Nemotron. A farmer asked: "${advisorQuestion}"${imageContext}\n\nInputs from 4 agents:\nDISEASE AGENT: ${diseaseInfo}\nWEATHER AGENT: ${weatherInfo}\nMARKET AGENT: ${marketInfo}\nSCHEMES AGENT: ${schemesInfo}\n\nSynthesize into ONE clear response:\n1. Direct answer\n2. Key recommendation (what to do right now)\n3. Best opportunity or warning\n\nDo not mention internal API failures. If live data is unavailable, say what the farmer should check next. Under 150 words. Simple, practical farming advisor tone.`
                        }]
                    })
                });

                if (!nimRes.ok) throw new Error(`NIM API error: ${await nimRes.text()}`);
                const nimData = await nimRes.json();
                const finalAnswer = nimData._extracted
                    || nimData.choices?.[0]?.message?.content
                    || nimData.choices?.[0]?.message?.reasoning_content
                    || '';
                setResponse(finalAnswer || buildLocalAdvisorSummary({ diseaseInfo, weatherInfo, marketInfo, schemesInfo }));
            } catch (error) {
                console.warn('NIM synthesis fallback:', error);
                setResponse(buildLocalAdvisorSummary({ diseaseInfo, weatherInfo, marketInfo, schemesInfo }));
            }

        } catch (err) {
            console.error("Advisor error:", err);
            setError(new Error("Advisor could not complete the analysis. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    const agentCards = [
        { label: 'Disease Agent', key: 'diseaseInfo', classes: 'bg-red-50 border-red-200', labelClass: 'text-red-700' },
        { label: 'Weather Agent', key: 'weatherInfo', classes: 'bg-sky-50 border-sky-200', labelClass: 'text-sky-700' },
        { label: 'Market Agent', key: 'marketInfo', classes: 'bg-amber-50 border-amber-200', labelClass: 'text-amber-700' },
        { label: 'Schemes Agent', key: 'schemesInfo', classes: 'bg-emerald-50 border-emerald-200', labelClass: 'text-emerald-700' },
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-emerald-200">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                <div className="flex items-center space-x-3">
                <div className="bg-emerald-700 p-2 rounded-lg">
                    <Brain size={24} color="white" />
                </div>
                <div>
                        <h2 className="text-2xl font-bold text-emerald-800">AgriGuard Pro Advisor</h2>
                        <p className="text-xs text-emerald-600">NVIDIA NIM synthesis with disease, weather, market, and scheme agents</p>
                    </div>
                </div>
                <div className="self-start rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    Demo-ready multi-agent mode
                </div>
            </div>

            <div className="flex flex-col space-y-3 mb-6">
                <div className="relative">
                    <textarea
                        className="w-full p-3 pr-14 border border-emerald-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        rows="3"
                        placeholder="e.g. My tomato leaves are turning yellow in Bangalore, should I sell now or wait?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {voiceSupported && (
                        <button
                            onClick={isListening ? stopVoiceInput : startVoiceInput}
                            className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
                            title={isListening ? 'Stop' : 'Speak'}
                        >
                            <Mic size={18} />
                        </button>
                    )}
                </div>
                {isListening && <p className="text-red-500 text-sm text-center animate-pulse">Listening... speak now</p>}

                {/* Photo Upload */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center space-x-2 px-4 py-2 border-2 border-dashed border-emerald-300 rounded-lg text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-sm"
                    >
                        <Camera size={18} />
                        <span>{uploadedImage ? 'Change Photo' : 'Upload Crop Photo (optional)'}</span>
                    </button>
                    {uploadedImage && (
                        <div className="relative">
                            <img src={uploadedImage} alt="Crop" className="h-16 w-16 object-cover rounded-lg border-2 border-purple-300" />
                            <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                                <XCircle size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleAdvisorQuery}
                    disabled={loading}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-6 rounded-lg shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                    {loading ? (
                        <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Analyzing crop, weather, market, and schemes...</span></>
                    ) : (
                        <span>Ask AgriGuard Pro</span>
                    )}
                </button>
            </div>

            {error && <p className="text-center text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg p-3">{error.message}</p>}

            {agentOutputs && (
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {agentCards.map(({ label, key, classes, labelClass }) => (
                        <div key={label} className={`${classes} border p-3 rounded-lg`}>
                            <p className={`text-xs font-bold ${labelClass} mb-1`}>{label} Ready</p>
                            <p className="text-xs text-gray-600 line-clamp-3">{agentOutputs[key]}</p>
                        </div>
                    ))}
                </div>
            )}

            {response && (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <p className="text-sm font-bold text-emerald-800">NVIDIA NIM Farm Recommendation</p>
                    </div>
                    <TranslatableText text={response} className="text-gray-800 leading-relaxed" />
                </div>
            )}
        </div>
    );
}

export default App;
