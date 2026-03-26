import { HttpError } from 'wasp/server'

export const getCaseAnalysisHandler = async (req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)

  const { id } = req.params

  const analysis = await context.entities.CaseAnalysis.findFirst({
    where: { caseId: id },
    include: {
      case: {
        select: { citation: true, caseName: true, court: true, courtCode: true, decisionDate: true, catchwords: true, jadeUrl: true, austliiUrl: true, bench: true },
      },
    },
  })

  if (!analysis) {
    const caseExists = await context.entities.Case.findUnique({ where: { id } })
    if (!caseExists) throw new HttpError(404, 'Case not found')
    throw new HttpError(404, 'Analysis not yet available for this case')
  }

  res.json(analysis)
}
