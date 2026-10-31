const STALE_DEPLOY = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i;
const RELOADED_KEY = "stale-deploy-reloaded";

export function isStaleDeployError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return STALE_DEPLOY.test(error.name) || STALE_DEPLOY.test(error.message);
}

// A visitor who had the site open during a deploy asks for chunks that no longer exist. A reload fetches the new build.
// The session flag allows one automatic reload per tab session, so a real fault can never put the page in a reload loop.
export function reloadOnceForStaleDeploy(error: unknown, reload: () => void = () => window.location.reload()) {
  if (!isStaleDeployError(error)) return false;
  try {
    if (window.sessionStorage.getItem(RELOADED_KEY)) return false;
    window.sessionStorage.setItem(RELOADED_KEY, "1");
  } catch {
    return false;
  }
  reload();
  return true;
}
