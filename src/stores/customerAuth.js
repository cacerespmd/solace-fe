
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/axios'

const TOKEN_KEY = 'solace_customer_token'

export const useCustomerAuthStore = defineStore('customerAuth', () => {
  const token = ref(sessionStorage.getItem(TOKEN_KEY))
  const customer = ref(null)

  const isAuthenticated = () => Boolean(token.value)

  async function register(payload) {
    const { data } = await api.post(
      '/api/customers/auth/register',
      payload
    )

    return data
  }

  async function login(payload) {
    const { data } = await api.post(
      '/api/customers/auth/login',
      payload
    )

    token.value = data.access_token
    customer.value = data.customer

    sessionStorage.setItem(TOKEN_KEY, data.access_token)

    return data
  }

  async function fetchCustomer() {
    if (!token.value) return null

    try {
      const { data } = await api.get('/api/customers/auth/me', {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })

      customer.value = data
      return data
    } catch (error) {
      if (error.response?.status === 401) {
        logout()
      }

      throw error
    }
  }

  function logout() {
    token.value = null
    customer.value = null
    sessionStorage.removeItem(TOKEN_KEY)
  }

  return {
    token,
    customer,
    isAuthenticated,
    register,
    login,
    fetchCustomer,
    logout,
  }
})
