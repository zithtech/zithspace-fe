import { api } from "@/lib/axios";

export const skillsService = {
  getSkills: () => api.get('/api/skills'),
  createSkill: (data: any) => api.post('/api/skills', data),
  updateSkill: (id: string, data: any) => api.put(`/api/skills/${id}`, data),
  deleteSkill: (id: string) => api.delete(`/api/skills/${id}`),

  getExperience: () => api.get('/api/experience'),
  createExperience: (data: any) => api.post('/api/experience', data),
  updateExperience: (id: string, data: any) => api.put(`/api/experience/${id}`, data),
  deleteExperience: (id: string) => api.delete(`/api/experience/${id}`)
};