import { net } from 'electron';

export default function fetch(provider: string, url: string, callback: Function) {
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
