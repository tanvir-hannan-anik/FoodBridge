# WhatsApp / Messenger through n8n

FoodBridge doesn't talk to WhatsApp or Messenger directly. n8n sits in between, so a chat app can be added, swapped or removed without touching the app:

```
WhatsApp / Messenger ──► n8n ──► POST /api/integrations/inbound ──► { reply } ──► n8n ──► chat app
FoodBridge outbox ──► NOTIFY_WHATSAPP_WEBHOOK_URL / NOTIFY_MESSENGER_WEBHOOK_URL (n8n) ──► chat app
```

The website stays the source of truth. From chat, users can only:

- link their account;
- start a donation (donors) or a food request (verified NGOs);
- confirm it with YES;
- ask for STATUS.

Everything else happens on the website. Every draft goes through the same validation and food-safety rules as the web forms, and nothing is created until the user replies YES.

## 1. FoodBridge settings (`.env.local`)

| Variable | What it's for |
| --- | --- |
| `INTEGRATION_SECRET` | 16+ random characters. n8n sends it as `Authorization: Bearer …`. If it isn't set, the integration is off and the profile card says so. |
| `NOTIFY_WHATSAPP_WEBHOOK_URL` | The n8n webhook URL for outgoing WhatsApp updates. |
| `NOTIFY_MESSENGER_WEBHOOK_URL` | The n8n webhook URL for outgoing Messenger updates. |
| `NOTIFY_WEBHOOK_TOKEN` | Optional. It's sent as `Authorization: Bearer …` on outgoing updates; check it in n8n with header auth. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Optional. Your WhatsApp business number (digits). The profile page then shows an "Open WhatsApp" button with the link code already filled in. |
| `NEXT_PUBLIC_MESSENGER_PAGE` | Optional. Your Facebook page username, for an "Open Messenger" button. |
| `APP_URL` | Optional. Your site address (e.g. `https://foodbridge.example`). Chat replies then include a link to the new record. |

## 2. Incoming messages

n8n sends each message like this:

```http
POST {FOODBRIDGE_URL}/api/integrations/inbound
Authorization: Bearer {INTEGRATION_SECRET}
Content-Type: application/json

{ "channel": "whatsapp", "from": "8801711111111", "text": "DONATE food: rice; quantity: 20 plates; …" }
```

- `from` is the sender id the chat app gives you: the phone number for WhatsApp, or the page-scoped id (PSID) for Messenger. Allowed characters are letters, digits and `+ . : @ - _`, up to 64 characters.
- The response is always `{ "reply": "…" }`. n8n sends that text back to the same sender.
- Errors:
  - `401`: wrong secret
  - `400`: invalid body
  - `503`: integration off

**Linking an account.** In FoodBridge, go to **Profile → Chat apps → Link WhatsApp**. That gives a 6-digit code, valid for 15 minutes. The user sends `LINK 123456` from the chat app. Only a hash of the code is stored, and a sender can make at most 5 attempts every 15 minutes. Linking also turns on status updates for that app. `STOP` unlinks.

**Commands:**

| Command | What it does |
| --- | --- |
| `DONATE …` | Donors only. |
| `NEED …` | Verified NGOs only. |
| `YES` / `NO` | Post or cancel the draft. |
| `STATUS` | The user's latest updates. |
| `HELP` | The command list. |
| `STOP` | Unlinks the chat. |

With an AI key the details can be written in plain words. Without one, use `key: value` pairs, for example `food: …; quantity: 20 plates; condition: fresh; prepared: 1h ago; best before: 4h; pickup: 30 min; address: …`. Follow-up messages add the missing details to the draft in progress.

## 3. Outgoing status updates

FoodBridge sends WhatsApp and Messenger only these updates:

- Match found
- Volunteer assigned
- Pickup confirmed
- Delivery completed
- Expiry warning

This rule lives in `CHAT_CATEGORIES` in `src/lib/notifications/meta.ts`. Updates go only to users who linked that app. The outbox posts this body to the webhook:

```json
{ "channel": "whatsapp", "to": "8801711111111", "name": "Hope Kitchen", "text": "…", "category": "match_found",
  "type": "request_matched", "donationId": "…", "subject": "FoodBridge: …", "sentAt": "…" }
```

It retries up to 3 times. Delivery status is in the `notification_deliveries` table.

> **WhatsApp's 24-hour rule.** WhatsApp only allows free-form messages within 24 hours of the user's last message. For updates outside that window, send an approved **message template** from n8n (for example `foodbridge_update` with one text parameter), and use `text` as the parameter.

## 4. The starter workflow

`foodbridge-chat.workflow.json` is a template for the WhatsApp Cloud API. Import it in n8n (**Workflows → Import from file**). It has three parts:

1. **Webhook verification:** the GET `hub.challenge` check that Meta requires when you register the webhook.
2. **Incoming messages:**
   - it picks out the sender and text;
   - calls FoodBridge;
   - sends the reply through the Graph API.
3. **Outgoing updates:** the webhook that `NOTIFY_WHATSAPP_WEBHOOK_URL` points to. It checks the bearer token, then sends the text to `to`.

It reads these n8n variables. Set them in your environment, or replace the `$env` expressions with n8n credentials if env access is blocked in your n8n.

| Variable | Value |
| --- | --- |
| `FOODBRIDGE_URL` | Your FoodBridge address. |
| `FOODBRIDGE_SECRET` | The same value as `INTEGRATION_SECRET`. |
| `FOODBRIDGE_WEBHOOK_TOKEN` | The same value as `NOTIFY_WEBHOOK_TOKEN`. |
| `WHATSAPP_VERIFY_TOKEN` | The verify token you enter in Meta's webhook settings. |
| `WHATSAPP_TOKEN` | Your WhatsApp access token. |
| `WHATSAPP_PHONE_ID` | Your WhatsApp phone number id. |

The workflow has not been run against a live n8n or WhatsApp account. Treat it as a starting point and test it with the Meta test number first. Messenger works the same way: use the Messenger webhook, send `channel: "messenger"` with the sender's PSID, and reply through the Send API (`/me/messages`).

## Removing the integration

1. Unset `INTEGRATION_SECRET` and the two `NOTIFY_*` URLs. The endpoint then answers 503 and chat updates are skipped.
2. To remove the code, delete:
   - `src/lib/integrations/`
   - `src/app/api/integrations/`
   - `src/app/actions/integrations.ts`
   - `src/components/integrations/`
   - the "Chat apps" card on the profile page
3. The workflows don't depend on it. The `channel_links` table can stay.
