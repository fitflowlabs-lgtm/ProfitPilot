const BASE = '';

async function request(method, path, body) {
  const options = {
    method,
    credentials: 'include',
    headers: {},
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, options);

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      message = data.error || data.message || message;
    } catch {
      // ignore parse error
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }

  return null;
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};

export default api;
