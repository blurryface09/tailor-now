export type UserRole = 'customer' | 'tailor' | 'admin'

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'measuring'
  | 'in_progress'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export type DeliveryType = 'pickup_delivery' | 'visit_shop'

export type ServiceType =
  | 'custom_outfit'
  | 'alterations'
  | 'bridal'
  | 'ready_to_wear'
  | 'fabric_sourcing'
  | 'uniforms'
  | 'asoebi'
  | 'street_wear'

export interface Profile {
  id: string
  email: string | null
  phone: string | null
  full_name: string
  avatar_url: string | null
  role: UserRole
  address: string | null
  city: string | null
  state: string | null
  created_at: string
  updated_at: string
}

export interface Measurements {
  id: string
  user_id: string
  chest: number | null
  waist: number | null
  hips: number | null
  inseam: number | null
  shoulder: number | null
  sleeve_length: number | null
  neck: number | null
  thigh: number | null
  ankle: number | null
  back_length: number | null
  notes: string | null
  updated_at: string
}

export interface TailorProfile {
  id: string
  user_id: string
  business_name: string
  bio: string | null
  specialties: ServiceType[]
  delivery_types: DeliveryType[]
  city: string
  state: string
  address: string | null
  latitude: number | null
  longitude: number | null
  is_verified: boolean
  is_active: boolean
  face_photo_url: string | null
  min_price: number | null
  max_price: number | null
  avg_rating: number
  total_reviews: number
  total_orders: number
  completion_rate: number
  response_time_hours: number | null
  created_at: string
}

export interface TailorService {
  id: string
  tailor_id: string
  service_type: ServiceType
  title: string
  description: string | null
  base_price: number
  price_negotiable: boolean
  min_days: number
  max_days: number
  is_active: boolean
}

export interface PortfolioItem {
  id: string
  tailor_id: string
  image_url: string
  title: string
  description: string | null
  service_type: ServiceType | null
  created_at: string
}

export interface AvailabilitySlot {
  id: string
  tailor_id: string
  date: string
  is_available: boolean
  note: string | null
}

export interface Order {
  id: string
  customer_id: string
  tailor_id: string
  service_id: string | null
  service_type: ServiceType
  title: string
  description: string
  delivery_type: DeliveryType
  pickup_address: string | null
  delivery_address: string | null
  status: OrderStatus
  customer_offer: number | null
  agreed_price: number | null
  deposit_amount: number | null
  balance_amount: number | null
  deposit_paid: boolean
  balance_paid: boolean
  is_delivering: boolean
  paystack_ref: string | null
  deadline: string | null
  actual_delivery: string | null
  style_reference_urls: string[]
  notes: string | null
  created_at: string
  updated_at: string
  customer?: Profile
  tailor?: TailorProfile & { profile?: Profile }
}

export interface Rating {
  id: string
  order_id: string
  reviewer_id: string
  reviewee_id: string
  reviewer_role: UserRole
  rating: number
  comment: string | null
  created_at: string
  reviewer?: Profile
}

export interface ChatRoom {
  id: string
  order_id: string | null
  customer_id: string
  tailor_id: string
  last_message: string | null
  last_message_at: string | null
  customer?: Profile
  tailor?: TailorProfile & { profile?: Profile }
}

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'contact'
  read: boolean
  created_at: string
  sender?: Profile
}

export interface Payout {
  id: string
  tailor_id: string
  order_id: string
  gross_amount: number
  commission_rate: number
  commission_amount: number
  net_amount: number
  status: 'pending' | 'processing' | 'paid' | 'failed'
  paid_at: string | null
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  creative_id: string | null
  caption: string | null
  image_urls: string[]
  service_type: ServiceType | null
  likes_count: number
  comments_count: number
  created_at: string
  author?: Profile
  creative?: TailorProfile
  liked_by_me?: boolean
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  author?: Profile
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'order_update' | 'new_follower' | 'post_like' | 'post_comment' | 'payment'
  title: string
  body: string | null
  data: Record<string, string>
  read: boolean
  created_at: string
}
