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
      name: 'sponsoredKid',
      type: 'relationship',
      relationTo: 'kids',
      required: false,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data }) => {
        const first = (data?.firstName as string | undefined)?.trim() ?? ''
        const last = (data?.lastName as string | undefined)?.trim() ?? ''
        if (first || last) {
          const full = [first, last].filter(Boolean).join(' ')
          return { ...data, name: full }
        }
        return data
      },
    ],
  },
}
