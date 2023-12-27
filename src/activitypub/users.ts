import { textToHtml, xExpandDescription, xExpandUrl } from '@/x/utils.ts';
import type { User } from '@/x/web_twitter.ts';

export function xUserToActivityPubPerson(user: User, reqUrl: URL) {
  const attachment = [];
  if (user.professional) {
    attachment.push({
      type: 'PropertyValue',
      name: `Professional (${user.professional.professional_type})`,
      value: user.professional.category.length > 0 ? user.professional.category.map((c) => c.name).join(', ') : 'N/A',
    });
  }
  if (user.legacy.location) {
    attachment.push({
      type: 'PropertyValue',
      name: 'Location',
      value: user.legacy.location,
    });
  }
  if (user.legacy.url) {
    attachment.push({
      type: 'PropertyValue',
      name: 'URL',
      value: user.legacy.entities.url ? textToHtml(xExpandUrl(user.legacy.url, user.legacy.entities.url.urls)) : user.legacy.url,
    });
  }
  if ('birthdate' in user.legacy_extended_profile) {
    if (user.legacy_extended_profile.birthdate.visibility === 'Public' && user.legacy_extended_profile.birthdate.year_visibility === 'Public') {
      attachment.push({
        type: 'PropertyValue',
        name: 'Birthdate',
        value: `${user.legacy_extended_profile.birthdate.year}/${user.legacy_extended_profile.birthdate.month}/${user.legacy_extended_profile.birthdate.day}`,
      });
    } else if (user.legacy_extended_profile.birthdate.visibility === 'Public' && user.legacy_extended_profile.birthdate.year_visibility === 'Self') {
      attachment.push({
        type: 'PropertyValue',
        name: 'Birthdate',
        value: `${user.legacy_extended_profile.birthdate.month}/${user.legacy_extended_profile.birthdate.day}`,
      });
    } else if (user.legacy_extended_profile.birthdate.visibility === 'Self' && user.legacy_extended_profile.birthdate.year_visibility === 'Public') {
      attachment.push({
        type: 'PropertyValue',
        name: 'Birthdate',
        value: `${user.legacy_extended_profile.birthdate.year}`,
      });
    }
  }
  attachment.push({
    type: 'PropertyValue',
    name: 'X ActivityPub Bridge',
    value:
      '<a href="https://github.com/c7e715d1b04b17683718fb1e8944cc28/XActivityPubBridge">github.com/c7e715d1b04b17683718fb1e8944cc28/XActivityPubBridge</a>',
  });
  attachment.push({
    type: 'PropertyValue',
    name: 'Original',
    value: `<a href="${`https://x.com/intent/user?${new URLSearchParams({
      screen_name: user.legacy.screen_name,
    })}`}">@${user.legacy.screen_name}</a>`,
  });
  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1',
      {
        manuallyApprovesFollowers: 'as:manuallyApprovesFollowers',
        toot: 'http://joinmastodon.org/ns#',
        featured: {
          '@id': 'toot:featured',
          '@type': '@id',
        },
        schema: 'http://schema.org#',
        PropertyValue: 'schema:PropertyValue',
        value: 'schema:value',
        discoverable: 'toot:discoverable',
        // suspended: 'toot:suspended',
        indexable: 'toot:indexable',
      },
    ],
    id: `${reqUrl.origin}/users/${user.legacy.screen_name}`,
    type: 'Person',
    following: `${reqUrl.origin}/users/${user.legacy.screen_name}/following`,
    followers: `${reqUrl.origin}/users/${user.legacy.screen_name}/followers`,
    liked: `${reqUrl.origin}/users/${user.legacy.screen_name}/liked`,
    inbox: `${reqUrl.origin}/users/${user.legacy.screen_name}/inbox`,
    outbox: `${reqUrl.origin}/users/${user.legacy.screen_name}/outbox`,
    featured: user.legacy.pinned_tweet_ids_str.length > 0 ? `${reqUrl.origin}/users/${user.legacy.screen_name}/collections/featured` : undefined,
    preferredUsername: user.legacy.screen_name,
    name: user.legacy.name,
    // TODO: メンションに対応する
    summary: textToHtml(xExpandDescription(user.legacy.description, user.legacy.entities.description.urls)),
    url: `https://x.com/intent/user?${new URLSearchParams({
      screen_name: user.legacy.screen_name,
    })}`,
    manuallyApprovesFollowers: user.legacy.protected ?? false,
    discoverable: true,
    indexable: true,
    published: user.legacy.created_at.toISOString(),
    // publicKey: {
    //   id: `${reqUrl.origin}/users/${user.legacy.screen_name}/publicKey`,
    //   owner: `${reqUrl.origin}/users/${user.legacy.screen_name}`,
    //   publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvXc4vkECU2/CeuSo1wtn\nFoim94Ne1jBMYxTZ9wm2YTdJq1oiZKif06I2fOqDzY/4q/S9uccrE9Bkajv1dnkO\nVm31QjWlhVpSKynVxEWjVBO5Ienue8gND0xvHIuXf87o61poqjEoepvsQFElA5ym\novljWGSA/jpj7ozygUZhCXtaS2W5AD5tnBQUpcO0lhItYPYTjnmzcc4y2NbJV8hz\n2s2G8qKv8fyimE23gY1XrPJg+cRF+g4PqFXujjlJ7MihD9oqtLGxbu7o1cifTn3x\nBfIdPythWu5b4cujNsB3m3awJjVmx+MHQ9SugkSIYXV0Ina77cTNS0M2PYiH1PFR\nTwIDAQAB\n-----END PUBLIC KEY-----\n',
    // },
    // tag: [],
    attachment,
    icon: {
      type: 'Image',
      url: user.legacy.profile_image_url_https.replace('_normal.', '.'),
    },
    image: user.legacy.profile_banner_url
      ? {
        type: 'Image',
        url: user.legacy.profile_banner_url,
      }
      : undefined,
    location: user.legacy.location
      ? {
        type: 'Place',
        name: user.legacy.location,
      }
      : undefined,
  };
}
