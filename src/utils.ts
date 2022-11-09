type TShopifyIdTypes =
  | "PRODUCT_ID"
  | "PRODUCT_VARIANT_ID"
  | "INVENTORY_ITEM"
  | "LOCATION";

interface IFormartArgs {
  id: number;
  type: TShopifyIdTypes;
}

export function formartId({ id, type }: IFormartArgs) {
  const base = "gid://shopify";
  const map: Record<TShopifyIdTypes, string> = {
    PRODUCT_ID: `${base}/Product/`,
    PRODUCT_VARIANT_ID: `${base}/ProductVariant`,
    INVENTORY_ITEM: `${base}/InventoryItem`,
    LOCATION: `${base}/Location`,
  };

  return `${map[type]}/${id}`;
}
