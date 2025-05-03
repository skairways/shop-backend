import { getAllProducts } from "./productService";

export async function main() {
  const producuts = getAllProducts();

  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    body: JSON.stringify(producuts),
  };
  return response;
}
