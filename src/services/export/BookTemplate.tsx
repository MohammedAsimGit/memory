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
      style={{
        background: '#f1f5f9',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        fontFamily: "'Inter', sans-serif",
        color: '#1e293b',
      }}
    >
      {/* CSS Styles to force PDF fonts & sizes - only PDF-compatible CSS */}
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
          flex-direction: column;
          overflow: hidden;
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
      `}} />

      {/* ==================== PAGE 1: COVER PAGE ==================== */}
      <div 
        className="story-page flex flex-col justify-between items-center text-center border-[8px] border-white rounded-[24px]"
        style={{
          background: 'linear-gradient(135deg, #B3E5FC, #E1F5FE, #EAF6FF)',
        }}
      >
        <div style={{ marginTop: '32px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.2em', color: 'rgba(25, 118, 210, 0.6)', textTransform: 'uppercase' }}>
          Our Personal Keepers
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto 0' }}>
          {/* Heart Illustration */}
          <div style={{
            width: '96px',
            height: '96px',
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            marginBottom: '32px'
          }}>
            ❤️
          </div>
          
          <h1 className="font-serif-title text-5xl font-black leading-tight mb-2" style={{ color: '#1976D2' }}>
            Our Love Story
          </h1>
          
          <div style={{
            height: '2px',
            width: '64px',
            background: '#2196F3',
            margin: '24px 0'
          }} />

          <div className="font-serif-title text-2xl font-bold flex items-center gap-3" style={{ color: '#334155' }}>
            <span>{partner1}</span>
            <span style={{ color: '#f87171', fontSize: '18px' }}>♡</span>
            <span>{partner2}</span>
          </div>

          <div style={{
            marginTop: '48px',
            fontSize: '14px',
            color: '#64748b',
            maxWidth: '280px',
            lineHeight: '1.6',
            fontStyle: 'italic'
          }}>
            &ldquo;Every memory. Every laugh. Every journey. Written together.&rdquo;
          </div>
        </div>

        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
            {new Date().getFullYear()} Edition
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(25, 118, 210, 0.4)', fontWeight: 500, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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

        <div style={{ margin: 'auto 0', padding: '0 32px' }}>
          <h2 className="font-serif-title text-3xl font-bold mb-10 flex items-center gap-2" style={{ color: '#1e293b' }}>
            Contents <span style={{ color: '#2196F3' }}>♡</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
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
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <span style={{ fontSize: '12px', color: '#2196F3', fontWeight: 700 }}>{item.num}</span>
                  <span style={{ color: '#1e293b' }}>{item.title}</span>
                  <div style={{ flex: 1, borderBottom: '1px dashed #e2e8f0', marginLeft: '8px', marginTop: '4px' }} />
                </div>
                <span style={{ color: '#2196F3', fontWeight: 700 }}>{item.page}</span>
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

        <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '36px' }}>🌱</span>
            <h2 className="font-serif-title text-3xl font-bold mt-2" style={{ color: '#1e293b' }}>Our Journey</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>How it all began and where we are today</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ background: '#f0f9ff', borderRadius: '16px', padding: '20px', border: '1px solid #e0f2fe', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Relationship Started</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#1976D2', marginTop: '8px' }}>
                {relationshipStart ? relationshipStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'July 10, 2026'}
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>An unforgettable date</span>
            </div>

            <div style={{ background: '#fdf2f8', borderRadius: '16px', padding: '20px', border: '1px solid #fce7f3', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Together For</span>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#ec4899', marginTop: '4px' }}>{daysTogether} Days</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>of pure happiness & love</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
            {[
              { val: memories.length, label: 'Memories', emoji: '📸' },
              { val: totalPhotos, label: 'Photos', emoji: '🖼️' },
              { val: letters.length, label: 'Letters', emoji: '💌' },
              { val: journals.length, label: 'Journals', emoji: '📔' },
            ].map((stat, idx) => (
              <div key={idx} style={{ background: '#f8fafc', borderRadius: '16px', padding: '12px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.emoji}</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', lineHeight: '1' }}>{stat.val}</span>
                <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            background: 'linear-gradient(90deg, #f0f9ff, #fdf2f8)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(224, 242, 254, 0.5)',
            marginTop: '16px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#475569', lineHeight: '1.6' }}>
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
            <span>OUR STORIES & MEMORIES</span>
            <span>{memory.title.toUpperCase()}</span>
          </div>

          <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 className="font-serif-title text-2xl font-black leading-tight" style={{ color: '#1e293b' }}>
                  {memory.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                  <span>📅 {formatDate(memory.date)} {memory.time && `at ${formatTime(memory.time)}`}</span>
                  {memory.location && <span>• 📍 {memory.location}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f0f9ff', color: '#1976D2', border: '1px solid #e0f2fe' }}>
                  ✍️ {memory.author === 'me' ? partner1 : partner2}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {memory.mood && <span style={{ fontSize: '12px' }} title="Mood">{getMoodEmoji(memory.mood)} {memory.mood}</span>}
                  {memory.weather && <span style={{ fontSize: '12px' }} title="Weather">{getWeatherEmoji(memory.weather)} {memory.weather}</span>}
                </div>
              </div>
            </div>

            {/* Images Grid */}
            {memory.images && memory.images.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <img
                  src={memory.images[0]}
                  alt={memory.title}
                  style={{ width: '100%', height: '224px', objectFit: 'cover', borderRadius: '16px', border: '1px solid #f1f5f9' }}
                  crossOrigin="anonymous"
                />
                {memory.images.length > 1 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {memory.images.slice(1, 4).map((imgUrl: string, idx: number) => (
                      <img
                        key={idx}
                        src={imgUrl}
                        alt="attachment"
                        style={{ width: '100%', height: '64px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #f1f5f9' }}
                        crossOrigin="anonymous"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', fontWeight: 500, background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid rgba(241, 245, 249, 0.5)', whiteSpace: 'pre-line', maxHeight: '176px', overflow: 'hidden' }}>
              {memory.description}
            </div>

            {/* Comments bubbles */}
            {comments.filter((c) => c.memoryId === memory._id).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <h4 style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comments</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '112px', overflow: 'hidden' }}>
                  {comments
                    .filter((c) => c.memoryId === memory._id)
                    .slice(0, 2)
                    .map((c) => {
                      const isCommentMe = c.author === 'me';
                      return (
                        <div key={c._id} style={{ display: 'flex', justifyContent: isCommentMe ? 'flex-start' : 'flex-end' }}>
                          <div className={`p-2.5 max-w-[80%] text-xs shadow-sm ${isCommentMe ? 'bubble-me' : 'bubble-her'}`}>
                            <p style={{ fontWeight: 700, fontSize: '10px', marginBottom: '2px', color: '#64748b', lineHeight: '1' }}>
                              {isCommentMe ? partner1 : partner2}
                            </p>
                            <p style={{ color: '#334155', fontWeight: 500, lineHeight: '1.4' }}>{c.content}</p>
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
            <span>DAILY JOURNALS & DIARY</span>
            <span>JOURNAL ENTRY</span>
          </div>

          <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fce7f3', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '36px' }}>📔</span>
                <h3 className="font-serif-title text-2xl font-bold mt-2" style={{ color: '#1e293b' }}>Journal Entry</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>📅 {formatDate(journal.date)} • {formatTime(journal.time)}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ padding: '6px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, background: '#fdf2f8', color: '#db2777', border: '1px solid #fce7f3' }}>
                  ✒️ {journal.author === 'me' ? partner1 : partner2}
                </span>
                {journal.mood && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                    Mood: {getMoodEmoji(journal.mood)} {journal.mood}
                  </div>
                )}
              </div>
            </div>

            {journal.photo && (
              <img
                src={journal.photo}
                alt="Journal photo"
                style={{ width: '100%', height: '192px', objectFit: 'cover', borderRadius: '16px', border: '1px solid #f1f5f9' }}
                crossOrigin="anonymous"
              />
            )}

            <div
              style={{
                fontSize: '16px',
                color: '#334155',
                lineHeight: '1.6',
                whiteSpace: 'pre-line',
                padding: '24px',
                borderRadius: '24px',
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
                minHeight: '180px'
              }}
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

            <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', width: '100%', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                <span style={{ fontSize: '48px' }}>💌</span>
                <h3 className="font-serif-title text-2xl font-bold mt-3" style={{ color: '#1e293b' }}>{letter.title}</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Written by {letter.author === 'me' ? partner1 : partner2}</p>
              </div>

              {isLocked && !includeLocked ? (
                // Redacted/Locked letter template
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', background: '#f8fafc', borderRadius: '24px', border: '1px dashed #e2e8f0', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
                  <span style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</span>
                  <h4 style={{ fontWeight: 700, color: '#1e293b', fontSize: '18px' }}>This letter is sealed</h4>
                  <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px', lineHeight: '1.6' }}>
                    It was sealed to be opened at a future date:
                  </p>
                  <span style={{ padding: '8px 16px', background: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', fontWeight: 700, borderRadius: '16px', fontSize: '14px', marginTop: '16px' }}>
                    📅 Unlock Date: {formatDate(letter.unlockDate)}
                  </span>
                </div>
              ) : (
                // Full letter template
                <div style={{ width: '100%', background: '#fefcf5', borderRadius: '24px', padding: '32px', border: '1px solid #f0e9d8', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '350px' }}>
                  <div className="font-serif-title text-sm leading-relaxed italic" style={{ color: '#334155', whiteSpace: 'pre-line' }}>
                    {letter.content}
                  </div>
                  <div style={{ borderTop: '1px solid #f0e9d8', paddingTop: '16px', marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
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

            <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', width: '100%', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                <span style={{ fontSize: '48px' }}>🔮</span>
                <h3 className="font-serif-title text-2xl font-bold mt-3" style={{ color: '#1e293b' }}>{capsule.title}</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Locked by {capsule.author === 'me' ? partner1 : partner2}</p>
              </div>

              {isLocked && !includeLocked ? (
                // Locked capsule — content redacted
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', background: 'rgba(199, 210, 254, 0.3)', borderRadius: '24px', border: '1px dashed #c7d2fe', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
                  <span style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</span>
                  <h4 style={{ fontWeight: 700, color: '#1e293b', fontSize: '18px' }}>Time Capsule Locked</h4>
                  <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px', lineHeight: '1.6' }}>
                    This capsule holds valuable memories sealed until:
                  </p>
                  <span style={{ padding: '8px 16px', background: 'rgba(199, 210, 254, 0.7)', border: '1px solid #c7d2fe', color: '#4f46e5', fontWeight: 700, borderRadius: '16px', fontSize: '14px', marginTop: '16px' }}>
                    📅 Unlock Date: {formatDate(capsule.unlockDate)}
                  </span>
                </div>
              ) : (
                // Unlocked capsule contents
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {capsule.images && capsule.images.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {capsule.images.slice(0, 2).map((img: string, idx: number) => (
                        <img
                          key={idx}
                          src={img}
                          alt="capsule asset"
                          style={{ width: '100%', height: '144px', objectFit: 'cover', borderRadius: '16px', border: '1px solid #f1f5f9' }}
                          crossOrigin="anonymous"
                        />
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: '14px', color: '#334155', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                    {capsule.content}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'right', marginTop: '8px' }}>
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

        <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '36px' }}>🖼️</span>
            <h3 className="font-serif-title text-2xl font-bold mt-2" style={{ color: '#1e293b' }}>Shared Gallery</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>A visual history of our favorite captures</p>
          </div>

          {/* Collage of images from memories */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {memories
              .flatMap((m) => m.images)
              .filter(Boolean)
              .slice(0, 6)
              .map((url, idx) => (
                <div key={idx} style={{ aspectRatio: '1/1', position: 'relative', overflow: 'hidden', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <img
                    src={url}
                    alt="gallery capture"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    crossOrigin="anonymous"
                  />
                </div>
              ))}
          </div>

          {memories.flatMap((m) => m.images).filter(Boolean).length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>No photos shared yet in memories.</p>
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

        <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '36px' }}>🎵</span>
            <h3 className="font-serif-title text-2xl font-bold mt-2" style={{ color: '#1e293b' }}>Our Relationship Soundtrack</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>The songs that define our love and moments</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflow: 'hidden' }}>
            {music.slice(0, 6).map((track) => (
              <div key={track._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(224, 242, 254, 0.7)', borderRadius: '16px', border: '1px solid rgba(186, 230, 253, 0.5)' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #4FC3F7, #1976D2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0
                }}>
                  🎧
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
                  <p style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '9999px', background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0' }}>
                    {track.platform.toUpperCase()}
                  </span>
                  <a href={track.url} target="_blank" rel="noreferrer" style={{ fontSize: '9px', color: '#2196F3', fontWeight: 700, textDecoration: 'underline' }}>
                    Listen Link
                  </a>
                </div>
              </div>
            ))}

            {music.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>No tracks added to our playlist yet.</p>
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
          <span>SPECIAL DATES & MILESTONES</span>
        </div>

        <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '36px' }}>💕</span>
            <h3 className="font-serif-title text-2xl font-bold mt-2" style={{ color: '#1e293b' }}>Special Milestones</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Timelines of key relationship milestones</p>
          </div>

          <div style={{ position: 'relative', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '350px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: '10px', top: '8px', bottom: '8px', width: '2px', background: 'linear-gradient(180deg, #38bdf8, #f472b6, #818cf8)' }} />
            
            {specialDays.slice(0, 5).map((sd) => (
              <div key={sd._id} style={{ position: 'relative', paddingLeft: '24px' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-18px',
                    top: '6px',
                    width: '11px',
                    height: '11px',
                    borderRadius: '50%',
                    border: '2px solid #ffffff',
                    background: sd.color || '#2196F3'
                  }}
                />
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '16px', border: '1px solid rgba(241, 245, 249, 0.8)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                      {sd.icon || '❤️'} {sd.title}
                    </h4>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{formatDate(sd.date)}</span>
                  </div>
                  {sd.description && (
                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>{sd.description}</p>
                  )}
                </div>
              </div>
            ))}

            {specialDays.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>No special days added yet.</p>
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

        <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '36px' }}>📊</span>
            <h3 className="font-serif-title text-2xl font-bold mt-2" style={{ color: '#1e293b' }}>Statistics of Us</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Our relationship in numbers and findings</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '8px' }}>
            <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: '16px', border: '1px solid #e0f2fe', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Together For</span>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#1976D2', marginTop: '4px' }}>{daysTogether} Days</span>
            </div>
            
            <div style={{ padding: '16px', background: '#fdf2f8', borderRadius: '16px', border: '1px solid #fce7f3', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Moments</span>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#ec4899', marginTop: '4px' }}>{memories.length} Memories</span>
            </div>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'center', gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Mood & Place</span>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Mood: {topMood} {getMoodEmoji(topMood)}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Place: {topLocation}</span>
                  </div>
                </div>
                <span style={{ fontSize: '24px' }}>😊</span>
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px', background: 'rgba(248, 250, 252, 0.5)' }}>
            <h4 style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Item Breakdown</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ padding: '10px', background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '18px' }}>📸</span>
                <p style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>{memories.length}</p>
                <p style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase' }}>Memories</p>
              </div>
              <div style={{ padding: '10px', background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '18px' }}>📔</span>
                <p style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>{journals.length}</p>
                <p style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase' }}>Journals</p>
              </div>
              <div style={{ padding: '10px', background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '18px' }}>💌</span>
                <p style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>{letters.length}</p>
                <p style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase' }}>Letters</p>
              </div>
            </div>
          </div>
        </div>

        <div className="page-num">Page {getNextPageNum()}</div>
      </div>

      {/* ==================== PAGE 13: CLOSING PAGE ==================== */}
      <div 
        className="story-page flex flex-col justify-between items-center text-center rounded-[24px] border border-slate-100"
        style={{
          background: 'linear-gradient(135deg, #EAF6FF, #ffffff)',
        }}
      >
        <div className="page-header w-full px-12 border-none">
          <span>OUR LOVE STORY</span>
          <span>CLOSING NOTE</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>🌱</div>
          <h2 className="font-serif-title text-3xl font-black" style={{ color: '#1e293b' }}>Our Story Continues...</h2>
          <div style={{ height: '2px', width: '48px', background: '#f472b6', margin: '20px 0' }} />
          
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '320px', lineHeight: '1.6', fontStyle: 'italic' }}>
            &ldquo;Every ending is another beginning. Thank you for writing this story together.&rdquo;
          </p>

          <div className="font-serif-title text-xl font-bold mt-8 flex items-center gap-2" style={{ color: '#334155' }}>
            <span>{partner1}</span>
            <span style={{ color: '#f87171', fontWeight: 700 }}>♡</span>
            <span>{partner2}</span>
          </div>
        </div>

        <div style={{ marginBottom: '16px', fontSize: '9px', color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
          To many more beautiful chapters...
        </div>
      </div>
    </div>
  );
}
