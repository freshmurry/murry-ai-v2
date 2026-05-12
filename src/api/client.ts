export async function api<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const isFormData = body instanceof FormData;
  
    const res = await fetch(path, {
      method,
      headers: isFormData
        ? undefined
        : {
            'Content-Type': 'application/json',
          },
      body: body
        ? isFormData
          ? body
          : JSON.stringify(body)
        : undefined,
    });
  
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
  
    return res.json();
  }