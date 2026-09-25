import type { NavigatorScreenParams } from "@react-navigation/native";
import type { CatalogProduct } from "../types";

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Login: undefined;
  Register: undefined;
  ProductDetail: { product: CatalogProduct };
  Quote: undefined;
  Tracking: undefined;
};

export type TabParamList = {
  Home: undefined;
  Catalog: undefined;
  Cart: undefined;
  Account: undefined;
};