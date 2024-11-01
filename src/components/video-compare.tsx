import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Play,
  Pause,
  RotateCcw,
  Save,
  Trash2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Video = {
  url: string;
  startTime: number;
  isValidUrl?: boolean;
};

export default function MultiVideoPlayer() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [startTimeInputs, setStartTimeInputs] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const config = params.get('id');
    
    if (config) {
      try {
        const decodedConfig = JSON.parse(atob(config));
        if (Array.isArray(decodedConfig)) {
          setVideos(decodedConfig.map(video => ({ ...video, isValidUrl: false })));
          setStartTimeInputs(decodedConfig.map(video => video.startTime.toString()));
        }
      } catch (error) {
        console.error('Error parsing config:', error);
        // Fallback to legacy format
        const savedVideos: Video[] = [];
        const savedInputs: string[] = [];
        let index = 0;
        while (params.has(`video${index}`)) {
          const [url, startTime] = params.get(`video${index}`)!.split('|');
          savedVideos.push({ url, startTime: parseFloat(startTime), isValidUrl: false });
          savedInputs.push(startTime);
          index++;
        }
        if (savedVideos.length > 0) {
          setVideos(savedVideos);
          setStartTimeInputs(savedInputs);
        }
      }
    }
  }, []);

  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, videos.length);
  }, [videos]);

  useEffect(() => {
    const handleVideoEnd = () => {
      setIsPlaying(false);
    };

    videoRefs.current.forEach((video) => {
      if (video) {
        video.addEventListener('ended', handleVideoEnd);
      }
    });

    return () => {
      videoRefs.current.forEach((video) => {
        if (video) {
          video.removeEventListener('ended', handleVideoEnd);
        }
      });
    };
  }, [videos]);

  const addVideo = () => {
    setVideos([...videos, { url: '', startTime: 0, isValidUrl: false }]);
    setStartTimeInputs([...startTimeInputs, '0']);
  };

  const handleVideoError = (index: number) => {
    const newVideos = [...videos];
    newVideos[index] = { ...newVideos[index], isValidUrl: false };
    setVideos(newVideos);
  };

  const handleVideoLoad = (index: number) => {
    const newVideos = [...videos];
    newVideos[index] = { ...newVideos[index], isValidUrl: true };
    setVideos(newVideos);
  };

  const updateVideo = (
    index: number,
    field: keyof Video,
    value: string | number
  ) => {
    const newVideos = [...videos];
    if (field === 'startTime') {
      const stringValue = value.toString();
      // Allow numbers, single decimal point, and partial inputs
      if (/^-?\d*\.?\d*$/.test(stringValue)) {
        // Update the input state immediately for smooth typing
        const newStartTimeInputs = [...startTimeInputs];
        newStartTimeInputs[index] = stringValue;
        setStartTimeInputs(newStartTimeInputs);

        // Only update the actual video time if we have a valid number
        const numericValue = parseFloat(stringValue);
        if (!isNaN(numericValue)) {
          newVideos[index] = {
            ...newVideos[index],
            startTime: numericValue,
          };
          const videoElement = videoRefs.current[index];
          if (videoElement) {
            videoElement.currentTime = numericValue;
          }
          setVideos(newVideos);
        }
      }
    } else {
      newVideos[index] = {
        ...newVideos[index],
        [field]: value,
        isValidUrl: field === 'url' ? false : newVideos[index].isValidUrl,
      };
      setVideos(newVideos);
    }
  };

  const setCurrentTimeAsStart = (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      const currentTime = video.currentTime;
      const formattedTime = currentTime.toFixed(2);
      updateVideo(index, 'startTime', formattedTime);
      const newStartTimeInputs = [...startTimeInputs];
      newStartTimeInputs[index] = formattedTime;
      setStartTimeInputs(newStartTimeInputs);
    }
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
    setStartTimeInputs(startTimeInputs.filter((_, i) => i !== index));
  };

  const playAll = () => {
    const promises = videoRefs.current.map((video, index) => {
      if (video && videos[index].isValidUrl) {
        video.currentTime = videos[index].startTime;
        return video.play();
      }
      return Promise.resolve();
    });

    Promise.all(promises)
      .then(() => {
        setIsPlaying(true);
      })
      .catch((error) => {
        console.error('Error playing videos:', error);
        setIsPlaying(false);
      });
  };

  const pauseAll = () => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.pause();
      }
    });
    setIsPlaying(false);
  };

  const resetAll = () => {
    videoRefs.current.forEach((video, index) => {
      if (video && videos[index].isValidUrl) {
        video.currentTime = videos[index].startTime;
        video.pause();
      }
    });
    setIsPlaying(false);
  };

  const saveToUrl = () => {
    // Remove isValidUrl from the saved data
    const saveData = videos.map(({ url, startTime }) => ({ url, startTime }));
    const config = btoa(JSON.stringify(saveData));
    const params = new URLSearchParams();
    params.set('id', config);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
    console.log('URL updated:', newUrl);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-[radial-gradient(circle_at_center,rgba(0,107,255,0.08)_0%,rgba(0,107,255,0)_100%)] p-8">
      <div className="relative max-w-[90rem] mx-auto">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A] to-[#0A0A0A] p-[1px] transition-all duration-300">
          <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-[#00D5FF] via-[#0094FF] to-[#0042FF] opacity-20 blur-xl transition-all duration-300" />
          <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-[#00D5FF] via-[#0094FF] to-[#0042FF] opacity-20" />
        </div>
        <div className="relative rounded-2xl bg-[#0A0A0A]/90 backdrop-blur-xl p-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#00D5FF] via-[#0094FF] to-[#0042FF] animate-gradient">
              Multi Video Player
            </h1>
            <p className="text-[#8F9BB3] text-lg">
              Compare multiple videos with precise timing control
            </p>
          </div>

          <div className="flex flex-col items-center space-y-8 mb-12">
            <div className="inline-flex rounded-lg shadow-sm">
              <Button
                onClick={isPlaying ? pauseAll : playAll}
                variant="default"
                size="lg"
                className="rounded-l-lg rounded-r-none text-white min-w-[140px] bg-gradient-to-r from-[#00D5FF] via-[#0094FF] to-[#0042FF] hover:opacity-90 transition-opacity"
              >
                {isPlaying ? (
                  <Pause className="mr-2" />
                ) : (
                  <Play className="mr-2" />
                )}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button
                onClick={resetAll}
                variant="outline"
                size="lg"
                className="rounded-none min-w-[140px] border-x-0 border-[#1E2D3D] text-[#8F9BB3] hover:text-white hover:bg-[#1E2D3D]/50"
              >
                <RotateCcw className="mr-2" />
                Reset
              </Button>
              <Button
                onClick={saveToUrl}
                variant="outline"
                size="lg"
                className="rounded-r-lg rounded-l-none min-w-[140px] border-[#1E2D3D] text-[#8F9BB3] hover:text-white hover:bg-[#1E2D3D]/50"
              >
                <Save className="mr-2" />
                Save
              </Button>
            </div>

            <Button
              onClick={addVideo}
              variant="outline"
              size="lg"
              className="border-dashed border-2 border-[#1E2D3D] text-[#8F9BB3] hover:text-white hover:border-[#0094FF] hover:bg-[#1E2D3D]/30 transition-all"
            >
              <Plus className="mr-2" />
              Add Video
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <div
                key={index}
                className="group relative rounded-xl transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#00D5FF] via-[#0094FF] to-[#0042FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative rounded-xl bg-[#0F1623] border border-[#1E2D3D] overflow-hidden">
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-[80px_1fr_auto] gap-3 items-center">
                      <Label
                        htmlFor={`video-url-${index}`}
                        className="text-[#8F9BB3]"
                      >
                        Video URL:
                      </Label>
                      <Input
                        id={`video-url-${index}`}
                        value={video.url}
                        onChange={(e) =>
                          updateVideo(index, 'url', e.target.value)
                        }
                        className="flex-grow bg-[#0A0A0A] border-[#1E2D3D] text-white focus:border-[#0094FF] focus:ring-[#0094FF]"
                        placeholder="Enter video URL"
                      />
                      <Button
                        onClick={() => removeVideo(index)}
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 text-[#8F9BB3] hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {video.isValidUrl && (
                      <div className="grid grid-cols-[80px_1fr] gap-3 items-center">
                        <Label
                          htmlFor={`start-time-${index}`}
                          className="text-[#8F9BB3]"
                        >
                          Start Time:
                        </Label>
                        <div className="flex items-center gap-3">
                          <Input
                            id={`start-time-${index}`}
                            type="text"
                            inputMode="decimal"
                            value={startTimeInputs[index]}
                            onChange={(e) =>
                              updateVideo(index, 'startTime', e.target.value)
                            }
                            className="w-24 bg-[#0A0A0A] border-[#1E2D3D] text-white focus:border-[#0094FF] focus:ring-[#0094FF]"
                          />
                          <span className="text-[#8F9BB3]">sec</span>
                          <Button
                            onClick={() => setCurrentTimeAsStart(index)}
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0 whitespace-nowrap border-[#1E2D3D] text-[#8F9BB3] hover:text-white hover:border-[#0094FF] hover:bg-[#1E2D3D]/30"
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Set Current
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <video
                      ref={(el) => (videoRefs.current[index] = el)}
                      src={video.url}
                      controls
                      className="w-full bg-black"
                      onError={() => handleVideoError(index)}
                      onLoadedData={() => handleVideoLoad(index)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}