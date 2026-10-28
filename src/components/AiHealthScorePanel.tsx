import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert,
  AlertTriangle, 
  Wrench, 
  CheckCircle2, 
  HelpCircle, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Terminal,
  RefreshCw 
} from 'lucide-react';
import type { MachineHealthEvaluation } from '../types/telemetry';

interface AiHealthScorePanelProps {
  evaluation: MachineHealthEvaluation;
  onTriggerDiagnosis: () => Promise<any>;
  isDiagnosing: boolean;
  detailedReport: string | null;
}

export const AiHealthScorePanel: React.FC<AiHealthScorePanelProps> = ({
  evaluation,
  onTriggerDiagnosis,
  isDiagnosing,
  detailedReport,
}) => {
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);
  const [showPythonIntegration, setShowPythonIntegration] = useState(false);

  // Score circular math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (evaluation.score / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#34d399'; // Emerald
    if (score >= 60) return '#fbbf24'; // Amber
    return '#f43f5e'; // Rose
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-100">
                AI-Based Machine Health Analysis
              </h2>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                ISO 10816 + Heuristics
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Correlated multi-sensor anomaly detection & rule-based health evaluation
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onTriggerDiagnosis}
          disabled={isDiagnosing}
          className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/40 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
        >
          {isDiagnosing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          )}
          <span>{isDiagnosing ? 'Analyzing...' : 'Run In-Depth Inspection'}</span>
        </button>
      </div>

      {/* Main Grid: Score Gauge + Reasons & Recommendations */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        
        {/* Machine Health Score (0 - 100) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center rounded-lg bg-slate-950/60 p-5 border border-slate-800/70 text-center">
          <p className="text-xs font-medium text-slate-400 mb-2">Calculated Machine Health Index</p>
          
          <div className="relative flex items-center justify-center">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="7"
                fill="transparent"
              />
              {/* Animated Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={getScoreColor(evaluation.score)}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold font-mono text-white tabular-nums">
                {evaluation.score}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                / 100
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold capitalize" style={{ color: getScoreColor(evaluation.score) }}>
            {evaluation.status === 'normal' && <CheckCircle2 className="h-4 w-4" />}
            {evaluation.status === 'warning' && <AlertTriangle className="h-4 w-4" />}
            {evaluation.status === 'anomaly' && <ShieldAlert className="h-4 w-4" />}
            <span>Condition: {evaluation.status}</span>
          </div>

          {/* Scoring Method Transparency Link */}
          <button
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="mt-3 flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <HelpCircle className="h-3 w-3" />
            <span>Defined Scoring Method</span>
            {showFormulaDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showFormulaDetails && (
            <div className="mt-3 w-full rounded bg-slate-900/90 p-3 text-left text-[11px] text-slate-300 border border-slate-700/60 font-mono space-y-1.5">
              <p className="text-cyan-300 font-semibold">Deterministic Algorithm:</p>
              <p className="text-slate-400 text-[10px]">
                Score = 100 - (VibPenalty + ThermPenalty + NoisePenalty)
              </p>
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>Vibration Factor (max 45):</span>
                  <span className="text-indigo-300">-{evaluation.scoringFormula.vibrationPenalty} pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Thermal Factor (max 35):</span>
                  <span className="text-emerald-300">-{evaluation.scoringFormula.thermalPenalty} pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Acoustic Factor (max 20):</span>
                  <span className="text-cyan-300">-{evaluation.scoringFormula.acousticPenalty} pts</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reasons & Cautious Recommendations */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Possible Warning Reasons based on ACTUAL readings */}
          <div className="rounded-lg bg-slate-950/40 p-4 border border-slate-800/70">
            <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Info className="h-4 w-4 text-cyan-400" />
              <span>Multi-Sensor Condition Observations</span>
            </h4>
            <ul className="mt-2.5 space-y-2 text-xs text-slate-300">
              {evaluation.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cautious Recommendations */}
          <div className="rounded-lg bg-slate-950/40 p-4 border border-slate-800/70">
            <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Wrench className="h-4 w-4 text-amber-400" />
              <span>Cautious Engineering Recommendations</span>
            </h4>
            <ul className="mt-2.5 space-y-2 text-xs text-slate-300">
              {evaluation.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Strict Anti-Hallucination Disclaimer (MANDATORY REQUIREMENT) */}
          <div className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-[11px] leading-relaxed text-slate-400">
            <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-300">Responsible Engineering Notice:</strong> {evaluation.disclaimer} Never claim a confirmed mechanical fault from sensor readings alone. The system detects deviations from normal operating baselines to schedule timely physical inspection.
            </p>
          </div>

          {/* Optional Gemini / Deep Diagnostic Output */}
          {detailedReport && (
            <div className="rounded-lg border border-cyan-800/60 bg-cyan-950/20 p-4 text-xs text-slate-200">
              <div className="flex items-center gap-2 mb-2 text-cyan-300 font-semibold">
                <Sparkles className="h-4 w-4" />
                <span>AI Engineering Reliability Assessment</span>
              </div>
              <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-300">
                {detailedReport}
              </div>
            </div>
          )}

          {/* Python ML Anomaly Detection Integration Hook */}
          <div className="pt-1">
            <button
              onClick={() => setShowPythonIntegration(!showPythonIntegration)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Terminal className="h-3.5 w-3.5 text-indigo-400" />
              <span>Python ML Isolation Forest & Autoencoder Pipeline Integration</span>
              {showPythonIntegration ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showPythonIntegration && (
              <div className="mt-3 rounded-lg bg-slate-950 p-3 text-[11px] text-slate-300 border border-slate-800 font-mono space-y-2">
                <p className="text-indigo-300"># Future ML Anomaly Detection API Hook (/api/ml/anomaly-detect):</p>
                <pre className="overflow-x-auto text-[10px] text-slate-400 bg-slate-900 p-2 rounded">
{`from sklearn.ensemble import IsolationForest
import numpy as np

# Feature vector: [vibration_rms, temp_delta, noise_variance]
X_features = np.array([[${evaluation.scoringFormula.vibrationPenalty}, ${evaluation.scoringFormula.thermalPenalty}, ${evaluation.scoringFormula.acousticPenalty}]])
# Model returns -1 for anomaly, 1 for normal
# Post to: POST /api/telemetry with calculated anomaly index`}
                </pre>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
