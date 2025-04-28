import { getAllProducts } from "./productService";

export async function main() {
  const producuts = getAllProducts();

  return {
    statusCode: 200,
    body: JSON.stringify(producuts),
  };
}
