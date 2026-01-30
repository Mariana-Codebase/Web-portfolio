const DEFAULT_LIMIT = 6;
const FETCH_TIMEOUT_MS = 8000;

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

const parseProjectTypeFromReadme = (readmeText: string) => {
  const firstLine = readmeText.split(/\r?\n/, 1)[0]?.trim() ?? "";
  if (!firstLine.startsWith("//")) return undefined;
  const tag = firstLine.slice(2).trim();
  return tag.length > 0 ? tag : undefined;
};

const calculatePercentages = (langs: Record<string, number>) => {
  const totalBytes = Object.values(langs).reduce((sum, bytes) => sum + bytes, 0);
  if (totalBytes === 0) return {};
  const percentages: Record<string, number> = {};
  for (const [lang, bytes] of Object.entries(langs)) {
    percentages[lang] = Math.round((bytes / totalBytes) * 1000) / 10;
  }
  return percentages;
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

    const filtered = repos
      .filter((repo) => !repo.fork && !repo.archived && !repo.disabled)
      .slice(0, limit);

    const enriched = await Promise.all(
      filtered.map(async (repo) => {
        let repoLanguages: Record<string, number> = {};
        let projectType: string | undefined;

        try {
          const langController = new AbortController();
          const langTimeout = setTimeout(() => langController.abort(), FETCH_TIMEOUT_MS);

          const langResponse = await fetch(
            `https://api.github.com/repos/${encodeURIComponent(user)}/${encodeURIComponent(repo.name)}/languages`,
            { headers, signal: langController.signal }
          );
          clearTimeout(langTimeout);

          if (langResponse.ok) {
            repoLanguages = (await langResponse.json()) as Record<string, number>;
          }
        } catch {
          // Ignorar si falla
        }

        try {
          const readmeController = new AbortController();
          const readmeTimeout = setTimeout(() => readmeController.abort(), FETCH_TIMEOUT_MS);

          const readmeResponse = await fetch(
            `https://api.github.com/repos/${encodeURIComponent(user)}/${encodeURIComponent(repo.name)}/readme`,
            {
              headers: { ...headers, Accept: "application/vnd.github.raw+json" },
              signal: readmeController.signal
            }
          );
          clearTimeout(readmeTimeout);

          if (readmeResponse.ok) {
            const readmeText = await readmeResponse.text();
            projectType = parseProjectTypeFromReadme(readmeText);
          }
        } catch {
          // Ignorar si falla
        }

        return {
          name: repo.name,
          description: repo.description ?? "",
          language: repo.language ?? "Unknown",
          languages: calculatePercentages(repoLanguages),
          projectType,
          url: repo.html_url,
          updatedAt: repo.updated_at
        };
      })
    );

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
    res.status(200).json({ user, projects: enriched });
  } catch (error) {
    res.status(500).json({ error: "Unexpected server error." });
  }
}