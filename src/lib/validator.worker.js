import { fullValidate } from './validator.js';

self.onmessage = (e) => {
  const { id, password, hibpResult } = e.data;
  const result = fullValidate(password, hibpResult);
  self.postMessage({ id, result });
};
