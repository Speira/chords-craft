import { Schema } from 'effect';

export const CHANNELS = ['WHATSAPP', 'SMS', 'EMAIL', 'PHONE_CALL'] as const;

export type ContactChannel = (typeof CHANNELS)[number];

export const schema = Schema.Literal(...CHANNELS);

/** Every channel but email reaches the person through their phone number. */
export const checkRequiresPhone = (channel: ContactChannel) => channel !== 'EMAIL';
