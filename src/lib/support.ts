/** Where a teacher reaches a person, for help and for ideas. */
export const supportEmail = 'support@teacher.dev';

/** A link that starts an email to support about one thing. */
export const supportMailto = (subject: string, body = '') =>
  `mailto:${supportEmail}?subject=${encodeURIComponent(`Class Gauntlet: ${subject}`)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
