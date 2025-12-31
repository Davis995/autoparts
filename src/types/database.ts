export type Database = {
  public: {
    Tables: {
      promotions: {
        Row: {
          id: string
          title: string
          description: string | null
          image: string | null
          bannerText: string | null
          discount: number | null
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          title: string
          description?: string | null
          image?: string | null
          bannerText?: string | null
          discount?: number | null
          isActive?: boolean
        }
        Update: Partial<{
          title: string
          description: string | null
          image: string | null
          bannerText: string | null
          discount: number | null
          isActive: boolean
        }>
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          firstName: string | null
          lastName: string | null
          emailVerified: boolean
          role: 'USER' | 'ADMIN'
          phone: string | null
          avatarUrl: string | null
          isAdmin: boolean
          createdAt?: string
          updatedAt?: string
        }
        Insert: {
          id: string
          email: string
          firstName?: string | null
          lastName?: string | null
          emailVerified?: boolean
          role?: 'USER' | 'ADMIN'
          phone?: string | null
          avatarUrl?: string | null
          isAdmin?: boolean
        }
        Update: Partial<{
          email: string
          firstName: string | null
          lastName: string | null
          emailVerified: boolean
          role: 'USER' | 'ADMIN'
          phone: string | null
          avatarUrl: string | null
          isAdmin: boolean
        }>
      }
    }
  }
}
