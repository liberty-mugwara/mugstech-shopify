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

export type TWeightUnit = "GRAMS" | "KILOGRAMS" | "OUNCES" | "POUNDS";

export interface IProductCreateInput {
  input: {
    collectionsToJoin?: string[];
    collectionsToLeave?: string[];
    customProductType?: string;
    descriptionHtml: string;
    giftCard?: boolean;
    giftCardTemplateSuffix?: string;
    handle: string;
    id?: string;
    images: {
      altText?: string;
      id?: string;
      src: string;
    }[];
    metafields?: {
      description?: string;
      id?: string;
      key: string;
      namespace: string;
      type: string;
      value: string;
    }[];

    options?: string[];
    privateMetafields?: {
      key: string;
      namespace: string;
      owner: string;
      valueInput: {
        value: string;
        valueType: string;
      };
    }[];

    productCategory?: {
      productTaxonomyNodeId: string;
    };
    productType: string;

    redirectNewHandle?: boolean;
    requiresSellingPlan?: boolean;
    seo: {
      description: string;
      title: string;
    };
    standardizedProductType?: {
      productTaxonomyNodeId: string;
    };
    status: string;
    tags?: string[];
    templateSuffix?: string;
    title: string;
    variants: {
      barcode?: string;
      compareAtPrice?: string;
      fulfillmentServiceId: string;
      harmonizedSystemCode?: string;
      id?: string;
      imageId?: string;
      imageSrc?: string;
      inventoryItem?: {
        cost: string;
        tracked: boolean;
      };
      inventoryManagement: string;
      inventoryPolicy: string;
      inventoryQuantities: {
        availableQuantity: number;
        locationId: string;
      };
      mediaSrc?: string[];
      metafields?: {
        description: string;
        id?: string;
        key: string;
        namespace: string;
        type: string;
        value: string;
      };
      options?: string[];
      position?: number;
      price: string;
      privateMetafields?: {
        key: string;
        namespace: string;
        owner: string;
        valueInput: {
          value: string;
          valueType: string;
        };
      };
      productId?: string;
      requiresShipping: boolean;
      sku: string;
      taxCode?: string;
      taxable: boolean;
      title?: string;
      weight: number;
      weightUnit: TWeightUnit;
    }[];

    vendor: string;
  };
  media?: {
    alt: string;
    mediaContentType: string;
    originalSource: string;
  };
}
