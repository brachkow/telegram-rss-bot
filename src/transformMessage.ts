import OpenAI from 'openai';
import { pick } from 'lodash-es';
import { type Item } from './index';
import { escapers } from '@telegraf/entity';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const format = {
  title: '',
  description: '',
  money: '',
  skills: '',
};

const prompt = (raw: Item) => `
This is a post from RSS feed:

${raw.title}

${raw.description}

Retreive it's data and send it to me in a structured format, as described below:

${JSON.stringify(format, null, 2)}

- Remove all html tags and keep only the text.
- Don't duplicate information from other properties in the description
- Summarize description to be at most 255 characters long
`;

export const transformMessage = async (raw: Item) => {
  const result = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt(raw) }],
  });

  const data = pick(
    JSON.parse(result.choices[0].message.content as string),
    Object.keys(format),
  );

  return escapers.MarkdownV2(`
${data.title}

💰 ${data.money}
🧠 ${data.skills}

${data.description}

🔗 ${raw.link}
`);
};
