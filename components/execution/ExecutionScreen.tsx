'use client';

import { useState, useEffect } from 'react';
import { Clock, ChevronDown, X, Navigation, MapPin, CheckCircle2 } from 'lucide-react';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function ExecutionScreen() {
  const { currentPlan, setScreen } = useNowgoStore();
  const [currentSpotIndex, setCurrentSpotIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [expandSchedule, setExpandSchedule] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentPlan) {
    return null;
  }

  const currentSpot = currentPlan.spots[currentSpotIndex];
  const nextSpot = currentPlan.spots[currentSpotIndex + 1];
  const progress = Math.min((elapsedTime / (currentSpot.duration * 60)) * 100, 100);

  const handleNext = () => {
    if (currentSpotIndex < currentPlan.spots.length - 1) {
      setCurrentSpotIndex(currentSpotIndex + 1);
      setElapsedTime(0);
    }
  };

  const handleComplete = () => {
    setShowExitDialog(false);
    setScreen('dashboard');
  };

  const isLastSpot = currentSpotIndex === currentPlan.spots.length - 1;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div
        className="relative h-40 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/1853542/pexels-photo-1853542.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
        <header className="relative z-10 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium text-white">Live</span>
              </div>
              <span className="text-white/80 text-sm tabular-nums">{formatTime(elapsedTime)}</span>
            </div>
            <button
              onClick={() => setShowExitDialog(true)}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </header>

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-white">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">
                Spot {currentSpotIndex + 1} of {currentPlan.spots.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col px-6 py-6 overflow-y-auto pb-32 -mt-4">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          <div className="bg-white border-2 border-green-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-700 uppercase tracking-wider">Current Location</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentSpot.name}</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1 font-medium">Arrival</p>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{currentSpot.time}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1 font-medium">Duration</p>
                <p className="text-xl font-bold text-gray-900">{currentSpot.duration}min</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Progress</span>
                <span className="text-green-600 font-bold tabular-nums">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-1000 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 text-right tabular-nums">
                {Math.max(0, currentSpot.duration - Math.floor(elapsedTime / 60))} min remaining
              </p>
            </div>
          </div>

          {nextSpot && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Up Next</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">{nextSpot.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  5 min walk
                </span>
                <span>Arriving at {nextSpot.time}</span>
              </div>
            </div>
          )}

          {currentPlan.spots.slice(currentSpotIndex + 1).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <button
                onClick={() => setExpandSchedule(!expandSchedule)}
                className="flex items-center justify-between w-full"
              >
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Remaining Schedule</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandSchedule ? 'rotate-180' : ''}`}
                />
              </button>

              {expandSchedule && (
                <div className="space-y-2 mt-4">
                  {currentPlan.spots.slice(currentSpotIndex + 1).map((spot, idx) => (
                    <div
                      key={spot.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {currentSpotIndex + idx + 2}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{spot.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{spot.time} - {spot.duration}min</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {isLastSpot ? (
            <button
              onClick={() => setShowExitDialog(true)}
              className="w-full py-4 px-6 rounded-xl font-semibold transition-all bg-green-500 text-white hover:bg-green-600 shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Complete Plan
            </button>
          ) : (
            <>
              <button
                onClick={handleNext}
                className="w-full py-4 px-6 rounded-xl font-semibold transition-all bg-blue-500 text-white hover:bg-blue-600 shadow-lg flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                Next Spot
              </button>
              <button
                onClick={() => setShowExitDialog(true)}
                className="w-full py-3 px-6 rounded-xl font-medium transition-all bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              >
                End Plan
              </button>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 text-lg font-bold">End this plan?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 text-sm">
              You'll return to the home screen. Your progress won't be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 rounded-xl py-3 px-5 font-medium">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleComplete}
              className="bg-blue-500 text-white hover:bg-blue-600 rounded-xl py-3 px-5 font-medium"
            >
              End Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
