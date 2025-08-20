import { Suspense } from 'react'
import { TimelineTabsClient } from './timeline-tabs-client'

export function TimelineTabs() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TimelineTabsClient />
    </Suspense>
  )
}