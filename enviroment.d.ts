declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string;
      FEED_URL: string;
      USER_ID: string;
      OPENAI_API_KEY: string;
    }
  }
}

export {};
