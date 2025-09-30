import type { CollectionConfig } from 'payload'

export const Kids: CollectionConfig = {
  slug: 'kids',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'sponsor',
      type: 'relationship',
      relationTo: 'users',
      required: false,
    },
    {
      name: 'birthday',
      type: 'date',
      required: false,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
  ],
}
