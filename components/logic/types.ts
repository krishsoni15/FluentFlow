export enum AvatarQuality {
  Low = "low",
  Medium = "medium",
  High = "high",
}

export enum ElevenLabsModel {
  eleven_monolingual_v1 = "eleven_monolingual_v1",
  eleven_multilingual_v1 = "eleven_multilingual_v1",
  eleven_multilingual_v2 = "eleven_multilingual_v2",
  eleven_turbo_v2 = "eleven_turbo_v2",
  eleven_flash_v2_5 = "eleven_flash_v2_5",
}

export enum STTProvider {
  DEEPGRAM = "deepgram",
}

export enum VoiceEmotion {
  EXCITED = "excited",
  SERIOUS = "serious",
  FRIENDLY = "friendly",
  SOOTHING = "soothing",
  BROADCASTER = "broadcaster"
}

export enum VoiceChatTransport {
  WEBSOCKET = "websocket",
  WEBRTC = "webrtc"
}

export interface StartAvatarRequest {
  quality?: AvatarQuality;
  avatarName: string;
  knowledgeId?: string;
  voice?: {
    voiceId?: string;
    rate?: number;
    emotion?: VoiceEmotion;
    model?: ElevenLabsModel;
  };
  language?: string;
  voiceChatTransport?: VoiceChatTransport;
  sttSettings?: {
    provider?: STTProvider;
  };
}

export enum TaskType {
  TALK = "talk",
  REPEAT = "repeat",
}

export enum TaskMode {
  SYNC = "sync",
  ASYNC = "async",
}
