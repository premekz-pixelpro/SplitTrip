import { useEffect, useMemo } from 'react';
import { useEventStore } from '../store/useEventStore';
import classNames from 'classnames';

export const BillsTable = () => {
  const { eventBills, fetchBills, participants, eventParticipants, currentEvent, loading } =
    useEventStore();

  // Dodaj wywołanie fetchBills przy zmianie currentEvent
  useEffect(() => {
    if (currentEvent) {
      fetchBills(currentEvent.id);
    }
  }, [currentEvent?.id]);

  // Mapuj id → displayName (z currentEvent + participants + eventParticipants)
  const nameById = useMemo(() => {
    const all = [...(currentEvent?.participants || []), ...participants, ...eventParticipants];
    const map = new Map<string, string>();
    all.forEach((p: any) => {
      const key = p.userId || p.uid; // <- tu był błąd
      const label = p.displayName || p.email || key;
      console.log('Mapping participant:', key, 'to label:', p.displayName);
      if (key) map.set(key, label);
    });
    return map;
  }, [currentEvent?.participants, participants, eventParticipants]);

  const participantIds = useMemo(() => {
    const set = new Set<string>();
    eventBills.forEach((b) => b.participants?.forEach((p) => set.add(p.userId)));
    currentEvent?.participants?.forEach((p: any) => set.add(p.userId));
    return Array.from(set);
  }, [eventBills, currentEvent?.participants]);

  // Suma zapłaconych kwot per uczestnik + suma rachunków
  const totals = useMemo(() => {
    const perUser: Record<string, number> = {};
    participantIds.forEach((id) => (perUser[id] = 0));
    let billsTotal = 0;

    eventBills.forEach((bill) => {
      const billValue = bill.value || 0;
      billsTotal += billValue;

      const paidByOthers =
        bill.participants?.reduce(
          (sum, p) => sum + (p.hasPaid && !p.creator ? p.share || 0 : 0),
          0
        ) || 0;

      bill.participants?.forEach((p) => {
        const uid = p.userId;
        if (!(uid in perUser)) return;

        if (p.creator) {
          // creator płaci resztę rachunku po tym, co opłacili inni
          const paid = billValue - paidByOthers;
          perUser[uid] += Math.max(0, paid);
        } else if (p.hasPaid) {
          // uczestnik płaci tylko swój udział, gdy hasPaid = true
          perUser[uid] += p.share || 0;
        }
      });
    });

    return {
      perUser,
      billsTotal: Math.round(billsTotal * 100) / 100,
    };
  }, [eventBills, participantIds]);

  // Balans netto per uczestnik (creator: wartość rachunku minus jego udział i to, co zapłacili inni)
  const balances = useMemo(() => {
    const perUser: Record<string, number> = {};
    participantIds.forEach((id) => (perUser[id] = 0));
    // console.log('Event Bills for balances:', eventBills);
    eventBills.forEach((bill) => {
      const billValue = bill.value || 0;
      const paidByOthers =
        bill.participants?.reduce(
          (sum, p) => sum + (p.hasPaid && !p.creator ? p.share || 0 : 0),
          0
        ) || 0;

      bill.participants?.forEach((p) => {
        const uid = p.userId;
        if (!(uid in perUser)) return;

        if (p.creator) {
          // Creator: dostaje całą kwotę minus własny udział i to, co zapłacili inni
          const delta = billValue - (p.share || 0) - paidByOthers;
          perUser[uid] += Number(delta.toFixed(2));
        } else {
          // Uczestnik: jeśli nie zapłacił swojego udziału, jest na plus (musi oddać)
          if (!p.hasPaid) {
            perUser[uid] += Number((p.share || 0).toFixed(2));
          }
          // Jeśli zapłacił, bilans się nie zmienia
        }
      });
    });

    return perUser;
  }, [eventBills, participantIds]);

  if (loading) return <p>Ładowanie…</p>;
  if (!eventBills.length) return <p>Brak rachunków</p>;

  return (
    <div className="expenses-list overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-3 py-2 text-left">Rachunek</th>
            <th className="border px-3 py-2 text-right">Kwota</th>
            {participantIds.map((id) => (
              <th key={id} className="border px-3 py-2 text-center">
                {nameById.get(id) || id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {eventBills.map((bill) => (
            <tr key={bill.id}>
              <td className="border px-3 py-2">{bill.title}</td>
              <td className="border px-3 py-2 text-right">{bill.value?.toFixed(2)} zł</td>
              {participantIds.map((id) => {
                const p = bill.participants?.find((x) => x.userId === id);
                const isCreator = p?.creator;
                const hasPaid = p?.hasPaid;
                const share = p?.share ?? null;

                const paidByOthers =
                  bill.participants?.reduce(
                    (sum, part) => sum + (part.hasPaid && !part.creator ? part.share || 0 : 0),
                    0
                  ) || 0;

                const amountToShow = isCreator
                  ? Math.max(0, share || 0)
                  : share !== null
                    ? share < 0
                      ? -share
                      : share
                    : null;

                return (
                  <td
                    key={id}
                    className={classNames(
                      'border px-3 py-2 text-center',
                      isCreator && 'bg-green-50',
                      hasPaid && 'text-green-700'
                    )}
                    title={
                      isCreator
                        ? 'Płacący (faktycznie zapłacona kwota rachunku)'
                        : hasPaid
                          ? 'Zapłacono własny udział'
                          : 'Do zapłaty udział'
                    }
                  >
                    <div className="flex justify-between text-center">
                      <div className="flex flex-col text-center border-r pr-2 mr-2">
                        <span>zapłacił</span>
                        <span> {hasPaid ? (bill.value - paidByOthers).toFixed(2) : 0}</span>
                      </div>
                      <div className="flex flex-col text-center">
                        wydał
                        <span>{amountToShow !== null ? amountToShow.toFixed(2) : '—'}</span>
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold">
            <td className="border px-3 py-2 text-left">Suma (wydane)</td>
            <td className="border px-3 py-2 text-right">{totals.billsTotal.toFixed(2)} zł</td>
            {participantIds.map((id) => (
              <td key={id} className="border px-3 py-2 text-center">
                {((totals.perUser[id] ?? 0) - (balances[id] ?? 0)).toFixed(2)}
              </td>
            ))}
          </tr>
          <tr className="bg-gray-50 font-semibold">
            <td className="border px-3 py-2 text-left">Balans (netto)</td>
            <td className="border px-3 py-2 text-right">—</td>
            {participantIds.map((id) => {
              const val = balances[id] ?? 0;
              return (
                <td
                  key={id}
                  className={classNames(
                    'border px-3 py-2 text-center',
                    val > 0 && 'text-green-700',
                    val < 0 && 'text-red-700'
                  )}
                >
                  {val.toFixed(2)}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
