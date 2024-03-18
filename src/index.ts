import 'dotenv/config';
import { Telegraf } from 'telegraf';
import RssFeedEmitter from 'rss-feed-emitter';
import { createClient } from 'redis';
import md5 from 'md5';
import { transformMessage } from './transformMessage';

export interface Item {
  title: string;
  link: string;
  description: string;
}

const main = async () => {
  const redis = createClient();
  await redis.connect();

  const bot = new Telegraf(process.env.BOT_TOKEN);
  const feeder = new RssFeedEmitter();

  feeder.add({
    url: process.env.FEED_URL,
    refresh: 60_000,
  });

  feeder.on('new-item', async (item: Item) => {
    try {
      const id = md5(item.link);
      console.log(`Processing item ${id}`);

      if (await redis.exists(id)) {
        console.log(`${id} found in redis, skipping...`);
        return;
      }
      console.log(`${id} is not found in redis, processing...`);

      const message = await transformMessage(item);
      console.log('Message generated', message);

      bot.telegram.sendMessage(process.env.USER_ID, message, {
        parse_mode: 'MarkdownV2',
      });
      console.log(`Message sent to ${process.env.USER_ID}`);

      await redis.set(id, 'true');
      console.log(`${id} added to redis`);
    } catch (e) {
      console.error(e);
    }
  });

  bot.launch();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

main();
