"use client";

import { LoaderCircleIcon, PauseIcon, PlayIcon, VolumeIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useGenerateVoiceOver } from "@/hooks/use-generate-voice-over";
import Button from "./button";

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function handleTimeUpdate() {
      if (audio) {
        setCurrentTime(audio.currentTime);
      }
    }

    function handleLoadedMetadata() {
      if (audio) {
        setDuration(audio.duration);
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
    }

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

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

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border">
        <LoaderCircleIcon className="size-6 animate-spin mr-2" />
        <span className="text-sm text-gray-600">Generating voice over...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  if (!audioUrl) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">No audio available</p>
      </div>
    );
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <audio ref={audioRef} src={audioUrl} preload="metadata">
        <track kind="captions" srcLang="en" label="English" />
      </audio>

      <div className="flex items-center space-x-4">
        {/* Play/Pause Button */}
        <Button
          variant="primary"
          size="md"
          onClick={togglePlayPause}
          disabled={isAudioLoading}
          className="flex-shrink-0 w-10 h-10 p-0"
        >
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

        {/* Volume Control */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <VolumeIcon className="size-4 text-gray-500" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-transparent appearance-none cursor-pointer
                       [&::-webkit-slider-track]:bg-gray-200 [&::-webkit-slider-track]:h-1 [&::-webkit-slider-track]:rounded-sm
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-brand-deep-gray 
                       [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-track]:bg-gray-200 [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-sm 
                       [&::-moz-range-track]:border-none
                       [&::-moz-range-thumb]:bg-brand-deep-gray [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 
                       [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
            aria-label="Volume control"
          />
        </div>
      </div>
    </div>
  );
}
