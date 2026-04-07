import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// Simple deep merge function for JSON objects
function deepMerge(target: any, source: any): any {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item: any) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) 
    ? requested 
    : routing.defaultLocale;

  // Load user's requested language
  const userMessages = (await import(`./messages/${locale}.json`)).default;
  
  // If not English, load English as fallback and deep merge them
  let messages = userMessages;
  if (locale !== 'en') {
    try {
      const enMessages = (await import(`./messages/en.json`)).default;
      // English messages as base (target), user messages override them (source)
      messages = deepMerge(enMessages, userMessages);
    } catch (e) {
      console.error('Failed to load English fallback messages', e);
    }
  }

  return {
    locale,
    messages,
  };
});
