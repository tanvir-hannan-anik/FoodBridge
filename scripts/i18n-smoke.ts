// Quick checks for the translator: npx tsx scripts/i18n-smoke.ts
import { translate } from "../src/lib/i18n";

const cases: [string, Record<string, string | number> | undefined, string][] = [
  ["Pending", undefined, "অপেক্ষমাণ"],
  ["Welcome, {name}", { name: "FoodBridge" }, "স্বাগতম, FoodBridge"],
  ["স্বাগতম, FoodBridge", undefined, "স্বাগতম, FoodBridge"],
  ["Rice for kids", undefined, "Rice for kids"],
  ["Your donation “মুরগির বিরিয়ানি” is live. We’re letting nearby NGOs know.", undefined, "আপনার দান “মুরগির বিরিয়ানি” এখন সক্রিয়। কাছের এনজিওগুলোকে জানানো হচ্ছে।"],
  ["The donor cancelled “Rice for kids”.", undefined, "দাতা “Rice for kids” বাতিল করেছেন।"],
  ["1.2 km", undefined, "১.২ কিমি"],
  ["For this food type, best-before can be at most 8 hours after it was prepared.", undefined, "এই ধরনের খাবারের ক্ষেত্রে খাওয়ার শেষ সময় রান্নার পর সর্বোচ্চ ৮ ঘণ্টা হতে পারে।"],
  ["The NGO cancelled the match for “Dal”. It’s available again. Reason: Kitchen closed", undefined, "এনজিও “Dal”-এর মিল বাতিল করেছে। এটি আবার পাওয়া যাচ্ছে। কারণ: Kitchen closed"],
  ["{n} meals", { n: 1240 }, "১,২৪০ বেলার খাবার"],
];

let failed = 0;
for (const [text, vars, want] of cases) {
  const got = translate("bn", text, vars);
  const ok = want === "" ? got !== text : got === want;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${text}\n     → ${got}`);
}
process.exitCode = failed ? 1 : 0;
