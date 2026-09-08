import { apiClient } from "@/lib/axios";

/**
 * Test Scenarios — the flow layer of a Module Test Cases page.
 *
 * A module scenario ("User Management") holds a hundred module test cases in
 * one flat list. A Test Scenario is the tester's own grouping of that list:
 * a name ("Create User") and the cases that flow, in the order they are walked.
 * A case may belong to several flows — "Log in as admin" opens more than one —
 * so membership is a mapping, not a field on the case.
 */

const BASE = "/api/v2/qa/scenarios";

interface Envelope<T> { success: boolean; data: T }

/** One step of a flow: the membership row, flattened onto the case it points at. */
export interface ScenarioStep {
  /** Membership id — NOT the test case id. */
  id: string;
  test_case_id: string;
  /** 0-based; the UI renders position + 1. */
  position: number;
  /** The human case id, "TC-004". */
  case_code: string | null;
  name: string;
  status: string | null;
  priority: string | null;
  test_type: string | null;
  automation: string | null;
}

export interface TestScenario {
  id: string;
  tenant_id: string;
  parent_test_case_id: string;
  module_id: string | null;
  name: string;
  description: string | null;
  position: number;
  created_by: string | null;
  creator_name?: string | null;
  created_at: string;
  updated_at: string;
  case_count: number;
  steps: ScenarioStep[];
}

/** Flat "this case is step N of that flow" rows, for the list view's column. */
export interface ScenarioMembership {
  test_case_id: string;
  scenario_id: string;
  name: string;
  position: number;
}

export interface ScenarioListResult {
  scenarios: TestScenario[];
  memberships: ScenarioMembership[];
}

export class QaScenarioService {
  /** Every flow on one Module Test Cases page, with its ordered steps. */
  static async list(parentId: string): Promise<ScenarioListResult> {
    const res = await apiClient.get<Envelope<ScenarioListResult>>(BASE, {
      params: { parent_id: parentId },
    });
    return res.data.data;
  }

  /**
   * The flows that touch a given set of cases.
   *
   * What a run asks: its suite can draw cases from several module scenarios,
   * so there is no single parent id to list by.
   */
  static async forCases(caseIds: string[]): Promise<ScenarioListResult> {
    if (caseIds.length === 0) return { scenarios: [], memberships: [] };
    const res = await apiClient.get<Envelope<ScenarioListResult>>(`${BASE}/for-cases`, {
      params: { case_ids: caseIds.join(",") },
    });
    return res.data.data;
  }

  static async get(id: string): Promise<TestScenario> {
    const res = await apiClient.get<Envelope<TestScenario>>(`${BASE}/${id}`);
    return res.data.data;
  }

  /** `case_ids` is the flow in order — index becomes the step number. */
  static async create(input: {
    parent_test_case_id: string;
    name: string;
    description?: string | null;
    case_ids?: string[];
  }): Promise<TestScenario> {
    const res = await apiClient.post<Envelope<TestScenario>>(BASE, input);
    return res.data.data;
  }

  static async update(
    id: string,
    input: { name?: string; description?: string | null }
  ): Promise<TestScenario> {
    const res = await apiClient.put<Envelope<TestScenario>>(`${BASE}/${id}`, input);
    return res.data.data;
  }

  /** Ungroups. The cases themselves stay in the module's list, untouched. */
  static async remove(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  }

  /**
   * Replace the flow with exactly these cases, in this order.
   *
   * Also how a reorder is saved: send the list as it now reads on screen.
   */
  static async setCases(id: string, caseIds: string[]): Promise<TestScenario> {
    const res = await apiClient.put<Envelope<TestScenario>>(`${BASE}/${id}/cases`, {
      case_ids: caseIds,
    });
    return res.data.data;
  }

  /** Append to the end of the flow, keeping the steps already in it. */
  static async addCases(id: string, caseIds: string[]): Promise<TestScenario> {
    const res = await apiClient.post<Envelope<TestScenario>>(`${BASE}/${id}/cases`, {
      case_ids: caseIds,
    });
    return res.data.data;
  }

  static async removeCase(id: string, testCaseId: string): Promise<TestScenario> {
    const res = await apiClient.delete<Envelope<TestScenario>>(
      `${BASE}/${id}/cases/${testCaseId}`
    );
    return res.data.data;
  }

  /** The order of the flows themselves on the page. */
  static async reorder(parentId: string, scenarioIds: string[]): Promise<TestScenario[]> {
    const res = await apiClient.put<Envelope<TestScenario[]>>(`${BASE}/reorder`, {
      parent_test_case_id: parentId,
      scenario_ids: scenarioIds,
    });
    return res.data.data;
  }
}
