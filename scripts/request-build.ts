// Starts the production Workers Build for the promoted commit and waits for its result.
// Pushes from the deploy key do not start Workers Builds (#74), so Deploy asks for the build.
//
// Usage (Deploy workflow):
//   CLOUDFLARE_BUILDS_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<id> BUILD_TRIGGER=<uuid> \
//   EXPECTED_SHA=<commit> node scripts/request-build.ts

const POLL_INTERVAL_MS = 15_000;
const TIMEOUT_MS = 15 * 60_000;

interface Build {
  build_uuid: string;
  status: string;
  build_outcome: string | null;
}

interface Envelope<T> {
  success?: boolean;
  errors?: { code: number; message: string }[];
  result?: T | null;
}

/** "running" until Cloudflare stops the build, then its outcome. */
export function buildState(
  build: Pick<Build, 'status' | 'build_outcome'>,
): 'running' | 'success' | 'failed' {
  if (build.status !== 'stopped') return 'running';
  return build.build_outcome === 'success' ? 'success' : 'failed';
}

/** Returns the API result, or throws an error that names the cause. */
export function unwrap<T>(status: number, body: Envelope<T>): T {
  if (status === 401 || status === 403) {
    throw new Error(
      `Cloudflare rejected CLOUDFLARE_BUILDS_TOKEN (HTTP ${status}). Renew it with Workers Builds Configuration: Edit.`,
    );
  }
  if (!body.success || !body.result) {
    throw new Error(`Cloudflare API HTTP ${status}: ${JSON.stringify(body.errors ?? [])}`);
  }
  return body.result;
}

if (import.meta.main) {
  const {
    CLOUDFLARE_BUILDS_TOKEN: token,
    CLOUDFLARE_ACCOUNT_ID: account,
    BUILD_TRIGGER: trigger,
    EXPECTED_SHA: sha,
  } = process.env;
  if (!token || !account || !trigger || !sha) {
    throw new Error(
      'CLOUDFLARE_BUILDS_TOKEN, CLOUDFLARE_ACCOUNT_ID, BUILD_TRIGGER and EXPECTED_SHA are required.',
    );
  }
  const api = `https://api.cloudflare.com/client/v4/accounts/${account}/builds`;
  const call = async (path: string, init: RequestInit = {}): Promise<Build> => {
    const response = await fetch(`${api}${path}`, {
      ...init,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    });
    const body = (await response.json().catch(() => ({}))) as Envelope<Build>;
    return unwrap(response.status, body);
  };

  const { build_uuid: id } = await call(`/triggers/${trigger}/builds`, {
    method: 'POST',
    body: JSON.stringify({ branch: 'production', commit_hash: sha }),
  });
  console.log(`Started Workers Build ${id} for ${sha.slice(0, 7)}`);

  const deadline = Date.now() + TIMEOUT_MS;
  for (;;) {
    const build = await call(`/builds/${id}`);
    const state = buildState(build);
    if (state === 'success') break;
    if (state === 'failed') {
      console.error(`✗ Build ${id} ended: ${build.build_outcome}. Read its log in Workers Builds.`);
      process.exit(1);
    }
    if (Date.now() > deadline) {
      console.error(`✗ Build ${id} still ${build.status} after ${TIMEOUT_MS / 1000} s.`);
      process.exit(1);
    }
    console.log(`… build ${build.status}`);
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  console.log(`✓ Build ${id} deployed ${sha.slice(0, 7)}`);
}
