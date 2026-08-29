"use client";

import React, { createContext, useContext, ReactNode, useMemo } from "react";
import {
  DEFAULT_PRODUCT,
  ProductKey,
  ProductManifest,
  manifestFor,
} from "@/lib/product";
import { ProductBrand, brandAssetsFor } from "@/lib/productBrand";

/**
 * Which product surface the app is currently rendering.
 *
 * RESOLVED ON THE SERVER, NOT IN AN EFFECT.
 *   The Edge middleware stamps the product header from the Host, the root
 *   layout reads it and hands it to this provider as `initialProduct`. That
 *   ordering is deliberate: resolving in a useEffect would render the full
 *   Zukvo navigation for one frame on a testiez.com load, which leaks the
 *   other brand to a customer who is not supposed to know it exists.
 *
 * SURFACE, NOT SECURITY.
 *   This decides what the shell draws. What the tenant may actually reach is
 *   decided by entitlements on the API (requireCapability) and what the user
 *   may do is decided by RBAC permissions. Never gate anything that matters on
 *   this value alone.
 */

interface ProductContextType {
  product: ProductKey;
  manifest: ProductManifest;
  /** Logo, wordmark and accent colour for this surface. */
  brand: ProductBrand;
  /** Convenience for the common branch. */
  isTestiez: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{
  children: ReactNode;
  initialProduct?: ProductKey;
}> = ({ children, initialProduct = DEFAULT_PRODUCT }) => {
  const value = useMemo<ProductContextType>(() => {
    const manifest = manifestFor(initialProduct);
    return {
      product: initialProduct,
      manifest,
      brand: brandAssetsFor(initialProduct),
      isTestiez: initialProduct === "testiez",
    };
  }, [initialProduct]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProduct = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProduct must be used within a ProductProvider");
  }
  return context;
};

export default ProductContext;
