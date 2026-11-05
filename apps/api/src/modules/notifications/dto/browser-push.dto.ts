import {
  ApiBrowserPushStatusSchema,
  ApiRegisterBrowserPushSubscriptionSchema,
  ApiRemoveBrowserPushSubscriptionSchema,
} from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Browser Push API availability and current-user enrollment summary. */
export class BrowserPushStatusDto extends createZodDto(ApiBrowserPushStatusSchema) {}

/** Browser PushSubscription payload registered for the authenticated user. */
export class RegisterBrowserPushSubscriptionDto extends createZodDto(ApiRegisterBrowserPushSubscriptionSchema) {}

/** Identifies one current-user browser subscription for removal. */
export class RemoveBrowserPushSubscriptionDto extends createZodDto(ApiRemoveBrowserPushSubscriptionSchema) {}
