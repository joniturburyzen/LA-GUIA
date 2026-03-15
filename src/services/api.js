const WORKER = 'https://young-mud-86b3.joniturbu.workers.dev'

export async function workerPost(path, body) {
  const res = await fetch(`${WORKER}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Worker error ${res.status}`)
  return res.json()
}
