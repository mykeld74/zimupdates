import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'level', 'sponsoredKids'],
  },
  auth: true,
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
      name: 'level',
      type: 'select',
      required: true,
      defaultValue: 'sponsor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Sponsor', value: 'sponsor' },
      ],
    },
    {
      name: 'sponsoredKids',
      type: 'relationship',
      relationTo: 'kids',
      hasMany: true,
      admin: {
        readOnly: true,
        description: 'Kids sponsored by this user (derived)',
      },
      access: {
        create: () => false,
        update: () => false,
        read: () => true,
      },
    },
    // Email added by default
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Never allow writes to derived field
        if (data && 'sponsoredKids' in data) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete (data as Record<string, unknown>).sponsoredKids
        }
        const first = (data?.firstName as string | undefined)?.trim() ?? ''
        const last = (data?.lastName as string | undefined)?.trim() ?? ''
        const existingName = (data?.name as string | undefined)?.trim() ?? ''

        if (first || last) {
          const full = [first, last].filter(Boolean).join(' ')
          return { ...data, name: full }
        }

        if (operation === 'create' && !existingName) {
          const email = (data?.email as string | undefined) ?? ''
          const derivedName = email.includes('@') ? email.split('@')[0] : email
          return { ...data, name: derivedName }
        }

        return data
      },
    ],
    afterRead: [
      async ({ doc, req }) => {
        try {
          const kids = await req.payload.find({
            collection: 'kids',
            where: { sponsor: { equals: doc.id } },
            depth: 0,
            limit: 1000,
          })
          // Return IDs so the relationship field renders labels reliably in admin
          return { ...doc, sponsoredKids: kids.docs.map((k) => k.id) }
        } catch {
          return doc
        }
      },
    ],
  },
}
