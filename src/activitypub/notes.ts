import { textToHtml, xExpandDescription } from '@/x/utils.ts';
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
            return {
              type: 'Document',
              mediaType: variant.content_type,
              url: variant.url,
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
    ],
    id: `${reqUrl.origin}/users/${tweetResult.user.screen_name}/collections/${tweetResult.id_str}`,
    type: 'Note',
    summary: undefined,
    inReplyTo: tweetResult.in_reply_to_status_id_str ? `${reqUrl.origin}/collections/${tweetResult.in_reply_to_status_id_str}` : undefined,
    published: tweetResult.created_at.toISOString(),
    url: `https://x.com/${tweetResult.user.screen_name}/status/${tweetResult.id_str}`,
    attributedTo: `${reqUrl.origin}/users/${tweetResult.user.screen_name}`,
    to: [
      'https://www.w3.org/ns/activitystreams#Public',
    ],
    cc: [
      `${reqUrl.origin}/users/${tweetResult.user.screen_name}/followers`,
    ],
    content: textToHtml(
      xExpandDescription(tweetResult.text, tweetResult.entities.urls),
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
    ],
    id: `${reqUrl.origin}/users/${tweet.user.screen_name}/collections/${tweet.id_str}`,
    type: 'Note',
    summary: undefined,
    // inReplyTo: tweet.in_reply_to_status_id_str ? `${reqUrl.origin}/collections/${tweet.in_reply_to_status_id_str}` : undefined,
    published: tweet.created_at.toISOString(),
    url: `https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
    attributedTo: `${reqUrl.origin}/users/${tweet.user.screen_name}`,
    to: [
      'https://www.w3.org/ns/activitystreams#Public',
    ],
    cc: [
      `${reqUrl.origin}/users/${tweet.user.screen_name}/followers`,
    ],
    content: textToHtml(
      xExpandDescription(tweet.text, tweet.entities.urls),
    ),
    // attachment,
  };
}
