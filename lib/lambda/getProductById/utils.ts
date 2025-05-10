import { Product, ProductDTO, StockDTO } from "../../shared/types";

export function mergeData(
  product: ProductDTO | null,
  stock: StockDTO | null
): Product | null {
  if (!product) {
    return null;
  }

  return {
    ...product,
    count: stock?.count ?? 0,
  };
}
