export function xExpandUrl(url: string, urls: { display_url: string, expanded_url: string, url: string, indices: number[] }[]): string {
  return urls.find((u) => u.url === url)?.expanded_url || url;
}

export function xExpandDescription(description: string, urls: { display_url: string, expanded_url: string, url: string, indices: number[] }[]): string {
  // TODO: indicesはどこからどこまでが短縮されたURLかを指す値なので、urlが同じ場合に置き換えるのではなくindicesを使うべき
  urls.forEach((url) => {
    description = description.replace(url.url, url.expanded_url);
  });
  return description;
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