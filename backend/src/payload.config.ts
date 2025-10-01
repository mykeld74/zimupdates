// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Kids } from './collections/Kids'
import { Sponsors } from './collections/Sponsors'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  cors: ['http://localhost:5173', 'http://localhost:4173', 'https://zim-updates.westwoodscc.org'],
  csrf: ['http://localhost:5173', 'http://localhost:4173', 'https://zim-updates.westwoodscc.org'],
  collections: [
    Users,
    Media,
    {
      slug: 'updates',
      admin: {
        useAsTitle: 'title',
      },
      access: {
        read: () => true,
      },
      timestamps: true,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'slug',
          type: 'text',
          required: false,
          unique: true,
          admin: {
            position: 'sidebar',
            description: 'Auto-generated from title if left blank',
          },
        },
        {
          name: 'content',
          type: 'richText',
          editor: lexicalEditor(),
        },
      ],
      hooks: {
        beforeChange: [
          async ({ data, originalDoc, operation }) => {
            const toSlug = (value: string): string =>
              value
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')

            const incoming = { ...(data || {}) } as Record<string, unknown>
            const title = (incoming.title as string | undefined) ?? ''
            const existingSlug = (incoming.slug as string | undefined) ?? ''

            if (!existingSlug && title) {
              incoming.slug = toSlug(title)
            }

            return incoming
          },
        ],
      },
    },
    Kids,
    Sponsors,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
