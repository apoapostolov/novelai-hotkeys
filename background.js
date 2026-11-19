const api = globalThis.browser || globalThis.chrome;

api.runtime.onMessage.addListener((message) => {
  if (!message || message.type !== 'nai-download') return undefined;

  return api.downloads.download({
    url: message.url,
    filename: message.filename || 'novelai.png',
    saveAs: !!message.saveAs,
    conflictAction: 'uniquify'
  }).then((id) => ({ ok: true, id }))
    .catch((error) => ({ ok: false, error: String((error && error.message) || error) }));
});
