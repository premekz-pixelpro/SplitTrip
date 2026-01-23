import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore, useEventStore, useUserProfileStore } from '@/store';

export const EventSelector = () => {
  const {
    events,
    currentEvent,
    loading,
    error,
    setCurrentEvent,
    calculateBalances,
    fetchParticipants,
    fetchEventsByIds,
    fetchBills,
  } = useEventStore();

  const { userProfile, loadingProfile, fetchUserProfile } = useUserProfileStore();
  const { user } = useAuthStore();
  // const currentUser = useAuthStore((state) => state.user);
  // const currentUserId = currentUser ? currentUser.uid : '';
  const navigate = useNavigate();
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchUserProfile(user.uid);
      // console.log('Fetched user profile in EventSelector:', user.uid);
      // console.log('User profile:', userProfile);
    }
  }, [user, fetchUserProfile]);

  useEffect(() => {
    const loadEvents = async () => {
      if (userProfile?.events?.length) {
        setIsLoadingEvents(true);
        await fetchEventsByIds(userProfile.events);
        setIsLoadingEvents(false);
      }
    };

    if (!loadingProfile && userProfile) {
      loadEvents();
    }
  }, [userProfile, loadingProfile, fetchEventsByIds]);

  if (loading || loadingProfile || isLoadingEvents) return <div>Loading events...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!events.length) return <div>No events found</div>;

  const onChange = async (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setCurrentEvent(event);
      await fetchBills(eventId);
      // USUŃ to - balances będą zaktualizowane przez listener lub przy dodawaniu rachunku
      // await calculateBalances(eventId);
    }
  };

  return (
    <div className="event-selector">
      <select
        value={currentEvent?.id || ''}
        onChange={(e) => {
          const selected = events.find((event) => event.id === e.target.value);
          setCurrentEvent(selected || null);
          fetchParticipants();
          calculateBalances(selected?.id || '');
          if (selected?.id) {
            localStorage.setItem('lastEventId', selected.id);
            navigate({ to: `/${selected.id}/newBill` });
          } else {
            localStorage.removeItem('lastEventId');
          }
        }}
      >
        <option value="">Choose an event</option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title}
          </option>
        ))}
      </select>
    </div>
  );
};
