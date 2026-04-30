import { useState, useCallback } from 'react';
import { skillsService } from '@/services/skills.service';

export const useSkills = () => {
  const [skills, setSkills] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await skillsService.getSkills();
      console.log('Skills response:', res);
      setSkills(res || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExperience = useCallback(async () => {
    setLoading(true);
    try {
      const res = await skillsService.getExperience();
      console.log('Experience response:', res);
      setExperience(res || []);
    } catch (error) {
      console.error('Error fetching experience:', error);
      setExperience([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSkill = async (data: any) => {
    await skillsService.createSkill(data);
    fetchSkills();
  };

  const updateSkill = async (id: string, data: any) => {
    await skillsService.updateSkill(id, data);
    fetchSkills();
  };

  const deleteSkill = async (id: string) => {
    await skillsService.deleteSkill(id);
    fetchSkills();
  };

  const createExperience = async (data: any) => {
    await skillsService.createExperience(data);
    fetchExperience();
  };

  const updateExperience = async (id: string, data: any) => {
    await skillsService.updateExperience(id, data);
    fetchExperience();
  };

  const deleteExperience = async (id: string) => {
    await skillsService.deleteExperience(id);
    fetchExperience();
  };

  return {
    skills,
    experience,
    loading,
    fetchSkills,
    fetchExperience,
    createSkill,
    updateSkill,
    deleteSkill,
    createExperience,
    updateExperience,
    deleteExperience
  };
};