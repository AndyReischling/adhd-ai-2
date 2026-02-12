'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProjectStore } from '@/store/projectStore';
import { generateScenarios } from '@/lib/api';
import { DoomsdayResponse, DoomsdayScenario } from '@/types';
import AnalysisLoadingScreen from '@/components/project/AnalysisLoadingScreen';
import DoomsdayWorkspace from '@/components/project/DoomsdayWorkspace';
import PageTransition from '@/components/layout/PageTransition';

export default function AnalysisPage() {
  const router = useRouter();
  const params = useParams();
  const {
    company,
    selectedScenarios,
    selectScenario,
    deselectScenario,
    setScenarios,
  } = useProjectStore();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DoomsdayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company) {
      router.push('/project');
      return;
    }

    const fetchScenarios = async () => {
      try {
        const result = await generateScenarios(company);

        // Safely access horizons with fallbacks
        const horizons = result?.horizons || {};
        const safeResult: DoomsdayResponse = {
          company: result?.company || company.name,
          horizons: {
            '1_year': Array.isArray(horizons['1_year']) ? horizons['1_year'] : [],
            '5_year': Array.isArray(horizons['5_year']) ? horizons['5_year'] : [],
            '10_year': Array.isArray(horizons['10_year']) ? horizons['10_year'] : [],
            '50_year': Array.isArray(horizons['50_year']) ? horizons['50_year'] : [],
          },
        };

        setData(safeResult);

        const allScenarios: DoomsdayScenario[] = [
          ...safeResult.horizons['1_year'],
          ...safeResult.horizons['5_year'],
          ...safeResult.horizons['10_year'],
          ...safeResult.horizons['50_year'],
        ];
        setScenarios(allScenarios);
      } catch (err) {
        setError('THE APPARATUS HAS ENCOUNTERED A TEMPORARY CONTRADICTION. STAND BY.');
        console.error(err);
      }
    };

    // Show loading for minimum 28 seconds — matches the agent deliberation dialogue
    const fetchPromise = fetchScenarios();
    const timerPromise = new Promise((resolve) => setTimeout(resolve, 28000));

    Promise.all([fetchPromise, timerPromise]).then(() => {
      setLoading(false);
    });
  }, [company, router, setScenarios]);

  const handleProceed = () => {
    if (selectedScenarios.length > 0) {
      router.push(`/project/${params.slug}/canvas`);
    }
  };

  if (loading) {
    return <AnalysisLoadingScreen />;
  }

  if (error || !data) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-black-primary px-6">
          <div className="text-center max-w-lg">
            <p className="font-mono text-sm text-red-primary mb-4 tracking-[0.2em]">
              ERROR
            </p>
            <p className="font-body text-lg text-gray-400">
              {error || 'THE APPARATUS HAS ENCOUNTERED A TEMPORARY CONTRADICTION. STAND BY.'}
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <DoomsdayWorkspace
      data={data}
      selectedScenarios={selectedScenarios}
      onSelect={selectScenario}
      onDeselect={deselectScenario}
      onProceed={handleProceed}
    />
  );
}
