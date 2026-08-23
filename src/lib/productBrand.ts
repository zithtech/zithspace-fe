import type { StaticImageData } from "next/image";
import type { ProductKey } from "./product";

import ZukvoMark from "@/assets/logo/Zukvologo.png";
import TestiezMark from "@/assets/logo/testiez/mark.png";
import TestiezWordmark from "@/assets/logo/testiez/wordmark.png";
import TestiezWordmarkLight from "@/assets/logo/testiez/wordmark-light.png";

/**
 * Visual identity per product surface.
 *
 * SEPARATE FROM lib/product.ts ON PURPOSE. That module is imported by the Edge
 * middleware and must stay free of image imports and anything webpack-specific.
 * This one is client-side only, so it can pull in real assets.
 *
 * The Testiez palette is not invented here — it is lifted from the tokens the
 * marketing site already ships (testiez-landing/src/styles/tokens.css), so the
 * app and the site that sells it agree on what the brand looks like.
 */
export interface ProductBrand {
  /** Square mark, used in the loader and the collapsed nav. */
  mark: StaticImageData;
  /**
   * Wordmark artwork, where one exists. Zukvo renders its name as type, so it
   * has none — consumers fall back to `name` from the product manifest.
   */
  wordmark?: StaticImageData;
  /** Wordmark for dark surfaces. */
  wordmarkLight?: StaticImageData;
  /** Primary action colour. Feeds the Ant Design theme token. */
  accent: string;
  /** Legal entity in footers. Testiez is a ZithTech product, same as Zukvo. */
  legalName: string;
}

export const PRODUCT_BRAND: Record<ProductKey, ProductBrand> = {
  zukvo: {
    mark: ZukvoMark,
    accent: "#3B82F6",
    legalName: "Zukvo",
  },
  testiez: {
    mark: TestiezMark,
    wordmark: TestiezWordmark,
    wordmarkLight: TestiezWordmarkLight,
    // --blue-600 from the landing page tokens: identity and primary action.
    accent: "#2a78d6",
    legalName: "Testiez",
  },
};

export function brandAssetsFor(product: ProductKey): ProductBrand {
  return PRODUCT_BRAND[product] ?? PRODUCT_BRAND.zukvo;
}
