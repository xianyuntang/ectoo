import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { encrypt, decrypt } from '@/lib/crypto'

interface Credentials {
  accessKeyId: string
  secretAccessKey: string
}

interface AppStore {
  credentials: Credentials | null
  selectedRegion: string
  isLoading: boolean
  error: string | null
  
  setCredentials: (credentials: Credentials) => Promise<void>
  clearCredentials: () => void
  setSelectedRegion: (region: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const useStore = create<AppStore>()(
  persist(
    (set) => ({
      credentials: null,
      selectedRegion: 'us-east-1',
      isLoading: false,
      error: null,
      
      setCredentials: async (credentials: Credentials) => {
        try {
          const encryptedAccessKeyId = await encrypt(credentials.accessKeyId)
          const encryptedSecretAccessKey = await encrypt(credentials.secretAccessKey)
          
          set({
            credentials: {
              accessKeyId: encryptedAccessKeyId,
              secretAccessKey: encryptedSecretAccessKey
            },
            error: null
          })
        } catch (error) {
          set({ error: 'Failed to encrypt credentials' })
        }
      },
      
      clearCredentials: () => {
        set({ credentials: null })
      },
      
      setSelectedRegion: (region: string) => {
        set({ selectedRegion: region })
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
      
      setError: (error: string | null) => {
        set({ error })
      }
    }),
    {
      name: 'vm-monitor-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        credentials: state.credentials,
        selectedRegion: state.selectedRegion
      })
    }
  )
)

export const getDecryptedCredentials = async (credentials: Credentials | null): Promise<Credentials | null> => {
  if (!credentials) return null
  
  try {
    const decryptedAccessKeyId = await decrypt(credentials.accessKeyId)
    const decryptedSecretAccessKey = await decrypt(credentials.secretAccessKey)
    
    return {
      accessKeyId: decryptedAccessKeyId,
      secretAccessKey: decryptedSecretAccessKey
    }
  } catch (error) {
    console.error('Failed to decrypt credentials:', error)
    return null
  }
}

export default useStore