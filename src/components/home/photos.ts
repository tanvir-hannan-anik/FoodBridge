import type { StaticImageData } from "next/image";
import hopeChildrenMeal from "../../../public/images/landing/hope-children-meal.jpg";
import hopeFoodPacks from "../../../public/images/landing/hope-food-packs.jpg";
import hopeServingPot from "../../../public/images/landing/hope-serving-pot.jpg";
import hungerChildMeal from "../../../public/images/landing/hunger-child-meal.jpg";
import hungerReliefCrowd from "../../../public/images/landing/hunger-relief-crowd.jpg";
import hungerWaitingLine from "../../../public/images/landing/hunger-waiting-line.jpg";
import roleFeastTable from "../../../public/images/landing/role-feast-table.jpg";
import wasteDumpRiver from "../../../public/images/landing/waste-dump-river.jpg";
import wasteIftarMarket from "../../../public/images/landing/waste-iftar-market.jpg";
import wasteHoludFeast from "../../../public/images/landing/waste-holud-feast.jpg";
import wasteKarwanBazar from "../../../public/images/landing/waste-karwan-bazar.jpg";
import wasteLeftoverPlates from "../../../public/images/landing/waste-leftover-plates.jpg";
import handsRice from "../../../public/hunger.jpg";
import heroVolunteer from "../../../public/images/landing/hero-volunteer-serving.jpg";
import hopeBoySmiling from "../../../public/images/landing/hope-boy-smiling.jpg";
import hopeCommunityPot from "../../../public/images/landing/hope-community-pot.jpg";
import hopeGirlServed from "../../../public/images/landing/hope-girl-served.jpg";
import hungerImHungry from "../../../public/images/landing/hunger-im-hungry.jpg";
import hungerMotherChild from "../../../public/images/landing/hunger-mother-child.jpg";
import hungerReachingPots from "../../../public/images/landing/hunger-reaching-pots.jpg";
import wasteStreetGarbage from "../../../public/images/landing/waste-street-garbage.jpg";

/*
 * Landing-page photographs. Wikimedia Commons photos carry their author and licence, which the page
 * shows next to the photo (CC BY / BY-SA require it). The others came with the design prototype.
 */

export type PhotoKey =
  | "handsRice"
  | "wasteHoludFeast"
  | "wasteLeftoverPlates"
  | "wasteKarwanBazar"
  | "wasteIftarMarket"
  | "wasteDumpRiver"
  | "hungerChildMeal"
  | "hungerReliefCrowd"
  | "hungerWaitingLine"
  | "hopeChildrenMeal"
  | "hopeServingPot"
  | "hopeFoodPacks"
  | "roleFeastTable"
  | "heroVolunteer"
  | "hopeBoySmiling"
  | "hopeCommunityPot"
  | "hopeGirlServed"
  | "hungerImHungry"
  | "hungerMotherChild"
  | "hungerReachingPots"
  | "wasteStreetGarbage";

/** `license` is set for Wikimedia Commons photos; without it the credit reads "Photo: author". */
export type Credit = { author: string; license?: string; href: string };

/** `position` is the CSS object-position used when a photo is cropped (its focal point). */
export const PHOTOS: Record<PhotoKey, { src: StaticImageData; credit?: Credit; position?: string }> = {
  handsRice: { src: handsRice },
  wasteHoludFeast: {
    src: wasteHoludFeast,
    credit: {
      author: "Syed Sajidul Islam",
      license: "CC BY-SA 4.0",
      href: "https://commons.wikimedia.org/wiki/File:Bangladeshi_traditional_turmeric_night%27s_food_and_its_decoration.jpg",
    },
  },
  wasteLeftoverPlates: { src: wasteLeftoverPlates },
  wasteKarwanBazar: {
    src: wasteKarwanBazar,
    credit: {
      author: "Wasiul Bahar",
      license: "CC BY-SA 4.0",
      href: "https://commons.wikimedia.org/wiki/File:Kawran_Bazar_market_127.jpg",
    },
  },
  wasteIftarMarket: {
    src: wasteIftarMarket,
    credit: {
      author: "Wasiul Bahar",
      license: "CC BY-SA 4.0",
      href: "https://commons.wikimedia.org/wiki/File:Chawkbazar_Iftar_Market_31.jpg",
    },
  },
  wasteDumpRiver: {
    src: wasteDumpRiver,
    position: "60% 85%",
    credit: {
      author: "Frameofashik",
      license: "CC BY-SA 4.0",
      href: "https://commons.wikimedia.org/wiki/File:A_man_searching_for_something_in_a_waste_disposal_area-01.jpg",
    },
  },
  hungerChildMeal: { src: hungerChildMeal },
  hungerReliefCrowd: { src: hungerReliefCrowd },
  hungerWaitingLine: {
    src: hungerWaitingLine,
    credit: {
      author: "Needy Foundation",
      license: "CC BY-SA 4.0",
      href: "https://commons.wikimedia.org/wiki/File:Ramadan_Food_Distribution_By_Needy_Foundation_02.jpg",
    },
  },
  hopeChildrenMeal: { src: hopeChildrenMeal },
  hopeServingPot: { src: hopeServingPot },
  hopeFoodPacks: {
    src: hopeFoodPacks,
    credit: {
      author: "Needy Foundation",
      license: "CC BY-SA 4.0",
      href: "https://commons.wikimedia.org/wiki/File:Ramadan_Food_Distribution_By_Needy_Foundation_04.jpg",
    },
  },
  roleFeastTable: {
    src: roleFeastTable,
    credit: {
      author: "Evening42",
      license: "CC BY-SA 4.0",
      href: "https://commons.wikimedia.org/wiki/File:Holud_Occasion_Food_Arrangement_of_Bangladesh.jpg",
    },
  },
  heroVolunteer: { src: heroVolunteer, position: "60% 40%" },
  hopeBoySmiling: { src: hopeBoySmiling, credit: { author: "GMB Akash", href: "https://gmb-akash.com" } },
  hopeCommunityPot: { src: hopeCommunityPot },
  hopeGirlServed: { src: hopeGirlServed, position: "50% 30%" },
  hungerImHungry: { src: hungerImHungry, position: "45% 30%" },
  hungerMotherChild: { src: hungerMotherChild },
  hungerReachingPots: { src: hungerReachingPots },
  wasteStreetGarbage: { src: wasteStreetGarbage },
};

/** Charts and news clippings about food waste in Bangladesh (shown whole, never cropped). */
export { default as chartHouseholdWaste } from "../../../public/images/landing/chart-household-waste.jpg";
export { default as chartWasteComposition } from "../../../public/images/landing/chart-waste-composition.png";
export { default as newsFoodWaste14m } from "../../../public/images/landing/news-food-waste-14m.jpg";
export { default as newsWorldBank34 } from "../../../public/images/landing/news-world-bank-34.jpg";
export { default as newsWastes34 } from "../../../public/images/landing/news-wastes-34.jpg";

/** UN Sustainable Development Goal tiles. */
export { default as sdg2 } from "../../../public/images/landing/sdg-2.jpg";
export { default as sdg12 } from "../../../public/images/landing/sdg-12-3.jpg";
export { default as sdg13 } from "../../../public/images/landing/sdg-13.png";
export { default as sdg17 } from "../../../public/images/landing/sdg-17.jpg";
export { default as sdg1 } from "../../../public/images/landing/sdg-1.png";
