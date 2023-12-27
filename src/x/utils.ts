interface Url {
  display_url: string;
  expanded_url: string;
  indices: number[];
  url: string;
}

export function xExpandShortUrls(text: string, urls: Url[]): string {
  let result = text;
  urls.forEach((url) => {
    const [startIndex, endIndex] = url.indices;
    result = result.substring(0, startIndex) + url.expanded_url + result.substring(endIndex);
  });
  return result;
}

export function textToHtml(text: string): string {
  text = text.replace(/\n/g, '<br>');
  text.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g)?.forEach((url) => {
    const urlObject = new URL(url);
    text = text.replace(url, `<a href="${urlObject.href}">${urlObject.hostname}${urlObject.pathname}</a>`);
  });
  return `<p>${text}</p>`;
}

export async function fetchMIMEType(url: string): Promise<string> {
  const response = await fetch(url);
  return response.headers.get('content-type') || '';
}
