'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'verify' | 'send' | 'success';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidUrl = (s: string) => /^https?:\/\/.+/.test(s.trim());

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconTV = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
    <rect x="2.5" y="5" width="19" height="13" rx="2" />
    <path d="m7 2 5 3 5-3" />
    <circle cx="18" cy="9" r="0.6" fill="currentColor" />
  </svg>
);

const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconWarning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────

const Spinner = () => (
  <span style={{
    display: 'inline-block',
    width: 16, height: 16,
    border: '2px solid rgba(26,18,8,0.3)',
    borderTop: '2px solid #1A1208',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
  }} />
);

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.3em',
        color: 'rgba(255,255,255,0.3)',
        fontWeight: 600,
      }}>
        {label}
        {optional && <span style={{ marginLeft: 8, textTransform: 'none', letterSpacing: 'normal', color: 'rgba(255,255,255,0.18)', fontWeight: 400 }}>opsiyonel</span>}
      </label>
      {children}
    </div>
  );
}

// ─── ErrorBox ─────────────────────────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 16px', borderRadius: 12,
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.2)',
      color: 'rgba(252,165,165,0.9)', fontSize: 13, lineHeight: 1.5,
    }}>
      <IconWarning />
      {message}
    </div>
  );
}

// ─── PrimaryButton ────────────────────────────────────────────────────────────

function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, width: '100%', padding: '15px 24px',
        borderRadius: 14, border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontSize: 15, fontWeight: 700, letterSpacing: '0.02em',
        transition: 'all 0.15s',
        background: disabled || loading ? 'rgba(255,255,255,0.06)' : '#E8B567',
        color: disabled || loading ? 'rgba(255,255,255,0.2)' : '#1A1208',
        boxShadow: disabled || loading ? 'none' : '0 0 32px -8px #E8B567',
      }}
    >
      {loading && <Spinner />}
      {children}
      {!loading && !disabled && <IconArrow />}
    </button>
  );
}

// ─── DeviceBadge ──────────────────────────────────────────────────────────────

function DeviceBadge({ deviceId }: { deviceId: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 12,
      background: 'rgba(232,181,103,0.07)',
      border: '1px solid rgba(232,181,103,0.2)',
    }}>
      <span style={{ color: '#E8B567', opacity: 0.7 }}><IconTV /></span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.25em' }}>
          Bağlı TV
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: 16, color: 'rgba(232,181,103,0.9)', letterSpacing: '0.1em' }}>
          {deviceId}
        </span>
      </div>
      <span style={{
        marginLeft: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 24, height: 24, borderRadius: '50%',
        background: 'rgba(52,211,153,0.15)', color: '#34d399',
      }}>
        <IconCheck />
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const [step, setStep]               = useState<Step>('verify');
  const [deviceId, setDeviceId]       = useState('');
  const [deviceKey, setDeviceKey]     = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [listName, setListName]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // ── Adım 1: Cihaz doğrulama ─────────────────────────────────────────────────
  const handleVerify = async () => {
    const id  = deviceId.trim().toUpperCase();
    const key = deviceKey.trim().toLowerCase();
    if (!id || !key) return;

    setLoading(true);
    setError(null);

    const { data, error: dbErr } = await supabase
      .from('devices')
      .select('device_id')
      .eq('device_id', id)
      .eq('device_key', key)
      .single();

    setLoading(false);

    if (dbErr || !data) {
      setError(`TV bulunamadı. (${dbErr?.message ?? 'veri yok'}) — Kimlik: ${id} / Anahtar: ${key}`);
      return;
    }

    setDeviceId(id);
    setStep('send');
  };

  // ── Adım 2: Liste gönder ────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!isValidUrl(playlistUrl)) return;

    setLoading(true);
    setError(null);

    const { error: dbErr } = await supabase
      .from('devices')
      .update({
        playlist_url:  playlistUrl.trim(),
        playlist_name: listName.trim() || null,
      })
      .eq('device_id', deviceId)
      .eq('device_key', deviceKey.trim().toLowerCase());

    setLoading(false);

    if (dbErr) {
      setError('Gönderim başarısız oldu. Lütfen tekrar deneyin.');
      return;
    }

    setStep('success');
  };

  // ── Sıfırla ─────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep('verify');
    setDeviceId(''); setDeviceKey('');
    setPlaylistUrl(''); setListName('');
    setError(null);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .card { animation: fadeIn 0.3s ease; }
      `}</style>

      <main style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}>

        {/* ── Logo ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <div style={{
            display: 'grid', placeItems: 'center', width: 48, height: 48,
            borderRadius: 14, border: '1px solid rgba(232,181,103,0.4)',
            background: 'rgba(232,181,103,0.08)',
            boxShadow: '0 0 28px -10px #E8B567',
          }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontStyle: 'italic', fontWeight: 300, color: '#E8B567', lineHeight: 1, paddingTop: 1 }}>Z</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1 }}>ZUI Cloud Sync</span>
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>TV Playlist Manager</span>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="card" style={{
          width: '100%', maxWidth: 440,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '28px 24px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>

          {/* ══ Step 1: Doğrula ══ */}
          {step === 'verify' && <>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>TV&apos;nizi doğrulayın</h2>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                TV&apos;deki ZUI uygulamasını açın → Onboarding → ZUI Cloud Sync ekranındaki bilgileri girin.
              </p>
            </div>

            <Field label="TV Kimliği">
              <input
                value={deviceId}
                onChange={e => setDeviceId(e.target.value)}
                placeholder="5ADB-21C2"
                style={{ fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
              />
            </Field>

            <Field label="Cihaz Anahtarı">
              <input
                value={deviceKey}
                onChange={e => setDeviceKey(e.target.value)}
                placeholder="st5q8y"
                style={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
              />
            </Field>

            {error && <ErrorBox message={error} />}

            <PrimaryButton
              onClick={handleVerify}
              loading={loading}
              disabled={!deviceId.trim() || !deviceKey.trim()}
            >
              TV&apos;yi Doğrula
            </PrimaryButton>
          </>}

          {/* ══ Step 2: Liste Gönder ══ */}
          {step === 'send' && <>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Liste gönderin</h2>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                M3U URL&apos;ini girdikten sonra TV&apos;de <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Yeniden Yükle</strong>&apos;ye basın.
              </p>
            </div>

            <DeviceBadge deviceId={deviceId} />

            <Field label="M3U URL">
              <input
                value={playlistUrl}
                onChange={e => setPlaylistUrl(e.target.value)}
                placeholder="https://example.com/playlist.m3u"
                type="url"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
            </Field>

            <Field label="Liste Adı" optional>
              <input
                value={listName}
                onChange={e => setListName(e.target.value)}
                placeholder="Aile Listesi, Yedek..."
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
            </Field>

            {error && <ErrorBox message={error} />}

            <PrimaryButton
              onClick={handleSend}
              loading={loading}
              disabled={!isValidUrl(playlistUrl)}
            >
              TV&apos;ye Gönder
            </PrimaryButton>

            <button
              onClick={reset}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 13, cursor: 'pointer', padding: '4px 0' }}
            >
              ← Farklı TV seç
            </button>
          </>}

          {/* ══ Step 3: Başarı ══ */}
          {step === 'success' && <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '12px 0' }}>
              <div style={{
                display: 'grid', placeItems: 'center', width: 56, height: 56,
                borderRadius: '50%', background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.3)',
                color: '#34d399',
              }}>
                <IconCheck />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Liste gönderildi!</h2>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                  TV&apos;de Cloud Sync ekranındayken<br />
                  <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Yeniden Yükle</strong>&apos;ye basın.
                </p>
              </div>

              <DeviceBadge deviceId={deviceId} />

              <div style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>URL</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {playlistUrl}
                  </span>
                </div>
                {listName && <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span>Ad</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{listName}</span>
                </div>}
              </div>

              <button
                onClick={() => { setStep('send'); setPlaylistUrl(''); setListName(''); setError(null); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', borderRadius: 12,
                  background: 'rgba(232,181,103,0.08)', border: '1px solid rgba(232,181,103,0.2)',
                  color: 'rgba(232,181,103,0.8)', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', letterSpacing: '0.02em',
                }}
              >
                Yeni Liste Gönder
              </button>
            </div>
          </>}

        </div>

        {/* ── Footer ── */}
        <p style={{ marginTop: 28, fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          ZUI IPTV Player · Açık Kaynak · MIT
        </p>
      </main>
    </>
  );
}
