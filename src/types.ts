// *******************************************************
// Shopify types
// *******************************************************
export type TShopifyObject =
  | "Customer"
  | "Fulfillment"
  | "InventoryItem"
  | "LineItem"
  | "Location"
  | "Order"
  | "OrderTransaction"
  | "Product"
  | "ProductVariant"
  | "Refund"
  | "ShippingLine";

export interface IMoneyV2 {
  amount: string;
  currencyCode: string;
}

export interface IMoneyBag {
  presentmentMoney: IMoneyV2;
}

export interface ITaxLine {
  title: string;
  rate: string;
  priceSet: IMoneyBag;
}

export type TShopifyIdTypes =
  | "PRODUCT_ID"
  | "PRODUCT_VARIANT_ID"
  | "INVENTORY_ITEM"
  | "LOCATION";

export interface IFormartArgs {
  id: number;
  type: TShopifyIdTypes;
}

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
    bodyHtml: string;
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

export type TBulkOperationStatus =
  | "CANCELED"
  | "CANCELING"
  | "COMPLETED"
  | "CREATED"
  | "EXPIRED"
  | "FAILED"
  | "RUNNING";

export interface IBulkOperation {
  status: TBulkOperationStatus;
  id: string;
  url: string | null;
  errorCode: number;
  objectCount: number;
}

export type TbulkOperationUserErrors = {
  field: string[];
  message: string;
}[];

export interface ICurrentBulkOperation {
  currentBulkOperation: IBulkOperation;
}

export interface IBulkOperationRunMutationResponse {
  bulkOperationRunMutation: {
    bulkOperation: IBulkOperation | null;
    userErrors: TbulkOperationUserErrors;
  };
}

export interface IBulkOperationRunQueryResponse {
  bulkOperationRunQuery: {
    bulkOperation: IBulkOperation | null;
    userErrors: TbulkOperationUserErrors;
  };
}
