'use client';

interface Props {
  connected: boolean;
  activeSources: string[];
  deviceCount: number;
  onSignOut?: () => void;
}

export default function StatusBar({ connected, activeSources, deviceCount, onSignOut }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-900 border-b border-gray-700 text-xs text-gray-400">
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span>{connected ? 'Connected' : 'Disconnected'}</span>
      </div>

      {activeSources.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-gray-600">|</span>
          <span>
            Sources:{' '}
            <span className="text-white font-medium">{activeSources.join(', ')}</span>
          </span>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <span className="text-gray-600">|</span>
        <span>
          Devices: <span className="text-white font-medium">{deviceCount}</span>
        </span>
      </div>

      {onSignOut && (
        <button
          onClick={onSignOut}
          className="ml-auto text-gray-500 hover:text-white transition-colors"
        >
          Sign out
        </button>
      )}
    </div>
  );
}
