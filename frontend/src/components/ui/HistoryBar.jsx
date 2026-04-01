import { useState } from 'react';

function statusClass(check) {
  if (!check) return 'empty';
  if (check.ok === true)  return 'up';
  if (check.ok === false) return 'down';
  return 'pending';
}

function formatTimestamp(ts) {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return null; }
}

function Check({ check, index }) {
  const [hover, setHover] = useState(false);
  const cls = statusClass(check);
  const ts = check?.at || check?.timestamp;
  const ms = check?.ms;
  const label = ts ? formatTimestamp(ts) : null;

  return (
    <div
      className={`history-check ${cls}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={!label ? undefined : undefined}
    >
      {hover && (label || ms !== undefined) && (
        <div className="hbar-tooltip">
          {label && <span>{label}</span>}
          {label && ms !== undefined && ' · '}
          {ms !== undefined && <span>{ms}ms</span>}
          {!label && !ms && (cls === 'empty' ? 'No data' : cls)}
        </div>
      )}
    </div>
  );
}

export function HistoryBar({ checks = [] }) {
  const padded = Array.from({ length: 30 }, (_, i) => checks[i] ?? null);

  return (
    <div className="history-bar">
      {padded.map((check, i) => (
        <Check key={i} check={check} index={i} />
      ))}
    </div>
  );
}
