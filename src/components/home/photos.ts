import type { StaticImageData } from "next/image";
import heroRickshaw from "../../../public/images/landing/hero-rickshaw-night.jpg";
import hopeChildrenMeal from "../../../public/images/landing/hope-children-meal.jpg";
import hopeFoodPacks from "../../../public/images/landing/hope-food-packs.jpg";
import hopeServingPot from "../../../public/images/landing/hope-serving-pot.jpg";
import hungerChildMeal from "../../../public/images/landing/hunger-child-meal.jpg";
import hungerReliefCrowd from "../../../public/images/landing/hunger-relief-crowd.jpg";
import hungerWaitingLine from "../../../public/images/landing/hunger-waiting-line.jpg";
import roleFeastTable from "../../../public/images/landing/role-feast-table.jpg";
import roleRickshaws from "../../../public/images/landing/role-rickshaws.jpg";
import wasteDumpRiver from "../../../public/images/landing/waste-dump-river.jpg";
import wasteIftarMarket from "../../../public/images/landing/waste-iftar-market.jpg";
import wasteHoludFeast from "../../../public/images/landing/waste-holud-feast.jpg";
import wasteKarwanBazar from "../../../public/images/landing/waste-karwan-bazar.jpg";
import wasteLeftoverPlates from "../../../public/images/landing/waste-leftover-plates.jpg";
import handsRice from "../../../public/hunger.jpg";

/*
 * Landing-page photographs. Wikimedia Commons photos carry their author and licence, which the page
 * shows next to the photo (CC BY / BY-SA require it). The others came with the design prototype.
 */

export type PhotoKey =
  | "heroRickshaw"
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
  | "roleRickshaws";

export type Credit = { author: string; license: string; href: string };

/** `position` is the CSS object-position used when a photo is cropped (its focal point). */
export const PHOTOS: Record<PhotoKey, { src: StaticImageData; credit?: Credit; position?: string }> = {
  heroRickshaw: {
    src: heroRickshaw,
    credit: {
      author: "Nasir Khan Saikat",
      license: "CC BY-SA 3.0",
      href: "https://commons.wikimedia.org/wiki/File:Rickshaw_on_the_road_at_night,_Dhaka.JPG",
    },
  },
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
  roleRickshaws: {
    src: roleRickshaws,
    credit: {
      author: "Ifteebd10",
      license: "CC BY-SA 4.0",
      href: "https://commons.wikimedia.org/wiki/File:Row_of_Rickshaws_at_Night,_Shantinagar,_Dhaka_2.jpg",
    },
  },
};
