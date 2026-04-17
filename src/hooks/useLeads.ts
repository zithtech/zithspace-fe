import { useState, useCallback } from "react";
import LeadService, { Lead } from "../services/leadService";

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await LeadService.getAll();
      setLeads(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch leads");
      console.error("Fetch leads error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeadById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await LeadService.getById(id);
      setLead(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch lead");
      console.error("Fetch lead error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLead = useCallback(async (payload: any) => {
    setLoading(true);
    setError(null);
    try {
      const newLead = await LeadService.create(payload);
      setLeads((prev) => [newLead, ...prev]);
      return newLead;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to create lead";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLead = useCallback(async (id: string, payload: any) => {
    setLoading(true);
    setError(null);
    try {
      const updatedLead = await LeadService.update(id, payload);
      setLeads((prev) =>
        prev.map((item) => (item.id === id ? updatedLead : item))
      );
      return updatedLead;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to update lead";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await LeadService.delete(id);
      setLeads((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to delete lead";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    leads,
    lead,
    loading,
    error,
    fetchLeads,
    fetchLeadById,
    createLead,
    updateLead,
    deleteLead
  };
};

export default useLeads;
