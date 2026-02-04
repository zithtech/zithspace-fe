import { useState, useCallback } from 'react';
import { 
  companyGovernmentHolidayService, 
  CompanyGovernmentHoliday, 
  CreateHolidayPayload, 
  UpdateHolidayPayload 
} from '../services/companyGovernmentHolidayService';

export const useCompanyGovernmentHolidays = () => {
  const [holidays, setHolidays] = useState<CompanyGovernmentHoliday[]>([]);
  const [currentHoliday, setCurrentHoliday] = useState<CompanyGovernmentHoliday | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all holidays
 const fetchHolidays = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await companyGovernmentHolidayService.getAll();
    console.log('Fetched holidays:', data); // 🔥 Debug: Check console post-add
    setHolidays(data); // Ensure this triggers
  } catch (err: any) {
    setError(err.response?.data?.message || 'Failed to fetch holidays');
    console.error('Fetch error:', err);
  } finally {
    setLoading(false);
  }
}, []);

  // Fetch a single holiday
  const fetchHolidayById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await companyGovernmentHolidayService.getById(id);
      setCurrentHoliday(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch holiday');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

// In createHoliday, fallback to temp ID if backend omits it
const createHoliday = useCallback(async (data: CreateHolidayPayload) => {
  setError(null);
  try {
    // This function now only performs the API call. The calling component
    // is responsible for refetching the data to update the UI. This avoids
    // race conditions and issues with optimistic updates.
    const newHoliday = await companyGovernmentHolidayService.create(data);
    return newHoliday;
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Failed to create holiday';
    setError(msg);
    throw new Error(msg);
  }
}, []);


  // Update an existing holiday
  const updateHoliday = useCallback(async (id: string, data: UpdateHolidayPayload) => {
    setLoading(true);
    setError(null);
    try {
      const updatedHoliday = await companyGovernmentHolidayService.update(id, data);
      setHolidays((prev) => 
        prev.map((h) => (h.id === id ? updatedHoliday : h))
      );
      if (currentHoliday?.id === id) {
        setCurrentHoliday(updatedHoliday);
      }
      return updatedHoliday;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update holiday';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [currentHoliday]);

  // Delete a holiday
  const deleteHoliday = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await companyGovernmentHolidayService.delete(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      if (currentHoliday?.id === id) {
        setCurrentHoliday(null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete holiday';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [currentHoliday]);

  return {
    holidays,
    currentHoliday,
    loading,
    error,
    fetchHolidays,
    fetchHolidayById,
    createHoliday,
    updateHoliday,
    deleteHoliday,
  };
};
