import type { ZillowOverview, ZillowProperty } from "./zillow";

export interface PropertyStats {
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize: number;
  yearBuilt: number;
  price: number;
  meta: ZillowProperty[];
  mlsId: string;
  overview: ZillowOverview;
  lat: number;
  lon: number;
  hoaDetails: {
    hasHoa: boolean;
    hoaFeeValue: number;
    hoaFeeCurrency: string;
    hoaFeePeriod: string;
    servicesIncluded: string[];
    amenitiesIncluded: string[];
  };
}

export type PropertyLocation = string;

export type PostType = "photo" | "video" | "both";
