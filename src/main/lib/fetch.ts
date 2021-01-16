/* eslint-disable max-len */

import { net } from 'electron';

export default function fetch(url: string, callback: ({ body: string, error: any, ok: boolean }) => any): void {
  let bodyData = '';
  const urlRequest = net.request(url);
  urlRequest.on('response', (response) => {
    if (response.statusCode === 200) {
      response.on('data', (chunk) => {
        bodyData += chunk.toString();
      });
      response.on('error', (err) => {
        callback({
          body: '',
          error: err,
          ok: false,
        });
      });
      response.on('end', () => {
        if (callback) {
          callback({
            body: bodyData,
            error: '',
            ok: true,
          });
        }
      });
    } else {
      callback({
        body: '',
        error: `${url} is not reachable.`,
        ok: false,
      });
    }
  });
  urlRequest.end();
}
