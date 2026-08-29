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
