import { formatWon } from '../features/budget/budget'

export type BudgetImpactValue = { total: number; giftAmount: number; includeGifts: boolean }

export function BudgetImpact({ total, giftAmount, includeGifts, showBar = false }: BudgetImpactValue & { showBar?: boolean }) {
  const deduction = includeGifts ? giftAmount : 0
  const burden = total - deduction
  const giftShare = total > 0 ? Math.min(100, deduction / total * 100) : 0
  return <div className="budget-impact" aria-live="polite">
    <dl><div><dt>예상 총비용</dt><dd>{formatWon(total)}</dd></div><div><dt>{includeGifts ? '포함한 축의금 수입' : '축의금 수입 제외'}</dt><dd>{deduction ? `−${formatWon(deduction)}` : formatWon(0)}</dd></div><div className="budget-impact-net"><dt>예상 부담액</dt><dd>{formatWon(burden)}</dd></div></dl>
    {showBar && total > 0 && <><div className="budget-impact-bar" role="img" aria-label={`예상 총비용 ${formatWon(total)}, 축의금 차감 ${formatWon(deduction)}, 예상 부담 ${formatWon(burden)}`}><span style={{ width: `${100 - giftShare}%` }}/><i style={{ width: `${giftShare}%` }}/></div><p className="budget-impact-legend"><span><i/>예상 부담</span>{includeGifts && <span><i/>예상 축의금</span>}</p></>}
    {includeGifts && giftAmount === 0 && <small>예상 축의금을 입력하면 차감 금액이 반영돼요.</small>}
    {burden < 0 && <small>예상 축의금이 총비용보다 {formatWon(-burden)} 많아요.</small>}
  </div>
}
