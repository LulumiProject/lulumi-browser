export function historyMappings(history: any): any {
  const out: any = {};
  history.forEach((h) => {
    if (!out[h.url]) {
      out[h.url] = {
        title: h.title,
        icon: h.favIconUrl,
      };
    }
  });
  return out;
}
