import { isDesignStyleId } from '~/utils/designStyles'
import type { GenerationGenerateResponse } from '~/types/generation'
import type { GenerationRow } from '../../../utils/designs'
import type { GrokAspectRatio } from '../../../utils/aspectRatio'

export default defineEventHandler(async (event): Promise<GenerationGenerateResponse> => {
  const { accessToken, authUser } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ style?: string }>(event)
  const style = String(body?.style ?? '').trim()

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Generation id is required' })
  }

  if (!isDesignStyleId(style)) {
    throw createError({ statusCode: 400, statusMessage: 'Choose a valid design style' })
  }

  if (!String(useRuntimeConfig().openrouterApiKey || '')) {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenRouter is not configured. Set NUXT_OPENROUTER_API_KEY.',
    })
  }

  const client = createAdminClient()
  const { data: existing, error: loadError } = await client
    .from('generations')
    .select(GENERATION_COLUMNS)
    .eq('id', id)
    .eq('user_id', authUser.id)
    .maybeSingle()

  if (loadError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load generation' })
  }

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Generation not found' })
  }

  const row = existing as GenerationRow

  if (row.status === 'completed') {
    return {
      generation: await toGeneration(row, accessToken, { includeResult: true }),
      credits: authUser.credits,
    }
  }

  if (row.status === 'generating') {
    throw createError({
      statusCode: 409,
      statusMessage: 'This design is already generating',
    })
  }

  if (row.status !== 'uploaded' && row.status !== 'failed') {
    throw createError({
      statusCode: 409,
      statusMessage: row.error || 'This design cannot be generated',
    })
  }

  const { data: claimed, error: claimError } = await client
    .from('generations')
    .update({ status: 'generating', style, error: null })
    .eq('id', id)
    .eq('user_id', authUser.id)
    .in('status', ['uploaded', 'failed'])
    .select(GENERATION_COLUMNS)
    .maybeSingle()

  if (claimError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to start generation' })
  }

  if (!claimed) {
    throw createError({
      statusCode: 409,
      statusMessage: 'This design is already generating',
    })
  }

  const claimedRow = claimed as GenerationRow
  let debitApplied = false
  let newBalance = authUser.credits
  let completedRow: GenerationRow | null = null

  try {
    const balance = await debitOneCredit(authUser.id)
    if (balance === null) {
      await client
        .from('generations')
        .update({ status: 'uploaded', style: null, error: null })
        .eq('id', id)
        .eq('user_id', authUser.id)
      throw createError({
        statusCode: 402,
        statusMessage: 'You need 1 credit to generate a design',
      })
    }
    debitApplied = true
    newBalance = balance

    const originalBlob = await downloadDesignObject(accessToken, claimedRow.original_path)
    const originalBytes = Buffer.from(await originalBlob.arrayBuffer())
    const originalMime = originalBlob.type || 'image/jpeg'

    const generated = await generateStyledImage({
      styleId: style,
      aspectRatio: claimedRow.aspect_ratio as GrokAspectRatio,
      originalBytes,
      originalMime,
    })

    const resultPath = resultObjectPath(authUser.id, id, generated.ext)
    await uploadDesignObject(accessToken, resultPath, generated.bytes, generated.contentType)

    const { data: completed, error: completeError } = await client
      .from('generations')
      .update({
        status: 'completed',
        result_path: resultPath,
        error: null,
      })
      .eq('id', id)
      .eq('user_id', authUser.id)
      .select(GENERATION_COLUMNS)
      .single()

    if (completeError || !completed) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to save generated image' })
    }

    completedRow = completed as GenerationRow
  } catch (error) {
    if (debitApplied) {
      await refundOneCredit(authUser.id)
    }

    const message =
      error && typeof error === 'object' && 'statusMessage' in error
        ? String((error as { statusMessage?: string }).statusMessage || 'Generation failed')
        : 'Generation failed'

    const statusCode =
      error && typeof error === 'object' && 'statusCode' in error
        ? Number((error as { statusCode?: number }).statusCode)
        : 500

    if (statusCode !== 402) {
      if (debitApplied) {
        await client
          .from('generations')
          .update({ status: 'failed', error: message })
          .eq('id', id)
          .eq('user_id', authUser.id)
      } else {
        await client
          .from('generations')
          .update({ status: 'uploaded', style: null, error: null })
          .eq('id', id)
          .eq('user_id', authUser.id)
      }
    }

    throw error
  }

  if (!completedRow) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to save generated image' })
  }

  return {
    generation: await toGeneration(completedRow, accessToken, {
      includeResult: true,
    }),
    credits: newBalance,
  }
})
