import ky, { type KyInstance } from 'npm:ky@1.1.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

function tokenHex(nbytes = 32) {
  return crypto.getRandomValues(new Uint8Array(nbytes)).reduce((a, b) => a + b.toString(16).padStart(2, '0'), '');
}

const UserResponseSchema = z.object({
  data: z.object({
    user: z.object({
      result: z.object({
        __typename: z.string(),
        id: z.string(),
        rest_id: z.string(),
        affiliates_highlighted_label: z.object({}),
        has_graduated_access: z.boolean().optional(),
        is_blue_verified: z.boolean(),
        profile_image_shape: z.string(),
        legacy: z.object({
          protected: z.boolean().optional(),
          can_dm: z.boolean().optional(),
          can_media_tag: z.boolean().optional(),
          created_at: z.preprocess((value) => new Date(String(value)), z.date()),
          default_profile: z.boolean(),
          default_profile_image: z.boolean(),
          description: z.string(),
          entities: z.object({
            description: z.object({
              urls: z.array(
                z.object({
                  display_url: z.string(),
                  expanded_url: z.string(),
                  url: z.string(),
                  indices: z.array(z.number()),
                }),
              ),
            }),
            url: z.object({
              urls: z.array(
                z.object({
                  display_url: z.string(),
                  expanded_url: z.string(),
                  url: z.string(),
                  indices: z.array(z.number()),
                }),
              ),
            }).optional(),
          }),
          fast_followers_count: z.number(),
          favourites_count: z.number(),
          followers_count: z.number(),
          friends_count: z.number(),
          has_custom_timelines: z.boolean(),
          is_translator: z.boolean(),
          listed_count: z.number(),
          location: z.string(),
          media_count: z.number(),
          name: z.string(),
          normal_followers_count: z.number(),
          pinned_tweet_ids_str: z.array(z.string()),
          possibly_sensitive: z.boolean(),
          profile_banner_url: z.string().optional(),
          profile_image_url_https: z.string(),
          profile_interstitial_type: z.string(),
          screen_name: z.string(),
          statuses_count: z.number(),
          translator_type: z.string(),
          url: z.string().optional(),
          verified: z.boolean(),
          verified_type: z.string().optional(),
          want_retweets: z.boolean().optional(),
          withheld_in_countries: z.array(z.unknown()),
        }),
        professional: z.object({
          rest_id: z.string(),
          professional_type: z.string(),
          category: z.array(
            z.object({
              id: z.number(),
              name: z.string(),
              icon_name: z.string(),
            }),
          ),
        }).optional(),
        has_nft_avatar: z.boolean().optional(),
        smart_blocked_by: z.boolean().optional(),
        smart_blocking: z.boolean().optional(),
        legacy_extended_profile: z.union([
          z.object({
            // TODO: 更に型を強固にする必要あり
            // visibilityがPublicの場合はdayとmonthが必ず存在
            // year_visibilityがPublicの場合はyearが必ず存在
            // visibilityステータスはPublic(公開)とSelf(非公開)のみ調べ済み、他にある可能性が高くその場合にはparseErrorが発生するため要注意
            birthdate: z.union([
              z.object({
                day: z.number(),
                month: z.number(),
                year: z.number(),
                visibility: z.literal('Public'),
                year_visibility: z.literal('Public'),
              }),
              z.object({
                day: z.number(),
                month: z.number(),
                visibility: z.literal('Public'),
                year_visibility: z.literal('Self'),
              }),
              z.object({
                year: z.number(),
                visibility: z.literal('Self'),
                year_visibility: z.literal('Public'),
              }),
            ]),
          }),
          z.object({}),
        ]),
        is_profile_translatable: z.boolean(),
        has_hidden_likes_on_profile: z.boolean(),
        has_hidden_subscriptions_on_profile: z.boolean(),
        verification_info: z.union([
          z.object({
            is_identity_verified: z.literal(true),
            reason: z.object({
              description: z.object({
                text: z.string(),
                entities: z.array(
                  z.object({
                    from_index: z.number(),
                    to_index: z.number(),
                    ref: z.object({ url: z.string(), url_type: z.string() }),
                  }),
                ),
              }),
              verified_since_msec: z.string(),
            }),
          }),
          z.object({
            is_identity_verified: z.literal(false),
          }),
        ]),
        highlights_info: z.object({
          can_highlight_tweets: z.boolean(),
          highlighted_tweets: z.string(),
        }),
        business_account: z.union([
          z.object({}),
          z.object({ affiliates_count: z.number() }),
        ]),
        creator_subscriptions_count: z.number(),
      }),
    }),
  }),
});

export type User = z.infer<typeof UserResponseSchema>['data']['user']['result'];

const AUTHORIZATION = 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

export default class Twitter {
  private readonly client: KyInstance;
  constructor(authToken?: string) {
    if (authToken) {
      const ct0 = tokenHex(16);
      this.client = ky.create({
        prefixUrl: 'https://api.twitter.com',
        headers: {
          'Authorization': AUTHORIZATION,
          'Cookie': `auth_token=${authToken}; ct0=${ct0};`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'X-Csrf-Token': ct0,
        },
      });
    } else {
      this.client = ky.create({
        prefixUrl: 'https://api.twitter.com',
        headers: {
          'Authorization': AUTHORIZATION,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        hooks: {
          beforeRequest: [
            async (request) => {
              if (!request.headers.has('X-Guest-Token')) {
                const guestToken = await ky.post('https://api.twitter.com/1.1/guest/activate.json', {
                  headers: {
                    'Authorization': AUTHORIZATION,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  },
                }).json<{ guest_token: string }>()
                  .then(({ guest_token }) => guest_token);
                this.client.extend({ headers: { 'X-Guest-Token': guestToken } });
                request.headers.set('X-Guest-Token', guestToken);
              }
              return request;
            },
          ],
          afterResponse: [
            async (request, _options, response) => {
              if (!response.ok && await response.json().then(({ errors: [{ code }] }) => code === 239)) {
                const guestToken = await ky.post('https://api.twitter.com/1.1/guest/activate.json', {
                  headers: {
                    'Authorization': AUTHORIZATION,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  },
                }).json<{ guest_token: string }>()
                  .then(({ guest_token }) => guest_token);
                this.client.extend({ headers: { 'X-Guest-Token': guestToken } });
                request.headers.set('X-Guest-Token', guestToken);
                response = await this.client(request);
              }
              return response;
            },
          ],
        },
      });
    }
  }
  async getUserByScreenName(screenName: string) {
    const response = await this.client.get('graphql/NimuplG1OB7Fd2btCLdBOw/UserByScreenName', {
      searchParams: new URLSearchParams({
        variables: JSON.stringify({ screen_name: screenName, withSafetyModeUserFields: true }),
        features: JSON.stringify({
          hidden_profile_likes_enabled: true,
          hidden_profile_subscriptions_enabled: true,
          responsive_web_graphql_exclude_directive_enabled: true,
          verified_phone_label_enabled: false,
          subscriptions_verification_info_is_identity_verified_enabled: true,
          subscriptions_verification_info_verified_since_enabled: true,
          highlights_tweets_tab_ui_enabled: true,
          responsive_web_twitter_article_notes_tab_enabled: false,
          creator_subscriptions_tweet_preview_api_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          responsive_web_graphql_timeline_navigation_enabled: true,
        }),
        fieldToggles: JSON.stringify({ withAuxiliaryUserLabels: false }),
      }),
    });
    const user = await response.json()
      .then((json) => UserResponseSchema.parseAsync(json))
      .then(({ data: { user: { result } } }) => result);
    return user;
  }
}
