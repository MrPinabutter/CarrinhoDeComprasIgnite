import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const product = await api.get(`/products/${productId}`);
      const stock = await api.get(`/stock/${productId}`);

      const productExists = updatedCart.find((item: Product) => item.id === productId);

      if(productExists){
        if(stock.data.amount <= productExists.amount){
          toast.error('Quantidade solicitada fora de estoque')
          return
        }
        
        productExists.amount = productExists.amount + 1;
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        return
      }

      const newProduct = {
        ...product.data,
        amount: 1
      }
      
      updatedCart.push(newProduct);
        
      setCart(updatedCart);
      
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if(!cart.find(product => product.id === productId)){
        throw new Error();
      }
      const updatedCart = [...cart].filter(product => product.id !== productId);

      setCart(updatedCart);
      console.log(cart);
      
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if(amount <= 0){
      return
    }
    try {
      const itens = [...cart]
      const stock = await api.get(`/stock/${productId}`);
      const updatedProduct = itens.find(product => product.id === productId);
      
      if(stock.data.amount < amount){
        return toast.error('Quantidade solicitada fora de estoque');
      }

      if(!updatedProduct){
        throw new Error()
      }

      updatedProduct.amount = amount;

      setCart(itens);
      return localStorage.setItem('@RocketShoes:cart', JSON.stringify(itens))

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
