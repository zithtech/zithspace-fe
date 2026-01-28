'use client'

import { use } from 'react'
import dynamic from 'next/dynamic'

import LoadingSpinner from '@/components/common/LoadingSpinner'

const DocumentWorkspace = dynamic(
    () => import('@/components/documenthub/DocumentWorkspace'),
    {
        ssr: false,
        loading: () => <LoadingSpinner message="Loading workspace..." />
    }
)

export default function Page({ params }: { params: Promise<{ documentId: string }> }) {
    const { documentId } = use(params)

    return <DocumentWorkspace documentId={documentId} />
}
