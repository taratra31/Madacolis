import type { AmazonProduct } from "../types";

export interface QuoteParams {
  product?: AmazonProduct;
  prefill?: { quantity?: number };
}

export type MainTabParamList = {
  Home: undefined;
  Catalog: undefined;
  Cart: undefined;
  Tracking: { number?: string } | undefined;
  Account: undefined;
};

export type TransitaireTabParamList = {
  Colis: undefined;
  Tarifs: undefined;
  Compte: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Transitaire: undefined;
  ProductDetail: { product?: AmazonProduct; productId?: string };
  Quote: QuoteParams | undefined;
};