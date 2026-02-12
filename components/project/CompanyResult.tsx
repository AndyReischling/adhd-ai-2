'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Company } from '@/types';

interface CompanyResultProps {
  company: Company;
  onClick: (company: Company) => void;
  index: number;
}

export default function CompanyResult({ company, onClick, index }: CompanyResultProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={() => onClick(company)}
      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-800 transition-colors duration-150 text-left border-b border-gray-800 last:border-0"
    >
      {/* Company logo — plain img tag to avoid Next.js Image domain issues */}
      <div className="w-8 h-8 bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {company.logoUrl && !logoFailed ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={company.logoUrl}
            alt=""
            width={24}
            height={24}
            className="object-contain"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="font-mono text-[10px] text-gray-600">
            {company.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Company info */}
      <div className="flex-1 min-w-0">
        <div className="font-mono text-sm text-off-white truncate">
          {company.name}
        </div>
        <div className="font-mono text-[10px] text-gray-400 tracking-[0.15em]">
          {company.sector.toUpperCase()}
        </div>
      </div>
    </motion.button>
  );
}
