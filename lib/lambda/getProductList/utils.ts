import { Product, ProductDTO, StockDTO } from "../../shared/types";

export function mergeData(
  products: ProductDTO[],
  stocks: StockDTO[]
): Product[] {
  const stocksMap: Map<StockDTO["product_id"], StockDTO> = new Map();

  stocks.forEach((stock) => {
    stocksMap.set(stock.product_id, stock);
  });

  return products.map((product) => {
    const count = stocksMap.get(product.id)?.count;

    return { ...product, count: count ?? 0 };
  });
}
