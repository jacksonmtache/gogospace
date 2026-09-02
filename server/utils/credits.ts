export async function debitOneCredit(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('debit_one_credit', { p_user_id: userId })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to deduct credit' })
  }

  return typeof data === 'number' ? data : null
}

export async function refundOneCredit(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('refund_one_credit', { p_user_id: userId })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to refund credit' })
  }

  return typeof data === 'number' ? data : null
}

export async function addCredits(userId: string, amount: number) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('add_credits', {
    p_user_id: userId,
    p_amount: amount,
  })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to add credits' })
  }

  return typeof data === 'number' ? data : null
}

export async function findProfileIdByEmail(email: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('find_profile_id_by_email', {
    p_email: email.trim().toLowerCase(),
  })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to look up account' })
  }

  return typeof data === 'string' && data ? data : null
}

export async function claimPaymentCredits(sessionId: string, userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('claim_payment_credits', {
    p_session_id: sessionId,
    p_user_id: userId,
  })

  if (error) {
    const alreadyClaimed = /already claimed/i.test(error.message)
    throw createError({
      statusCode: alreadyClaimed ? 409 : 500,
      statusMessage: alreadyClaimed ? 'This payment was already applied' : 'Failed to apply credits',
    })
  }

  return typeof data === 'number' ? data : null
}
