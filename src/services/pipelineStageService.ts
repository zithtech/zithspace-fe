import { api } from "@/lib/axios";

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  probability: number;
  isFinal: boolean;
  isDefault: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePipelineStagePayload {
  name: string;
  color?: string;
  probability?: number;
  isFinal?: boolean;
  isDefault?: boolean;
  order?: number;
}

export interface UpdatePipelineStagePayload extends Partial<CreatePipelineStagePayload> {}

const pipelineStageService = {
  async getAll(): Promise<PipelineStage[]> {
    return await api.get<PipelineStage[]>("/api/pipeline-stages");
  },

  async create(data: CreatePipelineStagePayload): Promise<PipelineStage> {
    return await api.post<PipelineStage>("/api/pipeline-stages", data);
  },

  async update(id: string, data: UpdatePipelineStagePayload): Promise<PipelineStage> {
    return await api.put<PipelineStage>(`/api/pipeline-stages/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/pipeline-stages/${id}`);
  },

  async reorder(stageIds: string[]): Promise<void> {
    await api.put("/api/pipeline-stages/reorder", { stageIds });
  }
};

export default pipelineStageService;
