import { defineStore } from "pinia";
import { computed, ref } from "vue";
import api from "../api/axios.js";

export const useCartStore = defineStore("cart", () => {
  const items = ref([]);
  const loading = ref(false);
  const error = ref("");

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  );

  const totalAmount = computed(() =>
    items.value.reduce((sum, item) => sum + Number(item.subtotal), 0),
  );

  function setCart(data) {
    items.value = data.items || [];
  }

  function clearCart() {
    items.value = [];
    error.value = "";
  }

  async function fetchCart() {
    loading.value = true;
    error.value = "";

    try {
      const { data } = await api.get("/api/cart");
      setCart(data);
      return data;
    } catch (err) {
      error.value = "Unable to load your cart.";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function addToCart(productId, quantity = 1) {
    const { data } = await api.post("/api/cart", {
      product_id: productId,
      quantity,
    });

    setCart(data);
    return data;
  }

  async function updateQuantity(itemId, quantity) {
    const { data } = await api.patch(`/api/cart/${itemId}`, {
      quantity,
    });

    setCart(data);
    return data;
  }

  async function removeItem(itemId) {
    const { data } = await api.delete(`/api/cart/${itemId}`);
    setCart(data);
    return data;
  }

  async function checkout(deliveryPayload) {
    console.log("Delivery payload:", deliveryPayload);

    const { data } = await api.post("/api/orders/checkout", deliveryPayload);

    clearCart();

    return data;
  }

  return {
    items,
    loading,
    error,
    totalItems,
    totalAmount,
    clearCart,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    checkout,
  };
});
