import Fuse from 'fuse.js';
import { companies } from './companies';

const fuse = new Fuse(companies, {
  keys: ['name', 'sector', 'description'],
  threshold: 0.3,
  includeScore: true,
});

export const searchCompanies = (query: string) => {
  if (!query || query.trim().length === 0) return [];
  return fuse
    .search(query)
    .slice(0, 8)
    .map((r) => r.item);
};
