// *******************************************************
// Shopify types
// *******************************************************

export interface IShopifylineItemNode {
  quantity: number;
  name: string;
  sku: string;
  taxLines: {
    priceSet: {
      presentmentMoney: {
        amount: string;
      };
    };
    ratePercentage: number;
  }[];
  customAttributes: { key: string; value: string | number }[];
}

export interface IShopifylineItems {
  edges: { node: IShopifylineItemNode }[];
}

export interface RawTaxOrder {
  lineItems: IShopifylineItems;
}
