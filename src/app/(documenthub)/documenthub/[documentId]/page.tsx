'use client'

import { use } from 'react'
import dynamic from 'next/dynamic'

import ZukvoLoader from '@/components/common/ZukvoLoader'

const DocumentWorkspace = dynamic(
    () => import('@/components/documenthub/DocumentWorkspace'),
    {
        ssr: false,
        loading: () => <ZukvoLoader message="Loading workspace..." fullscreen={true} />
    }
)

export default function Page({ params }: { params: Promise<{ documentId: string }> }) {
    const { documentId } = use(params)

    return <DocumentWorkspace documentId={documentId} />
}
