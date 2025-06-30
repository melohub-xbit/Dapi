export const mapLanguageCodeToName = (code: string): string => {
  switch (code) {
    case 'es':
      return 'spanish';
    case 'fr':
      return 'french';
    case 'de':
      return 'german';
    case 'it':
      return 'italian';
    case 'pt':
      return 'portuguese';
    case 'ja':
      return 'japanese';
    case 'ko':
      return 'korean';
    case 'zh':
      return 'chinese';
    case 'ar':
      return 'arabic';
    case 'ru':
      return 'russian';
    case 'en':
      return 'english';
    default:
      return 'english'; // Default to English
  }
};

export const mapLanguageNameToCode = (name: string): string => {
  switch (name.toLowerCase()) {
    case 'spanish':
      return 'es';
    case 'french':
      return 'fr';
    case 'german':
      return 'de';
    case 'italian':
      return 'it';
    case 'portuguese':
      return 'pt';
    case 'japanese':
      return 'ja';
    case 'korean':
      return 'ko';
    case 'chinese':
      return 'zh';
    case 'arabic':
      return 'ar';
    case 'russian':
      return 'ru';
    case 'english':
      return 'en';
    default:
      return 'en'; // Default to English
  }
};