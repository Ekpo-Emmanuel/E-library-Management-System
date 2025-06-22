'use client'

import { BorrowButton } from './borrow-button'
import { ReturnButton } from './return-button'
import { ReserveButton } from './reserve-button'
import { WaitlistButton } from './waitlist-button'
import { ContentStatus } from '@/utils/supabase/database.types'

interface ContentBorrowStatusProps {
  contentId: number
  status: ContentStatus
  userHasBorrowed: boolean
  userHasReserved: boolean
  borrowId: number | null
  reservationId: number | null
  waitlistPosition: number | null
  waitlistCount: number
  className?: string
}

export function ContentBorrowStatus({ 
  contentId, 
  status, 
  userHasBorrowed,
  userHasReserved,
  borrowId,
  reservationId,
  waitlistPosition,
  waitlistCount,
  className 
}: ContentBorrowStatusProps) {
  // If the user has borrowed this item, show the return button
  if (userHasBorrowed && borrowId) {
    return <ReturnButton borrowId={borrowId} className={className} />
  }
  
  // If the item is available, show the borrow button
  if (status === 'available') {
    return (
      <BorrowButton 
        contentId={contentId} 
        status={status} 
        userHasBorrowed={userHasBorrowed} 
        className={className} 
      />
    )
  }

  // If the item is borrowed or reserved, show reserve and waitlist buttons
  if (status === 'borrowed' || status === 'reserved') {
    return (
      <div className="space-y-2">
        <ReserveButton
          contentId={contentId}
          status={status}
          userHasReserved={userHasReserved}
          className={className}
        />
        <WaitlistButton
          contentId={contentId}
          status={status}
          waitlistPosition={waitlistPosition}
          waitlistCount={waitlistCount}
          className={className}
        />
      </div>
    )
  }

  // For archived items, show nothing
  return null
} 