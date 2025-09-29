import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: false,
    },
    // Email added by default
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'create') {
          const inputName = data?.name as string | undefined
          if (!inputName || inputName.trim() === '') {
            const email = (data?.email as string | undefined) ?? ''
            const derivedName = email.includes('@') ? email.split('@')[0] : email
            return { ...data, name: derivedName }
          }
        }
        return data
      },
    ],
  },
}
