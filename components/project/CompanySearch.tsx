'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { searchCompanies } from '@/lib/fuzzySearch';
import { useProjectStore } from '@/store/projectStore';
import { Company } from '@/types';
import CompanyResult from './CompanyResult';
import StampLabel from '@/components/ui/StampLabel';

export default function CompanySearch() {
  const router = useRouter();
  const setCompany = useProjectStore((s) => s.setCompany);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [showStamp, setShowStamp] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.trim().length > 0) {
      setResults(searchCompanies(value));
    } else {
      setResults([]);
    }
  }, []);

  const handleSelect = useCallback(
    (company: Company) => {
      setSelectedCompany(company);
      setCompany(company);
      setQuery(company.name);
      setResults([]);
      setShowStamp(true);

      // Navigate after stamp animation
      setTimeout(() => {
        const slug = company.domain.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        router.push(`/project/${slug}`);
      }, 1500);
    },
    [setCompany, router]
  );

  const handleFreeformSubmit = useCallback(() => {
    if (query.trim().length === 0) return;
    const freeformCompany: Company = {
      name: query.trim(),
      domain: `${query.trim().toLowerCase().replace(/\s+/g, '')}.com`,
      sector: 'Unknown',
      description: 'A company that has drawn the attention of the Collective.',
      logoUrl: '',
    };
    handleSelect(freeformCompany);
  }, [query, handleSelect]);

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results.length > 0) {
              handleSelect(results[0]);
            } else if (e.key === 'Enter') {
              handleFreeformSubmit();
            }
          }}
          placeholder="TYPE COMPANY NAME..."
          className="w-full bg-transparent border-2 border-gray-600 focus:border-red-primary px-6 py-5 font-mono text-lg text-off-white placeholder:text-gray-600 outline-none transition-colors duration-200 tracking-wider"
        />
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-5 bg-red-primary"
          style={{ animation: 'cursor-blink 1s step-end infinite' }}
        />
      </div>

      {/* Results dropdown */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 right-0 bg-gray-900 border-2 border-gray-800 border-t-0 z-50 max-h-[400px] overflow-y-auto"
          >
            {results.map((company, i) => (
              <CompanyResult
                key={company.domain}
                company={company}
                onClick={handleSelect}
                index={i}
              />
            ))}
            {query.trim().length > 0 && (
              <button
                onClick={handleFreeformSubmit}
                className="w-full px-4 py-3 text-left font-mono text-xs text-gray-400 hover:bg-gray-800 transition-colors border-t border-gray-800"
              >
                Can&apos;t find your company? Press ENTER to analyze &ldquo;{query}&rdquo;
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DOSSIER OPENED stamp overlay */}
      <AnimatePresence>
        {showStamp && selectedCompany && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black-primary/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StampLabel text="DOSSIER OPENED" variant="red" size="lg" animated />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
