'use client';

import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getEventsByDomain } from '@/lib/events-data';
import EventList from '@/components/EventList';
import { convertToDashboardEvent } from '@/lib/events-data';
import { Event } from '@/types';

// 공통 데이터에서 112 치안(A) 이벤트만 필터링
const getCrimeEvents = () => {
  return getEventsByDomain('A');
};

export default function CrimeAgentPage() {
  const router = useRouter();

  // 이벤트를 대시보드 형식으로 변환
  const events: Event[] = useMemo(() => {
    const crimeEvents = getCrimeEvents();
    return crimeEvents
      .map((event, index) => convertToDashboardEvent(event, index))
      .filter((event) => event.processingStage !== '종결');
  }, []);

  const handleEventSelect = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event?.eventId) {
      router.push(`/event/${event.eventId}`);
    }
  };

  const handleEventHover = (eventId: string | null) => {
    // 호버 처리 (필요시 구현)
  };

  return (
    <div className="flex flex-col h-screen bg-[#161719] overflow-hidden">
      <header className="flex h-16 items-center justify-between bg-[#1a1a1a] border-b border-[#31353a] px-6" style={{ borderWidth: '1px' }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-24 h-5 flex items-center justify-center">
              <img src="/logo.svg" alt="CUVIA Logo" className="h-5 w-auto object-contain" />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Icon icon="mdi:shield-alert" className="w-6 h-6 text-white" />
            <span className="text-xl font-semibold text-white">112 치안 · 방범 Agent</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/agent-hub" className="px-4 py-2 bg-[#36383B] hover:bg-[#2a2a2a] text-white rounded-full transition-colors text-sm border border-[#31353a]" style={{ borderWidth: '1px' }}>
            Agent Hub
          </Link>
          <Link href="/" className="px-4 py-2 bg-[#36383B] hover:bg-[#2a2a2a] text-white rounded-full transition-colors text-sm border border-[#31353a]" style={{ borderWidth: '1px' }}>
            대시보드
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 이벤트 리스트 */}
        <div className="w-full">
          <EventList
            events={events}
            onEventSelect={handleEventSelect}
            onEventHover={handleEventHover}
          />
          </div>
      </div>
    </div>
  );
}
