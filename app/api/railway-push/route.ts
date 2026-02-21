import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_GQL = 'https://backboard.railway.app/graphql/v2';

interface PushBody {
  envVars: Record<string, string>;
  railwayToken: string;
  projectId: string;
  serviceId: string;
  environmentId: string;
}

async function gql(token: string, query: string, variables: Record<string, unknown>) {
  const resp = await fetch(RAILWAY_GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!resp.ok) {
    throw new Error(`Railway API returned ${resp.status}`);
  }
  const json = await resp.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

export async function POST(req: NextRequest) {
  let body: PushBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { envVars, railwayToken, projectId, serviceId, environmentId } = body;

  if (!railwayToken || !projectId || !serviceId || !environmentId) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // 1. Upsert all env vars at once
    await gql(railwayToken, `
      mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
        variableCollectionUpsert(input: $input)
      }
    `, {
      input: {
        projectId,
        serviceId,
        environmentId,
        variables: envVars,
      },
    });

    // 2. Trigger redeploy
    const redeployData = await gql(railwayToken, `
      mutation ServiceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
        serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
      }
    `, { serviceId, environmentId });

    const deploymentId = redeployData?.serviceInstanceRedeploy ?? undefined;

    return NextResponse.json({ ok: true, deploymentId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Never log token or env var values
    console.error('[railway-push] error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
