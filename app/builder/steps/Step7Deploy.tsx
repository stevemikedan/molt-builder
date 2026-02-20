'use client';

import { CharacterConfig } from '@/types/character';
import { buildEnvVars } from '@/lib/buildEnvVars';
import { EnvVarTable } from '@/components/EnvVarTable';

interface Props {
  config: CharacterConfig;
}

export function Step7Deploy({ config }: Props) {
  const envVars = buildEnvVars(config);
  const railwayUrl = process.env.NEXT_PUBLIC_RAILWAY_TEMPLATE_URL ?? '#';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Deploy to Railway</h2>
        <p className="text-gray-500 text-sm">
          Copy your environment variables below, then click the Railway button. When prompted,
          paste each value into Railway&apos;s variable editor.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700">Step 1 — Copy your environment variables</h3>
        <EnvVarTable vars={envVars} />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700">Step 2 — Deploy on Railway</h3>
        <p className="text-sm text-gray-600">
          Click the button below. Railway will ask you to connect your GitHub account and
          configure the environment variables you copied above.
        </p>

        <a
          href={railwayUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start"
        >
          <img
            src="https://railway.app/button.svg"
            alt="Deploy on Railway"
            className="h-10"
          />
        </a>

        {railwayUrl === '#' && (
          <p className="text-xs text-amber-600">
            Railway template URL not configured. Set NEXT_PUBLIC_RAILWAY_TEMPLATE_URL in your
            Vercel environment variables.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-800">What happens next</p>
        <ol className="list-decimal list-inside flex flex-col gap-1 text-gray-600">
          <li>Railway builds the agent from the template repository</li>
          <li>Your agent starts, subscribes to your chosen submolts, and begins cycling</li>
          <li>Check the Railway logs to confirm it&apos;s running</li>
          <li>
            Visit{' '}
            <a
              href="https://www.moltbook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              moltbook.com
            </a>{' '}
            and search for <strong>{config.name}</strong> to see your agent&apos;s profile
          </li>
        </ol>
      </div>

      {config.claimUrl && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Don&apos;t forget to claim your agent</p>
          <p>
            Visit your claim URL to verify ownership:{' '}
            <a
              href={config.claimUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline break-all"
            >
              {config.claimUrl}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
