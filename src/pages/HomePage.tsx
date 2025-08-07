import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import { createAuthedSupabaseClient } from '../lib/authedClient';
import { fetchLocationText } from '../lib/geolocationUtils';

type FeaturedCard = {
  id: number;
  title: string;
  description: string | null;
  event_datetime: string | null;
  address: any | null;
  image: string;
  date: string;
  location: string;
  participants: number;
};

type ViewRow = {
  slot_id: number;
  id: number;
  title: string;
  description: string | null;
  event_datetime: string | null;
  address: any | null;
};

type FPAct = {
  slot_id: number;
  activity_id: number | null;
  start_timestamp: string;
  end_timestamp: string;
};

type FPDiagRow = {
  slot_id: number;
  start_timestamp: string;
  end_timestamp: string;
  activity_id: number | null;
  activity?: {
    id: number;
    title: string;
    status_id: number;
    event_datetime: string | null;
  } | null;
};

type Coords = { id: number; lat: number | null; lng: number | null };

const HARD_CODED_IDS: Record<number, number> = { 1: 394, 2: 395, 3: 400 };
const SLOTS = [1, 2, 3] as const;

// in-memory cache of pretty locations
const locCache = new Map<number, string>();

const HomePage: React.FC = () => {
  const [featuredEvents, setFeaturedEvents] = useState<FeaturedCard[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Debug
  const [debugInfo, setDebugInfo] = useState<any>({});
  const locationSearch = useLocation().search;
  const DEBUG = new URLSearchParams(locationSearch).has('debug');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    const supabase = createAuthedSupabaseClient(token || '');
    const log = (...a: any[]) => { if (DEBUG) console.log('[FeaturedDebug]', ...a); };

    const truncateText = (t: string, n: number) => (t.length > n ? t.slice(0, n) + '...' : t);

    const getNiceLocation = async (activityId: number, coords?: { lat?: number | null; lng?: number | null }, rowAddress?: any) => {
      if (locCache.has(activityId)) return locCache.get(activityId)!;

      try {
        // Pass explicit coords when available (preferred).
        const txt = await fetchLocationText(activityId, coords);
        const finalTxt =
          (typeof txt === 'string' && txt.trim()) ||
          (coords?.lat && coords?.lng ? 'Lieu précisé' : (rowAddress ? 'Lieu précisé' : 'Lieu non précisé'));
        locCache.set(activityId, finalTxt);
        return finalTxt;
      } catch (e) {
        log('fetchLocationText error', { activityId, e, coords });
        return (coords?.lat && coords?.lng) || rowAddress ? 'Lieu précisé' : 'Lieu non précisé';
      }
    };

    const enrichFactory = (coordsById: Map<number, Coords>) => async (row: {
      id: number; title: string; description: string | null; event_datetime: string | null; address: any | null;
    }): Promise<FeaturedCard> => {
      const { data: blobs, error: imgErr } = await supabase
        .from('activity_blobs')
        .select('blob_link')
        .eq('activity_id', row.id)
        .limit(1);
      if (imgErr) log('image query error', imgErr);

      const image = blobs?.[0]?.blob_link || '/placeholder.jpg';
      const date = row.event_datetime ? new Date(row.event_datetime).toLocaleDateString() : 'Date à venir';

      const c = coordsById.get(row.id);
      const prettyLocation = await getNiceLocation(row.id, { lat: c?.lat ?? null, lng: c?.lng ?? null }, row.address);

      return {
        id: row.id,
        title: row.title,
        description: row.description ? truncateText(row.description, 100) : '',
        event_datetime: row.event_datetime,
        address: row.address,
        image,
        date,
        location: prettyLocation,
        participants: Math.floor(Math.random() * 1000) + 100,
      };
    };

    const fetchFallbackForSlot = async (
      slotId: number,
      coordsById: Map<number, Coords>,
      enrich: ReturnType<typeof enrichFactory>
    ): Promise<FeaturedCard | null> => {
      const fallbackId = HARD_CODED_IDS[slotId];
      if (!fallbackId) return null;

      const { data: events, error } = await supabase
        .from('activities')
        .select('id, title, description, event_datetime, address, status_id')
        .eq('id', fallbackId)
        .eq('status_id', 3)
        .limit(1);

      if (error) log('fallback query error', { slotId, error });

      if (!events || events.length === 0) {
        log('no fallback found or not status 3', { slotId, fallbackId });
        return null;
      }
      log('using fallback for slot', slotId, events[0]);

      // ensure coords are present in coordsById (fallbacks were preloaded; see below)
      return enrich(events[0]);
    };

    const diagnose = async () => {
      const clientNow = new Date();
      const nowIso = clientNow.toISOString();

      const { data: live, error: liveErr } = await supabase
        .from('front_page_current_activities')
        .select('slot_id, id, title, description, event_datetime, address')
        .order('slot_id', { ascending: true });

      const { data: activeFpa, error: fpaErr } = await supabase
        .from('front_page_activities')
        .select('slot_id, activity_id, start_timestamp, end_timestamp')
        .lte('start_timestamp', nowIso)
        .gt('end_timestamp', nowIso)
        .order('slot_id', { ascending: true });

      let diagRows: FPDiagRow[] = [];
      if (activeFpa && activeFpa.length > 0) {
        const ids = activeFpa.map(r => r.activity_id).filter(Boolean) as number[];
        let actById: Record<number, { id: number; title: string; status_id: number; event_datetime: string | null }> = {};
        if (ids.length) {
          const { data: acts, error: actsErr } = await supabase
            .from('activities')
            .select('id, title, status_id, event_datetime')
            .in('id', ids);
          if (actsErr) log('activities diag error', actsErr);
          (acts || []).forEach(a => (actById[a.id] = a));
        }
        diagRows = activeFpa.map((r: FPAct) => ({
          slot_id: r.slot_id,
          start_timestamp: r.start_timestamp,
          end_timestamp: r.end_timestamp,
          activity_id: r.activity_id,
          activity: r.activity_id ? actById[r.activity_id] : null,
        }));
      }

      const pack = { clientNow: clientNow.toString(), clientNowIso: nowIso, liveErr, live, activeFpa, fpaErr, diagRows };
      setDebugInfo(pack);
      if (DEBUG) console.log('[FeaturedDebug] diagnostics', pack);
      return { live, diagRows };
    };

    const fetchFeatured = async () => {
      const { live, diagRows } = await diagnose();

      // Collect IDs we might show (live + all fallbacks) so we can batch fetch coords once
      const liveIds = (live || []).map((r: any) => r.id);
      const fallbackIds = Object.values(HARD_CODED_IDS);
      const neededIds = Array.from(new Set<number>([...liveIds, ...fallbackIds]));

      const { data: coordsRows, error: coordsErr } = await supabase
        .from('activities_with_coords')
        .select('id, lat, lng')
        .in('id', neededIds);

      if (coordsErr) log('coords query error', coordsErr);

      const coordsById = new Map<number, Coords>();
      (coordsRows || []).forEach((c: Coords) => coordsById.set(c.id, c));

      const enrich = enrichFactory(coordsById);

      // Map slot -> activity from view
      const bySlot = new Map<number, ViewRow>();
      (live || []).forEach((r: any) => bySlot.set(r.slot_id, r as ViewRow));

      const results: FeaturedCard[] = [];
      for (const slot of SLOTS) {
        const row = bySlot.get(slot);
        if (row) {
          results.push(await enrich(row));
        } else {
          const fb = await fetchFallbackForSlot(slot, coordsById, enrich);
          if (fb) results.push(fb);
          else {
            const diagHit = (diagRows || []).find(d => d.slot_id === slot);
            if (diagHit) log('Slot active in table but missing in view:', diagHit);
            else log('No active front_page_activities and no fallback for slot', slot);
          }
        }
      }

      // If still missing, try extra fallbacks (should be rare)
      if (results.length < 3) {
        const missingCount = 3 - results.length;
        const needExtraIds = SLOTS.map(s => HARD_CODED_IDS[s]).filter(id => !results.some(r => r.id === id));
        if (needExtraIds.length > 0) {
          const { data: extra, error: extraErr } = await supabase
            .from('activities')
            .select('id, title, description, event_datetime, address')
            .in('id', needExtraIds)
            .eq('status_id', 3);
          if (extraErr) log('extra fallback error', extraErr);
          const extrasEnriched = await Promise.all((extra || []).map(enrich));
          results.push(...extrasEnriched.slice(0, missingCount));
        }
      }

      if (results.length === 0) log('No featured results after all strategies.');
      setFeaturedEvents(results);
    };

    fetchFeatured();
  }, [locationSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] via-[#230022] to-[#561447] text-white">
      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <img src="/logo_final_fond_noir.png" alt="Logo CultureRadar" className="h-24 mb-6 mx-auto lg:mx-0" />
              <p className="text-xl md:text-2xl text-white mb-4 font-light">Révélateur d&apos;événements,</p>
              <p className="text-xl md:text-2xl text-white mb-8 font-light">amplificateur de proximité</p>
              <Link
                to={isLoggedIn ? '/premium' : '/login?signup=true'}
                className="inline-flex items-center px-8 py-4 bg-[#c30d9b] text-white font-semibold rounded-full hover:bg-[#e52d52] transition-all transform hover:scale-105 shadow-lg"
              >
                {isLoggedIn ? 'Abonnez-vous !' : 'Rejoignez-nous !'}
              </Link>
            </div>
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg"
                  alt="Concert violet"
                  className="w-full h-96 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xl md:text-2xl text-white mb-4 font-light">Vous souhaitez explorer tous les événements près de chez vous ?</p>
            <Link to="/map" className="inline-block bg-[#c30d9b] hover:bg-[#e52d52] text-white font-semibold px-6 py-3 rounded-full transition-all transform hover:scale-105 shadow-lg">
              Voir la carte interactive
            </Link>
          </div>

          {/* Debug panel */}
          {DEBUG && (
            <div className="mb-8 rounded-xl border border-[#e52d52] bg-[#2e0033] p-4">
              <h3 className="font-semibold mb-2 text-[#e52d52]">Debug: Featured Diagnostics</h3>
              <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(debugInfo, null, 2)}</pre>
              <p className="text-xs mt-2 opacity-80">If a slot looks active but missing in view, check tz + RLS.</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredEvents.map((event) => (
              <div key={event.id} className="bg-[#2e0033] rounded-2xl overflow-hidden border border-[#c30d9b] hover:border-[#e52d52] transition-all duration-300 cursor-pointer">
                <img src={event.image} alt={event.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h2 className="text-xl font-bold text-white mb-2">{event.title}</h2>
                  <p className="text-white/80 text-sm mb-4">{event.description}</p>
                  <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center text-white/80 gap-1">
                      <Users className="h-4 w-4" />
                      <span>{event.participants} participants</span>
                    </div>
                    <button className="bg-[#c30d9b] text-white text-xs px-4 py-2 rounded-full hover:bg-[#e52d52] transition">Je sors !</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Video */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Merci à tous d&apos;avoir été aussi nombreux</h2>
          <p className="text-xl text-white/80 mb-8">au concert exceptionnel de Coldplay ✨</p>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/Fpn1imb9qZg?si=jvd12DKfm74P36TB"
              title="Concert de Coldplay"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#230022]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '50K+', label: 'Événements' },
              { number: '200K+', label: 'Participants' },
              { number: '500+', label: 'Organisateurs' },
              { number: '50+', label: 'Villes' },
            ].map((stat, i) => (
              <div key={i} className="group">
                <div className="text-3xl md:text-4xl font-bold text-[#c30d9b] group-hover:text-[#e52d52] mb-2">{stat.number}</div>
                <div className="text-white/80 group-hover:text-white">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;