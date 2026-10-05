import { PAGE_SIZE } from './api.js';
export const compareScores = (a, b) => b.score - a.score || b.services - a.services || a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
export function localAdminStorage(read, save, sessions, currentVersion) {
  const matching = (entry, id, version, old) => entry.id === id && entry.version === version && ['name', 'score', 'services'].every(key => entry[key] === old[key]);
  return {
    versions() {
      const counts = new Map();
      for (const entry of read()) counts.set(entry.version, (counts.get(entry.version) || 0) + 1);
      return [...counts].map(([version, count]) => ({ version, count }));
    },
    list(version, search, page) {
      const scores = read().filter(s => s.version === version && s.name.toLowerCase().includes(search.toLowerCase())).sort(compareScores);
      return { scores: scores.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: scores.length };
    },
    export(version) { return read().filter(s => s.version === version).sort(compareScores); },
    update(id, version, entry, old) {
      const scores = read(), index = scores.findIndex(s => matching(s, id, version, old));
      if (index < 0) return false;
      const next = [...scores]; next[index] = { ...scores[index], ...entry }; save(next); return true;
    },
    remove(id, version, old) {
      const scores = read(), next = scores.filter(s => !matching(s, id, version, old));
      if (next.length === scores.length) return false;
      save(next); return true;
    },
    reset(version) {
      const scores = read(), next = scores.filter(s => s.version !== version);
      save(next);
      if (version === currentVersion) sessions.clear();
      return scores.length - next.length;
    },
  };
}
