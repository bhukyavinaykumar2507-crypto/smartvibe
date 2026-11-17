import React, { useEffect, useRef, useState } from 'react';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  Radar,
} from 'lucide-react';
import type { MachineHealthEvaluation } from '../types/telemetry';
import { AnimatedNumber } from './AnimatedNumber';

interface AiHealthScorePanelProps {
  evaluation: MachineHealthEvaluation;
  detailedReport: string | null;
  generatedBy?: 'gemini' | 'rule-engine';
  isDiagnosing: boolean;
  onRunDiagnosis: () => void;
}

export const AiHealthScorePanel: React.FC<AiHealthScorePanelProps> = ({
  evaluation,
  detailedReport,
  generatedBy,
  isDiagnosing,
  onRunDiagnosis,
}) => {
  const [justCompleted, setJustCompleted] = useState(false);
  const prevDiagnosingRef = useRef(isDiagnosing);

  useEffect(() => {
    if (prevDiagnosingRef.current && !isDiagnosing && detailedReport) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 3800);
      return () => clearTimeout(timer);
    }
    prevDiagnosingRef.current = isDiagnosing;
  }, [isDiagnosing, detailedReport]);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, evaluation.score));
  const dashOffset = circumference - (clampedScore / 100) * circumference;

  const isAnomaly = evaluation.status === 'anomaly';
  const isWarning = evaluation.status === 'warning';

  const strokeColor = isAnomaly ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981';

  return (
    <div
      className={`sv-card sv-card-neutral relative overflow-hidden rounded-2xl border bg-[#0b1322]/95 p-6 shadow-xl backdrop-blur-md transition-all duration-300 ${
        isAnomaly
          ? 'border-rose-500/75 sv-anomaly-glow'
          : isWarning
            ? 'border-amber-600/60'
            : 'border-slate-800/80'
      }`}
    >
      {/* AI Scanning Overlay Beam when analysis is actively running */}
      {isDiagnosing && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl">
          <div className="sv-scan-beam h-16 w-full bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent border-b border-cyan-400/60 shadow-[0_0_24px_rgba(6,182,212,0.35)]" />
        </div>
      )}

      <div className="relative z-20 flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Left: Animated Circular Health Gauge */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800/90 bg-slate-950/60 p-5 shrink-0 lg:w-64">
          <div className="relative flex h-32 w-32 items-center justify-center">
            {isAnomaly && (
              <span className="sv-live-ping absolute inset-2 rounded-full border border-rose-500/40" />
            )}
            <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#1e293b"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke={strokeColor}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                fill="transparent"
                className="sv-svg-smooth"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <AnimatedNumber
                value={clampedScore}
                decimals={0}
                duration={520}
                className="text-3xl font-extrabold font-mono text-white leading-none tabular-nums"
              />
              <span className="text-[10px] font-medium text-slate-400 mt-1">
                Health Score
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            {isAnomaly ? (
              <ShieldAlert className="h-4 w-4 text-rose-400" />
            ) : isWarning ? (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            )}
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isAnomaly
                  ? 'text-rose-400'
                  : isWarning
                    ? 'text-amber-400'
                    : 'text-emerald-400'
              }`}
            >
              {evaluation.status}
            </span>
          </div>

          {/* 2-Sensor Penalty Breakdown */}
          <div className="mt-4 w-full space-y-2 border-t border-slate-800/80 pt-3 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <span>ADXL345 Penalty</span>
              <span className="text-cyan-300 font-bold">-{evaluation.vibrationPenalty} / 65</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>MAX9814 Penalty</span>
              <span className="text-purple-300 font-bold">-{evaluation.acousticPenalty} / 35</span>
            </div>
          </div>
        </div>

        {/* Right: AI Diagnostic Runner & Report Output */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  AI Anomaly & Vibration Diagnostics
                </h3>
                <p className="text-xs text-slate-400">
                  Evaluates ADXL345 acceleration harmonics & MAX9814 acoustic envelope
                </p>
              </div>
            </div>

            <button
              onClick={onRunDiagnosis}
              disabled={isDiagnosing}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-950/40 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-60 transition-all"
            >
              {isDiagnosing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Scanning Telemetry...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Run AI Diagnostics</span>
                </>
              )}
            </button>
          </div>

          {/* Scanning Progress State */}
          {isDiagnosing && (
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/25 p-4 space-y-2.5 sv-tab-enter">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
                <span className="inline-flex items-center gap-2">
                  <Radar className="h-4 w-4 animate-spin" />
                  Analyzing tri-axial vibration & acoustic signatures...
                </span>
                <span>ACTIVE SCAN</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
                <div className="sv-scan-bar h-full w-2/5 rounded-full bg-gradient-to-r from-cyan-500 via-teal-300 to-cyan-500" />
              </div>
            </div>
          )}

          {/* Analysis Complete Banner */}
          {justCompleted && !isDiagnosing && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-xs font-medium text-emerald-300 sv-tab-enter">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Diagnostic scan complete — telemetry verified cleanly.
              </span>
              {generatedBy && (
                <span className="font-mono text-[10px] uppercase text-emerald-400/90">
                  Engine: {generatedBy}
                </span>
              )}
            </div>
          )}

          {/* Detected Conditions List */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Real-Time Rule Conditions
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-200">
              {evaluation.detectedConditions.map((cond, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                      isAnomaly
                        ? 'bg-rose-400'
                        : isWarning
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                    }`}
                  />
                  <span>{cond}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs text-teal-300 font-medium">
              Recommendation: {evaluation.recommendation}
            </p>
          </div>

          {/* Detailed AI Diagnostic Report */}
          {detailedReport && !isDiagnosing && (
            <div className="sv-tab-enter rounded-xl border border-cyan-500/30 bg-[#070b14]/90 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-300">
                  Diagnostic Assessment Report
                </span>
                {generatedBy && (
                  <span className="rounded bg-slate-900 border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    {generatedBy === 'gemini' ? 'Gemini AI Engine' : 'Deterministic Engine'}
                  </span>
                )}
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-200">
                {detailedReport}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
