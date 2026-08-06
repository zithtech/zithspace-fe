"use client";

import React, { useEffect, useState } from "react";
import { Skeleton } from "antd";
import {
  DownOutlined, FileTextOutlined, InfoCircleOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import { ShieldCheck, Activity } from "lucide-react";
import { api as axios } from "@/lib/axios";

/** Steps are stored as a JSON array, a newline string, or already an array. */
const parseSteps = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* fall through to newline splitting */
  }
  if (typeof val === "string") {
    return val.split("\n").map(s => s.replace(/^\d+[.)]\s*/, "").trim()).filter(Boolean);
  }
  return [];
};

interface Props {
  testCaseId: string | null;
  testCaseRef: string | null;
}

/**
 * The QA test case a bug was raised from, shown inline in the bug drawer as a
 * collapsed section. Details are fetched live on first expand rather than
 * copied into the bug, so they never drift from the source case.
 */
export default function TestCaseDetailsPanel({ testCaseId, testCaseRef }: Props) {
  const [open, setOpen] = useState(false);
  const [testCase, setTestCase] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || !testCaseId || testCase || loading) return;
    let active = true;
    setLoading(true);
    setFailed(false);
    axios.get(`/api/v2/qa/${testCaseId}`)
      .then((res: any) => {
        if (active) setTestCase(res?.data?.data || res?.data || res);
      })
      .catch((err) => {
        console.error("Failed to load the test case:", err);
        if (active) setFailed(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, testCaseId]);

  if (!testCaseRef && !testCaseId) return null;

  const steps = parseSteps(testCase?.steps_to_reproduce);

  return (
    <div className={`tcp${open ? " is-open" : ""}`}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .tcp {
          margin: -4px 0 16px; border-radius: 10px; overflow: hidden;
          border: 1px solid rgba(59,130,246,.22); background: rgba(59,130,246,.04);
          transition: border-color .15s ease;
        }
        .tcp.is-open { border-color: rgba(59,130,246,.32); }
        .tcp__bar {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 9px 12px; cursor: pointer; text-align: left;
          background: none; border: none; transition: background .15s ease;
        }
        .tcp__bar:hover { background: rgba(59,130,246,.06); }
        .tcp__icon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 26px; height: 26px; border-radius: 8px; font-size: 13px;
          background: rgba(59,130,246,.12); color: #2563eb;
        }
        .tcp__label {
          font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: #2563eb; flex-shrink: 0;
        }
        .tcp__ref {
          font-size: 11.5px; font-weight: 700; letter-spacing: .02em;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          padding: 2px 8px; border-radius: 5px;
          background: var(--bg-pure-white); border: 1px solid rgba(59,130,246,.28); color: #2563eb;
        }
        .tcp__hint { font-size: 11px; color: var(--text-slate-400); margin-left: auto; flex-shrink: 0; }
        .tcp__caret { font-size: 10px; color: #2563eb; transition: transform .18s ease; flex-shrink: 0; }
        .tcp.is-open .tcp__caret { transform: rotate(180deg); }

        .tcp__body {
          padding: 14px 14px 16px;
          border-top: 1px dashed rgba(59,130,246,.25);
          background: var(--bg-pure-white);
        }
        .tcp__title { margin: 0 0 12px; font-size: 13.5px; font-weight: 700; line-height: 1.4; color: var(--text-slate-900); }
        .tcp__facts {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
          background: var(--border-slate-100); border: 1px solid var(--border-slate-100);
          border-radius: 9px; overflow: hidden; margin-bottom: 16px;
        }
        @media (max-width: 640px) { .tcp__facts { grid-template-columns: repeat(2, 1fr); } }
        .tcp__fact { display: flex; flex-direction: column; gap: 3px; padding: 8px 10px; background: var(--bg-pure-white); }
        .tcp__fact-key { font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-slate-400); }
        .tcp__fact-val { font-size: 12px; font-weight: 600; color: var(--text-slate-700); }

        .tcp__sec { margin-bottom: 15px; }
        .tcp__sec:last-child { margin-bottom: 0; }
        .tcp__sec-title {
          display: flex; align-items: center; gap: 8px; margin: 0 0 7px;
          font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: var(--text-slate-500);
        }
        .tcp__sec-icon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 19px; height: 19px; border-radius: 6px; font-size: 10px;
          background: var(--bg-slate-50); color: var(--text-slate-400);
          border: 1px solid var(--border-slate-100);
        }
        .tcp__sec-icon--ok { background: rgba(16,185,129,.1); color: #059669; border-color: rgba(16,185,129,.2); }
        .tcp__rule { flex: 1; min-width: 16px; border-top: 1px dashed var(--border-slate-200); }
        .tcp__text { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--text-slate-700); white-space: pre-wrap; }
        .tcp__empty { margin: 0; font-size: 12px; color: var(--text-slate-400); font-style: italic; }
        .tcp__steps { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 5px; }
        .tcp__steps li {
          display: flex; align-items: flex-start; gap: 9px;
          padding: 7px 10px; border-radius: 8px;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
          font-size: 12.5px; line-height: 1.5; color: var(--text-slate-700);
        }
        .tcp__step-n {
          flex-shrink: 0; width: 17px; height: 17px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 9.5px; font-weight: 700; margin-top: 1px;
          background: rgba(59,130,246,.12); color: #2563eb;
        }
        .tcp__expected {
          margin: 0; padding: 9px 11px; border-radius: 8px;
          font-size: 12.5px; line-height: 1.55; white-space: pre-wrap;
          background: rgba(16,185,129,.07); border: 1px solid rgba(16,185,129,.22); color: #065f46;
        }
      `}} />

      <button type="button" className="tcp__bar" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="tcp__icon"><FileTextOutlined /></span>
        <span className="tcp__label">Test case</span>
        <span className="tcp__ref">{testCaseRef || testCase?.test_case_id || "TC"}</span>
        <span className="tcp__hint">{open ? "Hide details" : "Show details"}</span>
        <DownOutlined className="tcp__caret" />
      </button>

      {open && (
        <div className="tcp__body">
          {loading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : failed || !testCase ? (
            <p className="tcp__empty">
              {testCaseId
                ? "This test case could not be loaded — it may have been deleted."
                : "No test case is linked to this bug."}
            </p>
          ) : (
            <>
              <h4 className="tcp__title">{testCase.name || "Untitled case"}</h4>

              <div className="tcp__facts">
                <div className="tcp__fact">
                  <span className="tcp__fact-key">Priority</span>
                  <span className="tcp__fact-val">{testCase.priority || "—"}</span>
                </div>
                <div className="tcp__fact">
                  <span className="tcp__fact-key">Severity</span>
                  <span className="tcp__fact-val">{testCase.severity || "—"}</span>
                </div>
                <div className="tcp__fact">
                  <span className="tcp__fact-key">Type</span>
                  <span className="tcp__fact-val">{testCase.test_type || "—"}</span>
                </div>
                <div className="tcp__fact">
                  <span className="tcp__fact-key">Status</span>
                  <span className="tcp__fact-val">{testCase.status || "—"}</span>
                </div>
              </div>

              {testCase.description && (
                <section className="tcp__sec">
                  <h5 className="tcp__sec-title">
                    <span className="tcp__sec-icon"><InfoCircleOutlined /></span>
                    <span>Description</span><span className="tcp__rule" />
                  </h5>
                  <p className="tcp__text">{testCase.description}</p>
                </section>
              )}

              {testCase.preconditions && (
                <section className="tcp__sec">
                  <h5 className="tcp__sec-title">
                    <span className="tcp__sec-icon"><ShieldCheck size={11} /></span>
                    <span>Preconditions</span><span className="tcp__rule" />
                  </h5>
                  <p className="tcp__text">{testCase.preconditions}</p>
                </section>
              )}

              <section className="tcp__sec">
                <h5 className="tcp__sec-title">
                  <span className="tcp__sec-icon"><Activity size={11} /></span>
                  <span>Steps to Reproduce</span><span className="tcp__rule" />
                </h5>
                {steps.length === 0 ? (
                  <p className="tcp__empty">No steps recorded.</p>
                ) : (
                  <ol className="tcp__steps">
                    {steps.map((s, i) => (
                      <li key={i}><span className="tcp__step-n">{i + 1}</span><span>{s}</span></li>
                    ))}
                  </ol>
                )}
              </section>

              <section className="tcp__sec">
                <h5 className="tcp__sec-title">
                  <span className="tcp__sec-icon tcp__sec-icon--ok"><CheckCircleOutlined /></span>
                  <span>Expected Result</span><span className="tcp__rule" />
                </h5>
                {testCase.expected_result
                  ? <p className="tcp__expected">{testCase.expected_result}</p>
                  : <p className="tcp__empty">Not recorded.</p>}
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
