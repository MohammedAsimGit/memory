'use client';

import React from 'react';
import { ExportData } from './jsonExporter';
import { formatDate, formatTime, getMoodEmoji, getWeatherEmoji } from '@/lib/utils';

interface BookTemplateProps {
  data: ExportData;
  includeLocked: boolean;
}

export default function BookTemplate({ data, includeLocked }: BookTemplateProps) {
  const { settings, memories, journals, specialDays, letters, timeCapsules, comments, music } = data;

  const partner1 = settings?.partnerName1 || 'Asim';
  const partner2 = settings?.partnerName2 || 'My Love';

  // Calculate stats
  const relationshipStart = settings?.relationshipStartDate
    ? new Date(settings.relationshipStartDate)
    : null;
  const daysTogether = relationshipStart
    ? Math.floor((new Date().getTime() - relationshipStart.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const totalPhotos = memories.reduce((c, m) => c + (m.images?.length || 0), 0) +
    timeCapsules.reduce((c, tc) => c + (tc.images?.length || 0), 0);

  // Group memories for timeline/stats
  const moods = memories.map((m) => m.mood).filter((m): m is string => Boolean(m));
  const moodCounts = moods.reduce((acc: Record<string, number>, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {});
  const topMood = Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a])[0] || 'loved';

  const locations = memories.map((m) => m.location).filter((l): l is string => Boolean(l));
  const locCounts = locations.reduce((acc: Record<string, number>, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {});
  const topLocation = Object.keys(locCounts).sort((a, b) => locCounts[b] - locCounts[a])[0] || 'Our Favorite Place';

  // Create page numbering helper
  let pageCounter = 1;
  const getNextPageNum = () => pageCounter++;

  return (
    <div
      id="story-book-container"
      className="bg-slate-100 p-8 flex flex-col items-center gap-8 font-sans text-slate-800"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* CSS Styles to force PDF fonts & sizes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        .story-page {
          width: 794px;
          height: 1123px;
          position: relative;
          background: #ffffff;
          box-sizing: border-box;
          padding: 60px;
          display: flex;
          flex-col: column;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          margin-bottom: 20px;
        }
        .font-serif-title {
          font-family: 'Playfair Display', serif;
        }
        .page-num {
          position: absolute;
          bottom: 30px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
          font-weight: 500;
        }
        .page-header {
          position: absolute;
          top: 30px;
          left: 60px;
          right: 60px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 6px;
        }
        .bubble-me {
          background: #e0f2fe;
          border-radius: 18px 18px 18px 2px;
          border: 1px solid #bae6fd;
        }
        .bubble-her {
          background: #faf5ff;
          border-radius: 18px 18px 2px 18px;
          border: 1px solid #f3e8ff;
        }
      ` }} />

      {/* ==================== PAGE 1: COVER PAGE ==================== */}
      <div className="story-page bg-gradient-to-br from-[#B3E5FC] via-[#E1F5FE] to-[#EAF6FF] flex flex-col justify-between items-center text-center border-[8px] border-white rounded-[24px]">
        <div className="mt-8 text-xs font-semibold tracking-[0.2em] text-[#1976D2]/60 uppercase">
          Our Personal Keepers
        </div>

        <div className="flex flex-col items-center my-auto">
          {/* Heart Illustration */}
          <div className="w-24 h-24 bg-white/60 backdrop-blur-md rounded-[2rem] flex items-center justify-center text-5xl shadow-xl shadow-blue-400/20 mb-8 animate-pulse">
            ❤️
          </div>
          
          <h1 className="font-serif-title text-5xl font-black text-[#1976D2] leading-tight mb-2">
            Our Love Story
          </h1>
          
          <div className="h-0.5 w-16 bg-[#2196F3] my-6" />

          <div className="font-serif-title text-2xl font-bold text-slate-700 flex items-center gap-3">
            <span>{partner1}</span>
            <span className="text-red-400 text-lg">♡</span>
            <span>{partner2}</span>
          </div>

          <div className="mt-12 text-sm text-slate-500 max-w-[280px] leading-relaxed italic">
            &ldquo;Every memory. Every laugh. Every journey. Written together.&rdquo;
          </div>
        </div>

        <div className="mb-4 flex flex-col items-center">
          <div className="text-xs font-bold text-slate-400">
            {new Date().getFullYear()} Edition
          </div>
          <div className="text-[10px] text-[#1976D2]/40 font-medium mt-2 flex items-center gap-1">
            Created with ❤️ using Our Story
          </div>
        </div>
      </div>

      {/* ==================== PAGE 2: TABLE OF CONTENTS ==================== */}
      <div className="story-page flex flex-col justify-between">
        <div className="page-header">
          <span>OUR LOVE STORY</span>
          <span>TABLE OF CONTENTS</span>
        </div>

        <div className="my-auto px-8">
          <h2 className="font-serif-title text-3xl font-bold text-slate-800 mb-10 flex items-center gap-2">
            Contents <span className="text-[#2196F3]">♡</span>
          </h2>

          <div className="space-y-6 text-sm font-medium text-slate-600">
            {[
              { num: '01', title: 'Beginning of Our Journey', page: '3' },
              { num: '02', title: 'First Shared Memories', page: '4' },
              { num: '03', title: 'Our Special Milestones', page: '6' },
              { num: '04', title: 'Daily Journals & Thoughts', page: '7' },
              { num: '05', title: 'Love Letters & Sealed Notes', page: '9' },
              { num: '06', title: 'Locked & Unlocked Time Capsules', page: '10' },
              { num: '07', title: 'Shared Photo Gallery', page: '11' },
              { num: '08', title: 'Statistics of Us', page: '12' },
              { num: '09', title: 'Our Story Continues...', page: '13' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-xs text-[#2196F3] font-bold">{item.num}</span>
                  <span className="text-slate-800">{item.title}</span>
                  <div className="flex-1 border-b border-dashed border-slate-200 mx-2 mt-1" />
                </div>
                <span className="text-[#2196F3] font-bold">{item.page}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="page-num">Page {getNextPageNum()}</div>
      </div>

      {/* ==================== PAGE 3: BEGINNING PAGE ==================== */}
      <div className="story-page flex flex-col justify-between">
        <div className="page-header">
          <span>OUR LOVE STORY</span>
          <span>THE BEGINNING</span>
        </div>

        <div className="my-auto flex flex-col">
          <div className="text-center mb-8">
            <span className="text-4xl">🌱</span>
            <h2 className="font-serif-title text-3xl font-bold text-slate-800 mt-2">Our Journey</h2>
            <p className="text-xs text-slate-400 mt-1">How it all began and where we are today</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-sky-50/70 rounded-2xl p-5 border border-sky-100 flex flex-col items-center text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Relationship Started</span>
              <span className="text-lg font-bold text-[#1976D2] mt-2">
                {relationshipStart ? relationshipStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'July 10, 2026'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">An unforgettable date</span>
            </div>

            <div className="bg-pink-50/70 rounded-2xl p-5 border border-pink-100 flex flex-col items-center text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Together For</span>
              <span className="text-2xl font-black text-pink-500 mt-1">{daysTogether} Days</span>
              <span className="text-[10px] text-slate-400 mt-1">of pure happiness & love</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { val: memories.length, label: 'Memories', emoji: '📸' },
              { val: totalPhotos, label: 'Photos', emoji: '🖼️' },
              { val: letters.length, label: 'Letters', emoji: '💌' },
              { val: journals.length, label: 'Journals', emoji: '📔' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col items-center text-center">
                <span className="text-xl mb-1">{stat.emoji}</span>
                <span className="text-lg font-bold text-slate-800 leading-none">{stat.val}</span>
                <span className="text-[9px] font-semibold text-slate-400 mt-1 uppercase tracking-wider leading-none">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-sky-50 to-pink-50 rounded-2xl p-5 border border-sky-100/50 mt-4 text-center">
            <p className="text-xs italic text-slate-600 leading-relaxed">
              &ldquo;We began our book of life together, writing the pages with love, adventures, 
              laughter, and memories. Every day we grow together is another beautiful sentence in our story.&rdquo;
            </p>
          </div>
        </div>

        <div className="page-num">Page {getNextPageNum()}</div>
      </div>

      {/* ==================== MEMORY PAGES ==================== */}
      {memories.map((memory) => (
        <div key={memory._id} className="story-page flex flex-col justify-between">
          <div className="page-header">
            <span>OUR STORIES &amp; MEMORIES</span>
            <span>{memory.title.toUpperCase()}</span>
          </div>

          <div className="my-auto flex flex-col gap-4">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif-title text-2xl font-black text-slate-800 leading-tight">
                  {memory.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-medium">
                  <span>📅 {formatDate(memory.date)} {memory.time && `at ${formatTime(memory.time)}`}</span>
                  {memory.location && <span>• 📍 {memory.location}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-[#1976D2] border border-sky-100">
                  ✍️ {memory.author === 'me' ? partner1 : partner2}
                </span>
                <div className="flex gap-2">
                  {memory.mood && <span className="text-xs" title="Mood">{getMoodEmoji(memory.mood)} {memory.mood}</span>}
                  {memory.weather && <span className="text-xs" title="Weather">{getWeatherEmoji(memory.weather)} {memory.weather}</span>}
                </div>
              </div>
            </div>

            {/* Images Grid */}
            {memory.images && memory.images.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                <img
                  src={memory.images[0]}
                  alt={memory.title}
                  className="w-full h-56 object-cover rounded-2xl border border-slate-100 shadow-sm"
                  crossOrigin="anonymous"
                />
                {memory.images.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {memory.images.slice(1, 4).map((imgUrl: string, idx: number) => (
                      <img
                        key={idx}
                        src={imgUrl}
                        alt="attachment"
                        className="w-full h-16 object-cover rounded-xl border border-slate-100 shadow-sm"
                        crossOrigin="anonymous"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 whitespace-pre-line max-h-44 overflow-hidden">
              {memory.description}
            </div>

            {/* Comments bubbles */}
            {comments.filter((c) => c.memoryId === memory._id).length > 0 && (
              <div className="space-y-2 mt-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comments</h4>
                <div className="space-y-2 max-h-28 overflow-hidden">
                  {comments
                    .filter((c) => c.memoryId === memory._id)
                    .slice(0, 2)
                    .map((c) => {
                      const isCommentMe = c.author === 'me';
                      return (
                        <div key={c._id} className={`flex ${isCommentMe ? 'justify-start' : 'justify-end'}`}>
                          <div className={`p-2.5 max-w-[80%] text-xs shadow-sm ${isCommentMe ? 'bubble-me' : 'bubble-her'}`}>
                            <p className="font-bold text-[10px] mb-0.5 text-slate-500 leading-none">
                              {isCommentMe ? partner1 : partner2}
                            </p>
                            <p className="text-slate-700 font-medium leading-normal">{c.content}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          <div className="page-num">Page {getNextPageNum()}</div>
        </div>
      ))}

      {/* ==================== JOURNAL PAGES ==================== */}
      {journals.map((journal) => (
        <div key={journal._id} className="story-page flex flex-col justify-between">
          <div className="page-header">
            <span>DAILY JOURNALS &amp; DIARY</span>
            <span>JOURNAL ENTRY</span>
          </div>

          <div className="my-auto flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-pink-100 pb-3">
              <div>
                <span className="text-4xl">📔</span>
                <h3 className="font-serif-title text-2xl font-bold text-slate-800 mt-2">Journal Entry</h3>
                <span className="text-xs text-slate-400 font-medium">📅 {formatDate(journal.date)} • {formatTime(journal.time)}</span>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-600 border border-pink-100">
                  ✒️ {journal.author === 'me' ? partner1 : partner2}
                </span>
                {journal.mood && (
                  <div className="mt-2 text-xs text-slate-500">
                    Mood: {getMoodEmoji(journal.mood)} {journal.mood}
                  </div>
                )}
              </div>
            </div>

            {journal.photo && (
              <img
                src={journal.photo}
                alt="Journal photo"
                className="w-full h-48 object-cover rounded-2xl border border-slate-100 shadow-sm"
                crossOrigin="anonymous"
              />
            )}

            <div
              className="text-base text-slate-700 leading-relaxed whitespace-pre-line p-6 rounded-3xl bg-slate-50/70 border border-slate-100"
              style={{ minHeight: '180px', backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 0)', backgroundSize: '24px 24px' }}
            >
              {journal.content}
            </div>
          </div>

          <div className="page-num">Page {getNextPageNum()}</div>
        </div>
      ))}

      {/* ==================== LETTER PAGES ==================== */}
      {letters.map((letter) => {
        const isLocked = new Date(letter.unlockDate) > new Date() && letter.isLocked;
        return (
          <div key={letter._id} className="story-page flex flex-col justify-between">
            <div className="page-header">
              <span>LOVE LETTERS TO FUTURE SELVES</span>
              <span>LETTER</span>
            </div>

            <div className="my-auto flex flex-col gap-6 items-center">
              <div className="text-center w-full border-b border-slate-100 pb-4">
                <span className="text-5xl">💌</span>
                <h3 className="font-serif-title text-2xl font-bold text-slate-800 mt-3">{letter.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Written by {letter.author === 'me' ? partner1 : partner2}</p>
              </div>

              {isLocked && !includeLocked ? (
                // Redacted/Locked letter template
                <div className="flex flex-col items-center py-12 px-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center max-w-md w-full">
                  <span className="text-5xl mb-4 animate-bounce">🔒</span>
                  <h4 className="font-bold text-slate-800 text-lg">This letter is sealed</h4>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    It was sealed to be opened at a future date:
                  </p>
                  <span className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-2xl text-sm mt-4">
                    📅 Unlock Date: {formatDate(letter.unlockDate)}
                  </span>
                </div>
              ) : (
                // Full letter template
                <div className="w-full bg-[#FCFAF2] rounded-3xl p-8 border border-[#EBE3CD] shadow-inner flex flex-col justify-between" style={{ minHeight: '350px' }}>
                  <div className="text-sm text-slate-700 leading-relaxed font-serif whitespace-pre-line italic">
                    {letter.content}
                  </div>
                  <div className="border-t border-[#EBE3CD] pt-4 mt-6 flex justify-between items-center text-xs text-slate-400 font-medium">
                    <span>Unlock Date: {formatDate(letter.unlockDate)}</span>
                    <span className="font-serif-title italic font-bold">With love, {letter.author === 'me' ? partner1 : partner2}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="page-num">Page {getNextPageNum()}</div>
          </div>
        );
      })}

      {/* ==================== TIME CAPSULE ==================== */}
      {timeCapsules.map((capsule) => {
        const isLocked = new Date(capsule.unlockDate) > new Date() && capsule.isLocked;
        return (
          <div key={capsule._id} className="story-page flex flex-col justify-between">
            <div className="page-header">
              <span>TIME CAPSULES</span>
              <span>CAPSULE</span>
            </div>

            <div className="my-auto flex flex-col gap-6 items-center">
              <div className="text-center w-full border-b border-slate-100 pb-4">
                <span className="text-5xl">🔮</span>
                <h3 className="font-serif-title text-2xl font-bold text-slate-800 mt-3">{capsule.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Locked by {capsule.author === 'me' ? partner1 : partner2}</p>
              </div>

              {isLocked && !includeLocked ? (
                // Locked capsule — content redacted
                <div className="flex flex-col items-center py-12 px-6 bg-indigo-50/50 rounded-3xl border border-dashed border-indigo-200 text-center max-w-md w-full">
                  <span className="text-5xl mb-4">🔒</span>
                  <h4 className="font-bold text-slate-800 text-lg">Time Capsule Locked</h4>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    This capsule holds valuable memories sealed until:
                  </p>
                  <span className="px-4 py-2 bg-indigo-100/70 border border-indigo-200 text-indigo-700 font-bold rounded-2xl text-sm mt-4">
                    📅 Unlock Date: {formatDate(capsule.unlockDate)}
                  </span>
                </div>
              ) : (
                // Unlocked capsule contents
                <div className="w-full flex flex-col gap-4">
                  {capsule.images && capsule.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {capsule.images.slice(0, 2).map((img: string, idx: number) => (
                        <img
                          key={idx}
                          src={img}
                          alt="capsule asset"
                          className="w-full h-36 object-cover rounded-2xl shadow-sm border border-slate-100"
                          crossOrigin="anonymous"
                        />
                      ))}
                    </div>
                  )}
                  <div className="text-sm text-slate-700 bg-slate-50 p-5 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-line">
                    {capsule.content}
                  </div>
                  <div className="text-[10px] text-slate-400 text-right mt-2">
                    Unlocked on: {capsule.openedAt ? formatDate(capsule.openedAt) : formatDate(capsule.unlockDate)}
                  </div>
                </div>
              )}
            </div>

            <div className="page-num">Page {getNextPageNum()}</div>
          </div>
        );
      })}

      {/* ==================== GALLERY COLLAGE PAGE ==================== */}
      <div className="story-page flex flex-col justify-between">
        <div className="page-header">
          <span>OUR LOVE STORY</span>
          <span>PHOTO GALLERY</span>
        </div>

        <div className="my-auto flex flex-col gap-4">
          <div className="text-center mb-2">
            <span className="text-4xl">🖼️</span>
            <h3 className="font-serif-title text-2xl font-bold text-slate-800 mt-2">Shared Gallery</h3>
            <p className="text-xs text-slate-400 mt-1">A visual history of our favorite captures</p>
          </div>

          {/* Collage of images from memories */}
          <div className="grid grid-cols-3 gap-2">
            {memories
              .flatMap((m) => m.images)
              .filter(Boolean)
              .slice(0, 6)
              .map((url, idx) => (
                <div key={idx} className="aspect-square relative overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                  <img
                    src={url}
                    alt="gallery capture"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              ))}
          </div>

          {memories.flatMap((m) => m.images).filter(Boolean).length === 0 && (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400">No photos shared yet in memories.</p>
            </div>
          )}
        </div>

        <div className="page-num">Page {getNextPageNum()}</div>
      </div>

      {/* ==================== MUSIC PLAYLIST PAGE ==================== */}
      <div className="story-page flex flex-col justify-between">
        <div className="page-header">
          <span>OUR LOVE STORY</span>
          <span>SHARED PLAYLIST</span>
        </div>

        <div className="my-auto flex flex-col gap-4">
          <div className="text-center mb-2">
            <span className="text-4xl">🎵</span>
            <h3 className="font-serif-title text-2xl font-bold text-slate-800 mt-2">Our Relationship Soundtrack</h3>
            <p className="text-xs text-slate-400 mt-1">The songs that define our love and moments</p>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-hidden">
            {music.slice(0, 6).map((track) => (
              <div key={track._id} className="flex items-center gap-3 p-3 bg-sky-50/70 rounded-2xl border border-sky-100/50">
                <div className="w-10 h-10 bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                  🎧
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{track.title}</p>
                  <p className="text-[10px] text-slate-500 truncate">{track.artist}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] px-2 py-0.5 rounded bg-white text-slate-400 border border-slate-200">
                    {track.platform.toUpperCase()}
                  </span>
                  <a href={track.url} target="_blank" rel="noreferrer" className="text-[9px] text-[#2196F3] font-bold hover:underline">
                    Listen Link
                  </a>
                </div>
              </div>
            ))}

            {music.length === 0 && (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-400">No tracks added to our playlist yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="page-num">Page {getNextPageNum()}</div>
      </div>

      {/* ==================== SPECIAL DAYS MILESTONES ==================== */}
      <div className="story-page flex flex-col justify-between">
        <div className="page-header">
          <span>OUR LOVE STORY</span>
          <span>SPECIAL DATES &amp; MILESTONES</span>
        </div>

        <div className="my-auto flex flex-col gap-4">
          <div className="text-center mb-2">
            <span className="text-4xl">💕</span>
            <h3 className="font-serif-title text-2xl font-bold text-slate-800 mt-2">Special Milestones</h3>
            <p className="text-xs text-slate-400 mt-1">Timelines of key relationship milestones</p>
          </div>

          <div className="relative pl-6 space-y-4 max-h-[350px] overflow-hidden">
            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-sky-400 via-pink-400 to-indigo-400" />
            
            {specialDays.slice(0, 5).map((sd) => (
              <div key={sd._id} className="relative pl-6">
                <div
                  className="absolute left-[-18px] top-1.5 w-[11px] h-[11px] rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: sd.color || '#2196F3' }}
                />
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/80">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800">
                      {sd.icon || '❤️'} {sd.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold">{formatDate(sd.date)}</span>
                  </div>
                  {sd.description && (
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">{sd.description}</p>
                  )}
                </div>
              </div>
            ))}

            {specialDays.length === 0 && (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-400">No special days added yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="page-num">Page {getNextPageNum()}</div>
      </div>

      {/* ==================== PAGE 12: INFOGRAPHIC STATISTICS PAGE ==================== */}
      <div className="story-page flex flex-col justify-between">
        <div className="page-header">
          <span>OUR LOVE STORY</span>
          <span>STATISTICS OF US</span>
        </div>

        <div className="my-auto flex flex-col gap-4">
          <div className="text-center">
            <span className="text-4xl">📊</span>
            <h3 className="font-serif-title text-2xl font-bold text-slate-800 mt-2">Statistics of Us</h3>
            <p className="text-xs text-slate-400 mt-1">Our relationship in numbers and findings</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Together For</span>
              <span className="text-xl font-black text-[#1976D2] mt-1">{daysTogether} Days</span>
            </div>
            
            <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Moments</span>
              <span className="text-xl font-black text-pink-500 mt-1">{memories.length} Memories</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center col-span-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Mood &amp; Weather</span>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs font-bold text-slate-700">Mood: {topMood} {getMoodEmoji(topMood)}</span>
                    <span className="text-xs font-bold text-slate-700">Place: {topLocation}</span>
                  </div>
                </div>
                <span className="text-2xl">😊</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Item Breakdown</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                <span className="text-lg">📸</span>
                <p className="text-xs font-bold mt-1">{memories.length}</p>
                <p className="text-[8px] text-slate-400 uppercase">Memories</p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                <span className="text-lg">📔</span>
                <p className="text-xs font-bold mt-1">{journals.length}</p>
                <p className="text-[8px] text-slate-400 uppercase">Journals</p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                <span className="text-lg">💌</span>
                <p className="text-xs font-bold mt-1">{letters.length}</p>
                <p className="text-[8px] text-slate-400 uppercase">Letters</p>
              </div>
            </div>
          </div>
        </div>

        <div className="page-num">Page {getNextPageNum()}</div>
      </div>

      {/* ==================== PAGE 13: CLOSING PAGE ==================== */}
      <div className="story-page bg-gradient-to-tr from-[#EAF6FF] to-white flex flex-col justify-between items-center text-center rounded-[24px] border border-slate-100">
        <div className="page-header w-full px-12 border-none">
          <span>OUR LOVE STORY</span>
          <span>CLOSING NOTE</span>
        </div>

        <div className="flex flex-col items-center my-auto">
          <div className="text-6xl mb-6 animate-pulse">🌱</div>
          <h2 className="font-serif-title text-3xl font-black text-slate-800">Our Story Continues...</h2>
          <div className="h-0.5 w-12 bg-pink-400 my-5" />
          
          <p className="text-sm text-slate-500 max-w-[320px] leading-relaxed italic">
            &ldquo;Every ending is another beginning. Thank you for writing this story together.&rdquo;
          </p>

          <div className="font-serif-title text-xl font-bold mt-8 flex items-center gap-2 text-slate-700">
            <span>{partner1}</span>
            <span className="text-red-400 font-bold">♡</span>
            <span>{partner2}</span>
          </div>
        </div>

        <div className="mb-4 text-[9px] text-slate-400 tracking-wider uppercase font-semibold">
          To many more beautiful chapters...
        </div>
      </div>
    </div>
  );
}
