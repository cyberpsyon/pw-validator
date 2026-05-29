// Lazily-created singleton worker. The worker (and zxcvbn) only loads on the
// first validate call, keeping the empty state light.
let worker = null;
let seq = 0;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./validator.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { id, result } = e.data;
      const resolve = pending.get(id);
      if (resolve) { pending.delete(id); resolve(result); }
    };
  }
  return worker;
}

export function validateAsync(password, hibpResult) {
  return new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, resolve);
    getWorker().postMessage({ id, password, hibpResult });
  });
}
