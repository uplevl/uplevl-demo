"use client";

import { LoaderCircleIcon, MicIcon, PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useVoiceGeneration } from "@/contexts/voice-generation-context";
import { useGenerateVoiceOver } from "@/hooks/use-generate-voice-over";
import { useGenerateVoiceOverMutation } from "@/hooks/use-generate-voice-over-mutation";
import Button from "./button";
import { Typography } from "./typography";

interface VoiceOverPlayerProps {
  groupId: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function VoiceOverPlayer({ groupId }: VoiceOverPlayerProps) {
  const { data: audioUrl, isLoading, error } = useGenerateVoiceOver(groupId);
  const generateMutation = useGenerateVoiceOverMutation(groupId);
  const { isGenerating, currentGroupId } = useVoiceGeneration();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    console.log("Loading audio from URL:", audioUrl);

    // Reset state when new audio loads
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsAudioLoading(true);

    function handleTimeUpdate() {
      if (audio) {
        setCurrentTime(audio.currentTime || 0);
      }
    }

    function handleLoadedMetadata() {
      if (audio) {
        console.log("Audio metadata loaded, duration:", audio.duration);
        setDuration(audio.duration || 0);
        setIsAudioLoading(false);
      }
    }

    function handleLoadStart() {
      setIsAudioLoading(true);
    }

    function handleCanPlay() {
      setIsAudioLoading(false);
    }

    function handleEnded() {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audio) {
        audio.currentTime = 0;
      }
    }

    function handleLoadedData() {
      // Additional event to ensure duration is captured
      if (audio?.duration) {
        setDuration(audio.duration);
      }
    }

    function handleDurationChange() {
      // Handle duration changes
      if (audio) {
        console.log("Duration changed:", audio.duration);
        if (audio.duration) {
          setDuration(audio.duration);
        }
      }
    }

    function handleError(e: Event) {
      console.error("Audio error:", e);
      setIsAudioLoading(false);
    }

    // Add event listeners
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    // Set default volume
    audio.volume = 0.7;

    // Force load the audio
    audio.load();

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioUrl]); // Re-run when audioUrl changes

  function togglePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLButtonElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // Convert keyboard event to mouse event for seeking
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = rect.width / 2; // Seek to middle by default for keyboard
      const newTime = (clickX / rect.width) * duration;

      const audio = audioRef.current;
      if (audio && duration) {
        audio.currentTime = newTime;
        setCurrentTime(newTime);
      }
    }
  }

  const isThisGroupGenerating = currentGroupId === groupId;
  const isAnyGenerating = isGenerating;

  // Show loading if initial data is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border">
        <LoaderCircleIcon className="size-6 animate-spin mr-2" />
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  // Show error if there's an error
  if (error && !isThisGroupGenerating) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">Error: {error.message}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => generateMutation.mutate()}
          disabled={isAnyGenerating}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Show generation status for this group
  if (isThisGroupGenerating) {
    return (
      <div className="flex items-center justify-center p-2 bg-blue-50 rounded-xl border border-blue-100/50">
        <LoaderCircleIcon className="size-6 animate-spin mr-2 text-blue-600" />
        <Typography size="sm" className="text-blue-700">
          Generating voice over...
        </Typography>
      </div>
    );
  }

  // Show generate button if no audio
  if (!audioUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-xl">
        <Typography size="xs" className="text-gray-500">
          No voice-over generated yet
        </Typography>
        <Button variant="primary" size="sm" onClick={() => generateMutation.mutate()} disabled={isAnyGenerating}>
          <MicIcon className="size-4" />
          {isAnyGenerating && !isThisGroupGenerating ? "Generation in progress..." : "Generate Voice-Over"}
        </Button>
      </div>
    );
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-2 shadow-sm">
      <audio ref={audioRef} src={audioUrl} preload="metadata" crossOrigin="anonymous">
        <track kind="captions" srcLang="en" label="English" />
      </audio>

      <div className="flex items-center space-x-4">
        {/* Play/Pause Button */}
        <Button variant="primary" size="md" onClick={togglePlayPause} disabled={isAudioLoading}>
          {isAudioLoading ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : isPlaying ? (
            <PauseIcon className="size-4" />
          ) : (
            <PlayIcon className="size-4" />
          )}
        </Button>

        {/* Progress Section */}
        <div className="flex-1 space-y-2">
          {/* Time Display */}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Progress Bar */}
          <button
            type="button"
            className="relative h-2 bg-gray-200 rounded-full cursor-pointer group w-full"
            onClick={handleSeek}
            onKeyDown={handleKeyDown}
            aria-label={`Audio progress: ${formatTime(currentTime)} of ${formatTime(duration)}`}
          >
            <div
              className="absolute top-0 left-0 h-full bg-brand-deep-gray rounded-full transition-all duration-150"
              style={{ width: `${progressPercentage}%` }}
            />
            <div
              className="absolute top-1/2 w-3 h-3 bg-brand-deep-gray rounded-full transform -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ left: `${progressPercentage}%` }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
