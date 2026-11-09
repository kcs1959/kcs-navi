import { defineEventHandler, getRequestHeader, sendRedirect } from 'h3'
import { protectMutation } from '../utils/mutations'
import { withRepository } from '../utils/repository'

export default defineEventHandler(async (event) => {
  try {
    await protectMutation(event, 'checkin')
    const receipt = await withRepository(event, (repository) => repository.addCheckin())
    // POST/Redirect/GET keeps reloading Welcome from posting again. The timestamp is only
    // a human-readable receipt, not an identity, deduplication token or proof of admission.
    const query = new URLSearchParams({
      checkedInAt: receipt.checkedInAt,
      visitorNumber: String(receipt.visitorNumber),
    })
    return sendRedirect(event, `/welcome?${query.toString()}`, 303)
  } catch (error) {
    // A browser form needs a readable retry screen; JSON API clients retain the status.
    // The error query also prevents the GET page from auto-posting in a redirect loop.
    if (
      getRequestHeader(event, 'accept')?.includes('text/html') &&
      error &&
      typeof error === 'object' &&
      'statusCode' in error
    ) {
      const reason =
        error.statusCode === 429 ? 'busy' : error.statusCode === 403 ? 'forbidden' : 'unavailable'
      return sendRedirect(event, `/checkin?error=${reason}`, 303)
    }
    throw error
  }
})
