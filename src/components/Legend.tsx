'use client';

import { SOURCE_COLOR } from '@/lib/colors';

const SOURCE_LABEL: Record<string, string> = {
  simulator: 'Simulator',
  aprsfi:    'APRS.fi',
  aprsis:    'APRS-IS',
  dmr:       'DMR',
};

interface Props {
  activeSources: string[];
}

export default function Legend({ activeSources }: Props) {
  if (activeSources.length === 0) return null;

  return (
    <div className="absolute bottom-8 right-2 z-[1000] bg-gray-900/90 text-xs px-3 py-2 rounded shadow border border-gray-700 space-y-1.5">
      {activeSources.map(source => (
        <div key={source} className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: SOURCE_COLOR[source] ?? '#6b7280' }}
          />
          <span className="text-gray-200">{SOURCE_LABEL[source] ?? source}</span>
        </div>
      ))}
    </div>
  );
}
