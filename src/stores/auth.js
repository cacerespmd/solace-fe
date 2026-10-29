
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/axios'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(sessionStorage.getItem('solace_admin_token'))
  const loading = ref(false)
  const error = ref('')

  const login = async (email, password) => {
    loading.value = true
    error.value = ''

    try {
      const { data } = await api.post('/api/admin/auth/login', {
        email,
        password,
      })

      token.value = data.access_token
      sessionStorage.setItem('solace_admin_token', data.access_token)

      return true
    } catch (err) {
      error.value =
        err.response?.data?.detail || 'Unable to log in. Please try again.'

      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    token.value = null
    sessionStorage.removeItem('solace_admin_token')
  }

  return {
    token,
    loading,
    error,
    login,
    logout,
  }
})
