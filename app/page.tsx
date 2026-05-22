'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ─── Keyed client factory ─────────────────────────────────────────────────────
// Creates a Supabase client with device auth headers so RLS policies can
// enforce both device_id AND device_key on every request.

function makeKeyedClient(deviceId: string, deviceKey: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'x-zui-device-id':  deviceId,
          'x-zui-device-key': deviceKey,
        },
      },
    }
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'verify' | 'manage';
type SourceType = 'm3u' | 'xtream';

type Playlist = {
  id: number;
  playlist_name: string | null;
  playlist_url: string;
  source_type: string;
  sent_at: string;
  loaded: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidUrl = (s: string) => /^https?:\/\/.+/.test(s.trim());

async function fetchPlaylists(client: SupabaseClient, deviceId: string): Promise<Playlist[]> {
  const { data } = await client
    .from('playlists')
    .select('id, playlist_name, playlist_url, source_type, sent_at, loaded')
    .eq('device_id', deviceId)
    .order('sent_at', { ascending: false });
  return (data ?? []) as Playlist[];
}

function hostname(url: string) {
  try { return new URL(url).hostname; } catch { return url; }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

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
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconWarning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4h6v2" />
  </svg>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────

const Spinner = ({ dark }: { dark?: boolean }) => (
  <span style={{
    display: 'inline-block', width: 14, height: 14, flexShrink: 0,
    border: `2px solid ${dark ? 'rgba(26,18,8,0.25)' : 'rgba(255,255,255,0.15)'}`,
    borderTop: `2px solid ${dark ? '#1A1208' : 'rgba(255,255,255,0.7)'}`,
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  }} />
);

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, optional, children }: {
  label: string; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
        {label}
        {optional && <span style={{ marginLeft: 8, textTransform: 'none', letterSpacing: 'normal', color: 'rgba(255,255,255,0.18)', fontWeight: 400 }}>optional</span>}
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
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
      color: 'rgba(252,165,165,0.9)', fontSize: 13, lineHeight: 1.5,
    }}>
      <IconWarning />{message}
    </div>
  );
}

// ─── SuccessBox ───────────────────────────────────────────────────────────────

function SuccessBox({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', borderRadius: 12,
      background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
      color: 'rgba(110,231,183,0.9)', fontSize: 13,
    }}>
      <IconCheck />{message}
    </div>
  );
}

// ─── PrimaryButton ────────────────────────────────────────────────────────────

function PrimaryButton({ onClick, disabled, loading, children }: {
  onClick: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode;
}) {
  const off = disabled || loading;
  return (
    <button onClick={onClick} disabled={off} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 10, width: '100%', padding: '15px 24px',
      borderRadius: 14, border: 'none', cursor: off ? 'not-allowed' : 'pointer',
      fontSize: 15, fontWeight: 700, letterSpacing: '0.02em', transition: 'all 0.15s',
      background: off ? 'rgba(255,255,255,0.06)' : '#E8B567',
      color: off ? 'rgba(255,255,255,0.2)' : '#1A1208',
      boxShadow: off ? 'none' : '0 0 32px -8px #E8B567',
    }}>
      {loading && <Spinner dark />}
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
      background: 'rgba(232,181,103,0.07)', border: '1px solid rgba(232,181,103,0.2)',
    }}>
      <span style={{ color: '#E8B567', opacity: 0.7 }}><IconTV /></span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.25em' }}>Connected TV</span>
        <span style={{ fontFamily: 'monospace', fontSize: 16, color: 'rgba(232,181,103,0.9)', letterSpacing: '0.1em' }}>{deviceId}</span>
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

// ─── PlaylistRow ──────────────────────────────────────────────────────────────

function PlaylistRow({ pl, onDelete, deleting }: {
  pl: Playlist; onDelete: (id: number) => void; deleting: boolean;
}) {
  const name = pl.playlist_name?.trim() || hostname(pl.playlist_url);
  const isXtream = pl.source_type === 'xtream';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 10,
      background: pl.loaded ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${pl.loaded ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)'}`,
      animation: 'fadeIn 0.25s ease',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, flexShrink: 0 }}>{isXtream ? '🔑' : '📋'}</span>
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: pl.loaded ? 'rgba(110,231,183,0.8)' : 'rgba(255,255,255,0.75)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </span>
          {pl.loaded && (
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(52,211,153,0.55)', flexShrink: 0 }}>
              ✓ loaded
            </span>
          )}
        </div>
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 2,
          fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {isXtream ? 'Xtream · ' : ''}{hostname(pl.playlist_url)} · {fmtDate(pl.sent_at)}
        </div>
      </div>
      <button
        onClick={() => !deleting && onDelete(pl.id)}
        disabled={deleting}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.12)',
          cursor: deleting ? 'not-allowed' : 'pointer', flexShrink: 0,
          background: 'rgba(239,68,68,0.06)', color: 'rgba(252,165,165,0.45)',
          transition: 'all 0.15s',
        }}
        onMouseOver={e => { if (!deleting) e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
      >
        {deleting ? <Spinner /> : <IconTrash />}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const [step, setStep]               = useState<Step>('verify');
  const [sourceType, setSourceType]   = useState<SourceType>('m3u');
  const [deviceId, setDeviceId]       = useState('');
  const [deviceKey, setDeviceKey]     = useState('');
  // M3U fields
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [listName, setListName]       = useState('');
  // Xtream fields
  const [xtHost, setXtHost]           = useState('');
  const [xtUser, setXtUser]           = useState('');
  const [xtPass, setXtPass]           = useState('');
  const [xtName, setXtName]           = useState('');

  const [playlists, setPlaylists]     = useState<Playlist[]>([]);
  const [loading, setLoading]         = useState(false);
  const [deleteId, setDeleteId]       = useState<number | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [addSuccess, setAddSuccess]   = useState(false);

  // Keyed client stored after successful verification
  const keyedClientRef = useRef<SupabaseClient | null>(null);

  const reload = useCallback(async (id: string) => {
    if (!keyedClientRef.current) return;
    setPlaylists(await fetchPlaylists(keyedClientRef.current, id));
  }, []);

  // ── Auto-verify from QR code URL params (?id=…&key=…) ────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qId  = params.get('id')?.toUpperCase().trim()  ?? '';
    const qKey = params.get('key')?.toLowerCase().trim() ?? '';
    if (!qId || !qKey) return;

    setDeviceId(qId);
    setDeviceKey(qKey);

    const autoVerify = async () => {
      setLoading(true); setError(null);
      const client = makeKeyedClient(qId, qKey);

      // Retry up to 5 times with 2-second gaps.
      // The TV app needs a moment to register itself in Supabase after launch —
      // this handles the race condition when the QR is scanned right away.
      const MAX_ATTEMPTS = 5;
      const DELAY_MS     = 2000;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const { data, error: dbErr } = await client
          .from('devices').select('device_id').eq('device_id', qId).single();
        if (!dbErr && data) {
          keyedClientRef.current = client;
          setPlaylists(await fetchPlaylists(client, qId));
          setLoading(false);
          setStep('manage');
          return;
        }
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, DELAY_MS));
        }
      }

      setLoading(false);
      setError('TV not found. Make sure the ZUI app is open on your TV, then tap Verify TV.');
    };
    void autoVerify();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 1: Manual verify ────────────────────────────────────────────────
  const handleVerify = async () => {
    const id  = deviceId.trim().toUpperCase();
    const key = deviceKey.trim().toLowerCase();
    if (!id || !key) return;
    setLoading(true); setError(null);

    const client = makeKeyedClient(id, key);
    const { data, error: dbErr } = await client
      .from('devices').select('device_id').eq('device_id', id).single();

    if (dbErr || !data) {
      setLoading(false);
      setError('TV not found. Please check the TV ID and Device Key.');
      return;
    }
    keyedClientRef.current = client;
    setDeviceId(id);
    setPlaylists(await fetchPlaylists(client, id));
    setLoading(false);
    setStep('manage');
  };

  // ── Step 2: Add playlist ─────────────────────────────────────────────────
  const handleAdd = async () => {
    const client = keyedClientRef.current;
    if (!client) return;
    setLoading(true); setError(null); setAddSuccess(false);

    let insertData: Record<string, unknown>;

    if (sourceType === 'xtream') {
      const host = xtHost.trim();
      const user = xtUser.trim();
      const pass = xtPass.trim();
      if (!isValidUrl(host) || !user || !pass) {
        setLoading(false);
        setError('Server URL, username, and password are required.');
        return;
      }
      const duplicate = playlists.find(p => p.playlist_url === host && p.source_type === 'xtream');
      if (duplicate) { setLoading(false); setError('This Xtream server is already in the list.'); return; }
      insertData = {
        device_id: deviceId, device_key: deviceKey.trim().toLowerCase(),
        source_type: 'xtream',
        playlist_url: host, playlist_name: xtName.trim() || null,
        xtream_username: user, xtream_password: pass,
      };
    } else {
      const url = playlistUrl.trim();
      if (!isValidUrl(url)) { setLoading(false); setError('Please enter a valid M3U URL.'); return; }
      const duplicate = playlists.find(p => p.playlist_url === url && p.source_type !== 'xtream');
      if (duplicate) { setLoading(false); setError('This URL is already in the list.'); return; }
      insertData = {
        device_id: deviceId, device_key: deviceKey.trim().toLowerCase(),
        source_type: 'm3u',
        playlist_url: url, playlist_name: listName.trim() || null,
      };
    }

    const { error: dbErr } = await client.from('playlists').insert(insertData);
    if (dbErr) {
      setLoading(false);
      setError('Failed to send. Please try again.');
      return;
    }
    await reload(deviceId);
    setPlaylistUrl(''); setListName(''); setXtHost(''); setXtUser(''); setXtPass(''); setXtName('');
    setAddSuccess(true);
    setLoading(false);
    setTimeout(() => setAddSuccess(false), 4000);
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    const client = keyedClientRef.current;
    if (!client) return;
    setDeleteId(id);
    await client.from('playlists').delete().eq('id', id);
    await reload(deviceId);
    setDeleteId(null);
  };

  const reset = () => {
    setStep('verify'); setSourceType('m3u');
    setDeviceId(''); setDeviceKey('');
    setPlaylistUrl(''); setListName('');
    setXtHost(''); setXtUser(''); setXtPass(''); setXtName('');
    setPlaylists([]); setError(null); setAddSuccess(false);
    keyedClientRef.current = null;
    // Clear URL params so a refresh shows the clean form
    window.history.replaceState({}, '', window.location.pathname);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .card { animation: fadeIn 0.3s ease; }
        input {
          width: 100%; padding: 12px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.85); font-size: 14px; outline: none;
          transition: border-color 0.15s;
        }
        input:focus { border-color: rgba(232,181,103,0.4); }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      <main style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <div style={{
            display: 'grid', placeItems: 'center', width: 48, height: 48,
            borderRadius: 14, border: '1px solid rgba(232,181,103,0.4)',
            background: 'rgba(232,181,103,0.08)', boxShadow: '0 0 28px -10px #E8B567',
          }}>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: 22, fontStyle: 'italic', fontWeight: 300, color: '#E8B567', lineHeight: 1, paddingTop: 1 }}>Z</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1 }}>ZUI Cloud Sync</span>
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>TV Playlist Manager</span>
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{
          width: '100%', maxWidth: 480,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '28px 24px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>

          {/* ══ Step 1: Verify ══ */}
          {step === 'verify' && <>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Verify your TV</h2>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                Open the ZUI app on your TV → go to Cloud Sync and enter the details shown on screen.
              </p>
            </div>

            <Field label="TV ID">
              <input value={deviceId} onChange={e => setDeviceId(e.target.value)}
                placeholder="A1B2-C3D4"
                style={{ fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()} />
            </Field>

            <Field label="Device Key">
              <input value={deviceKey} onChange={e => setDeviceKey(e.target.value)}
                placeholder="ab3x9z"
                style={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()} />
            </Field>

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                <Spinner />
                Connecting to TV… (may take up to 10 s on first launch)
              </div>
            )}

            {error && <ErrorBox message={error} />}

            <PrimaryButton onClick={handleVerify} loading={loading}
              disabled={!deviceId.trim() || !deviceKey.trim()}>
              Verify TV
            </PrimaryButton>
          </>}

          {/* ══ Step 2: Playlist Manager ══ */}
          {step === 'manage' && <>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Playlist Manager</h2>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                Send a playlist URL to your TV. Each playlist is stored as a separate record.
              </p>
            </div>

            <DeviceBadge deviceId={deviceId} />

            {/* Sent playlists */}
            {playlists.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                  Sent Playlists ({playlists.length})
                </span>
                {playlists.map(pl => (
                  <PlaylistRow key={pl.id} pl={pl} onDelete={handleDelete} deleting={deleteId === pl.id} />
                ))}
              </div>
            )}

            {/* Add new playlist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Type selector */}
              <div style={{ display: 'flex', gap: 8 }}>
                {(['m3u', 'xtream'] as SourceType[]).map(t => (
                  <button key={t} onClick={() => { setSourceType(t); setError(null); }} style={{
                    flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                    background: sourceType === t ? 'rgba(232,181,103,0.15)' : 'rgba(255,255,255,0.04)',
                    color: sourceType === t ? '#E8B567' : 'rgba(255,255,255,0.35)',
                    outline: sourceType === t ? '1px solid rgba(232,181,103,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  }}>
                    {t === 'm3u' ? '📋 M3U URL' : '🔑 Xtream Codes'}
                  </button>
                ))}
              </div>

              {/* M3U fields */}
              {sourceType === 'm3u' && <>
                <Field label="M3U URL">
                  <input value={playlistUrl} onChange={e => setPlaylistUrl(e.target.value)}
                    placeholder="https://example.com/playlist.m3u"
                    type="url" autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                </Field>
                <Field label="Playlist Name" optional>
                  <input value={listName} onChange={e => setListName(e.target.value)}
                    placeholder="Family, Backup…"
                    onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                </Field>
              </>}

              {/* Xtream fields */}
              {sourceType === 'xtream' && <>
                <Field label="Server URL">
                  <input value={xtHost} onChange={e => setXtHost(e.target.value)}
                    placeholder="http://provider.com:8080"
                    type="url" autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                </Field>
                <Field label="Username">
                  <input value={xtUser} onChange={e => setXtUser(e.target.value)}
                    placeholder="username"
                    onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                </Field>
                <Field label="Password">
                  <input value={xtPass} onChange={e => setXtPass(e.target.value)}
                    placeholder="••••••••" type="password"
                    onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                </Field>
                <Field label="Provider Name" optional>
                  <input value={xtName} onChange={e => setXtName(e.target.value)}
                    placeholder="My IPTV Provider"
                    onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                </Field>
              </>}

              {error      && <ErrorBox   message={error} />}
              {addSuccess && <SuccessBox message="Playlist sent! Press Reload on the TV." />}

              <PrimaryButton onClick={handleAdd} loading={loading}
                disabled={sourceType === 'm3u' ? !isValidUrl(playlistUrl) : !isValidUrl(xtHost) || !xtUser.trim() || !xtPass.trim()}>
                Send to TV
              </PrimaryButton>
            </div>

            <button onClick={reset} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
              fontSize: 13, cursor: 'pointer', padding: '4px 0',
            }}>
              ← Switch TV
            </button>
          </>}

        </div>

        <p style={{ marginTop: 28, fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          ZUI IPTV Player · Open Source · MIT
        </p>
      </main>
    </>
  );
}
