import crypto from "crypto";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export interface ParsedInitData {
  user: TelegramUser;
  auth_date: number;
  hash: string;
  query_id?: string;
  start_param?: string;
}

/**
 * Telegram Mini App initData ni HMAC-SHA256 bilan tekshirish.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86400
): ParsedInitData {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    throw new Error("Missing hash in initData");
  }

  // hash ni olib tashlab, qolganlarni alifbo tartibida joylash
  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  // HMAC-SHA256 tekshiruv
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) {
    throw new Error("Invalid initData signature");
  }

  // Muddat tekshiruvi
  const authDate = parseInt(params.get("auth_date") || "0", 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > maxAgeSeconds) {
    throw new Error("initData is expired");
  }

  // User ob'ektini parse qilish
  const userStr = params.get("user");
  if (!userStr) {
    throw new Error("Missing user in initData");
  }

  const user: TelegramUser = JSON.parse(userStr);

  return {
    user,
    auth_date: authDate,
    hash,
    query_id: params.get("query_id") || undefined,
    start_param: params.get("start_param") || undefined,
  };
}

/**
 * Telegram Login Widget ma'lumotlarini tekshirish.
 * https://core.telegram.org/widgets/login#checking-authorization
 */
export interface TelegramWidgetData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function validateTelegramWidget(
  data: TelegramWidgetData,
  botToken: string,
  maxAgeSeconds = 86400
): TelegramWidgetData {
  const { hash, ...rest } = data;

  // data_check_string = barcha fieldlar alfavit tartibida \n bilan
  const dataCheckString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
    .join("\n");

  // secret_key = SHA256(bot_token)
  const secretKey = crypto.createHash("sha256").update(botToken).digest();

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) {
    throw new Error("Invalid Telegram widget signature");
  }

  // Muddat tekshiruvi
  const now = Math.floor(Date.now() / 1000);
  if (now - data.auth_date > maxAgeSeconds) {
    throw new Error("Telegram widget data is expired");
  }

  return data;
}
