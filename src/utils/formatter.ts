export function expandUrl(url: string, urls: { display_url: string, expanded_url: string, url: string, indices: number[] }[]): string {
  for (const url of urls) {
    if (url.url === url.display_url) {
      return url.expanded_url;
    }
  }
  return url;
}

export function expandDescription(description: string, urls: { display_url: string, expanded_url: string, url: string, indices: number[] }[]): string {
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