import { CreateShareResponse } from './constants';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isNetwork = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface SharePayload {
  content: string;
  templateId: string;
  title: string;
  themeClass?: string;
}

export async function createSharePage(
  apiBaseUrl: string,
  token: string | undefined,
  payload: SharePayload,
  existing?: { slug: string; updateToken: string }
): Promise<CreateShareResponse> {
  // Try update first if we have existing record
  if (existing) {
    try {
      const result = await updateSharePage(apiBaseUrl, token, payload, existing);
      return result;
    } catch (err) {
      if (err instanceof ApiError && err.isNetwork) {
        throw err;
      }
      // Fallback to create new
    }
  }

  const url = `${apiBaseUrl}/api/shares`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError('Network error', undefined, true);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(`API error: ${res.status} ${text}`, res.status);
  }

  const data = await res.json() as Record<string, unknown>;
  return {
    success: true,
    slug: data.slug as string,
    url: data.url as string,
    updateToken: (data.updateToken || data.update_token || '') as string,
    temporary: data.temporary as boolean | undefined,
    expiresAt: (data.expiresAt || data.expires_at) as string | undefined,
  };
}

async function updateSharePage(
  apiBaseUrl: string,
  token: string | undefined,
  payload: SharePayload,
  existing: { slug: string; updateToken: string }
): Promise<CreateShareResponse> {
  const url = `${apiBaseUrl}/api/shares/${existing.slug}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ...payload,
        updateToken: existing.updateToken,
      }),
    });
  } catch {
    throw new ApiError('Network error', undefined, true);
  }

  if (!res.ok) {
    throw new ApiError(`Update failed: ${res.status}`, res.status);
  }

  const data = await res.json() as Record<string, unknown>;
  return {
    success: true,
    slug: (data.slug as string) || existing.slug,
    url: data.url as string,
    updateToken: (data.updateToken || data.update_token || existing.updateToken) as string,
    temporary: data.temporary as boolean | undefined,
    expiresAt: (data.expiresAt || data.expires_at) as string | undefined,
  };
}

export async function deleteSharePage(
  apiBaseUrl: string,
  token: string | undefined,
  slug: string,
  updateToken: string
): Promise<void> {
  const url = `${apiBaseUrl}/api/shares/${slug}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ updateToken }),
    });
  } catch {
    throw new ApiError('Network error', undefined, true);
  }

  if (!res.ok) {
    throw new ApiError(`Delete failed: ${res.status}`, res.status);
  }
}
