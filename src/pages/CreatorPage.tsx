import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createAuthedSupabaseClient } from '../lib/authedClient';
import { jwtDecode } from 'jwt-decode';
import EventGrid from '../components/EventGrid';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

type JwtPayload = {
    user_id: number;
};

type EventItem = {
    id: number;
    image: string;
    title: string;
    description: string | null;
    date: string;
    location: string;
    participants: number;
    status_id: number;
};

const getUserAgent = (): string => {
    const host = window.location.hostname;
    if (host.includes('localhost')) return 'CultureRadarDev/0.1 (+http://localhost:5173)';
    if (host.includes('ias-b3-lyon-g2.site')) return 'CultureRadar/1.0 (+https://ias-b3-lyon-g2.site/)';
    return 'CultureRadar/1.0 (+https://cultureradar.fr)';
};

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    const cacheKey = `geocode:${lat.toFixed(6)}:${lng.toFixed(6)}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            {
                headers: { 'User-Agent': getUserAgent() },
            }
        );
        const json = await response.json();
        const display = json.display_name || 'Adresse non trouvée';
        const parts = display.split(',').map((s: string) => s.trim());
        const isFirstPartNumeric = /^\d+/.test(parts[0]);
        const truncated = parts.slice(0, isFirstPartNumeric ? 2 : 3).join(', ');
        localStorage.setItem(cacheKey, truncated);
        return truncated;
    } catch (error) {
        console.warn('Erreur de géocodage inversé:', error);
        return 'Lieu non précisé';
    }
};

const CreatorPage: React.FC = () => {
    const [myEvents, setMyEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);

    const navigate = useNavigate();

    const handleDeleteClick = (id: number) => {
        const found = myEvents.find(e => e.id === id);
        if (found) {
            setEventToDelete(found);
            setShowDeleteModal(true);
        }
    };

    const handleConfirmDelete = async () => {
        if (!eventToDelete) return;

        const token = localStorage.getItem('token');

        if (!token) {
            console.error('Veuillez vous Connecter ou vous Inscrire.');
            return;
        }

        const supabase = createAuthedSupabaseClient(token);

        const { error } = await supabase
            .from('activities')
            .delete()
            .eq('id', eventToDelete.id);

        if (error) {
            console.error("Erreur lors de la suppression:", error);
        } else {
            setMyEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
        }

        setEventToDelete(null);
        setShowDeleteModal(false);
    };

    useEffect(() => {
        let isMounted = true;

        const fetchMyActivities = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            const decoded = jwtDecode<JwtPayload>(token);
            const userId = decoded.user_id;
            const supabase = createAuthedSupabaseClient(token);

            const { data: firstBatch, error } = await supabase
                .from('activities_with_coords')
                .select('*')
                .eq('creator_id', userId)
                .order('event_datetime', { ascending: false })
                .limit(4);

            if (error || !isMounted) return;
            const enrichedFirst = await enrichActivities(firstBatch || [], supabase);
            if (!isMounted) return;

            setMyEvents(enrichedFirst);
            setLoading(false);

            if (firstBatch && firstBatch.length === 4) {
                const { data: remainingBatch } = await supabase
                    .from('activities_with_coords')
                    .select('*')
                    .eq('creator_id', userId)
                    .order('event_datetime', { ascending: false })
                    .range(4, 999);

                if (remainingBatch && remainingBatch.length > 0 && isMounted) {
                    const enrichedRest = await enrichActivities(remainingBatch, supabase);
                    setMyEvents(prev => [...prev, ...enrichedRest]);
                }
            }
        };

        fetchMyActivities();
        return () => { isMounted = false; };
    }, []);

    const enrichActivities = async (activities: any[], supabase: any): Promise<EventItem[]> => {
        return await Promise.all(
            activities.map(async (activity) => {
                const { data: blobs } = await supabase
                    .from('activity_blobs')
                    .select('blob_link')
                    .eq('activity_id', activity.id)
                    .limit(1);

                const location =
                    activity.lat && activity.lng
                        ? await reverseGeocode(activity.lat, activity.lng)
                        : 'Lieu non précisé';

                return {
                    id: activity.id,
                    image: blobs?.[0]?.blob_link || '/placeholder.jpg',
                    title: activity.title || 'Untitled Event',
                    description: activity.description,
                    date: new Date(activity.event_datetime).toLocaleDateString(),
                    location,
                    participants: activity.likes_count || 0,
                    status_id: activity.status_id,
                };
            })
        );
    };

    const truncateText = (text: string, maxLength: number): string =>
        text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#230022] via-[#230022] to-[#561447] text-white py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-center mb-12">Mes événements créés</h1>

            {loading ? (
                <p className="text-center text-white/70 text-sm">Chargement des événements...</p>
            ) : (
                <EventGrid
                    events={myEvents}
                    truncateText={truncateText}
                    onDeleteClick={handleDeleteClick}
                />
            )}

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                eventTitle={eventToDelete?.title || ''}
            />

            <div className="text-center">
                <button
                    onClick={() => navigate('/create-event')}
                    className="inline-flex items-center gap-2 bg-[#C30D9B] hover:bg-[#e52d52] text-white font-semibold px-6 py-3 rounded-full transition-all transform hover:scale-105 shadow-lg text-lg"
                >
                    <Plus className="w-5 h-5" />
                    Créer une activité
                </button>
            </div>
        </div>
    );
};

export default CreatorPage;