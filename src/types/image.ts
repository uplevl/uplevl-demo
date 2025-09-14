export type Filename = string;

export interface AnalyzedImage {
  url: string;
  filename: Filename;
  description: string;
  isEstablishingShot?: boolean;
}

export interface ImageGroup {
  groupName: string;
}

export interface ImageGroupWithImages extends ImageGroup {
  images: Filename[];
}

export interface ImageGroupWithDescribedImages extends ImageGroup {
  describedImages: AnalyzedImage[];
}
