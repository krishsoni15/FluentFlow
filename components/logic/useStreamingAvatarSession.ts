import {
  LiveAvatarSession,
  SessionEvent,
  AgentEventsEnum,
  ConnectionQuality,
} from "@heygen/liveavatar-web-sdk";
import { StartAvatarRequest } from "./types";
import { useCallback } from "react";

import {
  StreamingAvatarSessionState,
  useStreamingAvatarContext,
} from "./context";
import { useVoiceChat } from "./useVoiceChat";
import { useMessageHistory } from "./useMessageHistory";

export const useStreamingAvatarSession = () => {
  const {
    avatarRef,
    basePath,
    sessionState,
    setSessionState,
    stream,
    setStream,
    setIsListening,
    setIsUserTalking,
    setIsAvatarTalking,
    setConnectionQuality,
    handleUserTalkingMessage,
    handleStreamingTalkingMessage,
    handleEndMessage,
    clearMessages,
  } = useStreamingAvatarContext();
  const { stopVoiceChat } = useVoiceChat();

  useMessageHistory();

  const init = useCallback(
    (token: string) => {
      avatarRef.current = new LiveAvatarSession(token);

      return avatarRef.current;
    },
    [basePath, avatarRef],
  );

  const handleStream = useCallback(
    () => {
      setSessionState(StreamingAvatarSessionState.CONNECTED);
    },
    [setSessionState],
  );

  const stop = useCallback(async () => {
    avatarRef.current?.off(SessionEvent.SESSION_STREAM_READY, handleStream);
    avatarRef.current?.off(SessionEvent.SESSION_DISCONNECTED, stop);
    clearMessages();
    stopVoiceChat();
    setIsListening(false);
    setIsUserTalking(false);
    setIsAvatarTalking(false);
    setStream(null);
    await avatarRef.current?.stop();
    setSessionState(StreamingAvatarSessionState.INACTIVE);
  }, [
    handleStream,
    setSessionState,
    setStream,
    avatarRef,
    setIsListening,
    stopVoiceChat,
    clearMessages,
    setIsUserTalking,
    setIsAvatarTalking,
  ]);

  const start = useCallback(
    async (config: StartAvatarRequest, token?: string) => {
      if (sessionState !== StreamingAvatarSessionState.INACTIVE) {
        throw new Error("There is already an active session");
      }

      if (!avatarRef.current) {
        if (!token) {
          throw new Error("Token is required");
        }
        init(token);
      }

      if (!avatarRef.current) {
        throw new Error("Avatar is not initialized");
      }

      setSessionState(StreamingAvatarSessionState.CONNECTING);
      avatarRef.current.on(SessionEvent.SESSION_STREAM_READY, handleStream);
      avatarRef.current.on(SessionEvent.SESSION_DISCONNECTED, stop);
      avatarRef.current.on(
        SessionEvent.SESSION_CONNECTION_QUALITY_CHANGED,
        (quality: ConnectionQuality) => setConnectionQuality(quality),
      );
      avatarRef.current.on(AgentEventsEnum.USER_SPEAK_STARTED, () => {
        setIsUserTalking(true);
      });
      avatarRef.current.on(AgentEventsEnum.USER_SPEAK_ENDED, () => {
        setIsUserTalking(false);
      });
      avatarRef.current.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
        setIsAvatarTalking(true);
      });
      avatarRef.current.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
        setIsAvatarTalking(false);
      });
      avatarRef.current.on(
        AgentEventsEnum.USER_TRANSCRIPTION_CHUNK,
        handleUserTalkingMessage,
      );
      avatarRef.current.on(
        AgentEventsEnum.AVATAR_TRANSCRIPTION_CHUNK,
        handleStreamingTalkingMessage,
      );
      avatarRef.current.on(AgentEventsEnum.USER_TRANSCRIPTION, handleEndMessage);
      avatarRef.current.on(
        AgentEventsEnum.AVATAR_TRANSCRIPTION,
        handleEndMessage,
      );

      await avatarRef.current.start();

      return avatarRef.current;
    },
    [
      init,
      handleStream,
      stop,
      setSessionState,
      avatarRef,
      sessionState,
      setConnectionQuality,
      setIsUserTalking,
      handleUserTalkingMessage,
      handleStreamingTalkingMessage,
      handleEndMessage,
      setIsAvatarTalking,
    ],
  );

  return {
    avatarRef,
    sessionState,
    stream,
    initAvatar: init,
    startAvatar: start,
    stopAvatar: stop,
  };
};
