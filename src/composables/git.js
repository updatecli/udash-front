// Extracts information from a Git repository URL
// Supports GitHub, GitLab, Gitea, and Bitbucket URLs
export function extractGitURLInfo(url) {
      const regex = /^(?:https?:\/\/|git@)(github\.com|gitlab\.com|gitea\.com|bitbucket\.org)[/:]([^/]+)\/([^/.]+)(?:\.git)?$/i;

      const match = url.match(regex);
      if (match) {
        const domain = match[1].toLowerCase();
        const providerMap = {
          'github.com': 'github',
          'gitlab.com': 'gitlab',
          'gitea.com': 'gitea',
          'bitbucket.org': 'bitbucket'
        };

        const provider = providerMap[domain] || 'unknown';
        const owner = match[2];
        const repo = match[3];
        const rawURL = url;

        return { rawURL, provider, owner, repo };
      }

      return null; // Not a supported Git provider URL
}