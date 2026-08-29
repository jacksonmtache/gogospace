import type { Generation } from '~/types/generation'
import type { GenerationRow } from '../../utils/designs'

export default defineEventHandler(async (event): Promise<{ generation: Generation }> => {
  const { accessToken, authUser } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Generation id is required' })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('generations')
    .select(GENERATION_COLUMNS)
    .eq('id', id)
    .eq('user_id', authUser.id)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load generation' })
  }

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Generation not found' })
  }

  return {
    generation: await toGeneration(data as GenerationRow, accessToken, { includeResult: true }),
  }
})
