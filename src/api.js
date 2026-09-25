async function request(path, { method = 'GET', body, csrfToken, signal } = {}) {
  const headers = {}
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'
  const response = await fetch(path, { method, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body), headers, credentials: 'same-origin', signal })
  if (response.status === 204) return null
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error || 'No se pudo completar la solicitud. Inténtalo de nuevo.')
    error.status = response.status
    throw error
  }
  return data
}

export const fetchCatalog = () => request('/api/catalog')
export const adminRequest = (path, options) => request(`/api/admin${path}`, options)
