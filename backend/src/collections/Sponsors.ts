import type { CollectionConfig } from 'payload'

export const Sponsors: CollectionConfig = {
  slug: 'sponsors',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: false,
      admin: {
        readOnly: true,
        description: 'Auto-generated from first and last name',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phoneNumber',
      type: 'text',
      required: false,
    },
    {
      name: 'sponsoredKids',
      type: 'relationship',
      relationTo: 'kids',
      hasMany: true,
      required: false,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, originalDoc, operation }) => {
        const first = (data?.firstName as string | undefined)?.trim() ?? ''
        const last = (data?.lastName as string | undefined)?.trim() ?? ''
        if (first || last) {
          const full = [first, last].filter(Boolean).join(' ')
          data = { ...data, name: full }
        }

        // Sync changes to sponsoredKids -> kids.sponsors
        try {
          if (operation === 'update') {
            const sponsorId = originalDoc?.id as string | undefined
            if (sponsorId) {
              const nextKidsRaw = (data as Record<string, unknown>)?.sponsoredKids as unknown
              const prevKidsRaw = (originalDoc as Record<string, unknown>)?.sponsoredKids as unknown

              const normalizeIds = (value: unknown): string[] => {
                if (!value) return []
                const arr = Array.isArray(value) ? value : []
                return arr
                  .map((item) => {
                    if (!item) return undefined
                    if (typeof item === 'string') return item
                    if (typeof item === 'object' && 'id' in (item as Record<string, unknown>)) {
                      return String((item as { id?: string }).id)
                    }
                    return undefined
                  })
                  .filter((v): v is string => Boolean(v))
              }

              const nextKidIds = new Set(normalizeIds(nextKidsRaw))
              const prevKidIds = new Set(normalizeIds(prevKidsRaw))

              const toAdd: string[] = [...nextKidIds].filter((id) => !prevKidIds.has(id))
              const toRemove: string[] = [...prevKidIds].filter((id) => !nextKidIds.has(id))

              const updateKidSponsors = async (kidId: string, action: 'add' | 'remove') => {
                const kid = await req.payload.findByID({ collection: 'kids', id: kidId, depth: 0 })
                const sponsors: string[] = Array.isArray((kid as any).sponsors)
                  ? ((kid as any).sponsors as unknown[])
                      .map((s) =>
                        typeof s === 'string'
                          ? s
                          : s && typeof s === 'object' && 'id' in s
                            ? String((s as { id?: string }).id)
                            : undefined,
                      )
                      .filter((v): v is string => Boolean(v))
                  : []

                const set = new Set(sponsors)
                if (action === 'add') set.add(sponsorId)
                if (action === 'remove') set.delete(sponsorId)

                await req.payload.update({
                  collection: 'kids',
                  id: kidId,
                  data: { sponsors: [...set].map(id => parseInt(id, 10)) },
                  overrideAccess: true,
                  depth: 0,
                })
              }

              await Promise.all([
                ...toAdd.map((kidId) => updateKidSponsors(kidId, 'add')),
                ...toRemove.map((kidId) => updateKidSponsors(kidId, 'remove')),
              ])
            }
          }
        } catch {
          // Swallow sync errors to not block sponsor update; admin can retry
        }

        return data
      },
    ],
    afterRead: [
      async ({ doc, req }) => {
        try {
          const kids = await req.payload.find({
            collection: 'kids',
            where: { sponsors: { contains: doc.id } },
            depth: 0,
            limit: 1000,
          })
          return { ...doc, sponsoredKids: kids.docs.map((k) => k.id) }
        } catch {
          return doc
        }
      },
    ],
  },
}
