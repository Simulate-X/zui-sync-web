'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'verify' | 'manage';

type Playlist = {
  id: number;
  playlist_name: string | null;
  playlist_url: string;
  sent_at: string;
  loaded: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidUrl = (s: string) => /^https?:\/\/.+/.test(s.trim());

async function fetchPlaylists(deviceId: string): Promise<Playlist[]> {
  const { data } = await supabase
    .from('playlists')
    .select('id, playlist_name, playlist_url, sent_at, loaded')
    .eq('device_id', deviceId)
    .order('sent_at', { ascending: false });
  return (data ?? []) as Playlist[];
}

function hostname(url: string) {
  try { return new URL(url).hostname; } catch { return url; }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
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
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.25em' }}>Bağlı TV</span>
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
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: pl.loaded ? 'rgba(110,231,183,0.8)' : 'rgba(255,255,255,0.75)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </span>
          {pl.loaded && (
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(52,211,153,0.55)', flexShrink: 0 }}>
              ✓ yüklendi
            </span>
          )}
        </div>
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 2,
          fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {hostname(pl.playlist_url)} · {fmtDate(pl.sent_at)}
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
  const [deviceId, setDeviceId]       = useState('');
  const [deviceKey, setDeviceKey]     = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [listName, setListName]       = useState('');
  const [playlists, setPlaylists]     = useState<Playlist[]>([]);
  const [loading, setLoading]         = useState(false);
  const [deleteId, setDeleteId]       = useState<number | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [addSuccess, setAddSuccess]   = useState(false);

  const reload = useCallback(async (id: string) => {
    setPlaylists(await fetchPlaylists(id));
  }, []);

  // ── Adım 1: Cihaz doğrulama ──────────────────────────────────────────────
  const handleVerify = async () => {
    const id  = deviceId.trim().toUpperCase();
    const key = deviceKey.trim().toLowerCase();
    if (!id || !key) return;
    setLoading(true); setError(null);

    const { data, error: dbErr } = await supabase
      .from('devices').select('device_id')
      .eq('device_id', id).eq('device_key', key).single();

    if (dbErr || !data) {
      setLoading(false);
      setError('TV bulunamadı. Lütfen TV Kimliği ve Cihaz Anahtarını kontrol edin.');
      return;
    }
    setDeviceId(id);
    setPlaylists(await fetchPlaylists(id));
    setLoading(false);
    setStep('manage');
  };

  // ── Adım 2: Liste ekle ───────────────────────────────────────────────────
  const handleAdd = async () => {
    const url = playlistUrl.trim();
    if (!isValidUrl(url)) return;
    setLoading(true); setError(null); setAddSuccess(false);

    // Aynı URL zaten ekli mi kontrol et
    const duplicate = playlists.find(p => p.playlist_url === url);
    if (duplicate) {
      setLoading(false);
      setError('Bu URL zaten listede mevcut.');
      return;
    }

    const { error: dbErr } = await supabase.from('playlists').insert({
      device_id:     deviceId,
      playlist_url:  url,
      playlist_name: listName.trim() || null,
    });

    if (dbErr) {
      setLoading(false);
      setError('Gönderim başarısız oldu. Lütfen tekrar deneyin.');
      return;
    }
    await reload(deviceId);
    setPlaylistUrl(''); setListName('');
    setAddSuccess(true);
    setLoading(false);
    setTimeout(() => setAddSuccess(false), 4000);
  };

  // ── Sil ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    setDeleteId(id);
    await supabase.from('playlists').delete().eq('id', id);
    await reload(deviceId);
    setDeleteId(null);
  };

  const reset = () => {
    setStep('verify'); setDeviceId(''); setDeviceKey('');
    setPlaylistUrl(''); setListName(''); setPlaylists([]);
    setError(null); setAddSuccess(false);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .card { animation: fadeIn 0.3s ease; }
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

          {/* ══ Step 1: Doğrula ══ */}
          {step === 'verify' && <>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>TV&apos;nizi doğrulayın</h2>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                TV&apos;deki ZUI uygulamasını açın → Cloud Sync ekranındaki bilgileri girin.
              </p>
            </div>

            <Field label="TV Kimliği">
              <input value={deviceId} onChange={e => setDeviceId(e.target.value)}
                placeholder="5ADB-21C2"
                style={{ fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()} />
            </Field>

            <Field label="Cihaz Anahtarı">
              <input value={deviceKey} onChange={e => setDeviceKey(e.target.value)}
                placeholder="st5q8y"
                style={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()} />
            </Field>

            {error && <ErrorBox message={error} />}

            <PrimaryButton onClick={handleVerify} loading={loading}
              disabled={!deviceId.trim() || !deviceKey.trim()}>
              TV&apos;yi Doğrula
            </PrimaryButton>
          </>}

          {/* ══ Step 2: Liste Yöneticisi ══ */}
          {step === 'manage' && <>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Liste Yöneticisi</h2>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                TV&apos;ye M3U URL gönderin. Her liste ayrı kayıt olarak eklenir.
              </p>
            </div>

            <DeviceBadge deviceId={deviceId} />

            {/* Mevcut listeler */}
            {playlists.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                  Gönderilen Listeler ({playlists.length})
                </span>
                {playlists.map(pl => (
                  <PlaylistRow key={pl.id} pl={pl} onDelete={handleDelete} deleting={deleteId === pl.id} />
                ))}
              </div>
            )}

            {/* Yeni liste ekle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Yeni M3U URL">
                <input value={playlistUrl} onChange={e => setPlaylistUrl(e.target.value)}
                  placeholder="https://example.com/playlist.m3u"
                  type="url" autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              </Field>

              <Field label="Liste Adı" optional>
                <input value={listName} onChange={e => setListName(e.target.value)}
                  placeholder="Aile Listesi, Yedek..."
                  onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              </Field>

              {error      && <ErrorBox   message={error} />}
              {addSuccess && <SuccessBox message="Liste gönderildi! TV'de Yeniden Yükle'ye basın." />}

              <PrimaryButton onClick={handleAdd} loading={loading}
                disabled={!isValidUrl(playlistUrl)}>
                TV&apos;ye Gönder
              </PrimaryButton>
            </div>

            <button onClick={reset} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
              fontSize: 13, cursor: 'pointer', padding: '4px 0',
            }}>
              ← Farklı TV seç
            </button>
          </>}

        </div>

        <p style={{ marginTop: 28, fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          ZUI IPTV Player · Açık Kaynak · MIT
        </p>
      </main>
    </>
  );
}
