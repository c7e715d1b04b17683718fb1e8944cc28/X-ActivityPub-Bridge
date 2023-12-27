import ky, { type KyInstance } from 'npm:ky@1.1.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const NextDataSchema = z.object({
  props: z.object({
    pageProps: z.record(z.unknown()),
    __N_SSP: z.boolean(),
  }),
  page: z.string(),
  query: z.record(z.string()),
  buildId: z.string(),
  assetPrefix: z.string(),
  isFallback: z.boolean(),
  gssp: z.boolean(),
  customServer: z.boolean(),
});

const TimelineProfileSchema = z.object({
  contextProvider: z.object({
    features: z.object({}),
    scribeData: z.object({
      client_version: z.null(),
      dnt: z.boolean(),
      widget_id: z.string(),
      widget_origin: z.string(),
      widget_frame: z.string(),
      widget_partner: z.string(),
      widget_site_screen_name: z.string(),
      widget_site_user_id: z.string(),
      widget_creator_screen_name: z.string(),
      widget_creator_user_id: z.string(),
      widget_iframe_version: z.string(),
      widget_data_source: z.string(),
      session_id: z.string(),
    }),
    messengerContext: z.object({ embedId: z.string() }),
    hasResults: z.boolean(),
    lang: z.string(),
    theme: z.string(),
  }),
  lang: z.string(),
  maxHeight: z.null(),
  showHeader: z.boolean(),
  hideBorder: z.boolean(),
  hideFooter: z.boolean(),
  hideScrollBar: z.boolean(),
  transparent: z.boolean(),
  timeline: z.object({
    entries: z.array(z.object({
      type: z.string(),
      entry_id: z.string(),
      sort_index: z.string(),
      content: z.object({
        tweet: z.object({
          id: z.number(),
          location: z.string(),
          conversation_id_str: z.string(),
          created_at: z.preprocess(
            (value) => new Date(String(value)),
            z.date(),
          ),
          display_text_range: z.array(z.number()),
          entities: z.object({
            hashtags: z.array(z.unknown()),
            urls: z.array(z.object({
              display_url: z.string(),
              expanded_url: z.string(),
              indices: z.array(z.number()),
              url: z.string(),
            })),
            user_mentions: z.array(z.object({
              id_str: z.string(),
              indices: z.array(z.number()),
              name: z.string(),
              screen_name: z.string(),
            })),
            symbols: z.array(z.object({
              display_url: z.string(),
              expanded_url: z.string(),
              indices: z.array(z.number()),
              url: z.string(),
            })),
            media: z.array(
              z.object({
                display_url: z.string(),
                expanded_url: z.string(),
                indices: z.array(z.number()),
                url: z.string(),
              }),
            ),
          }),
          favorite_count: z.number(),
          favorited: z.boolean(),
          full_text: z.string(),
          id_str: z.string(),
          lang: z.string(),
          permalink: z.string(),
          possibly_sensitive: z.boolean(),
          quote_count: z.number(),
          reply_count: z.number(),
          retweet_count: z.number(),
          retweeted: z.boolean(),
          text: z.string(),
          user: z.object({
            blocking: z.boolean(),
            created_at: z.preprocess(
              (value) => new Date(String(value)),
              z.date(),
            ),
            default_profile: z.boolean(),
            default_profile_image: z.boolean(),
            description: z.string(),
            entities: z.object({
              description: z.object({ urls: z.array(z.unknown()) }),
              url: z.object({
                urls: z.array(
                  z.object({
                    display_url: z.string(),
                    expanded_url: z.string(),
                    url: z.string(),
                    indices: z.array(z.number()),
                  }),
                ),
              }),
            }),
            fast_followers_count: z.number(),
            favourites_count: z.number(),
            follow_request_sent: z.boolean(),
            followed_by: z.boolean(),
            followers_count: z.number(),
            following: z.boolean(),
            friends_count: z.number(),
            has_custom_timelines: z.boolean(),
            id: z.number(),
            id_str: z.string(),
            is_translator: z.boolean(),
            listed_count: z.number(),
            location: z.string(),
            media_count: z.number(),
            name: z.string(),
            normal_followers_count: z.number(),
            notifications: z.boolean(),
            profile_banner_url: z.string(),
            profile_image_url_https: z.string(),
            protected: z.boolean(),
            screen_name: z.string(),
            show_all_inline_media: z.boolean(),
            statuses_count: z.number(),
            time_zone: z.string(),
            translator_type: z.string(),
            url: z.string(),
            utc_offset: z.number(),
            verified: z.boolean(),
            verified_type: z.string().optional(),
            withheld_in_countries: z.array(z.unknown()),
            withheld_scope: z.string(),
            is_blue_verified: z.boolean(),
          }),
        }),
      }),
    })),
  }),
  latest_tweet_id: z.string().optional(),
  headerProps: z.object({ screenName: z.string() }).optional(),
});

export type TimelineProfile = z.infer<typeof TimelineProfileSchema>;

const TweetResultSchema = z.object({
  __typename: z.string(),
  in_reply_to_screen_name: z.string().optional(),
  in_reply_to_status_id_str: z.string().optional(),
  in_reply_to_user_id_str: z.string().optional(),
  lang: z.string(),
  favorite_count: z.number(),
  possibly_sensitive: z.boolean(),
  created_at: z.preprocess((value) => new Date(String(value)), z.date()),
  display_text_range: z.array(z.number()),
  entities: z.object({
    hashtags: z.array(z.unknown()),
    urls: z.array(z.object({
      display_url: z.string(),
      expanded_url: z.string(),
      indices: z.array(z.number()),
      url: z.string(),
    })),
    user_mentions: z.array(z.object({
      id_str: z.string(),
      indices: z.array(z.number()),
      name: z.string(),
      screen_name: z.string(),
    })),
    symbols: z.array(z.object({
      display_url: z.string(),
      expanded_url: z.string(),
      indices: z.array(z.number()),
      url: z.string(),
    })),
    media: z.array(
      z.object({
        display_url: z.string(),
        expanded_url: z.string(),
        indices: z.array(z.number()),
        url: z.string(),
      }),
    ).optional(),
  }),
  id_str: z.string(),
  text: z.string(),
  user: z.object({
    id_str: z.string(),
    name: z.string(),
    profile_image_url_https: z.string(),
    screen_name: z.string(),
    verified: z.boolean(),
    verified_type: z.string().optional(),
    is_blue_verified: z.boolean(),
    profile_image_shape: z.string(),
  }),
  edit_control: z.object({
    edit_tweet_ids: z.array(z.string()),
    editable_until_msecs: z.string(),
    is_edit_eligible: z.boolean(),
    edits_remaining: z.string(),
  }),
  mediaDetails: z.array(
    z.union([
      z.object({
        additional_media_info: z.object({}),
        display_url: z.string(),
        expanded_url: z.string(),
        ext_media_availability: z.object({ status: z.string() }),
        indices: z.array(z.number()),
        media_url_https: z.string(),
        original_info: z.object({
          height: z.number(),
          width: z.number(),
          focus_rects: z.array(z.unknown()),
        }),
        sizes: z.object({
          large: z.object({ h: z.number(), resize: z.string(), w: z.number() }),
          medium: z.object({
            h: z.number(),
            resize: z.string(),
            w: z.number(),
          }),
          small: z.object({ h: z.number(), resize: z.string(), w: z.number() }),
          thumb: z.object({ h: z.number(), resize: z.string(), w: z.number() }),
        }),
        type: z.literal('video'),
        url: z.string(),
        video_info: z.object({
          aspect_ratio: z.array(z.number()),
          duration_millis: z.number(),
          variants: z.array(
            z.union([
              z.object({
                bitrate: z.number(),
                content_type: z.string(),
                url: z.string(),
              }),
              z.object({ content_type: z.string(), url: z.string() }),
            ]),
          ),
        }),
      }),
      z.object({
        display_url: z.string(),
        expanded_url: z.string(),
        ext_media_availability: z.object({ status: z.string() }),
        indices: z.array(z.number()),
        media_url_https: z.string(),
        original_info: z.object({
          height: z.number(),
          width: z.number(),
          focus_rects: z.array(
            z.object({
              x: z.number(),
              y: z.number(),
              w: z.number(),
              h: z.number(),
            }),
          ),
        }),
        sizes: z.object({
          large: z.object({ h: z.number(), resize: z.string(), w: z.number() }),
          medium: z.object({
            h: z.number(),
            resize: z.string(),
            w: z.number(),
          }),
          small: z.object({ h: z.number(), resize: z.string(), w: z.number() }),
          thumb: z.object({ h: z.number(), resize: z.string(), w: z.number() }),
        }),
        type: z.literal('photo'),
        url: z.string(),
      }),
    ]),
  ).optional(),
  photos: z.array(
    z.object({
      backgroundColor: z.object({
        red: z.number(),
        green: z.number(),
        blue: z.number(),
      }),
      cropCandidates: z.array(
        z.object({
          x: z.number(),
          y: z.number(),
          w: z.number(),
          h: z.number(),
        }),
      ),
      expandedUrl: z.string(),
      url: z.string(),
      width: z.number(),
      height: z.number(),
    }),
  ).optional(),
  video: z.object({
    aspectRatio: z.array(z.number()),
    contentType: z.string(),
    durationMs: z.number(),
    mediaAvailability: z.object({ status: z.string() }),
    poster: z.string(),
    variants: z.array(z.object({ type: z.string(), src: z.string() })),
    videoId: z.object({ type: z.string(), id: z.string() }),
    viewCount: z.number(),
  }).optional(),
  conversation_count: z.number(),
  news_action_type: z.string(),
  parent: z.object({
    in_reply_to_screen_name: z.string().optional(),
    in_reply_to_status_id_str: z.string().optional(),
    in_reply_to_user_id_str: z.string().optional(),
    lang: z.string(),
    favorite_count: z.number(),
    possibly_sensitive: z.boolean(),
    created_at: z.preprocess((value) => new Date(String(value)), z.date()),
    display_text_range: z.array(z.number()),
    entities: z.object({
      hashtags: z.array(z.unknown()),
      urls: z.array(z.object({
        display_url: z.string(),
        expanded_url: z.string(),
        indices: z.array(z.number()),
        url: z.string(),
      })),
      user_mentions: z.array(z.object({
        id_str: z.string(),
        indices: z.array(z.number()),
        name: z.string(),
        screen_name: z.string(),
      })),
      symbols: z.array(z.object({
        display_url: z.string(),
        expanded_url: z.string(),
        indices: z.array(z.number()),
        url: z.string(),
      })),
      media: z.array(
        z.object({
          display_url: z.string(),
          expanded_url: z.string(),
          indices: z.array(z.number()),
          url: z.string(),
        }),
      ).optional(),
    }),
    id_str: z.string(),
    text: z.string(),
    user: z.object({
      id_str: z.string(),
      name: z.string(),
      profile_image_url_https: z.string(),
      screen_name: z.string(),
      verified: z.boolean(),
      verified_type: z.string().optional(),
      is_blue_verified: z.boolean(),
      profile_image_shape: z.string(),
    }),
    edit_control: z.object({
      edit_tweet_ids: z.array(z.string()),
      editable_until_msecs: z.string(),
      is_edit_eligible: z.boolean(),
      edits_remaining: z.string(),
    }),
    mediaDetails: z.array(
      z.union([
        z.object({
          additional_media_info: z.object({}),
          display_url: z.string(),
          expanded_url: z.string(),
          ext_media_availability: z.object({ status: z.string() }),
          indices: z.array(z.number()),
          media_url_https: z.string(),
          original_info: z.object({
            height: z.number(),
            width: z.number(),
            focus_rects: z.array(z.unknown()),
          }),
          sizes: z.object({
            large: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
            medium: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
            small: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
            thumb: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
          }),
          type: z.literal('video'),
          url: z.string(),
          video_info: z.object({
            aspect_ratio: z.array(z.number()),
            duration_millis: z.number(),
            variants: z.array(
              z.union([
                z.object({
                  bitrate: z.number(),
                  content_type: z.string(),
                  url: z.string(),
                }),
                z.object({ content_type: z.string(), url: z.string() }),
              ]),
            ),
          }),
        }),
        z.object({
          display_url: z.string(),
          expanded_url: z.string(),
          ext_media_availability: z.object({ status: z.string() }),
          indices: z.array(z.number()),
          media_url_https: z.string(),
          original_info: z.object({
            height: z.number(),
            width: z.number(),
            focus_rects: z.array(
              z.object({
                x: z.number(),
                y: z.number(),
                w: z.number(),
                h: z.number(),
              }),
            ),
          }),
          sizes: z.object({
            large: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
            medium: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
            small: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
            thumb: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
          }),
          type: z.literal('photo'),
          url: z.string(),
        }),
      ]),
    ).optional(),
    photos: z.array(
      z.object({
        backgroundColor: z.object({
          red: z.number(),
          green: z.number(),
          blue: z.number(),
        }),
        cropCandidates: z.array(
          z.object({
            x: z.number(),
            y: z.number(),
            w: z.number(),
            h: z.number(),
          }),
        ),
        expandedUrl: z.string(),
        url: z.string(),
        width: z.number(),
        height: z.number(),
      }),
    ).optional(),
    video: z.object({
      aspectRatio: z.array(z.number()),
      contentType: z.string(),
      durationMs: z.number(),
      mediaAvailability: z.object({ status: z.string() }),
      poster: z.string(),
      variants: z.array(z.object({ type: z.string(), src: z.string() })),
      videoId: z.object({ type: z.string(), id: z.string() }),
      viewCount: z.number(),
    }).optional(),
    conversation_count: z.number(),
    news_action_type: z.string(),
    isEdited: z.boolean(),
    isStaleEdit: z.boolean(),
  }).optional(),
  quoted_tweet: z.object({
    in_reply_to_screen_name: z.string().optional(),
    in_reply_to_status_id_str: z.string().optional(),
    in_reply_to_user_id_str: z.string().optional(),
    lang: z.string(),
    favorite_count: z.number(),
    possibly_sensitive: z.boolean(),
    created_at: z.preprocess((value) => new Date(String(value)), z.date()),
    display_text_range: z.array(z.number()),
    entities: z.object({
      hashtags: z.array(z.unknown()),
      urls: z.array(z.object({
        display_url: z.string(),
        expanded_url: z.string(),
        indices: z.array(z.number()),
        url: z.string(),
      })),
      user_mentions: z.array(z.object({
        id_str: z.string(),
        indices: z.array(z.number()),
        name: z.string(),
        screen_name: z.string(),
      })),
      symbols: z.array(z.object({
        display_url: z.string(),
        expanded_url: z.string(),
        indices: z.array(z.number()),
        url: z.string(),
      })),
      media: z.array(
        z.object({
          display_url: z.string(),
          expanded_url: z.string(),
          indices: z.array(z.number()),
          url: z.string(),
        }),
      ).optional(),
    }),
    id_str: z.string(),
    text: z.string(),
    user: z.object({
      id_str: z.string(),
      name: z.string(),
      profile_image_url_https: z.string(),
      screen_name: z.string(),
      verified: z.boolean(),
      verified_type: z.string().optional(),
      is_blue_verified: z.boolean(),
      profile_image_shape: z.string(),
    }),
    edit_control: z.object({
      edit_tweet_ids: z.array(z.string()),
      editable_until_msecs: z.string(),
      is_edit_eligible: z.boolean(),
      edits_remaining: z.string(),
    }),
    mediaDetails: z.array(
      z.union([
        z.object({
          additional_media_info: z.object({}),
          display_url: z.string(),
          expanded_url: z.string(),
          ext_media_availability: z.object({ status: z.string() }),
          indices: z.array(z.number()),
          media_url_https: z.string(),
          original_info: z.object({
            height: z.number(),
            width: z.number(),
            focus_rects: z.array(z.unknown()),
          }),
          sizes: z.object({
            large: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
            medium: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
            small: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
            thumb: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
          }),
          type: z.literal('video'),
          url: z.string(),
          video_info: z.object({
            aspect_ratio: z.array(z.number()),
            duration_millis: z.number(),
            variants: z.array(
              z.union([
                z.object({
                  bitrate: z.number(),
                  content_type: z.string(),
                  url: z.string(),
                }),
                z.object({ content_type: z.string(), url: z.string() }),
              ]),
            ),
          }),
        }),
        z.object({
          display_url: z.string(),
          expanded_url: z.string(),
          ext_media_availability: z.object({ status: z.string() }),
          indices: z.array(z.number()),
          media_url_https: z.string(),
          original_info: z.object({
            height: z.number(),
            width: z.number(),
            focus_rects: z.array(
              z.object({
                x: z.number(),
                y: z.number(),
                w: z.number(),
                h: z.number(),
              }),
            ),
          }),
          sizes: z.object({
            large: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
            medium: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
            small: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
            thumb: z.object({
              h: z.number(),
              resize: z.string(),
              w: z.number(),
            }),
          }),
          type: z.literal('photo'),
          url: z.string(),
        }),
      ]),
    ).optional(),
    photos: z.array(
      z.object({
        backgroundColor: z.object({
          red: z.number(),
          green: z.number(),
          blue: z.number(),
        }),
        cropCandidates: z.array(
          z.object({
            x: z.number(),
            y: z.number(),
            w: z.number(),
            h: z.number(),
          }),
        ),
        expandedUrl: z.string(),
        url: z.string(),
        width: z.number(),
        height: z.number(),
      }),
    ).optional(),
    video: z.object({
      aspectRatio: z.array(z.number()),
      contentType: z.string(),
      durationMs: z.number(),
      mediaAvailability: z.object({ status: z.string() }),
      poster: z.string(),
      variants: z.array(z.object({ type: z.string(), src: z.string() })),
      videoId: z.object({ type: z.string(), id: z.string() }),
      viewCount: z.number(),
    }).optional(),
    conversation_count: z.number(),
    news_action_type: z.string(),
    isEdited: z.boolean(),
    isStaleEdit: z.boolean(),
  }).optional(),
  isEdited: z.boolean(),
  isStaleEdit: z.boolean(),
});

export type TweetResult = z.infer<typeof TweetResultSchema>;

export default class SyndicationTwitter {
  private readonly client: KyInstance;
  constructor(authToken: string = '') {
    this.client = ky.create({
      headers: {
        'Cookie': authToken,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
  }
  async timelineProfile(screenName: string) {
    const response = await this.client.get(
      `https://syndication.twitter.com/srv/timeline-profile/screen-name/${screenName}`,
    );
    const nextData = await response.text()
      .then((text) =>
        JSON.parse(
          text.split('<script id="__NEXT_DATA__" type="application/json">')[1]
            .split('</script>')[0],
        )
      )
      .then((data) => NextDataSchema.parseAsync(data));
    const timelineProfile = await TimelineProfileSchema.parseAsync(
      nextData.props.pageProps,
    );
    return timelineProfile;
  }
  async tweetResult(postId: bigint) {
    const response = await this.client.get(
      'https://cdn.syndication.twimg.com/tweet-result',
      {
        searchParams: new URLSearchParams({
          id: postId.toString(),
          token: ((Number(postId) / 1e15) * Math.PI).toString(36).replace(
            /(0+|\.)/g,
            '',
          ),
        }),
      },
    );
    const tweetResult = await TweetResultSchema.parseAsync(
      await response.json(),
    );
    return tweetResult;
  }
}
