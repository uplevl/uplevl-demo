export interface ZillowPropertyDetails {
  zpid: number;
  city: string;
  state: string;
  homeStatus: string;
  address: ZillowAddress;
  isListingClaimedByCurrentSignedInUser: string;
  isCurrentSignedInAgentResponsible: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  yearBuilt: number;
  streetAddress: string;
  zipcode: string;
  isCurrentSignedInUserVerifiedOwner: string;
  isVerifiedClaimedByCurrentSignedInUser: string;
  listingDataSource: string;
  longitude: number;
  latitude: number;
  hasBadGeocode: boolean;
  streetViewMetadataUrlMediaWallLatLong: string;
  streetViewMetadataUrlMediaWallAddress: string;
  streetViewServiceUrl: string;
  livingArea: number;
  homeType: string;
  lotSize: number;
  lotAreaValue: number;
  lotAreaUnits: string;
  livingAreaValue: number;
  livingAreaUnitsShort: string;
  isUndisclosedAddress: string;
  zestimate: number;
  rentZestimate: number;
  currency: string;
  hideZestimate: string;
  dateSoldString: string;
  taxAssessedValue: number;
  taxAssessedYear: number;
  country: string;
  propertyTaxRate: number;
  photoCount: number;
  isPremierBuilder: string;
  isZillowOwned: string;
  ssid: any;
  hdpUrl: string;
  tourViewCount: number;
  hasPublicVideo: boolean;
  lastSoldPrice: number;
  livingAreaUnits: string;
  hasApprovedThirdPartyVirtualTourUrl: boolean;
  streetViewTileImageUrlMediumLatLong: string;
  isNonOwnerOccupied: string;
  zestimateMinus30: string;
  restimateMinus30: string;
  zestimateLowPercent: string;
  zestimateHighPercent: string;
  restimateLowPercent: string;
  restimateHighPercent: string;
  description: string;
  parcelId: string;
  taxHistory: ZillowTaxHistory[];
  priceHistory: ZillowPriceHistory[];
  nearbyHomes: string[];
  schools: ZillowSchool[];
  totalCount: any;
  mortgageRates: ZillowMortgageRates;
  isInstantOfferEnabled: string;
  zillowOfferMarket: string;
  isRentalListingOffMarket: string;
  nearbyCities: ZillowNearbyCity[];
  nearbyNeighborhoods: ZillowNearbyNeighborhood[];
  nearbyZipcodes: ZillowNearbyZipcode[];
  abbreviatedAddress: string;
  daysOnZillow: number;
  rentalApplicationsAcceptedType: string;
  brokerageName: any;
  propertyTypeDimension: string;
  hdpTypeDimension: string;
  timeZone: string;
  tourEligibility: ZillowTourEligibility;
  virtualTourUrl: any;
  selfTour: ZillowSelfTour;
  photos: ZillowPhoto[];
  "resoFacts:sewer": any;
  "resoFacts:waterSource": any;
  utilities: string[];
  url: string;
  countyFIPS: string;
  countyID: string;
  dateSold: string;
  isFeatured: boolean;
  isHousingConnector: boolean;
  isRentalsLeadCapMet: boolean;
  listingTypeDimension: string;
  postingContact: string[];
  homeValuation: string[];
  isOffMarket: boolean;
  resofacts_sewer: string;
  resofacts_water_source: string;
  citySearchUrl: ZillowCitySearchUrl;
  county: string;
  is_showcased: boolean;
  interior: ZillowInterior;
  overview: ZillowOverview;
  is_listed_by_management_company: boolean;
  management_company_phone_number: any;
  listing_provided_by: ZillowListingProvidedBy;
  hoa_details: ZillowHoaDetails;
  financial: ZillowFinancial[];
  interior_full: ZillowInteriorFull[];
  property: ZillowProperty[];
  construction: ZillowConstruction[];
  tag: any;
  contingent_listing_type: any;
  unit_number: any;
  unit_amenities: any;
  open_house_details: any;
  community_details: ZillowCommunityDetail[];
  mls_id: any;
  base_rent: any;
  sqft: any;
  availability_date: any;
  special_offer: any;
  originating_mls: any;
  tags: string[];
  getting_around_scores: ZillowGettingAroundScores;
  days_on_zillow: number;
  getting_around: ZillowGettingAround;
  other: ZillowOther[];
  financial_listing_details: any;
  publish_url: any;
  climate_risks: ZillowClimateRisks;
  num_of_contacts: any;
  num_of_applications: any;
}

export interface ZillowAddress {
  city: string;
  state: string;
  streetAddress: string;
  zipcode: string;
}

export interface ZillowTaxHistory {
  taxPaid?: number;
  time: number;
  value: number;
  valueIncreaseRate: number;
}

export interface ZillowPriceHistory {
  date: string;
  event: string;
  postingIsRental: boolean;
  price: number;
  priceChangeRate: number;
  pricePerSquareFoot: number;
  showCountyLink: boolean;
  source: string;
  source_listing_id?: string;
  source_name?: string;
  time: number;
  attributeSource?: ZillowAttributeSource;
}

export interface ZillowAttributeSource {
  infoString2: string;
}

export interface ZillowSchool {
  distance: number;
  grades: string;
  level: string;
  link: string;
  name: string;
  rating: number;
  type: string;
}

export interface ZillowMortgageRates {
  thirtyYearFixedRate: number;
}

export interface ZillowNearbyCity {
  name: string;
  regionUrl: ZillowRegionUrl;
}

export interface ZillowRegionUrl {
  path: string;
}

export interface ZillowNearbyNeighborhood {
  name: string;
  regionUrl: ZillowRegionUrl2;
}

export interface ZillowRegionUrl2 {
  path: string;
}

export interface ZillowNearbyZipcode {
  name: string;
  regionUrl: ZillowRegionUrl3;
}

export interface ZillowRegionUrl3 {
  path: string;
}

export interface ZillowTourEligibility {
  isPropertyTourEligible: boolean;
}

export interface ZillowSelfTour {
  hasSelfTour: boolean;
}

export interface ZillowPhoto {
  mixedSources: ZillowMixedSources;
}

export interface ZillowMixedSources {
  jpeg: ZillowJpeg[];
}

export interface ZillowJpeg {
  url: string;
  width: number;
}

export interface ZillowCitySearchUrl {
  path: string;
  text: string;
}

export interface ZillowInterior {
  bedrooms_and_bathrooms: ZillowBedroomsAndBathrooms;
  flooring: string;
  heating: string;
  other_interior_features: string;
}

export interface ZillowBedroomsAndBathrooms {
  bathrooms: number;
  bedrooms: number;
  full_bathrooms: number;
  half_bathroom: string;
}

export interface ZillowOverview {
  days_on_zillow: number;
}

export interface ZillowListingProvidedBy {
  company: any;
  email: any;
  name: any;
  phone_number: any;
}

export interface ZillowHoaDetails {
  amenities_included: any;
  has_hoa: any;
  hoa_fee_currency: any;
  hoa_fee_period: any;
  hoa_fee_value: any;
  services_included: any;
}

export interface ZillowFinancial {
  agency_fee: any;
}

export interface ZillowInteriorFull {
  title: string;
  values: string[];
}

export interface ZillowProperty {
  title: string;
  values: string[];
}

export interface ZillowConstruction {
  title: string;
  values: string[];
}

export interface ZillowCommunityDetail {
  title: string;
  values: any;
}

export interface ZillowGettingAroundScores {
  bike_score: any;
  transit_score: any;
  walk_score: any;
}

export interface ZillowGettingAround {
  bike: ZillowBike;
  transit: ZillowTransit;
  walk: ZillowWalk;
}

export interface ZillowBike {
  description: any;
  score: any;
}

export interface ZillowTransit {
  description: any;
  score: any;
}

export interface ZillowWalk {
  description: any;
  score: any;
}

export interface ZillowOther {
  name: string;
  value: string;
}

export interface ZillowClimateRisks {
  air_factor: any;
  fire_factor: any;
  flood_factor: any;
  heat_factor: any;
  wind_factor: any;
}
