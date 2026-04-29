"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  MicOff, 
  BarChart3,
  MessageSquare,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Menu,
  X,
  PanelRightClose,
  PanelRightOpen,
  Phone,
  Trophy,
  TrendingUp,
  User,
  LayoutDashboard,
  Activity,
  Star,
  Clock,
  ArrowRight
} from "lucide-react";

// Import your existing components
import { AvatarConfig } from "@/components/AvatarConfig";
import { AvatarVideo } from "@/components/AvatarSession/AvatarVideo";
import { AvatarControls } from "@/components/AvatarSession/AvatarControls";
import { MessageHistory } from "@/components/AvatarSession/MessageHistory";
import { ConversationScenarios } from "@/components/ConversationScenarios";
import { PerformanceAnalytics } from "@/components/PerformanceAnalytics";
import { Achievements } from "@/components/Achievements";
import { UserProfileComponent, type UserProfile } from "@/components/UserProfile";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StreamingAvatarProvider, useStreamingAvatarContext, StreamingAvatarSessionState } from "@/components/logic/context";
import { useStreamingAvatarSession } from "@/components/logic/useStreamingAvatarSession";
import { StartAvatarRequest, AvatarQuality, VoiceChatTransport } from "@/components/logic/types";
import { CONVERSATION_SCENARIOS, generatePersonalizedScenarios } from "@/app/lib/constants";

const MENTOR_PRESETS = [
  { name: "Ann Therapist", avatarName: "Ann_Therapist_public", role: "Supportive mentor" },
  { name: "Shawn Therapist", avatarName: "Shawn_Therapist_public", role: "Confidence coach" },
  { name: "Emma Interviewer", avatarName: "Emma_public", role: "Interview trainer" },
  { name: "Dexter Doctor", avatarName: "Dexter_Doctor_Standing2_public", role: "Professional advisor" },
];

// Main App Component
function FluentFlowApp() {
  const [showConfig, setShowConfig] = useState(false);
  const [showMessages, setShowMessages] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showUserVideo, setShowUserVideo] = useState(false);
  const [currentMode, setCurrentMode] = useState<'dashboard' | 'gemini-chat' | 'avatar-chat'>('dashboard');
  const [showSidebar, setShowSidebar] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);

  // Theme management
  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('fluentflow-theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('fluentflow-theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const getThemeIcon = () => {
    return theme === 'dark' ? '🌙' : '☀️';
  };

  const getThemeLabel = () => {
    return theme === 'dark' ? 'Dark' : 'Light';
  };

  // Load user profile from backend API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUserProfile(data.user);
            localStorage.setItem('fluentflow-user-profile', JSON.stringify(data.user));
            
            // If onboarding is not complete, show the profile modal automatically
            if (!data.user.onboardingComplete) {
              setShowUserProfile(true);
            }
          }
        } else {
          // Fallback to local storage if API fails
          const savedProfile = localStorage.getItem('fluentflow-user-profile');
          if (savedProfile) {
            setUserProfile(JSON.parse(savedProfile));
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    
    fetchProfile();
  }, []);

  const handleProfileSave = async (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('fluentflow-user-profile', JSON.stringify(profile));
    
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
    } catch (error) {
      console.error('Error saving profile to database:', error);
    }
  };
  
  
  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [isRealTimeMode, setIsRealTimeMode] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [talkMode, setTalkMode] = useState("voice");
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [asyncMode, setAsyncMode] = useState("realtime");
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isSessionStarting, setIsSessionStarting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [latestAvatarSpeech, setLatestAvatarSpeech] = useState<string>("");
  const [messages, setMessages] = useState<Array<{id: string, type: 'user'|'ai', text: string, timestamp: Date}>>([]);
  const recognitionRef = useRef<any>(null);
  
  // Default avatar configuration
  const [avatarConfig, setAvatarConfig] = useState<StartAvatarRequest>({
    avatarName: "Ann_Therapist_public",
    language: "en",
    quality: AvatarQuality.High,
    voiceChatTransport: VoiceChatTransport.WEBSOCKET,
  });
  const selectedMentor =
    MENTOR_PRESETS.find((mentor) => mentor.avatarName === avatarConfig.avatarName) ?? MENTOR_PRESETS[0];

  // Keep avatar mode manual-start only for better user control
  useEffect(() => {
    if (currentMode === 'gemini-chat') {
      setIsVoiceChatActive(false);
      setIsMuted(false);
    }
  }, [currentMode]);

  // Generate initial greeting for avatar based on profile and scenario
  const generateInitialGreeting = useCallback(() => {
    if (!userProfile || !selectedScenario) return null;

    let greeting = "";

    if (userProfile.name) {
      greeting += `Hello ${userProfile.name}! `;
    }

    greeting += `Welcome to our ${selectedScenario.name.toLowerCase()}. `;

    if (userProfile.nativeLanguage && userProfile.nativeLanguage !== 'English') {
      greeting += `I see you're a ${userProfile.nativeLanguage} speaker. `;
    }

    if (selectedScenario.category === 'Personal') {
      greeting += `I'm here to help you practice ${selectedScenario.learningGoals?.[0] || 'communication skills'}. `;
    } else if (selectedScenario.category === 'Professional') {
      greeting += `Let's work on your ${selectedScenario.learningGoals?.[0] || 'professional communication'}. `;
    } else if (selectedScenario.category === 'Health') {
      greeting += `I'm here to assist you with ${selectedScenario.learningGoals?.[0] || 'health-related communication'}. `;
    }

    greeting += `I'm ${userProfile.communicationStyle?.toLowerCase() || 'friendly'} and ready to help you improve. How can I assist you today?`;

    return greeting;
  }, [userProfile, selectedScenario]);

  // Send initial greeting when avatar session starts with a scenario
  useEffect(() => {
    if (selectedScenario && userProfile && currentMode === 'avatar-chat') {
      const greeting = generateInitialGreeting();
      if (greeting) {
        // Small delay to ensure avatar is ready
        const timer = setTimeout(() => {
          // This would normally send to the avatar API
          console.log('Avatar would speak:', greeting);
          // In a real implementation, you'd send this to the avatar service
        }, 2000);

        return () => clearTimeout(timer);
      }
    }
  }, [selectedScenario, userProfile, currentMode, generateInitialGreeting]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          const fullText = finalTranscript || interimTranscript;
          setVoiceText(fullText);

          // Auto-send based on async mode setting
          if (asyncMode === "realtime" && finalTranscript) {
            handleVoiceSend(finalTranscript);
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
      }
    }
  }, [asyncMode]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setVoiceText("");
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const handleVoiceSend = useCallback(async (text: string) => {
    if (text.trim()) {
      console.log('Sending text to Gemini:', text);
      setVoiceText("");
      
      // Update local messages for UI
      const userMessage = { id: Date.now().toString(), type: 'user' as const, text, timestamp: new Date() };
      setMessages(prev => [...prev, userMessage]);

      try {
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            userProfile,
            scenario: selectedScenario || null
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        
        // Add AI response to local messages
        const aiMessage = { id: (Date.now() + 1).toString(), type: 'ai' as const, text: data.reply, timestamp: new Date() };
        setMessages(prev => [...prev, aiMessage]);

        // Store the reply so AvatarChatMode can pick it up and speak it
        setLatestAvatarSpeech(data.reply);
      } catch (error) {
        console.error("Error getting AI response:", error);
      }
    }
  }, [userProfile, selectedScenario]);

  const handleScenarioSelect = useCallback((scenario: any) => {
    setSelectedScenario(scenario);
    // Auto-select the appropriate avatar for the scenario
    if (scenario.avatar) {
      setAvatarConfig(prev => ({ ...prev, avatarName: scenario.avatar }));
    }
    setShowScenarios(false);
    // Switch to avatar chat mode and auto-start session
    if (currentMode !== 'avatar-chat') {
      setCurrentMode('avatar-chat');
    }
    // Do not auto-start call; user must click Start Session manually
    setIsVoiceChatActive(false);
  }, [currentMode]);

  // Setup user video stream
  useEffect(() => {
    if (showUserVideo && userVideoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
          }
        })
        .catch(error => {
          console.error('Error accessing user video:', error);
        });
    }
  }, [showUserVideo]);

  return (
    <ErrorBoundary>
      <StreamingAvatarProvider>
        {/* Ambient mesh background */}
        <div className="animated-mesh" />
        <div className="h-screen w-full flex flex-col overflow-hidden" style={{background:'var(--color-bg)',color:'var(--color-text)'}}>

          {/* ── TOP NAV ── */}
          <motion.header
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative z-50 flex items-center justify-between px-5 py-3 border-b"
            style={{background:'var(--topbar-bg)',backdropFilter:'blur(24px)',borderColor:'var(--color-border)'}}
          >
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{background:'linear-gradient(135deg,#a855f7,#6366f1)'}}>
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text leading-none">FluentFlow</h1>
                <p className="text-xs theme-text-subtle">
                  {userProfile?.name ? `Welcome back, ${userProfile.name}` : 'AI Communication Coach'}
                </p>
              </div>
            </div>

            {/* Nav Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                onClick={cycleTheme}
                className="btn-ghost !p-2"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                <span className="text-lg leading-none">{getThemeIcon()}</span>
              </motion.button>

              {/* Profile */}
              <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                onClick={() => setShowUserProfile(true)}
                className="btn-ghost flex items-center gap-2 px-3 py-2 text-sm"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{background:'linear-gradient(135deg,#a855f7,#6366f1)'}}>
                  {userProfile?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                </div>
                <span className="hidden sm:block">{userProfile?.name || 'Profile'}</span>
              </motion.button>

              {/* Analytics */}
              <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                onClick={() => setShowAnalytics(true)}
                className="btn-ghost !p-2"
                title="Analytics"
              >
                <TrendingUp className="w-4 h-4" />
              </motion.button>

              {/* Achievements */}
              <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                onClick={() => setShowAchievements(true)}
                className="btn-ghost !p-2"
                title="Achievements"
              >
                <Trophy className="w-4 h-4" />
              </motion.button>

              {/* Mute */}
              <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                onClick={() => setIsMuted(!isMuted)}
                className={`btn-ghost !p-2 ${isMuted ? 'text-red-400 border-red-500/30' : ''}`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </motion.button>

              {/* Sidebar toggle */}
              <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                onClick={() => setShowSidebar(!showSidebar)}
                className={`btn-ghost !p-2 ${showSidebar ? 'text-violet-400 border-violet-500/30' : ''}`}
                title="Toggle sidebar"
              >
                <Menu className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.header>

          {/* ── BODY: SIDEBAR + CONTENT ── */}
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* SIDEBAR */}
            <AnimatePresence>
              {showSidebar && (
                <motion.aside
                  initial={{ x: -280, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -280, opacity: 0 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                  className="w-64 flex-shrink-0 flex flex-col border-r custom-scrollbar overflow-y-auto fixed lg:relative h-[calc(100vh-57px)] z-40"
                  style={{background:'var(--color-surface)',borderColor:'rgba(255,255,255,0.06)'}}
                >
                  {/* Mobile close */}
                  <button onClick={() => setShowSidebar(false)}
                    className="lg:hidden absolute top-3 right-3 btn-ghost !p-1.5"
                  ><X className="w-4 h-4" /></button>

                  {/* SECTION: Modes */}
                  <div className="p-4">
                    <p className="section-label mb-3">Mode</p>
                    <div className="space-y-1.5">
                      <button onClick={() => setCurrentMode('dashboard')}
                        className={`nav-item w-full ${currentMode === 'dashboard' ? 'active' : ''}`}
                      >
                        <LayoutDashboard className="nav-icon w-4 h-4" />
                        <div className="text-left">
                          <div className="font-semibold text-sm">Dashboard</div>
                          <div className="text-xs" style={{color:'var(--color-text-subtle)'}}>Overview & Stats</div>
                        </div>
                      </button>

                      <button onClick={() => setCurrentMode('gemini-chat')}
                        className={`nav-item w-full ${currentMode === 'gemini-chat' ? 'active' : ''}`}
                      >
                        <MessageSquare className="nav-icon w-4 h-4" />
                        <div className="text-left">
                          <div className="font-semibold text-sm">AI Chat</div>
                          <div className="text-xs" style={{color:'var(--color-text-subtle)'}}>Text conversation</div>
                        </div>
                      </button>

                      <button onClick={() => { setCurrentMode('avatar-chat'); setIsVoiceChatActive(false); }}
                        className={`nav-item w-full ${currentMode === 'avatar-chat' ? 'active' : ''}`}
                      >
                        <Video className="nav-icon w-4 h-4" />
                        <div className="text-left flex-1">
                          <div className="font-semibold text-sm">Live Avatar</div>
                          <div className="text-xs" style={{color:'var(--color-text-subtle)'}}>Real-time video</div>
                        </div>
                        {isVoiceChatActive && currentMode === 'avatar-chat' && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="divider" />

                  {/* SECTION: Scenarios */}
                  <div className="p-4">
                    <p className="section-label mb-3">Scenarios</p>
                    <button onClick={() => setShowScenarios(!showScenarios)}
                      className={`nav-item w-full ${showScenarios ? 'active' : ''}`}
                    >
                      <span className="text-base">🎭</span>
                      <div className="text-left">
                        <div className="font-semibold text-sm">Practice Scenarios</div>
                        <div className="text-xs truncate max-w-[120px]" style={{color:'var(--color-text-subtle)'}}>
                          {selectedScenario ? selectedScenario.name : 'Choose a scenario'}
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {showScenarios && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-2"
                        >
                          <div className="max-h-60 overflow-y-auto custom-scrollbar rounded-xl" style={{background:'var(--color-surface-2)'}}>
                            <ConversationScenarios
                              onScenarioSelect={handleScenarioSelect}
                              currentScenario={selectedScenario}
                              userProfile={userProfile}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* SECTION: Avatar Settings (only in avatar mode) */}
                  {currentMode === 'avatar-chat' && (
                    <>
                      <div className="divider" />
                      <div className="p-4 flex-1">
                        <p className="section-label mb-3">Avatar Settings</p>
                        <div className="space-y-4">
                          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                            <p className="text-xs theme-text-subtle">Live Call Preview</p>
                            <p className="text-sm font-semibold theme-text-primary">Mentor: {selectedMentor.name}</p>
                            <p className="text-xs theme-text-muted">{selectedMentor.role}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-2 block" style={{color:'var(--color-text-muted)'}}>Select mentor</label>
                            <div className="space-y-2">
                              {MENTOR_PRESETS.map((mentor) => {
                                const active = mentor.avatarName === avatarConfig.avatarName;
                                return (
                                  <button
                                    key={mentor.avatarName}
                                    onClick={() => setAvatarConfig({ ...avatarConfig, avatarName: mentor.avatarName })}
                                    className={`w-full rounded-xl border px-3 py-2 text-left transition-all ${
                                      active
                                        ? "border-violet-400/50 bg-violet-500/15"
                                        : "border-white/10 bg-white/5 hover:bg-white/10"
                                    }`}
                                  >
                                    <div className="text-sm font-semibold theme-text-primary">{mentor.name}</div>
                                    <div className="text-xs theme-text-muted">{mentor.role}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1.5 block" style={{color:'var(--color-text-muted)'}}>Language</label>
                            <select
                              value={avatarConfig.language}
                              onChange={(e) => setAvatarConfig({...avatarConfig, language: e.target.value})}
                              className="input-dark"
                            >
                              <option value="en">🇺🇸 English</option>
                              <option value="es">🇪🇸 Spanish</option>
                              <option value="fr">🇫🇷 French</option>
                              <option value="de">🇩🇪 German</option>
                              <option value="zh">🇨🇳 Chinese</option>
                              <option value="ja">🇯🇵 Japanese</option>
                              <option value="hi">🇮🇳 Hindi</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1.5 block" style={{color:'var(--color-text-muted)'}}>Quality</label>
                            <select
                              value={avatarConfig.quality}
                              onChange={(e) => setAvatarConfig({...avatarConfig, quality: e.target.value as any})}
                              className="input-dark"
                            >
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </div>
                          <button
                            onClick={() => {
                              setIsVoiceChatActive(false);
                            }}
                            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold py-2.5 hover:opacity-90 transition-opacity"
                          >
                            Select {selectedMentor.name}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Session Control */}
                  {currentMode === 'avatar-chat' && (
                    <div className="p-4 border-t sticky bottom-0 z-10" style={{borderColor:'var(--color-border)', background:'var(--color-surface)'}}>
                      <AvatarSessionManager
                        avatarConfig={avatarConfig}
                        selectedMentorName={selectedMentor.name}
                        setIsVoiceChatActive={setIsVoiceChatActive}
                        setIsMuted={setIsMuted}
                        setIsSessionStarting={setIsSessionStarting}
                      />
                    </div>
                  )}
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Mobile overlay */}
            <AnimatePresence>
              {showSidebar && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                  onClick={() => setShowSidebar(false)}
                />
              )}
            </AnimatePresence>


            {/* MAIN CONTENT */}
            <motion.div
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {currentMode === 'dashboard' ? (
                <DashboardMode userProfile={userProfile} setCurrentMode={setCurrentMode} setShowScenarios={setShowScenarios} />
              ) : currentMode === 'gemini-chat' ? (
                <GeminiChatMode userProfile={userProfile} selectedScenario={selectedScenario} />
              ) : (
                <AvatarChatMode
                  videoRef={videoRef}
                  userVideoRef={userVideoRef}
                  showMessages={showMessages}
                  setShowMessages={setShowMessages}
                  isListening={isListening}
                  isRealTimeMode={isRealTimeMode}
                  setIsRealTimeMode={setIsRealTimeMode}
                  voiceText={voiceText}
                  setVoiceText={setVoiceText}
                  startListening={startListening}
                  stopListening={stopListening}
                  handleVoiceSend={handleVoiceSend}
                  talkMode={talkMode}
                  setTalkMode={setTalkMode}
                  asyncMode={asyncMode}
                  setAsyncMode={setAsyncMode}
                  showUserVideo={showUserVideo}
                  setShowUserVideo={setShowUserVideo}
                  isMuted={isMuted}
                  setIsMuted={setIsMuted}
                  isVoiceChatActive={isVoiceChatActive}
                  setIsVoiceChatActive={setIsVoiceChatActive}
                  setCurrentMode={setCurrentMode}
                  showSidebar={showSidebar}
                  setShowSidebar={setShowSidebar}
                  avatarConfig={avatarConfig}
                  selectedMentorName={selectedMentor.name}
                  isSessionStarting={isSessionStarting}
                  userProfile={userProfile}
                  selectedScenario={selectedScenario}
                  generateInitialGreeting={generateInitialGreeting}
                  latestAvatarSpeech={latestAvatarSpeech}
                />
              )}
            </motion.div>

          </div>{/* end body */}
        </div>{/* end h-screen */}

      {/* Performance Analytics Modal */}
      <PerformanceAnalytics
        isVisible={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        currentSession={sessionData}
      />

      {/* Achievements Modal */}
      <Achievements
        isVisible={showAchievements}
        onClose={() => setShowAchievements(false)}
        stats={{
          totalConversations: 0, // These would be tracked in a real app
          totalDuration: 0,
          scenariosCompleted: 0,
          confidenceScore: 0
        }}
      />

      {/* User Profile Modal */}
      <UserProfileComponent
        isVisible={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        onSave={handleProfileSave}
        currentProfile={userProfile}
      />
      </StreamingAvatarProvider>
    </ErrorBoundary>
  );
}

// Connection Status Component
function ConnectionStatus() {
  const { sessionState, connectionQuality } = useStreamingAvatarContext();
  
  const getStatusColor = () => {
    switch (sessionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (sessionState) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="absolute top-4 left-4 flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
      <span className="text-sm text-gray-900 dark:text-white bg-white/80 dark:bg-black/50 px-2 py-1 rounded">
        {getStatusText()}
      </span>
      {connectionQuality !== 'UNKNOWN' && (
        <span className="text-xs text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-black/50 px-2 py-1 rounded">
          {connectionQuality}
        </span>
      )}
    </div>
  );
}

// Avatar Status Overlay Component
function AvatarStatusOverlay() {
  const { isUserTalking, isAvatarTalking, isListening } = useStreamingAvatarContext();

  return (
    <div className="absolute top-4 right-4 flex flex-col space-y-2">
      {isListening && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span>Listening</span>
        </motion.div>
      )}
      
      {isUserTalking && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span>You're speaking</span>
        </motion.div>
      )}
      
      {isAvatarTalking && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-purple-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span>Avatar speaking</span>
        </motion.div>
      )}
    </div>
  );
}

// Avatar Welcome Message Component
function AvatarWelcomeMessage({ userProfile, selectedScenario, generateInitialGreeting, isVoiceChatActive, onStartSession }: {
  userProfile: any,
  selectedScenario: any,
  generateInitialGreeting: () => string | null,
  isVoiceChatActive: boolean,
  onStartSession: () => void
}) {
  const { sessionState } = useStreamingAvatarContext();

  if (sessionState === 'connected') return null;

  const initialGreeting = generateInitialGreeting();

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 dark:bg-black/50 backdrop-blur-sm">
      <div className="text-center p-8 max-w-2xl">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          {sessionState === 'connecting' ? (
            <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Video className="w-10 h-10 text-white" />
          )}
        </motion.div>

        <motion.h3
          className="text-2xl font-bold text-white mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {sessionState === 'connecting' ? 'Connecting avatar...' : 'Session not started'}
        </motion.h3>

        <motion.p
          className="text-gray-300 mb-4 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {sessionState === 'connecting'
            ? 'Setting up your personalized AI communication coach...'
            : 'Choose your mentor and click Start Session to begin your live call.'
          }
        </motion.p>

        {sessionState !== 'connecting' && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onStartSession}
            className="mb-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold"
          >
            <Play className="w-4 h-4" />
            Start Session
          </motion.button>
        )}

        {selectedScenario && userProfile && (
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h4 className="text-lg font-semibold text-white mb-2">
              🎭 {selectedScenario.name}
            </h4>
            <p className="text-sm text-gray-200 mb-3">
              {selectedScenario.description}
            </p>
            {initialGreeting && (
              <div className="text-left bg-white/10 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-gray-300 mb-1">AI will start by saying:</p>
                <p className="text-sm text-white italic">"{initialGreeting}"</p>
              </div>
            )}
          </motion.div>
        )}

        {sessionState === 'connecting' && (
          <motion.div
            className="flex justify-center space-x-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </motion.div>
        )}

        <motion.div
          className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isVoiceChatActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span>Mic {isVoiceChatActive ? 'Active' : 'Inactive'}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Gemini Chat Mode Component
function GeminiChatMode({ userProfile, selectedScenario }: { userProfile: any, selectedScenario: any }) {
  const [messages, setMessages] = useState<Array<{id: string, type: 'user' | 'ai', text: string, timestamp: Date}>>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      text: inputText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      // Use Gemini for free NLP chat
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          userProfile: userProfile,
          scenario: selectedScenario || null
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        text: data.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Error:', err);
      // Add error message to chat with specific error details
      let errorText = "Sorry, I'm having trouble connecting right now. ";
      if (err.message?.includes('quota')) {
        errorText += "It seems we've reached the API limit. Please try again later or upgrade your plan.";
      } else if (err.message?.includes('key')) {
        errorText += "There might be an issue with the API configuration. Please check your settings.";
      } else {
        errorText += "Please try again in a moment.";
      }

      const errorMessage = {
        id: (Date.now() + 2).toString(),
        type: 'ai' as const,
        text: errorText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{background:'var(--color-bg)'}}>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center h-full text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 relative"
              style={{background:'linear-gradient(135deg,#a855f7,#6366f1)'}}
              animate={{ rotate: [0, 4, -4, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="absolute inset-0 rounded-3xl blur-2xl opacity-50" style={{background:'linear-gradient(135deg,#a855f7,#6366f1)'}} />
              <MessageSquare className="w-9 h-9 text-white relative z-10" />
            </motion.div>
            <h2 className="text-3xl font-bold gradient-text mb-3">
              {userProfile?.name ? `Hey, ${userProfile.name}!` : 'Start Practicing'}
            </h2>
            <p className="text-base max-w-md mb-8" style={{color:'var(--color-text-muted)'}}>
              {userProfile?.name
                ? `Your personalized AI coach is ready. Let's practice your communication skills!`
                : 'Chat with your AI English coach. Get corrections, tips and real-time feedback.'}
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
              {['Tell me about yourself', 'Correct my English', 'Practice job interview', 'Help me speak fluently'].map(prompt => (
                <button key={prompt}
                  onClick={() => { setInputText(prompt); }}
                  className="btn-ghost text-left text-sm p-3 rounded-xl"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3`}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {message.type === 'ai' && (
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{background:'linear-gradient(135deg,#a855f7,#6366f1)'}}>
                AI
              </div>
            )}
            <div className={`max-w-[75%] px-5 py-3.5 ${
              message.type === 'user' ? 'bubble-user' : 'bubble-ai'
            }`}>
              <p className="leading-relaxed">{message.text}</p>
              <p className="text-xs mt-2 opacity-50">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {message.type === 'user' && (
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{background:'rgba(168,85,247,0.2)',border:'1px solid rgba(168,85,247,0.3)',color:'#c084fc'}}>
                {userProfile?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </motion.div>
        ))}

        {loading && (
          <motion.div className="flex justify-start items-end gap-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{background:'linear-gradient(135deg,#a855f7,#6366f1)'}}>AI</div>
            <div className="bubble-ai px-5 py-4">
              <div className="flex items-center gap-1.5">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.div key={i} className="w-2 h-2 rounded-full"
                    style={{background:'#a855f7'}}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t" style={{background:'var(--color-surface)',borderColor:'rgba(255,255,255,0.06)'}}>
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder={userProfile?.name ? `Message your coach, ${userProfile.name}...` : 'Type your message...'}
            className="input-dark flex-1"
            disabled={loading}
          />
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleSendMessage}
            disabled={loading || !inputText.trim()}
            className="btn-brand px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : 'Send'}
          </motion.button>
        </div>
        <p className="text-center text-xs mt-2" style={{color:'var(--color-text-subtle)'}}>
          Press Enter to send • Powered by Google Gemini
        </p>
      </div>
    </div>
  );
}

// Avatar Chat Mode Component
function AvatarChatMode({
  videoRef,
  userVideoRef,
  showMessages,
  setShowMessages,
  isListening,
  isRealTimeMode,
  setIsRealTimeMode,
  voiceText,
  setVoiceText,
  startListening,
  stopListening,
  handleVoiceSend,
  talkMode,
  setTalkMode,
  asyncMode,
  setAsyncMode,
  showUserVideo,
  setShowUserVideo,
  isMuted,
  setIsMuted,
  isVoiceChatActive,
  setIsVoiceChatActive,
  setCurrentMode,
  showSidebar,
  setShowSidebar,
  avatarConfig,
  selectedMentorName,
  isSessionStarting,
  userProfile,
  selectedScenario,
  generateInitialGreeting,
  latestAvatarSpeech
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>,
  userVideoRef: React.RefObject<HTMLVideoElement | null>,
  showMessages: boolean,
  setShowMessages: (show: boolean) => void,
  isListening: boolean,
  isRealTimeMode: boolean,
  setIsRealTimeMode: (mode: boolean) => void,
  voiceText: string,
  setVoiceText: (text: string) => void,
  startListening: () => void,
  stopListening: () => void,
  handleVoiceSend: (text: string) => void,
  talkMode: string,
  setTalkMode: (mode: string) => void,
  asyncMode: string,
  setAsyncMode: (mode: string) => void,
  showUserVideo: boolean,
  setShowUserVideo: (show: boolean) => void,
  isMuted: boolean,
  setIsMuted: (muted: boolean) => void,
  isVoiceChatActive: boolean,
  setIsVoiceChatActive: (active: boolean) => void,
  setCurrentMode: (mode: 'gemini-chat' | 'avatar-chat') => void,
  showSidebar: boolean,
  setShowSidebar: (show: boolean) => void,
  avatarConfig: StartAvatarRequest,
  selectedMentorName: string,
  isSessionStarting: boolean,
  userProfile: any,
  selectedScenario: any,
  generateInitialGreeting: () => string | null,
  latestAvatarSpeech: string
}) {
  const { sessionState, avatarRef } = useStreamingAvatarContext();
  const triggerStartSession = () => {
    const startButton = document.querySelector('[data-auto-start="true"]') as HTMLButtonElement;
    if (startButton && !startButton.disabled) {
      startButton.click();
    }
  };

  useEffect(() => {
    if (latestAvatarSpeech && sessionState === StreamingAvatarSessionState.CONNECTED && avatarRef.current) {
      avatarRef.current.repeat(latestAvatarSpeech);
    }
  }, [latestAvatarSpeech, sessionState, avatarRef]);

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden relative transition-colors duration-300" style={{ background: "var(--color-bg)" }}>
      {/* Main Avatar Video - Full Screen */}
      <div className="flex-1 relative">
        <AvatarVideo ref={videoRef} />
        
        {/* Connection Status */}
        <ConnectionStatus />
        
        {/* Avatar Status Overlay */}
        <AvatarStatusOverlay />
        
        {/* Welcome Message when not connected */}
        <AvatarWelcomeMessage
          userProfile={userProfile}
          selectedScenario={selectedScenario}
          generateInitialGreeting={generateInitialGreeting}
          isVoiceChatActive={isVoiceChatActive}
          onStartSession={triggerStartSession}
        />

        {isSessionStarting && sessionState !== 'connected' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rounded-xl border border-white/20 bg-black/50 px-4 py-2 text-white text-sm backdrop-blur-md flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Preparing avatar session...
            </div>
          </div>
        )}

        <motion.div
          className="absolute top-5 left-5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-xl"
          style={{ background: "rgba(0,0,0,0.35)", borderColor: "rgba(255,255,255,0.25)", color: "white" }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Chatting with {selectedMentorName}
        </motion.div>

        {/* User Video - Picture in Picture */}
        {showUserVideo && (
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 dark:bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-white/20 transition-colors duration-300">
            <video
              ref={userVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Video Controls Overlay */}
        <motion.div
          className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/35 backdrop-blur-xl rounded-3xl p-2.5 md:p-3 border border-white/20 shadow-2xl w-[calc(100%-1.25rem)] md:w-auto justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          {/* Microphone Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-white/10 rounded-2xl border border-white/10">
            <motion.div
              className={`w-3 h-3 rounded-full ${isVoiceChatActive ? 'bg-green-400' : 'bg-gray-400'}`}
              animate={isVoiceChatActive ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 2, repeat: isVoiceChatActive ? Infinity : 0 }}
            />
            <span className="text-sm font-medium text-white">
              {isVoiceChatActive && !isMuted ? 'Mic Active' : 'Mic Off'}
            </span>
          </div>

          {/* Mic Toggle */}
          <motion.button
            onClick={() => {
              if (isVoiceChatActive && !isMuted) {
                setIsVoiceChatActive(false);
                setIsMuted(true);
              } else {
                setIsVoiceChatActive(true);
                setIsMuted(false);
              }
            }}
            className={`p-3 rounded-2xl transition-all duration-300 shadow-lg ${
              isVoiceChatActive && !isMuted
                ? 'bg-emerald-500/85 text-white hover:bg-emerald-600/85'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isVoiceChatActive && !isMuted ? 'Turn Mic Off' : 'Turn Mic On'}
          >
            {isVoiceChatActive && !isMuted ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </motion.button>

          {/* User Video Toggle */}
          <motion.button
            onClick={() => setShowUserVideo(!showUserVideo)}
            className={`p-3 rounded-2xl transition-all duration-300 shadow-lg ${
              showUserVideo
                ? 'bg-blue-500/80 text-white hover:bg-blue-600/80'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={showUserVideo ? 'Hide Your Video' : 'Show Your Video'}
          >
            {showUserVideo ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </motion.button>

          {/* Voice Toggle */}
          <motion.button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-2xl transition-all duration-300 shadow-lg ${
              isMuted
                ? 'bg-red-500/80 text-white hover:bg-red-600/80'
                : isVoiceChatActive
                ? 'bg-green-500/80 text-white hover:bg-green-600/80'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </motion.button>

          {/* End Call */}
          <motion.button
            onClick={() => {
              // Stop avatar session
              setIsVoiceChatActive(false);
              setIsMuted(true);
              // Stop the actual avatar session
              const stopButton = document.querySelector('[data-stop-avatar="true"]') as HTMLButtonElement;
              if (stopButton) {
                stopButton.click();
              }
              // Switch back to gemini chat
              setCurrentMode('gemini-chat');
            }}
            className="p-3 rounded-2xl bg-red-500/80 hover:bg-red-600/80 text-white transition-all duration-300 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="End Call"
          >
            <Phone className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Scenario Info Overlay */}
        {selectedScenario && (
          <motion.div
            className="absolute top-6 left-6 bg-black/30 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-lg max-w-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{selectedScenario.emoji}</span>
              <h4 className="text-white font-semibold">{selectedScenario.name}</h4>
            </div>
            <p className="text-gray-300 text-sm">{selectedScenario.description}</p>
          </motion.div>
        )}
      </div>

      {/* Right Side - Options Panel */}
      <div className="w-[320px] xl:w-[360px] border-l min-h-0 hidden lg:flex flex-col transition-colors duration-300" style={{borderColor:'var(--color-border)', background:'var(--color-surface)'}}>
        {/* Panel Header */}
        <div className="p-4 border-b" style={{borderColor:'var(--color-border)'}}>
          <div>
            <h3 className="text-lg font-semibold theme-text-primary">Live Call Controls</h3>
            <p className="text-sm theme-text-muted">Mentor: {selectedMentorName}</p>
          </div>
        </div>

        {/* Chat Controls */}
        <div className="p-4 border-b" style={{borderColor:'var(--color-border)'}}>
          <AvatarControls />
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <MessageHistory />
        </div>

      </div>

      {/* Mobile Conversation Toggle */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMessages(!showMessages)}
          className="p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
        >
          <MessageSquare className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Mobile Conversation Panel */}
      {showMessages && (
        <div className="lg:hidden fixed inset-0 bg-gray-200/50 dark:bg-black/50 backdrop-blur-sm z-40">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[70vh] flex flex-col transition-colors duration-300"
          >
            {/* Mobile Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Chat</h3>
              <button
                onClick={() => setShowMessages(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Mobile Chat Controls */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <AvatarControls />
            </div>

            {/* Mobile Message History */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              <MessageHistory />
            </div>

          </motion.div>
        </div>
      )}
    </div>
  );
}

// Avatar Session Manager Component
function AvatarSessionManager({
  avatarConfig,
  selectedMentorName,
  setIsVoiceChatActive,
  setIsMuted,
  setIsSessionStarting
}: {
  avatarConfig: StartAvatarRequest,
  selectedMentorName: string,
  setIsVoiceChatActive: (active: boolean) => void,
  setIsMuted: (muted: boolean) => void,
  setIsSessionStarting: (value: boolean) => void
}) {
  const { sessionState, startAvatar, stopAvatar } = useStreamingAvatarSession();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    setIsSessionStarting(true);
    try {
      console.log('Starting avatar session with config:', avatarConfig);
      // Get access token from your API
      const response = await fetch('/api/get-access-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(avatarConfig),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Access token API error:', response.status, errorText);
        throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
      }
      const token = await response.text();
      console.log('Got token, starting avatar...', token.substring(0, 50) + '...');
      console.log('Full token length:', token.length);
      console.log('Avatar config being sent:', JSON.stringify(avatarConfig, null, 2));
      
      // Try to decode the token to see if it's valid
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        console.log('Decoded token payload:', decodedToken);
      } catch (e) {
        console.log('Token is not a JWT, raw token:', token);
      }
      
      const avatar = await startAvatar(avatarConfig, token);
      console.log('Avatar started successfully:', avatar);
      setIsVoiceChatActive(true);
      setIsMuted(false);
    } catch (error: unknown) {
      console.error('Failed to start avatar:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('Failed to start avatar session. Please check your API key and try again. Error: ' + errorMessage);
    } finally {
      setIsStarting(false);
      setIsSessionStarting(false);
    }
  };

  const getButtonText = () => {
    if (isStarting) return 'Starting...';
    if (sessionState === 'connecting') return 'Connecting...';
    if (sessionState === 'connected') return 'Stop Session';
    return 'Start Session';
  };

  const getButtonIcon = () => {
    if (isStarting || sessionState === 'connecting') {
      return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />;
    }
    if (sessionState === 'connected') {
      return <Pause className="w-4 h-4" />;
    }
    return <Play className="w-4 h-4" />;
  };

  const isDisabled = isStarting || sessionState === 'connecting';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs theme-text-muted">Ready to connect with {selectedMentorName}</div>
        <div className="text-[11px] text-amber-400/90">Free preview ~1 min</div>
      </div>
      <motion.button
        whileHover={{ scale: isDisabled ? 1 : 1.05 }}
        whileTap={{ scale: isDisabled ? 1 : 0.95 }}
        onClick={sessionState === 'connected' ? stopAvatar : handleStart}
        disabled={isDisabled}
        data-auto-start="true"
        data-stop-avatar={sessionState === 'connected' ? "true" : "false"}
        className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
          sessionState === 'connected'
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
            : isDisabled
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
        }`}
      >
        {getButtonIcon()}
        <span>{getButtonText()}</span>
      </motion.button>
    </div>
  );
}

// Dashboard Mode Component
function DashboardMode({ userProfile, setCurrentMode, setShowScenarios }: { userProfile: any, setCurrentMode: any, setShowScenarios: any }) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-10 relative" style={{background:'var(--color-bg)'}}>
      {/* Background ambient effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[10%] left-[-5%] w-[30%] h-[30%] bg-teal-500/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10 relative z-10">
        
        {/* Welcome Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative rounded-[2rem] overflow-hidden p-8 sm:p-10 lg:p-12 shadow-2xl theme-card"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-teal-500/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md"
              >
                <Zap className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-medium text-gray-200">Your Daily Goal: 15 mins</span>
              </motion.div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight theme-text-primary">
                Welcome back, <br className="hidden sm:block" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400">
                  {userProfile?.name || 'Explorer'}
                </span>
              </h1>
              <p className="text-lg sm:text-xl theme-text-muted mb-8 leading-relaxed">
                {userProfile?.learningGoals?.length > 0
                  ? `Ready to master your ${userProfile.learningGoals.slice(0, 2).join(' and ').toLowerCase()}? Your personalized AI coach is tailored for your ${userProfile.targetLanguages?.[0] || 'language'} journey at the ${userProfile.proficiencyLevel?.split(' ')[0] || 'current'} level.`
                  : "Ready to elevate your communication skills today? Dive into a personalized AI coaching session or continue your previous scenarios."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setCurrentMode('avatar-chat')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_-10px_rgba(45,212,191,0.5)] border border-teal-400/20"
                >
                  <Video className="w-6 h-6" />
                  Open Live Call
                </button>
                <button 
                  onClick={() => setCurrentMode('gemini-chat')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg bg-gradient-to-r from-purple-600/50 to-blue-600/50 text-white hover:from-purple-500/50 hover:to-blue-500/50 border border-purple-500/30 backdrop-blur-md transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_-10px_rgba(168,85,247,0.3)]"
                >
                  <MessageSquare className="w-6 h-6" />
                  Text Practice
                </button>
              </div>
            </div>
            <div className="hidden lg:block relative perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/40 to-teal-400/40 rounded-full blur-[80px]" />
              <motion.div
                initial={{ rotateY: -20, rotateX: 10, y: 20 }}
                animate={{ rotateY: [-20, 0, -20], y: [20, 0, 20] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-64 h-[28rem] bg-gray-900 border-[8px] border-gray-800 rounded-[3rem] shadow-2xl overflow-hidden shadow-teal-500/20"
              >
                {/* Phone Notch */}
                <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 rounded-b-2xl w-1/2 mx-auto z-20" />
                
                {/* Animated Screen Content */}
                <div className="absolute inset-0 bg-black overflow-hidden flex flex-col p-4 pt-10">
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-full mx-auto mb-3 shadow-[0_0_30px_rgba(45,212,191,0.5)] flex items-center justify-center"
                    >
                      <Video className="w-8 h-8 text-white" />
                    </motion.div>
                    <div className="text-white font-bold text-lg">AI Coach Active</div>
                    <div className="text-teal-400 text-xs">Listening...</div>
                  </div>
                  
                  {/* Scrolling Chat Animation */}
                  <div className="flex-1 relative">
                    <motion.div
                      animate={{ y: [0, -100] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="space-y-4"
                    >
                      <div className="bg-gray-800/80 p-3 rounded-2xl rounded-tl-none w-3/4 shadow-sm border border-gray-700">
                        <div className="h-2 w-1/2 bg-gray-600 rounded mb-2"></div>
                        <div className="h-2 w-full bg-gray-600 rounded"></div>
                      </div>
                      <div className="bg-teal-500/20 p-3 rounded-2xl rounded-tr-none w-3/4 ml-auto border border-teal-500/30">
                        <div className="h-2 w-3/4 bg-teal-400/50 rounded mb-2 ml-auto"></div>
                        <div className="h-2 w-full bg-teal-400/50 rounded"></div>
                      </div>
                      <div className="bg-gray-800/80 p-3 rounded-2xl rounded-tl-none w-3/4 shadow-sm border border-gray-700">
                        <div className="h-2 w-full bg-gray-600 rounded mb-2"></div>
                        <div className="h-2 w-2/3 bg-gray-600 rounded"></div>
                      </div>
                      <div className="bg-teal-500/20 p-3 rounded-2xl rounded-tr-none w-3/4 ml-auto border border-teal-500/30">
                        <div className="h-2 w-full bg-teal-400/50 rounded mb-2"></div>
                        <div className="h-2 w-1/2 bg-teal-400/50 rounded ml-auto"></div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Audio Wave Animation */}
                  <div className="h-12 flex items-center justify-center gap-1 border-t border-gray-800 pt-4">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: ['20%', '100%', '20%'] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                        className="w-1.5 bg-teal-400 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: 'Total Sessions', value: '12', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/20' },
            { label: 'Practice Time', value: '4.5h', icon: Clock, color: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-500/20' },
            { label: 'Avg Fluency', value: '85%', icon: Star, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/20' },
            { label: 'Scenarios Done', value: '8', icon: Trophy, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-500/20' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 * i }}
              className={`p-6 rounded-[1.5rem] border theme-card transition-all cursor-default ${stat.border}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} shadow-inner`}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-sm font-medium theme-text-muted">{stat.label}</div>
                  <div className="text-3xl font-extrabold theme-text-primary">{stat.value}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recommended Scenarios & Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold theme-text-primary flex items-center gap-2">
                <Star className="w-6 h-6 text-teal-400" /> Recommended Scenarios
              </h2>
              <button 
                onClick={() => setShowScenarios(true)}
                className="text-sm font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-teal-400/10"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {[
                { title: 'Job Interview', desc: 'Practice for a tech role', tag: 'Professional', glowClass: 'bg-blue-500/10 group-hover:bg-blue-500/20' },
                { title: 'Coffee Shop', desc: 'Casual everyday conversation', tag: 'Social', glowClass: 'bg-teal-500/10 group-hover:bg-teal-500/20' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="p-6 rounded-[1.5rem] border theme-card cursor-pointer group transition-all relative overflow-hidden"
                  onClick={() => setCurrentMode('avatar-chat')}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 transition-colors ${item.glowClass}`} />
                  <div className="relative z-10">
                    <div className="text-xs font-semibold px-3 py-1.5 rounded-full mb-4 inline-block border theme-text-muted" style={{background:'var(--panel-soft)', borderColor:'var(--color-border)'}}>
                      {item.tag}
                    </div>
                    <h3 className="text-xl font-bold mb-2 theme-text-primary group-hover:text-teal-400 transition-colors">{item.title}</h3>
                    <p className="text-sm theme-text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-2xl font-bold theme-text-primary flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-400" /> Recent Activity
            </h2>
            <div className="rounded-[1.5rem] border theme-card p-6 sm:p-8 space-y-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
              {[
                { action: 'Completed "Airport Check-in"', time: '2 hours ago', icon: Trophy, color: 'text-amber-400' },
                { action: 'Earned "Fast Talker" badge', time: 'Yesterday', icon: Zap, color: 'text-teal-400' },
                { action: 'Updated User Profile', time: '2 days ago', icon: User, color: 'text-blue-400' }
              ].map((activity, i) => (
                <div key={i} className="flex gap-5 items-start relative z-10">
                  {i !== 2 && <div className="absolute left-[1.1rem] top-10 w-0.5 h-12 bg-white/10" />}
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${activity.color}`} style={{borderColor:'var(--color-border)', background:'var(--panel-soft)'}}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="pt-1.5">
                    <p className="text-sm sm:text-base font-semibold theme-text-primary">{activity.action}</p>
                    <p className="text-xs sm:text-sm theme-text-muted mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default FluentFlowApp;