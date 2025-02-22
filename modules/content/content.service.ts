import { sanityClient } from '../sanity/sanity';
import { env } from '../../app/env';
import { ConfigHomeScreen } from './content-types';
import { Cache } from 'memory-cache';
import { fiveMinutesInMs } from '../common/time';

const HOME_SCREEN_CONFIG_CACHE_KEY = 'content:homeScreen';

export class ContentService {
    private cache = new Cache<string, any>();

    public async getHomeScreenConfig(): Promise<ConfigHomeScreen> {
        const cached = this.cache.get(HOME_SCREEN_CONFIG_CACHE_KEY);

        if (cached) {
            return cached;
        }

        const data = await sanityClient.fetch<ConfigHomeScreen | null>(`
            *[_type == "homeScreen" && chainId == ${env.CHAIN_ID}][0]{
                ...,
                "featuredPoolGroups": featuredPoolGroups[]{
                    ...,
                    "icon": icon.asset->url + "?w=64",
                    "items": items[]{
                        ...,
                        "image": image.asset->url + "?w=600"
                    }
                },
                "newsItems": newsItems[]{
                    ...,
                    "image": image.asset->url + "?w=800"
                }
            }
        `);

        if (!data) {
            throw new Error(`No home screen config found for chain id ${env.CHAIN_ID}`);
        }

        this.cache.put(HOME_SCREEN_CONFIG_CACHE_KEY, data, fiveMinutesInMs);

        return data;
    }
}

export const configService = new ContentService();
