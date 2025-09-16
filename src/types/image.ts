export type Filename = string;

export interface AnalyzedImage {
  url: string;
  description: string;
  isEstablishingShot: boolean;
}

export interface ImageGroup {
  groupName: string;
}

export interface ImageGroupWithImages extends ImageGroup {
  images: string[];
}

export interface ImageGroupWithDescribedImages extends ImageGroup {
  describedImages: AnalyzedImage[];
}
