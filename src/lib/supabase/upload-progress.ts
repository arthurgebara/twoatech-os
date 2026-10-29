/** Keep the Storage SDK's signed-upload request and report real browser progress. */
export function createUploadProgressFetch(onProgress: (percentage: number) => void): typeof fetch {
  return (input, init) => {
    // Storage sends files as FormData. Leave any other SDK requests on fetch.
    if (!(init?.body instanceof FormData)) return fetch(input, init);

    return new Promise<Response>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open(init.method ?? "POST", input instanceof Request ? input.url : String(input));
      request.timeout = 5 * 60 * 1000;
      new Headers(init.headers).forEach((value, name) => request.setRequestHeader(name, value));
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.min(100, Math.round(event.loaded / event.total * 100)));
      };
      request.onload = () => {
        const headers = new Headers();
        for (const line of request.getAllResponseHeaders().trim().split(/[\r\n]+/)) {
          const separator = line.indexOf(":");
          if (separator > 0) headers.append(line.slice(0, separator), line.slice(separator + 1).trim());
        }
        resolve(new Response(request.status === 204 ? null : request.responseText, { status: request.status, headers }));
      };
      request.onerror = () => reject(new Error("Falha na conexão durante o envio. Verifique sua internet e tente novamente."));
      request.ontimeout = () => reject(new Error("O envio demorou demais. Verifique sua conexão e tente novamente."));
      request.onabort = () => reject(new Error("Envio interrompido."));
      request.send(init.body as FormData);
    });
  };
}
