import { request } from "@/lib/http/client";

export interface SprintView {
  sprintId: string;
  workspaceId: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  capacitySp: number;
  status: string;
  freezeState: boolean;
  dailyCapacityMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface BacklogItemView {
  backlogItemId: string;
  sprintId: string;
  workItemId: string;
  rank: number;
  status: string;
  createdAt: string;
}

export interface DayPlanItemView {
  dayPlanItemId: string;
  dayPlanId: string;
  workItemId: string;
  plannedMinutes: number;
  orderIndex: number;
}

export interface DayPlanView {
  dayPlanId: string;
  sprintId: string;
  day: string;
  locked: boolean;
  plannedMinutes: number;
  bufferMinutes: number;
  items: DayPlanItemView[];
  createdAt: string;
  updatedAt: string;
}

interface CreateSprintInput {
  workspaceId: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  capacitySp: number;
  dailyCapacityMinutes?: number;
}

interface AddBacklogItemInput {
  workItemId: string;
  rank: number;
  status: string;
}

interface GenerateDayPlanInput {
  dailyCapacityMinutes?: number;
  bufferMinutes?: number;
}

interface PatchDayPlanInput {
  plannedMinutes?: number;
  bufferMinutes?: number;
  locked?: boolean;
  items?: DayPlanItemView[];
}

export function useSprintPlanning() {
  async function createSprint(input: CreateSprintInput) {
    return request<SprintView>("/api/v2/sprints", {
      method: "POST",
      body: input
    });
  }

  async function addBacklogItem(sprintId: string, input: AddBacklogItemInput) {
    return request<BacklogItemView>(`/api/v2/sprints/${sprintId}/backlog-items`, {
      method: "POST",
      body: input
    });
  }

  async function listBacklog(sprintId: string) {
    return request<BacklogItemView[]>(`/api/v2/sprints/${sprintId}/backlog-items`);
  }

  async function generateDayPlan(sprintId: string, input: GenerateDayPlanInput = {}) {
    return request<DayPlanView[]>(`/api/v2/sprints/${sprintId}/day-plan:generate`, {
      method: "POST",
      body: input
    });
  }

  async function listDayPlans(sprintId: string) {
    return request<DayPlanView[]>(`/api/v2/sprints/${sprintId}/day-plans`);
  }

  async function patchDayPlan(dayPlanId: string, input: PatchDayPlanInput) {
    return request<DayPlanView>(`/api/v2/day-plans/${dayPlanId}`, {
      method: "PATCH",
      body: input
    });
  }

  async function freezeSprint(sprintId: string, freeze = true) {
    return request<SprintView>(`/api/v2/sprints/${sprintId}:freeze`, {
      method: "POST",
      body: { freeze }
    });
  }

  async function listSprintDsu(sprintId: string) {
    return request<Array<{ dsuId: string; authorId: string; rawText: string; createdAt: string }>>(
      `/api/v2/sprints/${sprintId}/dsu`
    );
  }

  return {
    createSprint,
    addBacklogItem,
    listBacklog,
    generateDayPlan,
    listDayPlans,
    patchDayPlan,
    freezeSprint,
    listSprintDsu
  };
}
