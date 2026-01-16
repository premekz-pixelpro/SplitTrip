import { FormEvent, useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNewBillStore, useEventStore } from '@/store';
import { useAuthStore } from '@/store/useAuthStore';
import { Button, AddParticipants } from '@/components';
import { getExchangeRate } from '@/services/currencyService';

export const NewBill = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [valueInPLN, setValueInPLN] = useState<number>(0);
  const [loadingRate, setLoadingRate] = useState(false);
  const submitCountRef = useRef(0);
  const { user } = useAuthStore();
  const currentEvent = useEventStore((state) => state.currentEvent);
  const billTitle = useNewBillStore((state) => state.title);
  const billValue = useNewBillStore((state) => state.value);
  const billCurrency = useNewBillStore((state) => state.currency);
  const setBillTitle = useNewBillStore((state) => state.setTitle);
  const setBillValue = useNewBillStore((state) => state.setValue);
  const setBillCurrency = useNewBillStore((state) => state.setCurrency);
  const handleNewBill = useNewBillStore((state) => state.createBill);

  // Pobierz kurs waluty i przelicz na PLN
  useEffect(() => {
    const fetchRate = async () => {
      if (billCurrency === 'PLN') {
        setExchangeRate(1);
        setValueInPLN(billValue);
        return;
      }

      if (!billValue) {
        setValueInPLN(0);
        return;
      }

      setLoadingRate(true);
      try {
        const rate = await getExchangeRate(billCurrency, 'PLN');
        setExchangeRate(rate);
        setValueInPLN(billValue * rate);
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        toast.error('Nie udało się pobrać kursu waluty');
      } finally {
        setLoadingRate(false);
      }
    };

    fetchRate();
  }, [billCurrency, billValue]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Zabezpieczenie przed wielokrotnym kliknięciem
    if (!user?.uid || !currentEvent || isSubmitting) {
      console.log('Submit zablokowany - isSubmitting:', isSubmitting);
      return;
    }

    submitCountRef.current += 1;
    console.log('Submit #', submitCountRef.current, '- rozpoczynam...');
    setIsSubmitting(true);

    try {
      // Zapisz rachunek z wartością w PLN
      const originalValue = billValue;
      const originalCurrency = billCurrency;

      console.log('Submitting bill:', { originalValue, originalCurrency, valueInPLN });

      // Przekazujemy przeliczoną wartość bezpośrednio do createBill
      await handleNewBill(user.uid, currentEvent.id, valueInPLN);

      // Reset form
      setBillTitle('');
      setBillValue(0);
      setBillCurrency('PLN');
      console.log('Submit zakończony pomyślnie');
      toast.success(
        originalCurrency === 'PLN'
          ? 'Rachunek został dodany!'
          : `Rachunek został dodany! (${originalValue.toFixed(2)} ${originalCurrency} = ${valueInPLN.toFixed(2)} PLN)`
      );
    } catch (error) {
      console.error('Failed to create bill:', error);
      toast.error('Nie udało się dodać rachunku');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentEvent) return null;

  return (
    <form className=" flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col">
        <label className="mb-2">🧾 Bill title</label>
        <input
          className=""
          type="text"
          value={billTitle}
          onChange={(e) => setBillTitle(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>
      <div className="flex flex-col ">
        <label className="mb-2 ">💰 Bill value</label>
        <div className="flex gap-2">
          <input
            className="flex-1"
            type="number"
            value={billValue}
            onChange={(e) => setBillValue(Number(e.target.value) || 0)}
            min="0"
            step="0.01"
            disabled={isSubmitting}
            required
          />
          <select
            className="px-3 py-2 rounded border"
            value={billCurrency}
            onChange={(e) => setBillCurrency(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="PLN">PLN</option>
            <option value="EUR">EUR</option>
            <option value="GEL">GEL</option>
          </select>
        </div>
        {billCurrency !== 'PLN' && billValue > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            {loadingRate ? (
              <span>Pobieranie kursu...</span>
            ) : exchangeRate ? (
              <>
                <div>
                  Kurs: 1 {billCurrency} = {exchangeRate.toFixed(4)} PLN
                </div>
                <div className="font-semibold">Wartość w PLN: {valueInPLN.toFixed(2)} PLN</div>
              </>
            ) : null}
          </div>
        )}
      </div>
      <AddParticipants valueInPLN={valueInPLN} />
      <Button type="submit" className="button" disabled={isSubmitting}>
        {isSubmitting ? 'Adding...' : 'Add Bill'}
      </Button>
    </form>
  );
};
