'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { DashboardScreen } from '@/components/dashboard/DashboardScreen';
import { QuickPlanScreen } from '@/components/dashboard/QuickPlanScreen';
import { MoodScreen } from '@/components/dashboard/MoodScreen';
import { ThemesScreen } from '@/components/dashboard/ThemesScreen';
import { NearbyScreen } from '@/components/dashboard/NearbyScreen';
import { ProfileScreen } from '@/components/dashboard/ProfileScreen';
import { PlanScreen } from '@/components/plan/PlanScreen';
import { ExecutionScreen } from '@/components/execution/ExecutionScreen';

export default function Home() {
<<<<<<< HEAD
  const { user, loading } = useAuth();
=======
  const { user, loading, isGuest } = useAuth();
>>>>>>> 939b30f (first commit)
  const { currentScreen, setScreen } = useNowgoStore();

  useEffect(() => {
    if (!loading) {
<<<<<<< HEAD
      if (user) {
=======
      if (user || isGuest) {
>>>>>>> 939b30f (first commit)
        if (currentScreen === 'auth') {
          setScreen('dashboard');
        }
      } else {
        setScreen('auth');
      }
    }
<<<<<<< HEAD
  }, [user, loading, currentScreen, setScreen]);
=======
  }, [user, loading, isGuest, currentScreen, setScreen]);
>>>>>>> 939b30f (first commit)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Now Go</h1>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

<<<<<<< HEAD
  if (!user) {
=======
  if (!user && !isGuest) {
>>>>>>> 939b30f (first commit)
    return <AuthScreen />;
  }

  return (
    <>
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'quickplan' && <QuickPlanScreen />}
      {currentScreen === 'mood' && <MoodScreen />}
      {currentScreen === 'themes' && <ThemesScreen />}
      {currentScreen === 'nearby' && <NearbyScreen />}
      {currentScreen === 'profile' && <ProfileScreen />}
      {currentScreen === 'plan' && <PlanScreen />}
      {currentScreen === 'executing' && <ExecutionScreen />}
    </>
  );
}
