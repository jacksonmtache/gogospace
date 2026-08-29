import type { GenerationGenerateResponse } from '~/types/generation'
import type { GenerationRow } from '../../../utils/designs'
import type { GrokAspectRatio } from '../../../utils/aspectRatio'

const MAX_INSTRUCTION_LENGTH = 1000

export default defineEventHandler(async (event): Promise<GenerationGenerateResponse> => {
  const { accessToken, authUser } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ instruction?: string }>(event)
  const instruction = String(body?.instruction ?? '').trim()

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Generation id is required' })
  }

  if (!instruction) {
    throw createError({ statusCode: 400, statusMessage: 'Describe the change you want' })
  }

  if (instruction.length > MAX_INSTRUCTION_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Keep your instruction under ${MAX_INSTRUCTION_LENGTH} characters`,
    })
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

  if (row.status === 'generating') {
    throw createError({
      statusCode: 409,
      statusMessage: 'This design is already generating',
    })
  }

  if (row.status !== 'completed' || !row.result_path) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Finish a design before refining it',
    })
  }

  const { data: claimed, error: claimError } = await client
    .from('generations')
    .update({ status: 'generating', error: null })
    .eq('id', id)
    .eq('user_id', authUser.id)
    .eq('status', 'completed')
    .select(GENERATION_COLUMNS)
    .maybeSingle()

  if (claimError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to start refine' })
  }

  if (!claimed) {
    throw createError({
      statusCode: 409,
      statusMessage: 'This design is already generating',
    })
  }

  const claimedRow = claimed as GenerationRow
  const previousResultPath = claimedRow.result_path
  let debitApplied = false
  let newBalance = authUser.credits
  let completedRow: GenerationRow | null = null

  async function restoreCompleted() {
    await client
      .from('generations')
      .update({
        status: 'completed',
        result_path: previousResultPath,
        error: null,
      })
      .eq('id', id)
      .eq('user_id', authUser.id)
  }

  try {
    const balance = await debitOneCredit(authUser.id)
    if (balance === null) {
      await restoreCompleted()
      throw createError({
        statusCode: 402,
        statusMessage: 'You need 1 credit to refine this design',
      })
    }
    debitApplied = true
    newBalance = balance

    const referenceBlob = await downloadDesignObject(accessToken, previousResultPath as string)
    const referenceBytes = Buffer.from(await referenceBlob.arrayBuffer())
    const referenceMime = referenceBlob.type || 'image/png'

    const generated = await generateImageFromReference({
      prompt: buildRefinePrompt(instruction, claimedRow.style),
      aspectRatio: claimedRow.aspect_ratio as GrokAspectRatio,
      referenceBytes,
      referenceMime,
    })

    const resultPath = resultObjectPath(authUser.id, id, generated.ext, String(Date.now()))
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
      throw createError({ statusCode: 500, statusMessage: 'Failed to save refined image' })
    }

    completedRow = completed as GenerationRow
  } catch (error) {
    if (debitApplied) {
      await refundOneCredit(authUser.id)
    }

    const statusCode =
      error && typeof error === 'object' && 'statusCode' in error
        ? Number((error as { statusCode?: number }).statusCode)
        : 500

    if (statusCode !== 402) {
      await restoreCompleted()
    }

    throw error
  }

  if (!completedRow) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to save refined image' })
  }

  return {
    generation: await toGeneration(completedRow, accessToken, {
      includeResult: true,
      includeVersions: true,
    }),
    credits: newBalance,
  }
})
