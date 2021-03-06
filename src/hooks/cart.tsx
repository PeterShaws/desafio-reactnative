import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      try {
        const storedProducts = await AsyncStorage.getItem(
          '@GoMarketplace:products',
        );
        if (storedProducts) {
          const loadedProducts: Product[] = JSON.parse(storedProducts);
          setProducts(loadedProducts);
        }
      } catch (err) {
        console.log(err); // eslint-disable-line no-console
      }
    }

    loadProducts();
  }, []);

  const storeProducts = useCallback(async (newProducts: Product[]) => {
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(newProducts),
    );
  }, []);

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const productIndex = products.findIndex(p => p.id === product.id);
      let newProducts: Product[];
      if (productIndex < 0) {
        newProducts = [...products, { ...product, quantity: 1 }];
      } else {
        const oldProduct = products[productIndex];
        const newQuantity = oldProduct.quantity + 1;
        const newProduct: Product = { ...oldProduct, quantity: newQuantity };
        newProducts = [...products];
        newProducts[productIndex] = newProduct;
      }
      setProducts(newProducts);
      await storeProducts(newProducts);
    },
    [products, storeProducts],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);
      const oldProduct = products[productIndex];
      const newQuantity = oldProduct.quantity + 1;
      const newProduct: Product = { ...oldProduct, quantity: newQuantity };
      const newProducts = [...products];
      newProducts[productIndex] = newProduct;
      setProducts(newProducts);
      await storeProducts(newProducts);
    },
    [products, storeProducts],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);
      const oldProduct = products[productIndex];
      let newProducts: Product[];
      if (oldProduct.quantity === 1) {
        newProducts = products.filter(product => product.id !== id);
      } else {
        const newQuantity = oldProduct.quantity - 1;
        const newProduct: Product = { ...oldProduct, quantity: newQuantity };
        newProducts = [...products];
        newProducts[productIndex] = newProduct;
      }
      setProducts(newProducts);
      await storeProducts(newProducts);
    },
    [products, storeProducts],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
