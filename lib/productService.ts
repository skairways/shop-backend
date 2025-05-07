type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  logo: string;
  count: number;
};

const products: Product[] = [
  {
    id: "1",
    title: "Milk",
    description: "Almond milk",
    price: 4,
    logo: "",
    count: 10,
  },
  {
    id: "2",
    title: "Strawberry",
    description: "Fresh and tasty",
    price: 10,
    logo: "",
    count: 200,
  },
  {
    id: "3",
    title: "Bread",
    description: "Baked with lovely hands",
    price: 4,
    logo: "",
    count: 10,
  },
];

export const getAllProducts = () => {
  return products;
};

export const getProductById = (id: string) => {
  return products.find((p) => p.id === id);
};
