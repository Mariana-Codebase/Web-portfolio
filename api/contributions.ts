const DEFAULT_LIMIT = 6;
const CACHE_TTL_MS = 10 * 60 * 1000;
const responseCache = new Map<string, { expiresAt: number; data: unknown }>();
const timelineCache = new Map<string, { expiresAt: number; data: Array<{ url: string; reference: string; author: string; event: string }> }>();

const parseLimit = (value: string | undefined) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, 50);
};

const parseIncludeRefs = (value: string | undefined) => {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return normalized !== "0" && normalized !== "false";
};

const parseSince = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return undefined;
  return normalized;
};

const buildSearchUrl = (user: string, perPage: number, since?: string) => {
  const sinceFilter = since ? ` created:>=${since}` : "";
  const params = new URLSearchParams({
    q: `author:${user} is:pr${sinceFilter} sort:updated-desc`,
    per_page: String(perPage)
  });

  return `https://api.github.com/search/issues?${params.toString()}`;
};

const parseRepoFromUrl = (repoUrl: string) => {
  const parts = repoUrl.split('/').filter(Boolean);
  if (parts.length < 2) return { fullName: repoUrl, name: repoUrl };
  const name = parts[parts.length - 1];
  const owner = parts[parts.length - 2];
  return { fullName: `${owner}/${name}`, name };
};

const parseOwnerRepo = (fullName: string) => {
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) return null;
  return { owner, repo };
};

const parseOwnerRepoFromUrl = (url: string) => {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
};

const buildCommitHtmlUrl = (commitUrl: string) => {
  const match = commitUrl.match(/repos\/([^/]+)\/([^/]+)\/commits\/([a-f0-9]+)/i);
  if (!match) return null;
  return `https://github.com/${match[1]}/${match[2]}/commit/${match[3]}`;
};

const normalizeReferenceEvent = (event: string) => {
  if (event === "mentioned") return "mentioned";
  if (event === "cross-referenced" || event === "referenced") return "referenced";
  return "referenced";
};

const fetchTimelineReferences = async (
  owner: string,
  repo: string,
  issueNumber: number,
  headers: Record<string, string>
) => {
  const cacheKey = `${owner}/${repo}#${issueNumber}`;
  const now = Date.now();
  const cached = timelineCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }
  const references: Array<{ url: string; reference: string; author: string; event: string }> = [];
  const seen = new Set<string>();
  let page = 1;
  const perPage = 100;

  while (page <= 5) {
    const timelineResponse = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}/timeline?per_page=${perPage}&page=${page}`,
      {
        headers: {
          ...headers,
          Accept: "application/vnd.github+json, application/vnd.github.mockingbird-preview+json"
        }
      }
    );
    if (!timelineResponse.ok) break;
    const timeline = (await timelineResponse.json()) as Array<{
      event?: string;
      url?: string;
      commit_id?: string;
      commit_url?: string;
      actor?: { login?: string };
      source?: {
        issue?: {
          html_url?: string;
          number?: number;
          user?: { login?: string };
          pull_request?: Record<string, unknown>;
        };
      };
    }>;
    if (!Array.isArray(timeline) || timeline.length === 0) break;
    for (const entry of timeline) {
      const actor = entry.actor?.login ?? "unknown";
      if (entry.event === "cross-referenced" && entry.source?.issue?.html_url) {
        const issue = entry.source.issue;
        const issueUrl = issue.html_url as string;
        const repoInfo = parseOwnerRepoFromUrl(issueUrl);
        const ref = repoInfo
          ? `${repoInfo.owner}/${repoInfo.repo}#${issue.number}`
          : `#${issue.number}`;
        const event = normalizeReferenceEvent("cross-referenced");
        const key = `${issueUrl}|${actor}`;
        if (!seen.has(key)) {
          seen.add(key);
          references.push({ url: issueUrl, reference: ref, author: actor, event });
        }
        continue;
      }

      if (entry.event === "referenced" && entry.commit_url && entry.commit_id) {
        const commitUrl = buildCommitHtmlUrl(entry.commit_url) ?? entry.commit_url;
        const repoInfo = parseOwnerRepoFromUrl(commitUrl) ?? { owner, repo };
        const ref = `${repoInfo.owner}/${repoInfo.repo}@${String(entry.commit_id).slice(0, 7)}`;
        const event = normalizeReferenceEvent("referenced");
        const key = `${commitUrl}|${actor}`;
        if (!seen.has(key)) {
          seen.add(key);
          references.push({ url: commitUrl, reference: ref, author: actor, event });
        }
        continue;
      }

      if (entry.event === "mentioned" && entry.url) {
        const mentionUrl = entry.url as string;
        const repoInfo = parseOwnerRepoFromUrl(mentionUrl) ?? { owner, repo };
        const ref = `${repoInfo.owner}/${repoInfo.repo}`;
        const event = normalizeReferenceEvent("mentioned");
        const key = `${mentionUrl}|${actor}`;
        if (!seen.has(key)) {
          seen.add(key);
          references.push({ url: mentionUrl, reference: ref, author: actor, event });
        }
      }
    }
    if (timeline.length < perPage) break;
    page += 1;
  }

  timelineCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, data: references });
  return references;
};

export default async function handler(req: any, res: any) {
  const user =
    typeof req.query?.user === "string"
      ? req.query.user
      : (typeof (globalThis as any).process !== "undefined"
          ? (globalThis as any).process.env.GITHUB_USER
          : undefined);

  const limit = parseLimit(
    typeof req.query?.limit === "string" ? req.query.limit : undefined
  );
  const includeRefs = parseIncludeRefs(
    typeof req.query?.includeRefs === "string" ? req.query.includeRefs : undefined
  );
  const since = parseSince(
    typeof req.query?.since === "string" ? req.query.since : undefined
  );

  if (!user) {
    res.status(400).json({ error: "Missing GitHub user." });
    return;
  }

  const token =
    typeof (globalThis as any).process !== "undefined"
      ? (globalThis as any).process.env?.GITHUB_TOKEN
      : undefined;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "portfolio-site"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const cacheKey = `${user}:${limit}:${includeRefs ? "refs" : "norefs"}:${since ?? "all"}`;
  const now = Date.now();
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
    res.status(200).json(cached.data);
    return;
  }

  try {
    const searchResponse = await fetch(buildSearchUrl(user, 50, since), { headers });
    if (!searchResponse.ok) {
      const message = await searchResponse.text();
      res.status(searchResponse.status).json({ error: message || "GitHub API error" });
      return;
    }

    const searchData = (await searchResponse.json()) as {
      items: Array<{
        html_url: string;
        number: number;
        state: "open" | "closed";
        repository_url: string;
        pull_request?: { url: string };
        title?: string;
      }>;
    };

    const repoCache = new Map<string, { name: string; fullName: string; stars: number; owner: string }>();
    const contributions: Array<{
      status: "OPEN" | "MERGED";
      project: string;
      title: string;
      stars: number;
      url: string;
      reference: string;
      owner: string;
      references: Array<{ url: string; reference: string; author: string; event: string }>;
    }> = [];

    for (const item of searchData.items ?? []) {
      if (contributions.length >= limit) break;
      if (!item.pull_request?.url) continue;

      let status: "OPEN" | "MERGED" | null = null;
      if (item.state === "open") {
        status = "OPEN";
      } else if (item.state === "closed") {
        try {
          const prResponse = await fetch(item.pull_request.url, { headers });
          if (prResponse.ok) {
            const prData = (await prResponse.json()) as { merged_at: string | null };
            if (prData.merged_at) status = "MERGED";
          }
        } catch {
          status = null;
        }
      }

      if (!status) continue;

      const repoUrl = item.repository_url;
      let repoData = repoCache.get(repoUrl);
      if (!repoData) {
        try {
          const repoResponse = await fetch(repoUrl, { headers });
          if (repoResponse.ok) {
            const repoJson = (await repoResponse.json()) as {
              name: string;
              full_name: string;
              stargazers_count: number;
              owner: { login: string };
            };
            repoData = {
              name: repoJson.name,
              fullName: repoJson.full_name,
              stars: repoJson.stargazers_count,
              owner: repoJson.owner.login
            };
          }
        } catch {
          repoData = undefined;
        }

        if (!repoData) {
          const parsed = parseRepoFromUrl(repoUrl);
          const owner = parsed.fullName.split('/')[0] ?? parsed.fullName;
          repoData = { name: parsed.name, fullName: parsed.fullName, stars: 0, owner };
        }

        repoCache.set(repoUrl, repoData);
      }

      if (repoData.owner?.toLowerCase() === user.toLowerCase()) {
        continue;
      }

      let references: Array<{ url: string; reference: string; author: string; event: string }> = [];
      if (includeRefs) {
        const ownerRepo = parseOwnerRepo(repoData.fullName);
        if (ownerRepo) {
          try {
            const allRefs = await fetchTimelineReferences(
              ownerRepo.owner,
              ownerRepo.repo,
              item.number,
              headers
            );
            references = allRefs.filter(
              (issue) => issue.author.toLowerCase() !== user.toLowerCase()
            );
          } catch {
            references = [];
          }
        }
      }

      contributions.push({
        status,
        project: repoData.name,
        title: item.title ?? "",
        stars: repoData.stars,
        url: item.html_url,
        reference: `${repoData.fullName}#${item.number}`,
        owner: repoData.owner,
        references
      });
    }

    const payload = { user, contributions };
    responseCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, data: payload });
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ error: "Unexpected server error." });
  }
}
