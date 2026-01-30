const DEFAULT_LIMIT = 6;

const parseLimit = (value: string | undefined) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, 50);
};

const buildGithubUrl = (user: string) => {
  const params = new URLSearchParams({
    per_page: "100",
    sort: "updated",
    direction: "desc"
  });

  return `https://api.github.com/users/${encodeURIComponent(user)}/repos?${params.toString()}`;
};

const extractReadmeCategory = (readme: string | null) => {
  if (!readme) return undefined;
  const firstLine = readme.split(/\r?\n/)[0]?.trim();
  if (!firstLine || !firstLine.startsWith("//")) return undefined;
  const candidate = firstLine.slice(2).trim();
  if (!candidate) return undefined;
  const token = candidate.split(/[-–—:|]/)[0]?.trim();
  if (!token) return undefined;
  return token.toUpperCase();
};

const fetchReadmeCategory = async (
  user: string,
  repo: string,
  headers: Record<string, string>
) => {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(user)}/${encodeURIComponent(repo)}/readme`,
    {
      headers: {
        ...headers,
        Accept: "application/vnd.github.raw"
      }
    }
  );

  if (!response.ok) return undefined;
  const text = await response.text();
  return extractReadmeCategory(text);
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

  try {
    const response = await fetch(buildGithubUrl(user), { headers });
    if (!response.ok) {
      const message = await response.text();
      res.status(response.status).json({ error: message || "GitHub API error" });
      return;
    }

    const repos = (await response.json()) as Array<{
      name: string;
      description: string | null;
      language: string | null;
      html_url: string;
      fork: boolean;
      archived: boolean;
      disabled: boolean;
      updated_at: string;
    }>;

    const filteredRepos = repos
      .filter((repo) => !repo.fork && !repo.archived && !repo.disabled)
      .slice(0, limit);

    const filtered = await Promise.all(
      filteredRepos.map(async (repo) => {
        let category: string | undefined;
        try {
          category = await fetchReadmeCategory(user, repo.name, headers);
        } catch {
          category = undefined;
        }

        return {
          name: repo.name,
          description: repo.description ?? "",
          language: repo.language ?? "Unknown",
          url: repo.html_url,
          updatedAt: repo.updated_at,
          category
        };
      })
    );

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
    res.status(200).json({ user, projects: filtered });
  } catch (error) {
    res.status(500).json({ error: "Unexpected server error." });
  }
}
