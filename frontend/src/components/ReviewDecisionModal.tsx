"use client";

import React, { useState } from "react";
import {
  ReviewQueueItem,
  approveMatchApi,
  rejectMatchApi,
  modifyMatchApi,
  createNationalMaterialFromMatchApi,
} from "@/lib/api";

interface ReviewDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  item: ReviewQueueItem | null;
  onSuccess: () => void;
}

export default function ReviewDecisionModal({
  isOpen,
  onClose,
  token,
  item,
  onSuccess,
}: ReviewDecisionModalProps) {
  const [action, setAction] = useState<"APPROVE" | "REJECT" | "MODIFY">("APPROVE");
  const [comment, setComment] = useState("");
  const [modifiedRelationship, setModifiedRelationship] = useState("NEAR_DUPLICATE");
  const [explicitSubstituteAuth, setExplicitSubstituteAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdNationalCode, setCreatedNationalCode] = useState<string | null>(null);
  const [createdNationalId, setCreatedNationalId] = useState<number | null>(null);

  if (!isOpen || !item) return null;

  const handleActionSubmit = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (action === "APPROVE") {
        if (item.hard_blocked && item.relationship_type === "SAME") {
          setError("Cannot approve a hard-blocked match as SAME. Please use MODIFY to select an alternate relationship.");
          setLoading(false);
          return;
        }
        await approveMatchApi(token, item.match_id);
        setSuccessMessage(`Match successfully APPROVED.`);
      } else if (action === "REJECT") {
        if (!comment.trim()) {
          setError("Rejection requires a mandatory explanatory comment.");
          setLoading(false);
          return;
        }
        await rejectMatchApi(token, item.match_id, comment.trim());
        setSuccessMessage("Match successfully REJECTED.");
      } else if (action === "MODIFY") {
        if (!comment.trim()) {
          setError("Modifying relationship requires a mandatory explanatory comment.");
          setLoading(false);
          return;
        }
        if (item.hard_blocked && modifiedRelationship === "SAME") {
          setError("Cannot set a hard-blocked match to SAME.");
          setLoading(false);
          return;
        }
        await modifyMatchApi(token, item.match_id, modifiedRelationship, comment.trim());
        setSuccessMessage(`Match relationship updated to ${modifiedRelationship} and APPROVED.`);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to submit review decision.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNationalMaterial = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await createNationalMaterialFromMatchApi(token, item.match_id, {
        explicit_substitute_authorization: explicitSubstituteAuth,
      });
      setCreatedNationalCode(res.national_material.national_material_code);
      setCreatedNationalId(res.national_material.id);
      setSuccessMessage(res.message);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create National Material Identity.");
    } finally {
      setLoading(false);
    }
  };

  const isEligibleForNationalMaterial =
    (item.status === "APPROVED" || successMessage?.includes("APPROVED")) &&
    ["SAME", "NEAR_DUPLICATE", "FUNCTIONALLY_EQUIVALENT", "APPROVED_SUBSTITUTE"].includes(
      action === "MODIFY" ? modifiedRelationship : item.relationship_type
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-semibold">
              Match #{item.match_id}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                item.priority === "HIGH"
                  ? "bg-red-500/10 text-red-400 border border-red-500/30"
                  : item.priority === "MEDIUM"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
              }`}
            >
              Priority: {item.priority}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Side by side comparison summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {item.material_a.cpse_code}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {item.material_a.id}</span>
              </div>
              <p className="text-sm font-bold text-white mb-1">{item.material_a.code}</p>
              <p className="text-xs text-slate-300 line-clamp-3">{item.material_a.description}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {item.material_b.cpse_code}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {item.material_b.id}</span>
              </div>
              <p className="text-sm font-bold text-white mb-1">{item.material_b.code}</p>
              <p className="text-xs text-slate-300 line-clamp-3">{item.material_b.description}</p>
            </div>
          </div>

          {/* AI Recommendation Summary */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">AI Proposed Relationship:</span>
              <span className="font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                {item.relationship_type}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Confidence Score:</span>
              <span className="font-mono font-bold text-white">{(item.final_score * 100).toFixed(1)}%</span>
            </div>
            <div className="text-xs text-slate-400 pt-1 border-t border-slate-700/30">
              <span className="font-medium text-slate-300">Explanation:</span> {item.explanation}
            </div>
          </div>

          {/* Hard Block Alert */}
          {item.hard_blocked && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <div>
                <p className="font-semibold text-red-200">Engineering Hard Constraint Conflict</p>
                <p>This match has technical specification conflicts (e.g. pressure rating or metallurgy). It cannot be approved as SAME without justification.</p>
              </div>
            </div>
          )}

          {/* Decision Selector */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Expert Decision</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAction("APPROVE")}
                className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  action === "APPROVE"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-950/50"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <span>✓</span> APPROVE
              </button>
              <button
                type="button"
                onClick={() => setAction("MODIFY")}
                className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  action === "MODIFY"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-950/50"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <span>✎</span> MODIFY
              </button>
              <button
                type="button"
                onClick={() => setAction("REJECT")}
                className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  action === "REJECT"
                    ? "bg-red-500/20 border-red-500 text-red-300 shadow-lg shadow-red-950/50"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <span>✕</span> REJECT
              </button>
            </div>
          </div>

          {/* Action-Specific Options */}
          {action === "MODIFY" && (
            <div className="space-y-2 p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/50">
              <label className="text-xs font-semibold text-slate-300">Target Relationship Type</label>
              <select
                value={modifiedRelationship}
                onChange={(e) => setModifiedRelationship(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="SAME">SAME (Identical)</option>
                <option value="NEAR_DUPLICATE">NEAR_DUPLICATE (Minor Variant)</option>
                <option value="FUNCTIONALLY_EQUIVALENT">FUNCTIONALLY_EQUIVALENT (Interchangeable)</option>
                <option value="APPROVED_SUBSTITUTE">APPROVED_SUBSTITUTE (Requires Justification)</option>
                <option value="RELATED">RELATED (Same family, different spec)</option>
                <option value="DIFFERENT">DIFFERENT (Unrelated)</option>
              </select>
            </div>
          )}

          {/* Comment input (Mandatory for REJECT & MODIFY) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Decision Comment {action !== "APPROVE" && <span className="text-red-400">* (Mandatory)</span>}
              </label>
              <span className="text-[10px] text-slate-500">Audited in review_actions</span>
            </div>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                action === "REJECT"
                  ? "Explain why this match recommendation was rejected..."
                  : action === "MODIFY"
                  ? "Explain engineering rationale for relationship modification..."
                  : "Optional approval note..."
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
              {successMessage}
            </div>
          )}

          {/* National Material Creation shortcut if approved */}
          {createdNationalCode ? (
            <div className="p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-xl text-center space-y-2">
              <span className="text-xs font-semibold text-emerald-400">National Material Identity Assigned</span>
              <div className="text-2xl font-mono font-bold text-white tracking-widest">{createdNationalCode}</div>
              <p className="text-xs text-slate-400">
                Legacy materials mapped with initial PENDING status awaiting authorization.
              </p>
              {createdNationalId && (
                <a
                  href={`/national-materials/${createdNationalId}`}
                  className="inline-block mt-2 px-4 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg text-xs font-semibold text-emerald-300 transition"
                >
                  View National Material Master →
                </a>
              )}
            </div>
          ) : isEligibleForNationalMaterial ? (
            <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Create National Material Identity</p>
                  <p className="text-[11px] text-slate-400">
                    Assign a trusted NM-XXXXXX code and establish legacy mappings for both CPSE materials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateNationalMaterial}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
                >
                  Create NM Code
                </button>
              </div>

              {((action === "MODIFY" ? modifiedRelationship : item.relationship_type) === "APPROVED_SUBSTITUTE") && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50 text-xs text-amber-300">
                  <input
                    type="checkbox"
                    id="authSub"
                    checked={explicitSubstituteAuth}
                    onChange={(e) => setExplicitSubstituteAuth(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <label htmlFor="authSub">I explicitly authorize grouping this approved substitute under this National Identity.</label>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Close
          </button>
          {!createdNationalCode && (
            <button
              type="button"
              onClick={handleActionSubmit}
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 transition disabled:opacity-50"
            >
              {loading ? "Processing..." : `Confirm ${action}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
