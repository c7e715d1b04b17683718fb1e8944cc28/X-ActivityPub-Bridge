import { textToHtml, xExpandShortUrls, xRemoveShortUrls } from '@/x/utils.ts';
import type { TimelineProfile, TweetResult } from '@/x/syndication_twitter.ts';
import { fetchMIMEType } from '@/x/utils.ts';

export async function xTweetResultToActivityPubNote(
  tweetResult: TweetResult,
  reqUrl: URL,
) {
  const attachment = tweetResult.mediaDetails
    ? await Promise.all(tweetResult.mediaDetails.map(async (mediaDetail) => {
      switch (mediaDetail.type) {
        case 'photo': {
          return {
            type: 'Document',
            mediaType: await fetchMIMEType(mediaDetail.media_url_https),
            url: mediaDetail.media_url_https,
            width: mediaDetail.original_info.width,
            height: mediaDetail.original_info.height,
          };
        }
        case 'video': {
          const variant = mediaDetail.video_info.variants.at(-1);
          if (variant) {
            const variantUrl = new URL(variant.url);
            return {
              type: 'Document',
              mediaType: variant.content_type,
              url: `${variantUrl.origin}${variantUrl.pathname}`,
              width: mediaDetail.original_info.width,
              height: mediaDetail.original_info.height,
            };
          } else {
            return {
              type: 'Document',
              mediaType: await fetchMIMEType(mediaDetail.media_url_https),
              url: mediaDetail.media_url_https,
              width: mediaDetail.original_info.width,
              height: mediaDetail.original_info.height,
            };
          }
        }
      }
    }))
    : undefined;
  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      {
        sensitive: 'as:sensitive',
      },
    ],
    id: `${reqUrl.origin}/users/${tweetResult.user.id_str}/statuses/${tweetResult.id_str}`,
    type: 'Note',
    summary: undefined,
    inReplyTo: tweetResult.in_reply_to_status_id_str ? `${reqUrl.origin}/statuses/${tweetResult.in_reply_to_status_id_str}` : undefined,
    published: tweetResult.created_at.toISOString(),
    url: `https://x.com/${tweetResult.user.screen_name}/status/${tweetResult.id_str}`,
    attributedTo: `${reqUrl.origin}/users/${tweetResult.user.id_str}`,
    to: [
      'https://www.w3.org/ns/activitystreams#Public',
    ],
    cc: [
      `${reqUrl.origin}/users/${tweetResult.user.id_str}/followers`,
    ],
    sensitive: tweetResult.possibly_sensitive,
    content: textToHtml(
      tweetResult.entities.media
        ? xRemoveShortUrls(xExpandShortUrls(tweetResult.text, tweetResult.entities.urls), tweetResult.entities.media)
        : xExpandShortUrls(tweetResult.text, tweetResult.entities.urls),
    ),
    attachment,
  };
}

export function xTweetToActivityPubNote(
  tweet: TimelineProfile['timeline']['entries'][0]['content']['tweet'],
  reqUrl: URL,
) {
  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      {
        sensitive: 'as:sensitive',
      },
    ],
    id: `${reqUrl.origin}/users/${tweet.user.id_str}/statuses/${tweet.id_str}`,
    type: 'Note',
    summary: undefined,
    // inReplyTo: tweet.in_reply_to_status_id_str ? `${reqUrl.origin}/statuses/${tweet.in_reply_to_status_id_str}` : undefined,
    published: tweet.created_at.toISOString(),
    url: `https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
    attributedTo: `${reqUrl.origin}/users/${tweet.user.id_str}`,
    to: [
      'https://www.w3.org/ns/activitystreams#Public',
    ],
    cc: [
      `${reqUrl.origin}/users/${tweet.user.id_str}/followers`,
    ],
    sensitive: tweet.possibly_sensitive,
    content: textToHtml(
      tweet.entities.media
        ? xRemoveShortUrls(xExpandShortUrls(tweet.text, tweet.entities.urls), tweet.entities.media)
        : xExpandShortUrls(tweet.text, tweet.entities.urls),
    ),
    // attachment,
  };
}
