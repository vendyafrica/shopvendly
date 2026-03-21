export type CollectionRow = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  productCount: number;
};

export type CollectionProductRow = {
  id: string;
  productName: string;
  thumbnailUrl?: string | null;
  thumbnailType?: string | null;
};

export type MediaItem = {
  url: string;
  pathname: string;
  contentType: string;
};
