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
        // TODO: contentの中にツイートが含まれている、そのスキーマを作成
        tweet: z.any(),
      })
    })),
  }),
  latest_tweet_id: z.string().optional(),
  headerProps: z.object({ screenName: z.string() }).optional(),
});

export type TimelineProfile = z.infer<typeof TimelineProfileSchema>;

export default class SyndicationTwitter {
  private readonly client: KyInstance;
  constructor(authToken: string = '') {
    this.client = ky.create({
      prefixUrl: 'https://syndication.twitter.com',
      headers: {
        'Cookie': authToken,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
  }
  async timelineProfile(screenName: string) {
    const response = await this.client.get(`srv/timeline-profile/screen-name/${screenName}`);
    const nextData = await response.text()
    .then((text) => JSON.parse(text.split('<script id="__NEXT_DATA__" type="application/json">')[1].split('</script>')[0]))
    .then((data) => NextDataSchema.parseAsync(data));
    const timelineProfile = await TimelineProfileSchema.parseAsync(nextData.props.pageProps);
    return timelineProfile;
  }
}