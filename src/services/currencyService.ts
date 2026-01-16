// Service do pobierania kursów walut
export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

/**
 * Pobiera aktualne kursy walut z Frankfurter API (ECB)
 * @param baseCurrency - waluta bazowa (np. 'USD', 'EUR', 'PLN')
 * @param targetCurrencies - tablica walut docelowych (opcjonalnie)
 */
export async function getExchangeRates(
  baseCurrency: string = 'USD',
  targetCurrencies?: string[]
): Promise<ExchangeRates> {
  try {
    let url = `https://api.frankfurter.app/latest?from=${baseCurrency}`;

    if (targetCurrencies && targetCurrencies.length > 0) {
      url += `&to=${targetCurrencies.join(',')}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      base: data.base,
      date: data.date,
      rates: data.rates,
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
}

/**
 * Pobiera kurs GEL (gruzińskie lari) z alternatywnego API
 * Frankfurter API nie obsługuje GEL, więc używamy exchangerate-api.com
 */
async function getGELRate(targetCurrency: string): Promise<number> {
  try {
    // Próba 1: exchangerate-api.com
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/GEL');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('GEL rate data:', data);
    return data.rates[targetCurrency];
  } catch (error) {
    console.error('Error fetching GEL rate from exchangerate-api:', error);

    // Fallback: użyj stałego kursu jako ostateczność
    // Aktualne kursy GEL (styczeń 2026): 1 GEL ≈ 1.44 PLN, 1 GEL ≈ 0.33 EUR
    const fallbackRates: Record<string, number> = {
      PLN: 1.44,
      EUR: 0.33,
      USD: 0.36,
    };

    if (fallbackRates[targetCurrency]) {
      console.warn(
        `Using fallback rate for GEL to ${targetCurrency}: ${fallbackRates[targetCurrency]}`
      );
      return fallbackRates[targetCurrency];
    }

    throw error;
  }
}

/**
 * Konwertuje wartość z jednej waluty na drugą
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

/**
 * Pobiera kurs waluty dla konkretnej pary
 */
export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  // Obsługa GEL (gruzińskie lari) - nie obsługiwane przez Frankfurter API
  if (fromCurrency === 'GEL') {
    return await getGELRate(toCurrency);
  }

  if (toCurrency === 'GEL') {
    const gelToPLN = await getGELRate('PLN');
    if (fromCurrency === 'PLN') {
      return 1 / gelToPLN; // PLN -> GEL
    }
    // Dla innych walut -> GEL
    const rates = await getExchangeRates(fromCurrency, ['PLN']);
    const fromToPLN = rates.rates['PLN'];
    return fromToPLN / gelToPLN;
  }

  // Standardowe waluty obsługiwane przez Frankfurter API
  const rates = await getExchangeRates(fromCurrency, [toCurrency]);
  return rates.rates[toCurrency];
}
